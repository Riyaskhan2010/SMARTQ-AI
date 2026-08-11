// SmartQ AI - Backend Entry Point
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { setupSocketHandlers } = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// ── Socket.IO ────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
setupSocketHandlers(io);

// Make io accessible in routes
app.set('io', io);

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/sectors',     require('./routes/sectors'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/services',    require('./routes/services'));
app.use('/api/tokens',      require('./routes/tokens'));
app.use('/api/queues',      require('./routes/queues'));
app.use('/api/counters',    require('./routes/counters'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/staff',       require('./routes/staff'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/history',     require('./routes/history'));
app.use('/api/ai',          require('./routes/ai'));
app.use('/api/simulation',  require('./routes/simulation'));
app.use('/api/demo',        require('./routes/demo'));
app.use('/api/canteen',     require('./routes/canteen'));

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'SmartQ AI Backend', timestamp: new Date() }));

// ── Global error handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 SmartQ AI Backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = { app, server, io };
