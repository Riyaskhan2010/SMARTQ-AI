const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  const notifs = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  const unreadCount = notifs.filter(n => !n.isRead).length;
  res.json({ notifications: notifs, unreadCount });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res) => {
  const n = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json(n);
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ success: true });
});

module.exports = router;
