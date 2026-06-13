const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, phone, password, role = 'driver', specialties, vehicleType, vehicleMake, vehicleModel, vehiclePlate, businessName } = req.body;

  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

  const validRoles = ['driver', 'mechanic', 'petrol', 'ev', 'hotel'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  try {
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, phone || null, hash, role);

    const userId = result.lastInsertRowid;

    if (role === 'mechanic') {
      db.prepare(
        'INSERT INTO mechanic_profiles (user_id, specialties) VALUES (?, ?)'
      ).run(userId, specialties || 'puncture,battery');
    } else if (['petrol', 'ev', 'hotel'].includes(role)) {
      db.prepare(
        'INSERT INTO partner_profiles (user_id, partner_type, business_name) VALUES (?, ?, ?)'
      ).run(userId, role, businessName || name);
    } else if (role === 'driver' && vehicleType) {
      db.prepare(
        'INSERT INTO vehicles (user_id, type, make, model, plate) VALUES (?, ?, ?, ?, ?)'
      ).run(userId, vehicleType, vehicleMake || null, vehicleModel || null, vehiclePlate || null);
    }

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
    const user = db.prepare(
      'SELECT id, name, email, phone, role, avatar_url, created_at FROM users WHERE id = ?'
    ).get(userId);

    res.status(201).json({ token, user });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  const { password_hash, ...safeUser } = user;

  res.json({ token, user: safeUser });
});

router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

module.exports = router;
