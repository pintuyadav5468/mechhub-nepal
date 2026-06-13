const express = require('express');
const { db } = require('../database');
const { authenticate } = require('../middleware/auth');
const { LEVEL_NAMES, LEVEL_THRESHOLDS, getLevel } = require('../constants');

const router = express.Router();

// GET /api/mechanics/nearby — all online mechanics (for driver radar)
router.get('/nearby', authenticate, (req, res) => {
  const mechanics = db.prepare(`
    SELECT mp.user_id AS id, u.name, mp.rating, mp.jobs_done, mp.specialties,
           mp.xp, mp.level, mp.current_lat AS lat, mp.current_lng AS lng, mp.is_online
    FROM mechanic_profiles mp
    JOIN users u ON u.id = mp.user_id
    WHERE mp.is_online = 1
    ORDER BY mp.rating DESC
  `).all();

  res.json(mechanics.map(m => ({
    ...m,
    specialties: m.specialties ? m.specialties.split(',') : [],
    levelName: LEVEL_NAMES[(m.level || 1) - 1] || 'Rookie',
    estimatedArrival: Math.floor(3 + Math.abs(m.id % 10)),
  })));
});

// GET /api/mechanics/dashboard — mechanic's own stats
router.get('/dashboard', authenticate, (req, res) => {
  if (req.user.role !== 'mechanic') return res.status(403).json({ error: 'Mechanics only' });

  const profile = db.prepare('SELECT * FROM mechanic_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Mechanic profile not found' });

  const today = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM earnings WHERE mechanic_id = ? AND DATE(created_at) = DATE('now')"
  ).get(req.user.id);
  const week = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM earnings WHERE mechanic_id = ? AND created_at >= DATE('now', '-7 days')"
  ).get(req.user.id);
  const month = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM earnings WHERE mechanic_id = ? AND created_at >= DATE('now', '-30 days')"
  ).get(req.user.id);
  const allTime = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) AS total FROM earnings WHERE mechanic_id = ?'
  ).get(req.user.id);

  const recentJobs = db.prepare(`
    SELECT sr.id, sr.service_type, sr.vehicle_type, sr.fare, sr.driver_rating, sr.completed_at,
           u.name AS driver_name
    FROM service_requests sr
    JOIN users u ON u.id = sr.driver_id
    WHERE sr.mechanic_id = ? AND sr.status = 'completed'
    ORDER BY sr.completed_at DESC
    LIMIT 10
  `).all(req.user.id);

  // Active job check
  const activeJob = db.prepare(`
    SELECT sr.*, u.name AS driver_name, u.phone AS driver_phone
    FROM service_requests sr
    JOIN users u ON u.id = sr.driver_id
    WHERE sr.mechanic_id = ? AND sr.status NOT IN ('completed', 'cancelled')
    LIMIT 1
  `).get(req.user.id);

  const levelInfo = getLevel(profile.xp);

  res.json({
    profile,
    earnings: {
      today: today.total,
      week: week.total,
      month: month.total,
      allTime: allTime.total,
    },
    recentJobs,
    activeJob: activeJob || null,
    levelInfo,
    isOnline: !!profile.is_online,
  });
});

// GET /api/mechanics/pending — pending jobs mechanic can pick up
router.get('/pending', authenticate, (req, res) => {
  if (req.user.role !== 'mechanic') return res.status(403).json({ error: 'Mechanics only' });

  const jobs = db.prepare(`
    SELECT sr.*, u.name AS driver_name
    FROM service_requests sr
    JOIN users u ON u.id = sr.driver_id
    WHERE sr.status = 'pending' AND sr.mechanic_id IS NULL
    ORDER BY sr.created_at DESC
    LIMIT 10
  `).all();

  res.json(jobs);
});

// PATCH /api/mechanics/toggle — go online / offline
router.patch('/toggle', authenticate, (req, res) => {
  if (req.user.role !== 'mechanic') return res.status(403).json({ error: 'Mechanics only' });

  const profile = db.prepare('SELECT is_online FROM mechanic_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const newStatus = profile.is_online ? 0 : 1;
  db.prepare('UPDATE mechanic_profiles SET is_online = ? WHERE user_id = ?').run(newStatus, req.user.id);
  res.json({ isOnline: !!newStatus });
});

// PATCH /api/mechanics/location — update GPS position
router.patch('/location', authenticate, (req, res) => {
  if (req.user.role !== 'mechanic') return res.status(403).json({ error: 'Mechanics only' });
  const { lat, lng } = req.body;

  db.prepare('UPDATE mechanic_profiles SET current_lat = ?, current_lng = ? WHERE user_id = ?')
    .run(lat, lng, req.user.id);

  res.json({ ok: true });
});

module.exports = router;
