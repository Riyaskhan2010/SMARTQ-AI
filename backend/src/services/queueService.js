// SmartQ AI - Queue Business Logic Service
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculate ETA for a waiting token given its position.
 * position = number of tokens ahead (not including serving ones).
 */
function calculateETA({ waitingAhead, activeCounters, avgServiceTime, noShowRate = 0.08 }) {
  if (activeCounters <= 0) return 99;
  const effectiveAhead = Math.max(0, waitingAhead * (1 - noShowRate));
  const eta = Math.ceil((effectiveAhead / activeCounters) * avgServiceTime);
  return eta;
}

function getCrowdLevel(waitingCount, activeCounters) {
  if (activeCounters === 0) return 'VERY_HIGH';
  const ratio = waitingCount / activeCounters;
  if (ratio <= 3)  return 'LOW';
  if (ratio <= 7)  return 'MEDIUM';
  if (ratio <= 12) return 'HIGH';
  return 'VERY_HIGH';
}

/**
 * Get full queue state for a department.
 */
async function getQueueState(departmentId) {
  const queue = await prisma.queue.findUnique({
    where: { departmentId },
    include: {
      tokens: {
        orderBy: { position: 'asc' },
        include: { service: true, counter: true, user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!queue) return null;

  const counters = await prisma.counter.findMany({
    where: { departmentId },
    include: { staff: { include: { user: { select: { name: true } } } } },
    orderBy: { number: 'asc' },
  });

  const activeCounters = counters.filter(c => c.status === 'OPEN').length;
  const waitingTokens  = queue.tokens.filter(t => t.status === 'WAITING');
  const servingTokens  = queue.tokens.filter(t => t.status === 'SERVING');

  // Average service time across active services
  const services = await prisma.service.findMany({ where: { department: { id: departmentId } } });
  const avgServiceTime = services.length
    ? services.reduce((s, svc) => s + svc.avgServiceTime, 0) / services.length
    : 8;

  const crowdLevel = getCrowdLevel(waitingTokens.length, activeCounters);
  const baseETA    = calculateETA({ waitingAhead: waitingTokens.length, activeCounters, avgServiceTime });

  return { queue, counters, activeCounters, waitingTokens, servingTokens, avgServiceTime, crowdLevel, baseETA };
}

/**
 * Recalculate and update ETA for all waiting tokens in a queue.
 * Returns the updated prediction object.
 */
async function recalculateQueueETA(queueId) {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: { tokens: { where: { status: 'WAITING' }, orderBy: { position: 'asc' } } },
  });
  if (!queue) return null;

  const counters = await prisma.counter.findMany({
    where: { departmentId: queue.departmentId },
  });
  const activeCounters = counters.filter(c => c.status === 'OPEN').length;

  const services = await prisma.service.findMany({ where: { department: { id: queue.departmentId } } });
  const avgServiceTime = services.length
    ? services.reduce((s, svc) => s + svc.avgServiceTime, 0) / services.length
    : 8;

  const waitingCount = queue.tokens.length;
  const crowdLevel   = getCrowdLevel(waitingCount, activeCounters);

  // Update each waiting token's estimated wait
  for (let i = 0; i < queue.tokens.length; i++) {
    const eta = calculateETA({ waitingAhead: i, activeCounters, avgServiceTime });
    await prisma.token.update({
      where: { id: queue.tokens[i].id },
      data: { estimatedWait: eta },
    });
  }

  // Store prediction snapshot
  const baseETA = calculateETA({ waitingAhead: 0, activeCounters, avgServiceTime });
  const confidence = Math.min(0.95, 0.6 + (activeCounters * 0.1));

  const prediction = await prisma.prediction.create({
    data: {
      queueId, estimatedWait: baseETA, crowdLevel,
      confidence, activeCounters, waitingCount,
      avgServiceTime, noShowRate: 0.08,
      recommendation: activeCounters > 0 && waitingCount / activeCounters > 8
        ? `Opening Counter ${activeCounters + 1} may reduce estimated waiting time.`
        : null,
    },
  });

  return { prediction, baseETA, crowdLevel, activeCounters, waitingCount, avgServiceTime };
}

/**
 * Generate the next token number for a queue.
 */
async function generateToken(queueId) {
  const queue = await prisma.queue.update({
    where: { id: queueId },
    data: { lastNumber: { increment: 1 } },
  });
  return `${queue.tokenPrefix}${String(queue.lastNumber).padStart(3, '0')}`;
}

/**
 * Get the next waiting token in a queue (for a counter).
 */
async function getNextWaitingToken(queueId) {
  return prisma.token.findFirst({
    where: { queueId, status: 'WAITING' },
    orderBy: { position: 'asc' },
    include: { user: { select: { id: true, name: true } }, service: true },
  });
}

module.exports = { calculateETA, getCrowdLevel, getQueueState, recalculateQueueETA, generateToken, getNextWaitingToken };
