// 贪心排班主流程
import { db, transaction } from '../db.js';
import {
  createScheduleContext,
  checkHardConstraints,
  scoreCandidate,
  shiftPriority,
  updateContext,
  shiftInterval,
} from './scoring.js';

// 加载范围内的班次（status='open' 或包含 published）
export function loadShifts(teamId, from, to, includePublished = false) {
  const clauses = ['team_id = ?', 'date >= ?', 'date <= ?'];
  const params = [teamId, from, to];
  if (!includePublished) clauses.push("status = 'open'");
  return db.prepare(
    `SELECT * FROM shifts WHERE ${clauses.join(' AND ')} ORDER BY date ASC, start_time ASC`
  ).all(...params);
}

// 加载团队成员
export function loadTeamMembers(teamId) {
  return db.prepare(`
    SELECT tm.*, u.username, u.name, u.role, u.credit AS user_credit
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    WHERE tm.team_id = ?
  `).all(teamId);
}

// 加载某成员的可用时间
export function loadAvailability(userId, date) {
  return db.prepare(`SELECT * FROM availability WHERE user_id = ? AND date = ?`).get(userId, date);
}

// 加载历史值班数（用于初始化 ctx）
function loadHistoryCount(teamId, untilDate) {
  const rows = db.prepare(`
    SELECT a.user_id, COUNT(*) AS cnt
    FROM assignments a
    JOIN shifts s ON s.id = a.shift_id
    WHERE s.team_id = ? AND s.date < ?
    GROUP BY a.user_id
  `).all(teamId, untilDate);
  const map = new Map();
  let max = 1;
  for (const r of rows) {
    map.set(r.user_id, r.cnt);
    if (r.cnt > max) max = r.cnt;
  }
  return { map, max };
}

// 计算某成员历史已占用区间（用于休息间隔判断，跨日）
function loadScheduledIntervals(userId, teamId) {
  const rows = db.prepare(`
    SELECT s.date, s.start_time, s.end_time
    FROM assignments a
    JOIN shifts s ON s.id = a.shift_id
    WHERE a.user_id = ? AND s.team_id = ? AND s.date >= date('now', '-7 days')
  `).all(userId, teamId);
  return rows.map((r) => {
    const it = shiftInterval(r);
    return { date: r.date, start: it.start, end: it.end };
  });
}

/**
 * 生成排班草案
 * @param {number} teamId
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 * @returns { draft: [{ shift, assignments: [{user_id, score, reason}], candidates }], conflicts: [{shift_id, gap}], priorityBreakdown }
 */
export function generateSchedule(teamId, from, to) {
  const shifts = loadShifts(teamId, from, to, false);
  const members = loadTeamMembers(teamId);
  const { map: historyMap, max } = loadHistoryCount(teamId, from);

  const ctx = createScheduleContext();
  ctx.historyCount = historyMap;
  ctx.maxHistory = max;

  // 为每位成员预填已占用区间（用于跨日休息判断）
  for (const m of members) {
    const intervals = loadScheduledIntervals(m.user_id, teamId);
    if (intervals.length) ctx.scheduled.set(m.user_id, intervals);
  }

  // 班次按优先级降序
  const shiftsWithPriority = shifts.map((s) => ({
    shift: s,
    priority: shiftPriority(s, ctx),
  }));
  shiftsWithPriority.sort((a, b) => b.priority.priority - a.priority.priority);

  const draft = [];
  const conflicts = [];

  for (const { shift, priority } of shiftsWithPriority) {
    const candidates = [];

    for (const m of members) {
      const avail = loadAvailability(m.user_id, shift.date);
      const userObj = { id: m.user_id, credit: m.credit };
      const hard = checkHardConstraints(userObj, shift, ctx, avail);
      if (!hard.ok) {
        candidates.push({
          user_id: m.user_id,
          username: m.username,
          name: m.name,
          eligible: false,
          reason: hard.reason,
          score: 0,
          breakdown: [],
        });
        continue;
      }
      const result = scoreCandidate(userObj, m, shift, ctx, avail);
      candidates.push({
        user_id: m.user_id,
        username: m.username,
        name: m.name,
        eligible: true,
        score: result.score,
        breakdown: result.breakdown,
      });
    }

    // 候选按分数降序
    candidates.sort((a, b) => (b.eligible ? 1 : 0) - (a.eligible ? 1 : 0) || b.score - a.score);

    const chosen = candidates.filter((c) => c.eligible).slice(0, shift.required_count);
    const gap = shift.required_count - chosen.length;

    draft.push({
      shift,
      priority: priority.priority,
      priorityBreakdown: priority.breakdown,
      assignments: chosen.map((c) => ({
        user_id: c.user_id,
        username: c.username,
        name: c.name,
        score: c.score,
        reason: c.breakdown,
      })),
      candidates: candidates.filter((c) => c.eligible),
    });

    if (gap > 0) {
      conflicts.push({
        shift_id: shift.id,
        title: shift.title,
        date: shift.date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        gap,
      });
    }

    // 更新上下文（只更新被选中的）
    for (const c of chosen) {
      const m = members.find((mm) => mm.user_id === c.user_id);
      if (m) {
        const userObj = { id: m.user_id };
        updateContext(ctx, userObj, shift);
      }
    }
  }

  return { draft, conflicts, generated_at: new Date().toISOString() };
}

// 内存缓存草案（按 teamId）
const draftCache = new Map();

export function cacheDraft(teamId, draft) {
  draftCache.set(teamId, draft);
}

export function getCachedDraft(teamId) {
  return draftCache.get(teamId);
}

export function clearDraft(teamId) {
  draftCache.delete(teamId);
}

/**
 * 发布草案到数据库
 * @param {number} teamId
 * @param {Array<{shift_id, user_id, score, reason}>} assignments
 */
export function publishSchedule(teamId, assignments) {
  const insertAsg = db.prepare(`
    INSERT INTO assignments (shift_id, user_id, status, score, reason)
    VALUES (?, ?, 'assigned', ?, ?)
  `);
  const updateShift = db.prepare(`UPDATE shifts SET status = 'published' WHERE id = ?`);

  const tx = transaction((items) => {
    const shiftIds = new Set();
    for (const a of items) {
      insertAsg.run(
        a.shift_id,
        a.user_id,
        a.score || 0,
        JSON.stringify(a.reason || [])
      );
      shiftIds.add(a.shift_id);
    }
    for (const sid of shiftIds) updateShift.run(sid);
  });
  tx(assignments);
  return { published: assignments.length, shift_count: new Set(assignments.map((a) => a.shift_id)).size };
}
