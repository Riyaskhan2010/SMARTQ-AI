const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/services/:id
router.get('/:id', async (req, res) => {
  const svc = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: {
      department: {
        include: {
          organization: { include: { sector: true } },
          counters: { where: { status: 'OPEN' } },
        },
      },
    },
  });
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  res.json(svc);
});

// GET /api/services/:id/queue-info  (for booking preview)
router.get('/:id/queue-info', async (req, res) => {
  const svc = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: { department: true },
  });
  if (!svc) return res.status(404).json({ error: 'Service not found' });

  const queue = await prisma.queue.findUnique({ where: { departmentId: svc.departmentId } });
  const counters = await prisma.counter.findMany({ where: { departmentId: svc.departmentId } });
  const activeCounters = counters.filter(c => c.status === 'OPEN').length;

  let waitingCount = 0;
  let servingToken = null;

  if (queue) {
    waitingCount = await prisma.token.count({ where: { queueId: queue.id, status: 'WAITING' } });
    servingToken = await prisma.token.findFirst({
      where: { queueId: queue.id, status: 'SERVING' },
      orderBy: { calledAt: 'desc' },
      select: { tokenNumber: true },
    });
  }

  const { calculateETA, getCrowdLevel } = require('../services/queueService');
  const eta = calculateETA({ waitingAhead: waitingCount, activeCounters, avgServiceTime: svc.avgServiceTime });
  const crowdLevel = getCrowdLevel(waitingCount, activeCounters);

  res.json({
    service: svc,
    queue: queue ? { id: queue.id, lastNumber: queue.lastNumber, tokenPrefix: queue.tokenPrefix } : null,
    activeCounters,
    waitingCount,
    servingToken: servingToken?.tokenNumber || null,
    estimatedWait: eta,
    crowdLevel,
  });
});

module.exports = router;
