// 应用配置：端口、JWT、排班约束参数
export const PORT = process.env.PORT || 3001;
export const JWT_SECRET = process.env.JWT_SECRET || 'smartshift-dev-secret-please-change-in-prod';
export const JWT_EXPIRES_IN = '7d';

// 默认团队
export const DEFAULT_TEAM_NAME = '智能排班演示团队';

// 排班硬约束参数
export const CONSTRAINTS = {
  MIN_REST_MINUTES: 8 * 60,        // 班次间最小休息 8h
  MAX_DAILY_MINUTES: 8 * 60,       // 每日最大值班 8h
  MAX_WEEKLY_MINUTES: 40 * 60,     // 每周最大值班 40h
};

// 评分公式权重（与设计方案一致，0~该上限）
export const SCORE_WEIGHTS = {
  PREFERENCE_MAX: 20,
  FAIRNESS_MAX: 30,
  REST_GAP_MAX: 20,
  CREDIT_MAX: 20,
  DURATION_MATCH_MAX: 10,
  CONSECUTIVE_PENALTY_MAX: 30,
  MANUAL_WEIGHT_MIN: -20,
  MANUAL_WEIGHT_MAX: 20,
};

// 班次优先级权重
export const PRIORITY_WEIGHTS = {
  TIME_URGENCY_MAX: 30,
  HOLIDAY_MAX: 20,
  SPECIAL_MAX: 20,
  GAP_MAX: 20,
  MANUAL_MAX: 20,
};

// 积分规则
export const POINTS_RULES = {
  ON_TIME_COMPLETE: 10,
  SPECIAL_BONUS: 5,
  SUBSTITUTE_BONUS: 8,
  ABSENT_CREDIT_PENALTY: -5,
  TEMP_LEAVE_CREDIT_PENALTY: -2,
};

// 角色
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SCHEDULE_ADMIN: 'schedule_admin',
  MEMBER: 'member',
};

// 默认账号（仅用于 seed）
export const DEFAULT_PASSWORD = '123456';
