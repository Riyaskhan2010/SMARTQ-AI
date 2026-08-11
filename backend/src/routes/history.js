const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/history
router.get('/', authenticate, async (req, res) => {
  const history = await prisma.visitHistory.findMany({
    where: { userId: req.user.id },
    orderBy: { visitDate: 'desc' },
    take: 20,
  });
  res.json(history);
});

module.exports = router;
