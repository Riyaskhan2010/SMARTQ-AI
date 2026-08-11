const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { recalculateQueueETA, getNextWaitingToken } = require('../services/queueService');
const {
  emitQueueUpdated, emitTokenCalled, emitCounterOpened,
  emitCounterPaused, emitEtaUpdated, emitNotification, emitPublicDisplay,
} = require('../services/socketService');
const prisma = new PrismaClient();

const logEvent = (data) => prisma.queueEvent.create({ data });

// POST /api/counters/:id/open
router.post('/:id/open', authenticate, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  const counter = await prisma.counter.update({
    where: { id: req.params.id },
    data: { status: 'OPEN', updatedAt: new Date() },
    include: { department: { include: { organization: true } } },
  });
  await logEvent({ counterId: counter.id, eventType: 'COUNTER_OPENED', triggeredBy: req.user.id });

  // Recalculate and broadcast
  const queue = await prisma.queue.findUnique({ where: { departmentId: counter.departmentId } });
  let etaResult = null;
  if (queue) {
    etaResult = await recalculateQueueETA(queue.id);
    const io = req.app.get('io');
    emitCounterOpened(io, counter.department.organizationId, { counter, ...etaResult });
    emitQueueUpdated(io, queue.id, { action: 'COUNTER_OPENED', counter, ...etaResult });
    emitEtaUpdated(io, queue.id, etaResult);
  }
  res.json({ counter, etaResult });
});

// POST /api/counters/:id/close
router.post('/:id/close', authenticate, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  const counter = await prisma.counter.update({
    where: { id: req.params.id },
    data: { status: 'CLOSED', updatedAt: new Date() },
    include: { department: { include: { organization: true } } },
  });
  await logEvent({ counterId: counter.id, eventType: 'COUNTER_CLOSED', triggeredBy: req.user.id });
  const queue = await prisma.queue.findUnique({ where: { departmentId: counter.departmentId } });
  if (queue) {
    const etaResult = await recalculateQueueETA(queue.id);
    const io = req.app.get('io');
    emitQueueUpdated(io, queue.id, { action: 'COUNTER_CLOSED', counter, ...etaResult });
    emitEtaUpdated(io, queue.id, etaResult);
  }
  res.json({ counter });
});

// POST /api/counters/:id/pause
router.post('/:id/pause', authenticate, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  const counter = await prisma.counter.update({
    where: { id: req.params.id },
    data: { status: 'PAUSED', updatedAt: new Date() },
    include: { department: { include: { organization: true } } },
  });
  await logEvent({ counterId: counter.id, eventType: 'COUNTER_PAUSED', triggeredBy: req.user.id });
  const queue = await prisma.queue.findUnique({ where: { departmentId: counter.departmentId } });
  if (queue) {
    const etaResult = await recalculateQueueETA(queue.id);
    const io = req.app.get('io');
    emitCounterPaused(io, counter.department.organizationId, { counter, ...etaResult });
    emitQueueUpdated(io, queue.id, { action: 'COUNTER_PAUSED', counter, ...etaResult });
  }
  res.json({ counter });
});

// POST /api/counters/:id/resume
router.post('/:id/resume', authenticate, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  const counter = await prisma.counter.update({
    where: { id: req.params.id },
    data: { status: 'OPEN', updatedAt: new Date() },
    include: { department: { include: { organization: true } } },
  });
  await logEvent({ counterId: counter.id, eventType: 'COUNTER_RESUMED', triggeredBy: req.user.id });
  const queue = await prisma.queue.findUnique({ where: { departmentId: counter.departmentId } });
  if (queue) {
    const etaResult = await recalculateQueueETA(queue.id);
    const io = req.app.get('io');
    emitQueueUpdated(io, queue.id, { action: 'COUNTER_RESUMED', counter, ...etaResult });
    emitEtaUpdated(io, queue.id, etaResult);
  }
  res.json({ counter });
});

module.exports = router;
