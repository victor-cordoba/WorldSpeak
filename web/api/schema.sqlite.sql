CREATE TABLE IF NOT EXISTS ws_users (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  email TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ws_sessions (
  token_hash TEXT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ws_progress (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  progress_json TEXT NOT NULL,
  done_count INTEGER NOT NULL DEFAULT 0,
  total_seconds REAL NOT NULL DEFAULT 0,
  last_track TEXT NULL,
  last_position REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS ws_rate_limits (
  rate_key TEXT NOT NULL PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  blocked_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
)
;
CREATE INDEX IF NOT EXISTS idx_sessions_user ON ws_sessions(user_id)
;
CREATE TABLE IF NOT EXISTS ws_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  sid TEXT NOT NULL,
  user_id TEXT NULL,
  event TEXT NOT NULL,
  page TEXT NULL,
  course TEXT NULL,
  track TEXT NULL,
  extra TEXT NULL,
  ua TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON ws_events(ts);
CREATE INDEX IF NOT EXISTS idx_events_event ON ws_events(event)
