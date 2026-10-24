// 排班评分与硬约束
// 实现：硬约束过滤 + Score 评分公式 + 班次优先级 + 可解释性
import { CONSTRAINTS, SCORE_WEIGHTS, PRIORITY_WEIGHTS } from '../config.js';

// ---------- 工具：时段比较 ----------
// "HH:MM" -> 分钟数
export function timeToMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// 日期+时间 -> Date 对象
export function shiftInterval(shift) {
  const start = timeToMin(shift.start_time);
  let end = timeToMin(shift.end_time);
  if (end <= start) end += 24 * 60; // 跨日
  return { start, end };
}

// 解析 unavailable_slots JSON
export function parseUnavailable(json) {
  if (!json) return [];
  try {
    const arr = typeof json === 'string' ? JSON.parse(json) : json;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// 检查两个 [start, end] 区间是否相交（单位：分钟）
export function intervalsIntersect(a, b) {
  return a.start < b.end && b.start < a.end;
}

// ---------- 上下文 ----------
// ctx.scheduled: Map<userId, Array<{date, start, end}>>
// ctx.dailyTotal: Map<"userId|date", minutes>
// ctx.weeklyTotal: Map<"userId|week", minutes>
// ctx.historyCount: Map<userId, number>
// ctx.maxHistory: number
export function createScheduleContext() {
  return {
    scheduled: new Map(),
    dailyTotal: new Map(),
    weeklyTotal: new Map(),
    historyCount: new Map(),
    maxHistory: 1,
  };
}

// 周编号（用 ISO 周简化：YYYY-WW，按月份+日期计算）
function weekKey(date) {
  const d = new Date(date);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

// ---------- 硬约束 ----------
// 返回 { ok: bool, reason: string }
export function checkHardConstraints(user, shift, ctx, availability) {
  const interval = shiftInterval(shift);
  // 1) 时段可用性：与 unavailable_slots 不相交
  const unavail = parseUnavailable(availability?.unavailable_slots);
  for (const slot of unavail) {
    const [s, e] = slot.split('-');
    const u = { start: timeToMin(s), end: timeToMin(e) };
    if (intervalsIntersect(interval, u)) {
      return { ok: false, reason: '该时段不可用' };
    }
  }

  // 2) 与已排班次不重叠
  const scheduled = ctx.scheduled.get(user.id) || [];
  for (const s of scheduled) {
    if (s.date === shift.date && intervalsIntersect(interval, s)) {
      return { ok: false, reason: '与其他已排班次冲突' };
    }
  }

  // 3) 最小休息时间（班次间 ≥ 8h）
  for (const s of scheduled) {
    if (s.date === shift.date) continue;
    // 跨日休息判断简化：仅检查同日前一天/后一天结束与开始间隔
    const prevEnd = s.end;
    const curStart = interval.start;
    // 同日不重叠已被上面拦截；此处检查相邻日
    const diff = curStart - prevEnd;
    if (diff >= 0 && diff < CONSTRAINTS.MIN_REST_MINUTES) {
      return { ok: false, reason: '不满足最小休息时间 8h' };
    }
  }

  // 4) 每日最大值班
  const dailyKey = `${user.id}|${shift.date}`;
  const dailyUsed = ctx.dailyTotal.get(dailyKey) || 0;
  if (dailyUsed + shift.duration_min > CONSTRAINTS.MAX_DAILY_MINUTES) {
    return { ok: false, reason: '超过每日最大值班 8h' };
  }

  // 5) 每周最大值班
  const wKey = `${user.id}|${weekKey(shift.date)}`;
  const weeklyUsed = ctx.weeklyTotal.get(wKey) || 0;
  if (weeklyUsed + shift.duration_min > CONSTRAINTS.MAX_WEEKLY_MINUTES) {
    return { ok: false, reason: '超过每周最大值班 40h' };
  }

  return { ok: true, reason: '通过' };
}

// ---------- Score 评分 ----------
// 返回 { score, breakdown: [{factor, value, detail}] }
export function scoreCandidate(user, teamMember, shift, ctx, availability) {
  const breakdown = [];

  // 偏好匹配 0~20
  const pref = availability?.preferred_shift_type || 'any';
  let prefVal = 10;
  let prefDetail = '未指定偏好，给基础分 10';
  if (pref !== 'any') {
    const startMin = timeToMin(shift.start_time);
    const morning = pref === 'morning' && startMin < 12 * 60;
    const evening = pref === 'evening' && startMin >= 12 * 60 && startMin < 18 * 60;
    const night = pref === 'night' && startMin >= 18 * 60;
    if (morning || evening || night) {
      prefVal = SCORE_WEIGHTS.PREFERENCE_MAX;
      prefDetail = `偏好 ${pref} 命中`;
    } else {
      prefVal = 5;
      prefDetail = `偏好 ${pref} 未命中`;
    }
  }
  breakdown.push({ factor: '偏好匹配', value: prefVal, max: SCORE_WEIGHTS.PREFERENCE_MAX, detail: prefDetail });

  // 公平性 0~30（历史值班越少越高）
  const hist = ctx.historyCount.get(user.id) || 0;
  const fairness = Math.round(SCORE_WEIGHTS.FAIRNESS_MAX * (1 - hist / Math.max(ctx.maxHistory, 1)));
  breakdown.push({
    factor: '公平性',
    value: fairness,
    max: SCORE_WEIGHTS.FAIRNESS_MAX,
    detail: `历史值班 ${hist} 次，团队最高 ${ctx.maxHistory} 次`,
  });

  // 休息间隔 0~20（距上次班次结束越久越高）
  const scheduled = ctx.scheduled.get(user.id) || [];
  let lastEnd = null;
  for (const s of scheduled) {
    if (!lastEnd || s.end < lastEnd) lastEnd = s.end;
  }
  let restVal = SCORE_WEIGHTS.REST_GAP_MAX;
  let restDetail = '尚无值班历史，给满分';
  if (lastEnd !== null) {
    const curStart = shiftInterval(shift).start;
    const gap = curStart - lastEnd;
    // gap 单位是分钟；以 48h 为满分基准
    const norm = Math.min(gap / (48 * 60), 1);
    restVal = Math.round(SCORE_WEIGHTS.REST_GAP_MAX * norm);
    restDetail = `距上次值班 ${Math.round(gap / 60)}h`;
  }
  breakdown.push({ factor: '休息间隔', value: restVal, max: SCORE_WEIGHTS.REST_GAP_MAX, detail: restDetail });

  // 信用分 0~20（按 team_member.credit 归一，0-100 映射到 0-20）
  const credit = teamMember?.credit ?? user.credit ?? 100;
  const creditVal = Math.round((SCORE_WEIGHTS.CREDIT_MAX * credit) / 100);
  breakdown.push({
    factor: '信用分',
    value: creditVal,
    max: SCORE_WEIGHTS.CREDIT_MAX,
    detail: `信用 ${credit}/100`,
  });

  // 时长匹配 0~10（班次时长接近 8h 满分，过短/过长递减）
  const dur = shift.duration_min;
  const ideal = 8 * 60;
  const durNorm = 1 - Math.min(Math.abs(dur - ideal) / ideal, 1);
  const durVal = Math.round(SCORE_WEIGHTS.DURATION_MATCH_MAX * durNorm);
  breakdown.push({
    factor: '时长匹配',
    value: durVal,
    max: SCORE_WEIGHTS.DURATION_MATCH_MAX,
    detail: `班次 ${Math.round(dur / 60)}h`,
  });

  // 连续值班惩罚 0~30（连续天数越多扣越多）
  let consecutive = 0;
  const dates = new Set(scheduled.map((s) => s.date));
  const d = new Date(shift.date);
  for (let i = 1; i <= 3; i++) {
    const prev = new Date(d);
    prev.setDate(prev.getDate() - i);
    const key = prev.toISOString().slice(0, 10);
    if (dates.has(key)) consecutive++;
    else break;
  }
  const penalty = Math.round(SCORE_WEIGHTS.CONSECUTIVE_PENALTY_MAX * (consecutive / 3));
  breakdown.push({
    factor: '连续值班惩罚',
    value: -penalty,
    max: -SCORE_WEIGHTS.CONSECUTIVE_PENALTY_MAX,
    detail: `前 ${consecutive} 天连续值班`,
  });

  // 管理员手动加权 -20~+20
  const mw = Math.max(SCORE_WEIGHTS.MANUAL_WEIGHT_MIN, Math.min(SCORE_WEIGHTS.MANUAL_WEIGHT_MAX, teamMember?.manual_weight || 0));
  if (mw !== 0) {
    breakdown.push({
      factor: '管理员加权',
      value: mw,
      max: SCORE_WEIGHTS.MANUAL_WEIGHT_MAX,
      detail: `管理员手动设置 ${mw > 0 ? '+' : ''}${mw}`,
    });
  }

  const score = breakdown.reduce((sum, b) => sum + b.value, 0);
  return { score, breakdown };
}

// ---------- 班次优先级 ----------
export function shiftPriority(shift, ctx) {
  const breakdown = [];

  // 时间紧迫度：越早的班次优先级越高（简化：以天数为基准）
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const shiftDate = new Date(shift.date);
  const days = Math.max(0, Math.round((shiftDate - today) / 86400000));
  const urgencyVal = Math.round(PRIORITY_WEIGHTS.TIME_URGENCY_MAX * (1 - Math.min(days / 14, 1)));
  breakdown.push({ factor: '时间紧迫度', value: urgencyVal, max: PRIORITY_WEIGHTS.TIME_URGENCY_MAX });

  // 节假日权重（简化：周末算节假日）
  const dayOfWeek = shiftDate.getDay();
  const isHoliday = dayOfWeek === 0 || dayOfWeek === 6;
  const holidayVal = isHoliday ? PRIORITY_WEIGHTS.HOLIDAY_MAX : 0;
  breakdown.push({ factor: '节假日', value: holidayVal, max: PRIORITY_WEIGHTS.HOLIDAY_MAX });

  // 特殊班次权重
  const specialVal = shift.is_special ? PRIORITY_WEIGHTS.SPECIAL_MAX : 0;
  breakdown.push({ factor: '特殊班次', value: specialVal, max: PRIORITY_WEIGHTS.SPECIAL_MAX });

  // 人数缺口（required_count）
  const gapVal = Math.min(PRIORITY_WEIGHTS.GAP_MAX, shift.required_count * 5);
  breakdown.push({ factor: '人数缺口', value: gapVal, max: PRIORITY_WEIGHTS.GAP_MAX });

  // 管理员加权
  const mw = shift.priority_weight || 0;
  if (mw !== 0) {
    breakdown.push({ factor: '管理员加权', value: mw, max: PRIORITY_WEIGHTS.MANUAL_MAX });
  }

  const priority = breakdown.reduce((sum, b) => sum + b.value, 0);
  return { priority, breakdown };
}

// ---------- 更新上下文 ----------
export function updateContext(ctx, user, shift) {
  const interval = shiftInterval(shift);
  const arr = ctx.scheduled.get(user.id) || [];
  arr.push({ date: shift.date, start: interval.start, end: interval.end });
  ctx.scheduled.set(user.id, arr);

  const dailyKey = `${user.id}|${shift.date}`;
  ctx.dailyTotal.set(dailyKey, (ctx.dailyTotal.get(dailyKey) || 0) + shift.duration_min);

  const d = new Date(shift.date);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
  const wKey = `${user.id}|${d.getFullYear()}-W${week}`;
  ctx.weeklyTotal.set(wKey, (ctx.weeklyTotal.get(wKey) || 0) + shift.duration_min);

  ctx.historyCount.set(user.id, (ctx.historyCount.get(user.id) || 0) + 1);
  ctx.maxHistory = Math.max(ctx.maxHistory, ctx.historyCount.get(user.id));
}
