// What-if Queue Simulation
const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { calculateETA, getCrowdLevel } = require('../services/queueService');
const prisma = new PrismaClient();

// POST /api/simulation
router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { queueId, deltaCounters = 0, deltaArrivalRate = 0, deltaServiceTime = 0 } = req.body;

    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: { tokens: { where: { status: 'WAITING' } } },
    });
    if (!queue) return res.status(404).json({ error: 'Queue not found' });

    const counters = await prisma.counter.findMany({ where: { departmentId: queue.departmentId } });
    const activeCounters = counters.filter(c => c.status === 'OPEN').length;
    const services = await prisma.service.findMany({ where: { department: { id: queue.departmentId } } });
    const avgServiceTime = services.length
      ? services.reduce((s, svc) => s + svc.avgServiceTime, 0) / services.length
      : 8;

    const waitingCount = queue.tokens.length;

    // Current state
    const currentETA   = calculateETA({ waitingAhead: waitingCount, activeCounters, avgServiceTime });
    const currentCrowd = getCrowdLevel(waitingCount, activeCounters);

    // Simulated state
    const simCounters     = Math.max(0, activeCounters + deltaCounters);
    const simArrivalMulti = 1 + (deltaArrivalRate / 100);
    const simWaiting      = Math.ceil(waitingCount * simArrivalMulti);
    const simServiceTime  = Math.max(1, avgServiceTime + deltaServiceTime);
    const simETA          = calculateETA({ waitingAhead: simWaiting, activeCounters: simCounters, avgServiceTime: simServiceTime });
    const simCrowd        = getCrowdLevel(simWaiting, simCounters);

    const improvement = currentETA - simETA;

    res.json({
      current:   { activeCounters, waitingCount, avgServiceTime, eta: currentETA, crowdLevel: currentCrowd },
      simulated: { activeCounters: simCounters, waitingCount: simWaiting, avgServiceTime: simServiceTime, eta: simETA, crowdLevel: simCrowd },
      improvement,
      recommendation: improvement > 0
        ? `This change could reduce average wait time by ~${improvement} minutes.`
        : improvement < 0
          ? `This change may increase average wait time by ~${Math.abs(improvement)} minutes.`
          : 'No significant impact expected.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
