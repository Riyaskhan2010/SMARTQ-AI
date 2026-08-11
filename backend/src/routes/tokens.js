const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { generateToken, recalculateQueueETA, getCrowdLevel, calculateETA } = require('../services/queueService');
const { emitQueueUpdated, emitEtaUpdated, emitNotification, emitPublicDisplay } = require('../services/socketService');
const prisma = new PrismaClient();

// POST /api/tokens  — book a token
router.post('/', authenticate, async (req, res) => {
  try {
    const { serviceId, isFollowUp, notes } = req.body;
    if (!serviceId) return res.status(400).json({ error: 'serviceId is required' });

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { department: true },
    });
    if (!service || !service.isActive) return res.status(404).json({ error: 'Service not found or inactive' });

    // Find or create today's queue
    let queue = await prisma.queue.findUnique({ where: { departmentId: service.departmentId } });
    if (!queue) {
      queue = await prisma.queue.create({
        data: { departmentId: service.departmentId, tokenPrefix: 'A', lastNumber: 100 },
      });
    }

    // Check max tokens
    const todayCount = await prisma.token.count({
      where: { queueId: queue.id, status: { not: 'CANCELLED' } },
    });
    if (todayCount >= service.maxTokensPerDay) {
      return res.status(400).json({ error: 'Token limit reached for today. Please try tomorrow.' });
    }

    // Check if user already has active token for this service
    const existing = await prisma.token.findFirst({
      where: { userId: req.user.id, serviceId, status: { in: ['WAITING', 'SERVING'] } },
    });
    if (existing) return res.status(409).json({ error: 'You already have an active token for this service', token: existing });

    const counters = await prisma.counter.findMany({ where: { departmentId: service.departmentId } });
    const activeCounters = counters.filter(c => c.status === 'OPEN').length;

    const waitingCount = await prisma.token.count({ where: { queueId: queue.id, status: 'WAITING' } });
    const tokenNumber  = await generateToken(queue.id);
    const position     = waitingCount + 1;
    const eta          = calculateETA({ waitingAhead: waitingCount, activeCounters, avgServiceTime: service.avgServiceTime });

    // Prev visit date for follow-ups
    let prevVisitDate = null;
    if (isFollowUp) {
      const lastVisit = await prisma.visitHistory.findFirst({
        where: { userId: req.user.id },
        orderBy: { visitDate: 'desc' },
      });
      prevVisitDate = lastVisit?.visitDate || null;
    }

    const token = await prisma.token.create({
      data: {
        queueId: queue.id, userId: req.user.id, serviceId,
        tokenNumber, status: 'WAITING', position,
        isFollowUp: !!isFollowUp, prevVisitDate, notes,
        estimatedWait: eta,
      },
      include: { service: { include: { department: { include: { organization: true } } } }, counter: true },
    });

    // Log event
    const js = (o) => JSON.stringify(o);
    await prisma.queueEvent.create({
      data: { queueId: queue.id, tokenId: token.id, eventType: 'TOKEN_CREATED', triggeredBy: req.user.id, data: js({ tokenNumber, position }) },
    });

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: req.user.id, type: 'TOKEN_BOOKED',
        title: 'Token Booked Successfully',
        message: `Your token ${tokenNumber} has been booked for ${service.name}. ${waitingCount} people ahead.`,
        data: js({ tokenId: token.id, tokenNumber, eta, waitingCount }),
      },
    });

    // Emit realtime
    const io = req.app.get('io');
    emitNotification(io, req.user.id, notification);
    const { crowdLevel } = await recalculateQueueETA(queue.id);
    emitQueueUpdated(io, queue.id, { waitingCount: waitingCount + 1, crowdLevel, baseETA: eta });

    res.status(201).json({ token, queue: { id: queue.id }, waitingAhead: waitingCount, eta, crowdLevel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Token booking failed' });
  }
});

// GET /api/tokens/:id
router.get('/:id', authenticate, async (req, res) => {
  const token = await prisma.token.findUnique({
    where: { id: req.params.id },
    include: {
      service: { include: { department: { include: { organization: true } } } },
      counter: true,
      queue: true,
    },
  });
  if (!token) return res.status(404).json({ error: 'Token not found' });
  if (token.userId && token.userId !== req.user.id && req.user.role === 'USER') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  // Live position
  let waitingAhead = 0;
  if (token.status === 'WAITING') {
    waitingAhead = await prisma.token.count({
      where: { queueId: token.queueId, status: 'WAITING', position: { lt: token.position } },
    });
  }

  // Active counters for ETA
  const counters = await prisma.counter.findMany({ where: { departmentId: token.service.departmentId } });
  const activeCounters = counters.filter(c => c.status === 'OPEN').length;
  const { getCrowdLevel } = require('../services/queueService');
  const waitingCount = await prisma.token.count({ where: { queueId: token.queueId, status: 'WAITING' } });
  const crowdLevel = getCrowdLevel(waitingCount, activeCounters);

  res.json({ token, waitingAhead, activeCounters, crowdLevel });
});

// GET /api/tokens  (user's tokens)
router.get('/', authenticate, async (req, res) => {
  const { status } = req.query;
  const where = { userId: req.user.id };
  if (status) where.status = status;
  const tokens = await prisma.token.findMany({
    where,
    include: { service: { include: { department: { include: { organization: true } } } }, counter: true },
    orderBy: { bookedAt: 'desc' },
  });
  res.json(tokens);
});

// POST /api/tokens/:id/cancel
router.post('/:id/cancel', authenticate, async (req, res) => {
  const token = await prisma.token.findUnique({ where: { id: req.params.id } });
  if (!token) return res.status(404).json({ error: 'Token not found' });
  if (token.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  if (!['WAITING'].includes(token.status)) return res.status(400).json({ error: 'Cannot cancel this token' });

  const updated = await prisma.token.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });

  const io = req.app.get('io');
  const result = await recalculateQueueETA(token.queueId);
  if (result) emitQueueUpdated(io, token.queueId, { action: 'TOKEN_CANCELLED', tokenId: token.id });
  res.json({ token: updated });
});

module.exports = router;
