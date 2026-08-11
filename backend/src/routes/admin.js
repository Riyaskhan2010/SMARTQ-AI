const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { recalculateQueueETA, getCrowdLevel } = require('../services/queueService');
const prisma = new PrismaClient();

// GET /api/admin/dashboard  — summary for admin
router.get('/dashboard', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    // Find orgs that this admin can manage (for demo, show all)
    const orgs = await prisma.organization.findMany({ where: { isActive: true }, select: { id: true, name: true } });
    const orgIds = orgs.map(o => o.id);

    const depts = await prisma.department.findMany({ where: { organizationId: { in: orgIds } } });
    const deptIds = depts.map(d => d.id);

    const counters = await prisma.counter.findMany({
      where: { departmentId: { in: deptIds } },
      include: { staff: { include: { user: { select: { name: true } } } }, department: true },
      orderBy: [{ department: { name: 'asc' } }, { number: 'asc' }],
    });

    const queues = await prisma.queue.findMany({ where: { departmentId: { in: deptIds } } });
    const queueIds = queues.map(q => q.id);

    const waitingTokens = await prisma.token.findMany({
      where: { queueId: { in: queueIds }, status: 'WAITING' },
      include: { service: true, queue: true },
      orderBy: { position: 'asc' },
    });

    const servingTokens = await prisma.token.findMany({
      where: { queueId: { in: queueIds }, status: 'SERVING' },
      include: { service: true, counter: true },
    });

    const totalWaiting  = waitingTokens.length;
    const activeCounters = counters.filter(c => c.status === 'OPEN').length;
    const pausedCounters = counters.filter(c => c.status === 'PAUSED').length;

    // Average ETA across queues
    const avgServiceTime = 8;
    const baseETA = activeCounters > 0
      ? Math.ceil((totalWaiting / activeCounters) * avgServiceTime * 0.92)
      : 99;

    const crowdLevel = getCrowdLevel(totalWaiting, activeCounters);

    // Latest recommendation
    const recommendation = await prisma.recommendation.findFirst({
      where: { queueId: { in: queueIds }, isAccepted: false },
      orderBy: { createdAt: 'desc' },
    });

    // Today completed
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const completedToday = await prisma.token.count({
      where: { queueId: { in: queueIds }, status: 'COMPLETED', completedAt: { gte: today } },
    });

    const noShowToday = await prisma.token.count({
      where: { queueId: { in: queueIds }, status: 'NO_SHOW', completedAt: { gte: today } },
    });

    res.json({
      summary: { totalWaiting, activeCounters, pausedCounters, totalCounters: counters.length, avgETA: baseETA, crowdLevel, completedToday, noShowToday },
      counters,
      waitingTokens,
      servingTokens,
      recommendation,
      queues,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/analytics
router.get('/analytics', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { range = '7' } = req.query;
    const days = parseInt(range, 10);
    const since = new Date(); since.setDate(since.getDate() - days); since.setHours(0, 0, 0, 0);

    const tokens = await prisma.token.findMany({
      where: { bookedAt: { gte: since } },
      include: { service: true, queue: true },
    });

    // Group by date
    const byDate = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since); d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      byDate[key] = { date: key, total: 0, completed: 0, noShow: 0, waiting: 0, avgWait: 0, waitSum: 0, waitCount: 0 };
    }

    for (const t of tokens) {
      const key = t.bookedAt.toISOString().split('T')[0];
      if (!byDate[key]) continue;
      byDate[key].total++;
      if (t.status === 'COMPLETED') { byDate[key].completed++; if (t.actualWait) { byDate[key].waitSum += t.actualWait; byDate[key].waitCount++; } }
      if (t.status === 'NO_SHOW') byDate[key].noShow++;
      if (t.status === 'WAITING') byDate[key].waiting++;
    }

    for (const v of Object.values(byDate)) {
      v.avgWait = v.waitCount > 0 ? Math.round(v.waitSum / v.waitCount) : 0;
      delete v.waitSum; delete v.waitCount;
    }

    // Peak hours
    const hourlyBuckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    for (const t of tokens) {
      hourlyBuckets[t.bookedAt.getHours()].count++;
    }
    const peakHours = hourlyBuckets.filter(h => h.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

    // Service breakdown
    const serviceMap = {};
    for (const t of tokens) {
      const name = t.service.name;
      if (!serviceMap[name]) serviceMap[name] = { name, total: 0, completed: 0 };
      serviceMap[name].total++;
      if (t.status === 'COMPLETED') serviceMap[name].completed++;
    }

    // Counter utilization
    const counterStats = await prisma.token.groupBy({
      by: ['counterId'],
      _count: { id: true },
      where: { bookedAt: { gte: since }, counterId: { not: null } },
    });

    const totalTokens  = tokens.length;
    const totalCompleted = tokens.filter(t => t.status === 'COMPLETED').length;
    const totalNoShow  = tokens.filter(t => t.status === 'NO_SHOW').length;
    const noShowRate   = totalTokens > 0 ? ((totalNoShow / totalTokens) * 100).toFixed(1) : 0;
    const completionRate = totalTokens > 0 ? ((totalCompleted / totalTokens) * 100).toFixed(1) : 0;
    const allActualWaits = tokens.filter(t => t.actualWait).map(t => t.actualWait);
    const overallAvgWait = allActualWaits.length > 0
      ? Math.round(allActualWaits.reduce((s, w) => s + w, 0) / allActualWaits.length) : 0;

    res.json({
      summary: { totalTokens, totalCompleted, totalNoShow, noShowRate, completionRate, overallAvgWait },
      daily: Object.values(byDate),
      peakHours,
      services: Object.values(serviceMap),
      counterStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/recommendations/:id/accept
router.post('/recommendations/:id/accept', authenticate, requireRole('ADMIN'), async (req, res) => {
  const rec = await prisma.recommendation.update({
    where: { id: req.params.id },
    data: { isAccepted: true, acceptedBy: req.user.id, acceptedAt: new Date() },
  });
  res.json({ recommendation: rec });
});

module.exports = router;
