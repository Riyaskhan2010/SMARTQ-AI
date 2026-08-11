const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/organizations  (optionally ?sectorId=...)
router.get('/', async (req, res) => {
  const { sectorId, sector, search } = req.query;
  const where = { isActive: true };

  if (sectorId) where.sectorId = sectorId;
  if (sector) {
    const s = await prisma.sector.findUnique({ where: { slug: sector } });
    if (s) where.sectorId = s.id;
  }
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const orgs = await prisma.organization.findMany({
    where,
    include: { sector: true },
    orderBy: { name: 'asc' },
  });
  res.json(orgs);
});

// GET /api/organizations/:id
router.get('/:id', async (req, res) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.params.id },
    include: {
      sector: true,
      departments: {
        where: { isActive: true },
        include: {
          services: { where: { isActive: true } },
          counters: { orderBy: { number: 'asc' } },
        },
      },
    },
  });
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  res.json(org);
});

// GET /api/organizations/:id/queue-status  (live summary)
router.get('/:id/queue-status', async (req, res) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.params.id },
    include: { departments: { include: { counters: true } } },
  });
  if (!org) return res.status(404).json({ error: 'Not found' });

  const deptIds = org.departments.map(d => d.id);
  const queues = await prisma.queue.findMany({
    where: { departmentId: { in: deptIds } },
    include: { tokens: { where: { status: 'WAITING' } } },
  });

  const totalWaiting = queues.reduce((s, q) => s + q.tokens.length, 0);
  const totalCounters = org.departments.flatMap(d => d.counters).length;
  const activeCounters = org.departments.flatMap(d => d.counters).filter(c => c.status === 'OPEN').length;

  res.json({ totalWaiting, totalCounters, activeCounters, departments: org.departments.length });
});

module.exports = router;
