// 积分与信用变动
import { db, transaction } from '../db.js';
import { POINTS_RULES } from '../config.js';

// 写一条流水并更新余额
export function awardPoints(userId, delta, reason, assignmentId = null, creditDelta = 0) {
  const tx = transaction(() => {
    db.prepare(`
      INSERT INTO points_ledger (user_id, delta, reason, assignment_id)
      VALUES (?, ?, ?, ?)
    `).run(userId, delta, reason, assignmentId);

    db.prepare(`UPDATE users SET points = points + ? WHERE id = ?`).run(delta, userId);

    if (creditDelta !== 0) {
      db.prepare(`UPDATE users SET credit = MAX(0, MIN(200, credit + ?)) WHERE id = ?`).run(creditDelta, userId);
    }
  });
  tx();
}

// 班次签到完成时发放积分
export function awardForCheckin(assignment, shift) {
  let delta = POINTS_RULES.ON_TIME_COMPLETE;
  let reason = '准时完成值班';
  if (shift.is_special) {
    delta += POINTS_RULES.SPECIAL_BONUS;
    reason = '准时完成值班（特殊班次）';
  }
  // 写入 assignment
  db.prepare(`
    UPDATE assignments SET points_awarded = ? WHERE id = ?
  `).run(delta, assignment.id);

  awardPoints(assignment.user_id, delta, reason, assignment.id, 0);
  return delta;
}

// 缺席扣信用
export function penalizeAbsent(assignment) {
  awardPoints(
    assignment.user_id,
    0,
    '未完成/缺席',
    assignment.id,
    POINTS_RULES.ABSENT_CREDIT_PENALTY
  );
}

// 管理员手动调整
export function manualAdjust(userId, delta, reason) {
  awardPoints(userId, delta, `管理员调整：${reason}`, null, 0);
}

// 查询用户积分余额
export function getBalance(userId) {
  return db.prepare(`SELECT points, credit FROM users WHERE id = ?`).get(userId);
}

// 查询流水
export function getLedger(userId, limit = 50) {
  return db.prepare(`
    SELECT * FROM points_ledger WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).all(userId, limit);
}

// 团队流水
export function getTeamLedger(teamId, limit = 100) {
  return db.prepare(`
    SELECT pl.*, u.username, u.name
    FROM points_ledger pl
    JOIN team_members tm ON tm.user_id = pl.user_id AND tm.team_id = ?
    JOIN users u ON u.id = pl.user_id
    ORDER BY pl.created_at DESC, pl.id DESC
    LIMIT ?
  `).all(teamId, limit);
}
