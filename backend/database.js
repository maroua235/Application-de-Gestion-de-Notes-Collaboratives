const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Créer/ouvrir la base de données
const dbPath = path.join(__dirname, 'notes.db');
const db = new sqlite3.Database(dbPath);

// Créer les tables si elles n'existent pas
db.serialize(() => {
  // Table utilisateurs
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table notes (AVEC public_token)
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      tags TEXT,
      status TEXT DEFAULT 'private',
      user_id INTEGER NOT NULL,
      public_token TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Table partages (NOUVELLE)
  db.run(`
    CREATE TABLE IF NOT EXISTS note_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      shared_with_email TEXT NOT NULL,
      shared_by_user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (note_id) REFERENCES notes (id),
      FOREIGN KEY (shared_by_user_id) REFERENCES users (id),
      UNIQUE(note_id, shared_with_email)
    )
  `);

  console.log('Tables créées avec succès');
});

module.exports = db;