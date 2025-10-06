BEGIN;

CREATE TABLE IF NOT EXISTS hero (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_path TEXT,
  image_alt TEXT,
  primary_cta_label TEXT,
  primary_cta_href TEXT,
  secondary_cta_label TEXT,
  secondary_cta_href TEXT
);

INSERT OR IGNORE INTO hero (id, title, description) VALUES (1, '', '');

CREATE TABLE IF NOT EXISTS scriptures (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  title TEXT,
  translation TEXT,
  summary TEXT,
  key_verse TEXT,
  category TEXT,
  selector_category TEXT,
  alignment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scripture_themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scripture_id TEXT NOT NULL,
  theme TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (scripture_id) REFERENCES scriptures(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scripture_contexts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scripture_id TEXT NOT NULL,
  heading TEXT,
  body TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (scripture_id) REFERENCES scriptures(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scripture_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scripture_id TEXT NOT NULL,
  title TEXT,
  body TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (scripture_id) REFERENCES scriptures(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scripture_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scripture_id TEXT NOT NULL,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (scripture_id) REFERENCES scriptures(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scripture_tension (
  scripture_id TEXT PRIMARY KEY,
  question TEXT,
  steelman TEXT,
  response TEXT,
  FOREIGN KEY (scripture_id) REFERENCES scriptures(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scripture_tension_supports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scripture_id TEXT NOT NULL,
  support TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (scripture_id) REFERENCES scriptures(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hero_tiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position INTEGER NOT NULL UNIQUE,
  scripture_id TEXT NOT NULL,
  FOREIGN KEY (scripture_id) REFERENCES scriptures(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS narrative_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  scripture_id TEXT,
  image_path TEXT,
  image_alt TEXT,
  accent TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (scripture_id) REFERENCES scriptures(id) ON DELETE SET NULL
);

COMMIT;
