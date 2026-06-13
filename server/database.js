const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'mechhub.db');

class CompatStatement {
  constructor(db, sql, persist) {
    this._db = db;
    this._sql = sql;
    this._persist = persist;
  }

  get(...args) {
    const params = args.flat();
    const stmt = this._db.prepare(this._sql);
    stmt.bind(params);
    const result = stmt.step() ? stmt.getAsObject() : undefined;
    stmt.free();
    return result;
  }

  all(...args) {
    const params = args.flat();
    const stmt = this._db.prepare(this._sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push({ ...stmt.getAsObject() });
    stmt.free();
    return rows;
  }

  run(...args) {
    const params = args.flat();
    const stmt = this._db.prepare(this._sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    const changes = this._db.getRowsModified();
    const idResult = this._db.exec('SELECT last_insert_rowid()');
    const lastInsertRowid = idResult[0]?.values?.[0]?.[0] ?? 0;
    this._persist();
    return { changes, lastInsertRowid };
  }
}

class CompatDB {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  _persist() {
    const data = this._db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  prepare(sql) {
    return new CompatStatement(this._db, sql, () => this._persist());
  }

  exec(sql) {
    this._db.run(sql);
    this._persist();
  }
}

let db = null;

async function initDB() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(buf);
  } else {
    sqlDb = new SQL.Database();
  }

  db = new CompatDB(sqlDb);

  const schema = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'driver',
      avatar_url TEXT,
      location_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'car',
      make TEXT,
      model TEXT,
      plate TEXT,
      year INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS mechanic_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      rating REAL DEFAULT 5.0,
      jobs_done INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      is_online INTEGER DEFAULT 0,
      specialties TEXT DEFAULT 'puncture,battery',
      current_lat REAL DEFAULT 27.7172,
      current_lng REAL DEFAULT 85.3240
    )`,
    `CREATE TABLE IF NOT EXISTS partner_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      partner_type TEXT NOT NULL,
      business_name TEXT,
      location_name TEXT,
      phone TEXT,
      is_open INTEGER DEFAULT 0,
      today_requests INTEGER DEFAULT 0,
      today_revenue INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS service_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      mechanic_id INTEGER,
      service_type TEXT NOT NULL,
      vehicle_type TEXT NOT NULL DEFAULT 'car',
      status TEXT DEFAULT 'pending',
      location_name TEXT,
      lat REAL DEFAULT 27.7172,
      lng REAL DEFAULT 85.3240,
      fare INTEGER DEFAULT 0,
      pay_method TEXT,
      tip INTEGER DEFAULT 0,
      driver_rating INTEGER,
      driver_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME,
      completed_at DATETIME
    )`,
    `CREATE TABLE IF NOT EXISTS earnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mechanic_id INTEGER NOT NULL,
      request_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const stmt of schema) {
    try { sqlDb.run(stmt); } catch (e) { /* already exists */ }
  }

  db._persist();
  await seedDemoData(db);
  console.log('✅ MechHub database initialized');
}

async function seedDemoData(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('mechanic');
  if (count.c > 0) return;

  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('demo123', 10);

  const mechanics = [
    { name: 'Ram Prasad Sharma',      email: 'ram@mechhub.np',   phone: '9841001001', specialties: 'puncture,battery,engine', xp: 1200, level: 4, rating: 4.9, jobs: 45, streak: 5, lat: 27.7080, lng: 85.3150 },
    { name: 'Shyam Bahadur Thapa',    email: 'shyam@mechhub.np', phone: '9841001002', specialties: 'puncture,battery,fuel',   xp: 700,  level: 3, rating: 4.7, jobs: 23, streak: 3, lat: 27.7200, lng: 85.3320 },
    { name: 'Hari Krishna Yadav',     email: 'hari@mechhub.np',  phone: '9841001003', specialties: 'engine,towing,ev_charge', xp: 3000, level: 6, rating: 5.0, jobs: 87, streak: 7, lat: 27.7150, lng: 85.3080 },
  ];

  mechanics.forEach(m => {
    const result = db.prepare(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(m.name, m.email, m.phone, hash, 'mechanic');

    const userId = result.lastInsertRowid;
    db.prepare(
      'INSERT INTO mechanic_profiles (user_id, xp, level, rating, jobs_done, streak, is_online, specialties, current_lat, current_lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(userId, m.xp, m.level, m.rating, m.jobs, m.streak, 1, m.specialties, m.lat, m.lng);
  });

  console.log('✅ Demo mechanics seeded (password: demo123)');
}

const dbProxy = new Proxy({}, {
  get(_, key) {
    if (!db) throw new Error('Database not initialized. Did initDB() run?');
    const val = db[key];
    return typeof val === 'function' ? val.bind(db) : val;
  }
});

module.exports = { db: dbProxy, initDB };
