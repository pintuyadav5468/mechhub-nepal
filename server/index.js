const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { initDB } = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], credentials: true }
});

// userId (string) → socket instance
const connectedUsers = new Map();

const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// Make io + connectedUsers available in route handlers via req.app.get(...)
app.set('io', io);
app.set('connectedUsers', connectedUsers);

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/jobs',      require('./routes/jobs'));
app.use('/api/mechanics', require('./routes/mechanics'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/partners',  require('./routes/partners'));

app.get('/api/health', (_, res) => res.json({ ok: true, service: 'MechHub Nepal API' }));

io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    connectedUsers.set(String(userId), socket);
    console.log(`Socket registered: user ${userId} → ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (const [uid, s] of connectedUsers.entries()) {
      if (s.id === socket.id) { connectedUsers.delete(uid); break; }
    }
  });
});

async function main() {
  await initDB();
  server.listen(3002, () => {
    console.log('');
    console.log('🔧 MechHub Nepal server running on http://localhost:3002');
    console.log('   Health: http://localhost:3002/api/health');
    console.log('');
  });
}

main().catch(err => { console.error('Startup failed:', err); process.exit(1); });
