import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

if (typeof window === 'undefined') {
  // Only initialize on server-side
  db = new Database(path.join(process.cwd(), 'data.db'));

  // Initialize database tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS parent_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS child_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_requirement_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_requirement_id) REFERENCES parent_requirements (id)
    );

    CREATE TABLE IF NOT EXISTS test_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_requirement_id INTEGER,
      name TEXT NOT NULL,
      status TEXT CHECK (status IN ('passed', 'failed', 'pending')) DEFAULT 'pending',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (child_requirement_id) REFERENCES child_requirements (id)
    );
  `);
}

export default db!