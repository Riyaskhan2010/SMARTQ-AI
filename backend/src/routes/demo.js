// Demo Mode – Load scenario, reset queue, etc.
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { recalculateQueueETA } = require('../services/queueService');
const { emitQueueUpdated } = require('../services/socketService');
const prisma = new PrismaClient();

// POST /api/demo/load-scenario
// Resets the Gov Hospital OPD queue to a fresh demo state
router.post('/load-scenario', authenticate, async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');

    // Find Gov Hospital OPD department
    const dept = await prisma.department.findFirst({
      where: { name: { contains: 'Outpatient' } },
    });
    if (!dept) return res.status(404).json({ error: 'OPD department not found' });

    // Reset counters
    await prisma.counter.updateMany({
      where: { departmentId: dept.id, number: { in: [1, 2, 3] } },
      data: { status: 'OPEN' },
    });
    await prisma.counter.updateMany({
      where: { departmentId: dept.id, number: { in: [4, 5] } },
      data: { status: 'CLOSED' },
    });

    // Clear existing tokens
    const queue = await prisma.queue.findUnique({ where: { departmentId: dept.id } });
    if (queue) {
      await prisma.token.deleteMany({ where: { queueId: queue.id } });
      await prisma.queue.update({ where: { id: queue.id }, data: { lastNumber: 100 } });
    }

    const services = await prisma.service.findMany({ where: { departmentId: dept.id } });
    const genOP    = services.find(s => s.name.includes('General OP'));
    const followUp = services.find(s => s.name.includes('Follow-up'));
    if (!genOP || !queue) return res.status(500).json({ error: 'Services or queue not found' });

    const counters = await prisma.counter.findMany({ where: { departmentId: dept.id }, orderBy: { number: 'asc' } });
    const [c1, c2, c3] = counters;

    const demoUser = await prisma.user.findFirst({ where: { email: 'demo.user@smartq.ai' } });

    const bookedAt = (minAgo) => { const d = new Date(); d.setMinutes(d.getMinutes() - minAgo); return d; };

    // Completed tokens
    for (let i = 0; i < 4; i++) {
      const ctr = [c1, c2, c3, c1][i];
      const started = bookedAt(40 - i * 7);
      const completed = new Date(started); completed.setMinutes(completed.getMinutes() + 7);
      await prisma.token.create({ data: {
        id: uuidv4(), queueId: queue.id, userId: null,
        serviceId: genOP.id, counterId: ctr.id,
        tokenNumber: `A${98 + i}`, status: 'COMPLETED',
        position: i + 1, bookedAt: bookedAt(50 - i * 7),
        startedAt: started, completedAt: completed, actualWait: 7, estimatedWait: 8,
      }});
    }

    // Serving tokens — with realistic demo names in notes field
    await prisma.token.create({ data: { id: uuidv4(), queueId: queue.id, userId: null, notes: 'Arun Kumar',   serviceId: genOP.id, counterId: c1.id, tokenNumber: 'A102', status: 'SERVING', position: 5, bookedAt: bookedAt(20), calledAt: bookedAt(2), startedAt: bookedAt(1), estimatedWait: 0 }});
    await prisma.token.create({ data: { id: uuidv4(), queueId: queue.id, userId: null, notes: 'Priya Sharma', serviceId: genOP.id, counterId: c2.id, tokenNumber: 'A103', status: 'SERVING', position: 6, bookedAt: bookedAt(18), calledAt: bookedAt(3), startedAt: bookedAt(2), estimatedWait: 0 }});
    await prisma.token.create({ data: { id: uuidv4(), queueId: queue.id, userId: null, notes: 'Mohamed Ali',  serviceId: followUp?.id || genOP.id, counterId: c3.id, tokenNumber: 'A104', status: 'SERVING', position: 7, bookedAt: bookedAt(15), calledAt: bookedAt(4), startedAt: bookedAt(3), estimatedWait: 0 }});

    // Demo user's token A105 (name comes from authenticated user record)
    await prisma.token.create({ data: { id: uuidv4(), queueId: queue.id, userId: demoUser?.id, notes: demoUser?.name || 'Demo User', serviceId: genOP.id, counterId: null, tokenNumber: 'A105', status: 'WAITING', position: 8, bookedAt: bookedAt(3), estimatedWait: 32 }});

    // Additional waiting tokens with demo names
    const demoNames = [
      'Rahul Verma', 'Priya Sharma', 'Karthik Raja', 'Sarah Thomas',
      'Deepa Nair',  'Vikram Singh', 'Meera Patel',  'Suresh Babu',
      'Kavitha Devi','Anand Kumar',  'Fatima Sheikh','Ravi Chandran', 'Lakshmi Iyer'
    ];
    const waitNums   = ['A106','A107','A108','A109','A110','A111','A112','A113','A114','A115','A116','A117','A118'];
    const waitFUMap  = [false, true, false, false, true, false, false, false, true, false, false, true, false];
    for (let i = 0; i < waitNums.length; i++) {
      await prisma.token.create({ data: {
        id: uuidv4(), queueId: queue.id, userId: null,
        notes: demoNames[i],
        serviceId: (i % 3 === 2 && followUp) ? followUp.id : genOP.id,
        isFollowUp: waitFUMap[i],
        counterId: null, tokenNumber: waitNums[i], status: 'WAITING',
        position: 9 + i, bookedAt: bookedAt(2 - i * 0.1), estimatedWait: 32 + (i + 1) * 8
      }});
    }

    await prisma.queue.update({ where: { id: queue.id }, data: { lastNumber: 118 } });

    // Create fresh recommendation
    await prisma.recommendation.deleteMany({ where: { queueId: queue.id, isAccepted: false } });
    await prisma.recommendation.create({ data: { queueId: queue.id, message: 'High crowd detected. 15 patients waiting with only 3 active counters.', action: 'Open Counter 4', currentETA: 32, expectedETA: 21, isAccepted: false } });

    const etaResult = await recalculateQueueETA(queue.id);
    const io = req.app.get('io');
    emitQueueUpdated(io, queue.id, { action: 'DEMO_RESET', ...etaResult });

    res.json({ success: true, message: 'Demo scenario loaded', tokens: 18, activeCounters: 3, queueId: queue.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/demo/credentials
router.get('/credentials', (_req, res) => {
  res.json({
    accounts: [
      { role: 'User',  email: 'demo.user@smartq.ai',  password: 'demo123', description: 'Regular citizen with active token A105' },
      { role: 'Admin', email: 'demo.admin@smartq.ai', password: 'demo123', description: 'Organization admin with full dashboard access' },
      { role: 'Staff', email: 'demo.staff@smartq.ai', password: 'demo123', description: 'Counter staff at Counter 1' },
    ],
  });
});

module.exports = router;
