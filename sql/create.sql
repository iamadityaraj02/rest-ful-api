-- Schema for recipes table
-- Fields are stored as TEXT to exactly mirror sample payloads

CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  making_time TEXT NOT NULL,
  serves TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  cost TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);


