CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  google_id TEXT UNIQUE,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE vocabularies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  pronunciation_uk TEXT,
  pronunciation_us TEXT,
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_vocabularies_user_id ON vocabularies(user_id);
CREATE INDEX idx_vocabularies_word ON vocabularies(word);

CREATE TABLE vocabulary_tags (
  id TEXT PRIMARY KEY,
  vocabulary_id TEXT NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(vocabulary_id, tag)
);

CREATE INDEX idx_vocabulary_tags_vocabulary_id ON vocabulary_tags(vocabulary_id);

CREATE TABLE meanings (
  id TEXT PRIMARY KEY,
  vocabulary_id TEXT NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
  part_of_speech TEXT NOT NULL,
  definition TEXT NOT NULL,
  translation TEXT,
  cefr_level TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_meanings_vocabulary_id ON meanings(vocabulary_id);

CREATE TABLE examples (
  id TEXT PRIMARY KEY,
  meaning_id TEXT NOT NULL REFERENCES meanings(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL,
  translation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_examples_meaning_id ON examples(meaning_id);

CREATE TABLE review_states (
  vocabulary_id TEXT PRIMARY KEY REFERENCES vocabularies(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL DEFAULT 1,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  interval_days REAL NOT NULL DEFAULT 0,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  last_reviewed_at TEXT,
  next_review_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_review_states_next_review_at ON review_states(next_review_at);
CREATE INDEX idx_review_states_stage ON review_states(stage);

CREATE TABLE review_logs (
  id TEXT PRIMARY KEY,
  vocabulary_id TEXT NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
  rating TEXT NOT NULL,
  previous_stage INTEGER,
  next_stage INTEGER,
  previous_interval_days REAL,
  next_interval_days REAL,
  reviewed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_review_logs_vocabulary_id ON review_logs(vocabulary_id);
CREATE INDEX idx_review_logs_reviewed_at ON review_logs(reviewed_at);

CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stage_thresholds TEXT NOT NULL DEFAULT '{"1":0,"2":1,"3":4,"4":15,"5":60}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
