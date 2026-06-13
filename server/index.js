const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { initDB } = require('./database');

const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3002;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: IS_PROD ? {} : { origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }
});

// userId (string) → socket instance
const connectedUsers = new Map();

if (!IS_PROD) {
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
}
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

// In production, serve the React build from ../client/dist
if (IS_PROD) {
  const buildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(buildPath, 'index.html'));
    }
  });
}

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
  server.listen(PORT, () => {
    console.log('');
    console.log(`🔧 MechHub Nepal server running on port ${PORT}`);
    console.log(`   Mode: ${IS_PROD ? 'production' : 'development'}`);
    console.log('');
  });
}

main().catch(err => { console.error('Startup failed:', err); process.exit(1); });
