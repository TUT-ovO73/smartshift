-- SmartShift 数据库 Schema（7 张表）

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',         -- super_admin / schedule_admin / member
  credit INTEGER NOT NULL DEFAULT 100,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  creator_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role_in_team TEXT NOT NULL DEFAULT 'member',  -- super_admin / schedule_admin / member
  credit INTEGER NOT NULL DEFAULT 100,
  points_balance INTEGER NOT NULL DEFAULT 0,
  manual_weight INTEGER NOT NULL DEFAULT 0,     -- 管理员手动加权 -20~+20
  UNIQUE(team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,                           -- YYYY-MM-DD
  start_time TEXT NOT NULL,                     -- HH:MM
  end_time TEXT NOT NULL,                       -- HH:MM
  duration_min INTEGER NOT NULL,
  location_text TEXT,
  required_count INTEGER NOT NULL DEFAULT 1,
  is_special INTEGER NOT NULL DEFAULT 0,        -- 0/1
  priority_weight INTEGER NOT NULL DEFAULT 0,   -- 管理员手动加权
  status TEXT NOT NULL DEFAULT 'open',          -- open / published / closed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,                           -- YYYY-MM-DD
  unavailable_slots TEXT,                       -- JSON 数组 ["06:00-08:00"]
  preferred_shift_type TEXT,                    -- morning / evening / night / any
  UNIQUE(user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned',      -- assigned / checked_in / confirmed / absent
  score REAL NOT NULL DEFAULT 0,
  reason TEXT,                                  -- JSON 数组（评分分解）
  check_in_time TEXT,
  check_in_method TEXT,                         -- button / password / admin
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(shift_id, user_id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS points_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  assignment_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tm_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tm_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_shift_team_date ON shifts(team_id, date);
CREATE INDEX IF NOT EXISTS idx_avail_user_date ON availability(user_id, date);
CREATE INDEX IF NOT EXISTS idx_asg_shift ON assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_asg_user ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_points_user ON points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_asg_shift_status ON assignments(shift_id, status);
