const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'birthday.db');

let db;

const database = {
  init() {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('✓ Connected to SQLite database');
        this.createTables();
      }
    });
  },

  createTables() {
    db.serialize(() => {
      // Birthdays table
      db.run(`
        CREATE TABLE IF NOT EXISTS birthdays (
          id TEXT PRIMARY KEY,
          personName TEXT NOT NULL,
          personAge INTEGER NOT NULL,
          birthday TEXT NOT NULL,
          nickname TEXT,
          relationship TEXT NOT NULL,
          mainMessage TEXT NOT NULL,
          shortMessage TEXT,
          longMessage TEXT,
          signature TEXT,
          senderName TEXT NOT NULL,
          theme TEXT NOT NULL,
          backgroundImage TEXT,
          backgroundColor TEXT DEFAULT '#ffffff',
          fontFamily TEXT DEFAULT 'Inter',
          accentColor TEXT DEFAULT '#ff006e',
          animationEnabled BOOLEAN DEFAULT 1,
          photoLayout TEXT DEFAULT 'grid',
          musicUrl TEXT,
          musicAutoplay BOOLEAN DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Photos table
      db.run(`
        CREATE TABLE IF NOT EXISTS photos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          birthdayId TEXT NOT NULL,
          filename TEXT NOT NULL,
          url TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (birthdayId) REFERENCES birthdays(id) ON DELETE CASCADE
        )
      `);

      console.log('✓ Database tables ready');
    });
  },

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  close() {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

module.exports = database;
