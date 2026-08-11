// Staff counter operations: next, start, complete, no-show + counter assignment
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { recalculateQueueETA, getNextWaitingToken } = require('../services/queueService');
const { emitQueueUpdated, emitTokenCalled, emitTokenCompleted, emitEtaUpdated, emitNotification, emitPublicDisplay } = require('../services/socketService');
const prisma = new PrismaClient();

// SQLite stores JSON as text
const js = (obj) => obj ? JSON.stringify(obj) : null;

// PATCH /api/staff/assign-counter
router.patch('/assign-counter', authenticate, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { counterId, organizationId } = req.body;
    if (!counterId || !organizationId) return res.status(400).json({ error: 'counterId and organizationId required' });
    const counter = await prisma.counter.findUnique({ where: { id: counterId }, include: { department: { include: { organization: true } } } });
    if (!counter) return res.status(404).json({ error: 'Counter not found' });
    const staff = await prisma.staff.upsert({
      where: { userId: req.user.id },
      update: { counterId, organizationId },
      create: { userId: req.user.id, organizationId, counterId, designation: 'Counter Staff' },
      include: { counter: { include: { department: { include: { organization: true } } } }, organization: { select: { id: true, name: true } } },
    });
    res.json({ staff, counter });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// PATCH /api/staff/unassign-counter — for "Change Location"
router.patch('/unassign-counter', authenticate, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    await prisma.staff.update({ where: { userId: req.user.id }, data: { counterId: null } });
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

// GET /api/staff/org-counters/:departmentId — counters for a dept (staff setup)
router.get('/org-counters/:departmentId', authenticate, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  const counters = await prisma.counter.findMany({
    where: { departmentId: req.params.departmentId, isActive: true },
    include: { staff: { include: { user: { select: { name: true } } } } },
    orderBy: { number: 'asc' },
  });
  res.json(counters);
});

// Helper: get staff's assigned counter
async function getStaffCounter(userId) {
  const staff = await prisma.staff.findUnique({
    where: { userId },
    include: { counter: true },
  });
  return staff?.counter || null;
}

// POST /api/staff/next  — call next token
router.post('/next', authenticate, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const counter = await getStaffCounter(req.user.id);
    if (!counter) return res.status(400).json({ error: 'No counter assigned' });

    const queue = await prisma.queue.findFirst({
      where: { departmentId: counter.departmentId },
    });
    if (!queue) return res.status(404).json({ error: 'Queue not found' });

    // If current token is still serving, must complete first
    const currentServing = await prisma.token.findFirst({
      where: { counterId: counter.id, status: 'SERVING' },
    });
    if (currentServing) return res.status(400).json({ error: 'Current token must be completed first', token: currentServing });

    const nextToken = await getNextWaitingToken(queue.id);
    if (!nextToken) return res.status(404).json({ error: 'No waiting tokens' });

    const called = await prisma.token.update({
      where: { id: nextToken.id },
      data: { status: 'SERVING', counterId: counter.id, calledAt: new Date() },
      include: { service: true, user: { select: { id: true, name: true } } },
    });

    await prisma.queueEvent.create({
      data: {
        queueId: queue.id, tokenId: called.id, counterId: counter.id,
        eventType: 'TOKEN_CALLED', triggeredBy: req.user.id,
        data: js({ tokenNumber: called.tokenNumber }),
      },
    });

    // Notify user
    if (called.userId) {
      const notif = await prisma.notification.create({
        data: {
          userId: called.userId, type: 'TOKEN_CALLED',
          title: 'Your Turn!',
          message: `Token ${called.tokenNumber} – please proceed to ${counter.name}.`,
          data: js({ tokenNumber: called.tokenNumber, counterName: counter.name }),
        },
      });
      const io = req.app.get('io');
      emitNotification(io, called.userId, notif);
    }

    const io = req.app.get('io');
    emitTokenCalled(io, queue.id, { token: called, counter });
    emitPublicDisplay(io, counter.departmentId, { action: 'TOKEN_CALLED', token: called, counter });

    res.json({ token: called, counter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff/tokens/:id/start
router.post('/tokens/:id/start', authenticate, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  const token = await prisma.token.update({
    where: { id: req.params.id },
    data: { startedAt: new Date() },
  });
  res.json({ token });
});

// POST /api/staff/tokens/:id/complete
router.post('/tokens/:id/complete', authenticate, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const existing = await prisma.token.findUnique({
      where: { id: req.params.id },
      include: { service: { include: { department: { include: { organization: true } } } }, user: true },
    });
    if (!existing) return res.status(404).json({ error: 'Token not found' });
    if (existing.status !== 'SERVING') return res.status(400).json({ error: 'Token is not being served' });

    const now = new Date();
    const actualWait = existing.startedAt
      ? Math.round((now - new Date(existing.startedAt)) / 60000)
      : null;

    const token = await prisma.token.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: now, actualWait },
    });

    // Add to visit history
    if (existing.userId) {
      await prisma.visitHistory.create({
        data: {
          userId: existing.userId,
          tokenId: existing.id,
          organizationName: existing.service.department.organization.name,
          serviceName: existing.service.name,
          visitDate: now,
          status: 'COMPLETED',
          waitTime: actualWait,
        },
      });
      const notif = await prisma.notification.create({
        data: {
          userId: existing.userId, type: 'TOKEN_COMPLETED',
          title: 'Service Completed',
          message: `Your service for ${existing.service.name} has been completed. Thank you!`,
          data: js({ tokenNumber: existing.tokenNumber }),
        },
      });
      const io = req.app.get('io');
      emitNotification(io, existing.userId, notif);
    }

    await prisma.queueEvent.create({
      data: {
        queueId: existing.queueId, tokenId: existing.id,
        eventType: 'TOKEN_COMPLETED', triggeredBy: req.user.id,
      },
    });

    const etaResult = await recalculateQueueETA(existing.queueId);
    const io = req.app.get('io');
    emitTokenCompleted(io, existing.queueId, { token, ...etaResult });
    emitQueueUpdated(io, existing.queueId, { action: 'TOKEN_COMPLETED', token, ...etaResult });
    emitPublicDisplay(io, existing.service.departmentId, { action: 'TOKEN_COMPLETED', token });

    res.json({ token, etaResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff/tokens/:id/no-show
router.post('/tokens/:id/no-show', authenticate, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const existing = await prisma.token.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Token not found' });

    const token = await prisma.token.update({
      where: { id: req.params.id },
      data: { status: 'NO_SHOW', completedAt: new Date() },
    });

    await prisma.queueEvent.create({
      data: {
        queueId: existing.queueId, tokenId: existing.id,
        eventType: 'TOKEN_NO_SHOW', triggeredBy: req.user.id,
      },
    });

    const etaResult = await recalculateQueueETA(existing.queueId);
    const io = req.app.get('io');
    emitQueueUpdated(io, existing.queueId, { action: 'TOKEN_NO_SHOW', token, ...etaResult });

    res.json({ token, etaResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/staff/counter  — current counter info + queue
router.get('/counter', authenticate, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  const staff = await prisma.staff.findUnique({
    where: { userId: req.user.id },
    include: {
      counter: { include: { department: true } },
      organization: true,
    },
  });
  if (!staff) return res.status(404).json({ error: 'Staff profile not found' });

  const queue = staff.counter
    ? await prisma.queue.findUnique({ where: { departmentId: staff.counter.departmentId } })
    : null;

  const servingToken = queue
    ? await prisma.token.findFirst({
        where: { counterId: staff.counterId, status: 'SERVING' },
        include: { service: true, user: { select: { id: true, name: true } } },
      })
    : null;

  const waitingTokens = queue
    ? await prisma.token.findMany({
        where: { queueId: queue.id, status: 'WAITING' },
        orderBy: { position: 'asc' },
        take: 20,
        include: {
          service: true,
          user: { select: { id: true, name: true } },
        },
      })
    : [];

  res.json({ staff, queue, servingToken, waitingTokens });
});

module.exports = router;
