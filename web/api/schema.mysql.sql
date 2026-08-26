CREATE TABLE IF NOT EXISTS ws_users (
  id CHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  email VARCHAR(190) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ws_sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  user_id CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_sessions_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ws_progress (
  user_id CHAR(64) NOT NULL,
  course_id VARCHAR(64) NOT NULL,
  progress_json MEDIUMTEXT NOT NULL,
  done_count INT NOT NULL DEFAULT 0,
  total_seconds DOUBLE NOT NULL DEFAULT 0,
  last_track VARCHAR(80) NULL,
  last_position DOUBLE NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ws_rate_limits (
  rate_key CHAR(64) NOT NULL PRIMARY KEY,
  count INT NOT NULL DEFAULT 0,
  blocked_until INT NOT NULL DEFAULT 0,
  updated_at INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
