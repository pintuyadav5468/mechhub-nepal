const express = require('express');
const { db } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const PARTNER_ROLES = ['petrol', 'ev', 'hotel'];

router.get('/dashboard', authenticate, (req, res) => {
  if (!PARTNER_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Partners only' });

  const profile = db.prepare('SELECT * FROM partner_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Partner profile not found' });

  // Recent requests count for today (simulated for demo)
  res.json({ profile, user: req.user });
});

router.patch('/toggle', authenticate, (req, res) => {
  if (!PARTNER_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Partners only' });

  const profile = db.prepare('SELECT is_open FROM partner_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Partner profile not found' });

  const newStatus = profile.is_open ? 0 : 1;
  db.prepare('UPDATE partner_profiles SET is_open = ? WHERE user_id = ?').run(newStatus, req.user.id);
  res.json({ isOpen: !!newStatus });
});

module.exports = router;
