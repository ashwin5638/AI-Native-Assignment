import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, '../../docs-editor.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT 'Untitled Document',
    content TEXT NOT NULL DEFAULT '{}',
    owner_id INTEGER NOT NULL,
    source_format TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    permission TEXT NOT NULL DEFAULT 'edit',
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(document_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  );
`)

try {
  db.exec('ALTER TABLE documents ADD COLUMN source_format TEXT')
} catch {
  // column already exists
}

// backfill source_format for old documents that have attached files
db.exec(`
  UPDATE documents SET source_format = '.docx'
  WHERE source_format IS NULL AND id IN (
    SELECT document_id FROM files WHERE original_name LIKE '%.docx'
  )
`)
db.exec(`
  UPDATE documents SET source_format = '.md'
  WHERE source_format IS NULL AND id IN (
    SELECT document_id FROM files WHERE original_name LIKE '%.md'
  )
`)
db.exec(`
  UPDATE documents SET source_format = '.txt'
  WHERE source_format IS NULL AND id IN (
    SELECT document_id FROM files WHERE original_name LIKE '%.txt'
  )
`)
db.exec(`
  UPDATE documents SET source_format = '.md'
  WHERE source_format IS NULL
`)

export default db
