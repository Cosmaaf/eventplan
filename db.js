import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if /data exists (Amvera) or fallback to local ./data
const dataDir = fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dbInstance = null;

let initPromise = null;

export const initDb = async () => {
  if (dbInstance) return dbInstance;

  const db = await open({
    filename: path.join(dataDir, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      telegram_id TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Initialize default data if empty
  const eventCount = await db.get('SELECT COUNT(*) as count FROM events');
  if (eventCount.count === 0) {
    const defaultEvent = {
      id: 1,
      title: 'Свадьба Давидян',
      date: '2026-08-29T18:00',
      address: 'LOFTHALL, ул. Жужа д.3, Москва',
      status: 'active',
      limit: 100,
      notes: 'Dress code: Black Tie',
    };
    await db.run('INSERT INTO events (id, data) VALUES (?, ?)', [1, JSON.stringify(defaultEvent)]);

    // Initialize mock guests
    for (let i = 0; i < 12; i++) {
      const statuses = ['prepared', 'invited', 'agree', 'disagree'];
      const st = statuses[i % 4];
      const gId = `g_${i}`;
      const guest = {
        id: gId,
        firstName: `Гость ${i + 1}`,
        lastName: `Фамилия ${i + 1}`,
        phone: `+799900000${i.toString().padStart(2, '0')}`,
        status: st,
        token: `guest_${i + 1}`,
        companions: st === 'agree' && i % 2 === 0 ? [{ name: 'Спутник 1' }] : []
      };
      await db.run('INSERT INTO guests (id, data) VALUES (?, ?)', [gId, JSON.stringify(guest)]);
    }

    // Initialize mock tables
    const defaultTables = [
      { id: 't_1', name: 'Стол молодых', shape: 'rect', capacity: 2, group: 'bride' },
      { id: 't_2', name: 'Семья жениха', shape: 'round', capacity: 10, group: 'groom' },
      { id: 't_3', name: 'VIP Гости', shape: 'round', capacity: 8, group: 'vip' },
    ];
    for (const t of defaultTables) {
      await db.run('INSERT INTO tables (id, data) VALUES (?, ?)', [t.id, JSON.stringify(t)]);
    }
  }

  const pw = await db.get('SELECT value FROM settings WHERE key = ?', ['admin_password']);
  if (!pw) {
    await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['admin_password', '1234']);
  }

  dbInstance = db;
  return dbInstance;
};

export const getDb = async () => {
  if (dbInstance) return dbInstance;
  if (!initPromise) {
    initPromise = initDb();
  }
  return await initPromise;
};
