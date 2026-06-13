const express = require('express');
const { db } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticate, (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE user_id = ? LIMIT 1').get(req.user.id);
  res.json({ ...req.user, vehicle: vehicle || null });
});

router.put('/profile', authenticate, (req, res) => {
  const { name, phone, locationName } = req.body;
  db.prepare('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), location_name = ? WHERE id = ?')
    .run(name || null, phone || null, locationName || null, req.user.id);
  res.json({ ok: true });
});

router.put('/vehicle', authenticate, (req, res) => {
  const { type, make, model, plate, year } = req.body;
  const existing = db.prepare('SELECT id FROM vehicles WHERE user_id = ?').get(req.user.id);

  if (existing) {
    db.prepare('UPDATE vehicles SET type = ?, make = ?, model = ?, plate = ?, year = ? WHERE user_id = ?')
      .run(type, make || null, model || null, plate || null, year || null, req.user.id);
  } else {
    db.prepare('INSERT INTO vehicles (user_id, type, make, model, plate, year) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, type, make || null, model || null, plate || null, year || null);
  }

  res.json({ ok: true });
});

module.exports = router;
