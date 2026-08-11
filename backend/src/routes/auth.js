// Auth Routes
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const safeRole = ['USER', 'ADMIN', 'STAFF'].includes(role) ? role : 'USER';
    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, role: safeRole },
      select: { id: true, name: true, email: true, role: true, language: true },
    });
    const token = signToken(user.id);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account is disabled' });

    // If staff, load counter info
    let staffInfo = null;
    if (user.role === 'STAFF') {
      staffInfo = await prisma.staff.findUnique({
        where: { userId: user.id },
        include: { counter: true, organization: { select: { id: true, name: true } } },
      });
    }

    const token = signToken(user.id);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, language: user.language, isDemo: user.isDemo },
      token,
      staffInfo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, language: true, isDemo: true, createdAt: true },
    });
    let staffInfo = null;
    if (user.role === 'STAFF') {
      staffInfo = await prisma.staff.findUnique({
        where: { userId: user.id },
        include: { counter: true, organization: { select: { id: true, name: true } } },
      });
    }
    res.json({ user, staffInfo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/auth/language
router.patch('/language', authenticate, async (req, res) => {
  const { language } = req.body;
  await prisma.user.update({ where: { id: req.user.id }, data: { language } });
  res.json({ success: true });
});

module.exports = router;
