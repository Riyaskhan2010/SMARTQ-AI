const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { getQueueState } = require('../services/queueService');
const prisma = new PrismaClient();

// GET /api/queues/:id  (full queue state by queue ID)
router.get('/:id', authenticate, async (req, res) => {
  const queue = await prisma.queue.findUnique({
    where: { id: req.params.id },
    include: {
      tokens: {
        where: { status: { in: ['WAITING', 'SERVING'] } },
        orderBy: { position: 'asc' },
        include: {
          service: true,
          counter: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!queue) return res.status(404).json({ error: 'Queue not found' });

  const state = await getQueueState(queue.departmentId);
  res.json({ queue, state });
});

// GET /api/queues/department/:departmentId  (queue by department)
router.get('/department/:departmentId', async (req, res) => {
  const state = await getQueueState(req.params.departmentId);
  if (!state) return res.status(404).json({ error: 'Queue not found for this department' });

  const servingToken = await prisma.token.findFirst({
    where: { queueId: state.queue.id, status: 'SERVING' },
    orderBy: { calledAt: 'desc' },
    include: { counter: true },
  });

  const nextTokens = await prisma.token.findMany({
    where: { queueId: state.queue.id, status: 'WAITING' },
    orderBy: { position: 'asc' },
    take: 5,
    include: { service: true },
  });

  res.json({
    queue: state.queue,
    counters: state.counters,
    activeCounters: state.activeCounters,
    waitingCount: state.waitingTokens.length,
    servingCount: state.servingTokens.length,
    crowdLevel: state.crowdLevel,
    estimatedWait: state.baseETA,
    servingToken,
    nextTokens,
    allWaiting: state.waitingTokens,
    allServing: state.servingTokens,
  });
});

// GET /api/queues/public/:departmentId  (no auth, for display board)
router.get('/public/:departmentId', async (req, res) => {
  const state = await getQueueState(req.params.departmentId);
  if (!state) return res.status(404).json({ error: 'Queue not found' });

  const serving = await prisma.token.findMany({
    where: { queueId: state.queue.id, status: 'SERVING' },
    include: { counter: true, service: true },
    orderBy: { calledAt: 'desc' },
  });

  const next = await prisma.token.findMany({
    where: { queueId: state.queue.id, status: 'WAITING' },
    orderBy: { position: 'asc' },
    take: 8,
    include: { service: true },
  });

  res.json({
    serving,
    next,
    counters: state.counters,
    crowdLevel: state.crowdLevel,
    estimatedWait: state.baseETA,
    waitingCount: state.waitingTokens.length,
    activeCounters: state.activeCounters,
  });
});

module.exports = router;
