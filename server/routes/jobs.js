const express = require('express');
const { db } = require('../database');
const { authenticate } = require('../middleware/auth');
const { SERVICES, calculateFare, getLevel } = require('../constants');

const router = express.Router();

// POST /api/jobs — driver creates a service request
router.post('/', authenticate, (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Drivers only' });

  const { serviceType, vehicleType = 'car', locationName = 'Current Location', lat = 27.7172, lng = 85.3240 } = req.body;
  if (!serviceType || !SERVICES[serviceType]) return res.status(400).json({ error: 'Invalid service type' });

  const fare = calculateFare(serviceType, vehicleType);

  const result = db.prepare(`
    INSERT INTO service_requests (driver_id, service_type, vehicle_type, location_name, lat, lng, fare)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, serviceType, vehicleType, locationName, lat, lng, fare);

  const job = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(result.lastInsertRowid);

  // Emit new job ping to all connected online mechanics
  const io = req.app.get('io');
  const connectedUsers = req.app.get('connectedUsers');

  const onlineMechanics = db.prepare(
    'SELECT user_id FROM mechanic_profiles WHERE is_online = 1'
  ).all();

  onlineMechanics.forEach(({ user_id }) => {
    const socket = connectedUsers.get(String(user_id));
    if (socket) socket.emit('new_job', { job, serviceName: SERVICES[serviceType].name, driverName: req.user.name });
  });

  // Demo auto-assign: if no mechanic accepts within 2.5s, auto-assign the best available one
  const driverId = req.user.id;
  const jobId = job.id;
  setTimeout(() => {
    const current = db.prepare('SELECT status FROM service_requests WHERE id = ?').get(jobId);
    if (!current || current.status !== 'pending') return;

    const mechanic = db.prepare(`
      SELECT mp.user_id, u.name, u.phone, mp.rating, mp.jobs_done, mp.specialties, mp.xp, mp.level, mp.current_lat, mp.current_lng
      FROM mechanic_profiles mp
      JOIN users u ON u.id = mp.user_id
      WHERE mp.is_online = 1
      ORDER BY mp.rating DESC
      LIMIT 1
    `).get();

    if (!mechanic) return;

    db.prepare(
      'UPDATE service_requests SET status = ?, mechanic_id = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run('accepted', mechanic.user_id, jobId);

    const driverSocket = connectedUsers.get(String(driverId));
    if (driverSocket) {
      driverSocket.emit('job_accepted', {
        jobId,
        mechanic: {
          id: mechanic.user_id,
          name: mechanic.name,
          phone: mechanic.phone,
          rating: mechanic.rating,
          jobsDone: mechanic.jobs_done,
          specialties: mechanic.specialties ? mechanic.specialties.split(',') : [],
          xp: mechanic.xp,
          level: mechanic.level,
          lat: mechanic.current_lat,
          lng: mechanic.current_lng,
        }
      });
    }
  }, 2500);

  res.status(201).json(job);
});

// GET /api/jobs/current — driver's active job
router.get('/current', authenticate, (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Drivers only' });

  const job = db.prepare(`
    SELECT sr.*,
      u.name AS mechanic_name, u.phone AS mechanic_phone,
      mp.rating AS mechanic_rating, mp.jobs_done AS mechanic_jobs_done,
      mp.specialties AS mechanic_specialties, mp.xp AS mechanic_xp,
      mp.level AS mechanic_level, mp.current_lat AS mechanic_lat, mp.current_lng AS mechanic_lng
    FROM service_requests sr
    LEFT JOIN users u ON u.id = sr.mechanic_id
    LEFT JOIN mechanic_profiles mp ON mp.user_id = sr.mechanic_id
    WHERE sr.driver_id = ? AND sr.status NOT IN ('completed', 'cancelled')
    ORDER BY sr.created_at DESC
    LIMIT 1
  `).get(req.user.id);

  res.json(job || null);
});

// GET /api/jobs/history — driver's completed/cancelled jobs
router.get('/history', authenticate, (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Drivers only' });

  const jobs = db.prepare(`
    SELECT sr.*, u.name AS mechanic_name
    FROM service_requests sr
    LEFT JOIN users u ON u.id = sr.mechanic_id
    WHERE sr.driver_id = ? AND sr.status IN ('completed', 'cancelled')
    ORDER BY sr.created_at DESC
    LIMIT 30
  `).all(req.user.id);

  res.json(jobs);
});

// GET /api/jobs/:id — get any job by id
router.get('/:id', authenticate, (req, res) => {
  const job = db.prepare(`
    SELECT sr.*,
      u_d.name AS driver_name,
      u_m.name AS mechanic_name, u_m.phone AS mechanic_phone,
      mp.rating AS mechanic_rating, mp.jobs_done AS mechanic_jobs_done,
      mp.specialties AS mechanic_specialties, mp.xp AS mechanic_xp,
      mp.level AS mechanic_level, mp.current_lat AS mechanic_lat, mp.current_lng AS mechanic_lng
    FROM service_requests sr
    LEFT JOIN users u_d ON u_d.id = sr.driver_id
    LEFT JOIN users u_m ON u_m.id = sr.mechanic_id
    LEFT JOIN mechanic_profiles mp ON mp.user_id = sr.mechanic_id
    WHERE sr.id = ?
  `).get(req.params.id);

  if (!job) return res.status(404).json({ error: 'Job not found' });

  const isParty = job.driver_id === req.user.id || job.mechanic_id === req.user.id;
  if (!isParty) return res.status(403).json({ error: 'Access denied' });

  res.json(job);
});

// PATCH /api/jobs/:id/status — update job status (mechanic or driver)
router.patch('/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  const valid = ['accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const job = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const isParty = job.driver_id === req.user.id || job.mechanic_id === req.user.id;
  if (!isParty) return res.status(403).json({ error: 'Access denied' });

  const sets = ['status = ?'];
  const params = [status];

  if (status === 'accepted') {
    sets.push('mechanic_id = ?', 'accepted_at = CURRENT_TIMESTAMP');
    params.push(req.user.id);
  }
  if (status === 'completed') sets.push('completed_at = CURRENT_TIMESTAMP');

  params.push(req.params.id);
  db.prepare(`UPDATE service_requests SET ${sets.join(', ')} WHERE id = ?`).run(...params);

  // Award XP and earnings when mechanic completes job
  if (status === 'completed' && req.user.role === 'mechanic') {
    const service = SERVICES[job.service_type];
    const xpGain = service ? service.xp : 50;
    const mechanicCut = Math.round(job.fare * 0.9);

    const mp = db.prepare('SELECT xp FROM mechanic_profiles WHERE user_id = ?').get(req.user.id);
    const newXp = (mp?.xp || 0) + xpGain;
    const levelInfo = getLevel(newXp);

    db.prepare(
      'UPDATE mechanic_profiles SET xp = ?, level = ?, jobs_done = jobs_done + 1, streak = streak + 1 WHERE user_id = ?'
    ).run(newXp, levelInfo.level, req.user.id);
    db.prepare(
      'INSERT INTO earnings (mechanic_id, request_id, amount) VALUES (?, ?, ?)'
    ).run(req.user.id, job.id, mechanicCut);
  }

  // Notify the other party via socket
  const io = req.app.get('io');
  const connectedUsers = req.app.get('connectedUsers');
  const otherId = req.user.id === job.driver_id ? job.mechanic_id : job.driver_id;

  if (otherId) {
    const otherSocket = connectedUsers.get(String(otherId));
    if (otherSocket) otherSocket.emit('job_status_update', { jobId: job.id, status });
  }

  res.json({ ok: true, status });
});

// PATCH /api/jobs/:id/accept — mechanic explicitly accepts job
router.patch('/:id/accept', authenticate, (req, res) => {
  if (req.user.role !== 'mechanic') return res.status(403).json({ error: 'Mechanics only' });

  const job = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'pending') return res.status(409).json({ error: 'Job is no longer available' });

  db.prepare(
    'UPDATE service_requests SET status = ?, mechanic_id = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run('accepted', req.user.id, job.id);

  // Notify driver
  const io = req.app.get('io');
  const connectedUsers = req.app.get('connectedUsers');
  const driverSocket = connectedUsers.get(String(job.driver_id));

  const mp = db.prepare('SELECT * FROM mechanic_profiles WHERE user_id = ?').get(req.user.id);

  if (driverSocket) {
    driverSocket.emit('job_accepted', {
      jobId: job.id,
      mechanic: {
        id: req.user.id,
        name: req.user.name,
        phone: req.user.phone,
        rating: mp?.rating || 5.0,
        jobsDone: mp?.jobs_done || 0,
        specialties: mp?.specialties ? mp.specialties.split(',') : [],
        xp: mp?.xp || 0,
        level: mp?.level || 1,
        lat: mp?.current_lat,
        lng: mp?.current_lng,
      }
    });
  }

  res.json({ ok: true, jobId: job.id });
});

// PATCH /api/jobs/:id/payment — record payment method
router.patch('/:id/payment', authenticate, (req, res) => {
  const { payMethod } = req.body;
  const job = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
  if (!job || job.driver_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

  db.prepare('UPDATE service_requests SET pay_method = ? WHERE id = ?').run(payMethod, req.params.id);
  res.json({ ok: true });
});

// PATCH /api/jobs/:id/rate — driver rates the mechanic
router.patch('/:id/rate', authenticate, (req, res) => {
  const { rating, comment, tip = 0 } = req.body;
  const job = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
  if (!job || job.driver_id !== req.user.id) return res.status(403).json({ error: 'Drivers only' });

  db.prepare(
    'UPDATE service_requests SET driver_rating = ?, driver_comment = ?, tip = ? WHERE id = ?'
  ).run(rating, comment || null, tip, req.params.id);

  if (job.mechanic_id && tip > 0) {
    const existing = db.prepare('SELECT id FROM earnings WHERE request_id = ?').get(job.id);
    if (existing) {
      db.prepare('UPDATE earnings SET amount = amount + ? WHERE request_id = ?').run(tip, job.id);
    }
  }

  if (job.mechanic_id) {
    const avg = db.prepare(
      'SELECT AVG(driver_rating) AS avg FROM service_requests WHERE mechanic_id = ? AND driver_rating IS NOT NULL'
    ).get(job.mechanic_id);
    const newRating = Math.round((avg?.avg || 5) * 10) / 10;
    db.prepare('UPDATE mechanic_profiles SET rating = ? WHERE user_id = ?').run(newRating, job.mechanic_id);
  }

  res.json({ ok: true });
});

module.exports = router;
