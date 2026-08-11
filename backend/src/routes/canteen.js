// SmartQ AI — Canteen Routes
// /api/canteen/*
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { emitNotification } = require('../services/socketService');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────

/** Return current meal period based on server time */
function getMealPeriod() {
  const h = new Date().getHours();
  if (h >= 7  && h < 11)  return 'MORNING';
  if (h >= 11 && h < 15)  return 'AFTERNOON'; // 3:30 PM → 15
  if (h >= 15 && h < 18)  return 'EVENING';   // up to 6 PM
  return 'NIGHT';
}

/** AI-style prep-time estimator */
function estimatePrepTime({ activeOrders, avgPrepTime = 8 }) {
  if (activeOrders <= 2)  return Math.ceil(avgPrepTime * 0.8);
  if (activeOrders <= 5)  return avgPrepTime;
  if (activeOrders <= 10) return Math.ceil(avgPrepTime * 1.3);
  return Math.ceil(avgPrepTime * 1.6);
}

function getCrowdLevel(activeOrders) {
  if (activeOrders <= 3)  return 'LOW';
  if (activeOrders <= 8)  return 'MEDIUM';
  if (activeOrders <= 15) return 'HIGH';
  return 'VERY_HIGH';
}

// ── GET /api/canteen/org/:orgId  — canteen info for an org ────────
router.get('/org/:orgId', async (req, res) => {
  try {
    const canteen = await prisma.canteenOrg.findUnique({
      where: { organizationId: req.params.orgId },
      include: {
        counters: {
          where: { isActive: true },
          orderBy: { number: 'asc' },
        },
      },
    });
    if (!canteen) return res.status(404).json({ error: 'No canteen for this organization' });

    // Active order counts per counter
    const activeCounts = await prisma.canteenOrder.groupBy({
      by: ['canteenOrgId'],
      _count: { id: true },
      where: {
        canteenOrgId: canteen.id,
        status: { in: ['PLACED', 'CONFIRMED', 'PREPARING'] },
      },
    });
    const totalActive = activeCounts[0]?._count?.id || 0;

    res.json({
      canteen,
      mealPeriod: getMealPeriod(),
      activeOrders: totalActive,
      crowdLevel: getCrowdLevel(totalActive),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ── GET /api/canteen/:canteenOrgId/menu  — menu for current period ─
router.get('/:canteenOrgId/menu', async (req, res) => {
  try {
    const period = req.query.period || getMealPeriod();
    const items = await prisma.menuItem.findMany({
      where: {
        counter: { canteenOrgId: req.params.canteenOrgId },
        isActive: true,
        OR: [{ mealPeriod: period }, { mealPeriod: 'ALL' }],
      },
      include: { counter: { select: { id: true, name: true, type: true, number: true } } },
      orderBy: [{ counter: { number: 'asc' } }, { sortOrder: 'asc' }],
    });
    res.json({ items, period, mealPeriod: period });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ── GET /api/canteen/:canteenOrgId/counters  — all counters ───────
router.get('/:canteenOrgId/counters', async (req, res) => {
  try {
    const counters = await prisma.canteenCounter.findMany({
      where: { canteenOrgId: req.params.canteenOrgId, isActive: true },
      orderBy: { number: 'asc' },
    });
    res.json(counters);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/canteen/order  — place an order ─────────────────────
router.post('/order', authenticate, async (req, res) => {
  try {
    const { canteenOrgId, items } = req.body;
    // items: [{ menuItemId, quantity }]
    if (!canteenOrgId || !items?.length) {
      return res.status(400).json({ error: 'canteenOrgId and items required' });
    }

    const canteen = await prisma.canteenOrg.findUnique({ where: { id: canteenOrgId } });
    if (!canteen) return res.status(404).json({ error: 'Canteen not found' });

    // Validate items and compute total
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map(i => i.menuItemId) }, isActive: true, availability: 'AVAILABLE' },
    });
    if (menuItems.length !== items.length) {
      return res.status(400).json({ error: 'One or more items unavailable' });
    }

    const total = items.reduce((s, i) => {
      const mi = menuItems.find(m => m.id === i.menuItemId);
      return s + (mi?.price || 0) * i.quantity;
    }, 0);

    // Generate order number: C + (lastNumber+1)
    const updated = await prisma.canteenOrg.update({
      where: { id: canteenOrgId },
      data: { lastOrderNumber: { increment: 1 } },
    });
    const orderNumber = `C${updated.lastOrderNumber}`;

    // Count active orders for ETA
    const activeCount = await prisma.canteenOrder.count({
      where: { canteenOrgId, status: { in: ['PLACED', 'CONFIRMED', 'PREPARING'] } },
    });
    const avgPrep = menuItems.reduce((s, m) => s + m.avgPrepTime, 0) / menuItems.length;
    const eta = estimatePrepTime({ activeOrders: activeCount, avgPrepTime: avgPrep });

    // Create order
    const order = await prisma.canteenOrder.create({
      data: {
        id: uuidv4(), canteenOrgId, orderNumber,
        userId: req.user.id,
        guestName: req.user.name,
        status: 'PLACED',
        totalAmount: total,
        estimatedReadyTime: eta,
      },
    });

    // Create order items
    for (const item of items) {
      const mi = menuItems.find(m => m.id === item.menuItemId);
      await prisma.canteenOrderItem.create({
        data: {
          id: uuidv4(), orderId: order.id,
          menuItemId: item.menuItemId,
          canteenCounterId: mi.canteenCounterId,
          name: mi.name, price: mi.price, quantity: item.quantity,
        },
      });
    }

    // Notification
    const notif = await prisma.notification.create({
      data: {
        userId: req.user.id, type: 'TOKEN_BOOKED',
        title: `Canteen Order ${orderNumber} Placed`,
        message: `Your order has been placed. Estimated ready time: ${eta} minutes.`,
        data: JSON.stringify({ orderNumber, eta }),
      },
    });
    const io = req.app.get('io');
    emitNotification(io, req.user.id, notif);

    // Return full order with items
    const full = await prisma.canteenOrder.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { counter: { select: { name: true, number: true } } } },
      },
    });
    const crowdLevel = getCrowdLevel(activeCount + 1);
    res.status(201).json({ order: full, eta, ordersAhead: activeCount, crowdLevel });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ── GET /api/canteen/order/:orderId  — order tracking ────────────
router.get('/order/:orderId', authenticate, async (req, res) => {
  try {
    const order = await prisma.canteenOrder.findUnique({
      where: { id: req.params.orderId },
      include: {
        items: {
          include: {
            counter: { select: { id: true, name: true, number: true, type: true } },
            item: { select: { id: true, name: true, price: true } },
          },
        },
        canteenOrg: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Orders ahead in this canteen
    const ahead = await prisma.canteenOrder.count({
      where: {
        canteenOrgId: order.canteenOrgId,
        status: { in: ['PLACED', 'CONFIRMED', 'PREPARING'] },
        placedAt: { lt: order.placedAt },
      },
    });

    const active = await prisma.canteenOrder.count({
      where: { canteenOrgId: order.canteenOrgId, status: { in: ['PLACED', 'CONFIRMED', 'PREPARING'] } },
    });

    res.json({ order, ordersAhead: ahead, crowdLevel: getCrowdLevel(active), activeOrders: active });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/canteen/my-orders  — user's canteen orders ──────────
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const orders = await prisma.canteenOrder.findMany({
      where: { userId: req.user.id },
      include: {
        items: { include: { counter: { select: { name: true, number: true } } } },
        canteenOrg: true,
      },
      orderBy: { placedAt: 'desc' },
      take: 10,
    });
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Staff routes ──────────────────────────────────────────────────

// GET /api/canteen/staff/:canteenOrgId/:counterId — orders for a counter
router.get('/staff/:canteenOrgId/:counterId', authenticate, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { canteenOrgId, counterId } = req.params;
    const active = await prisma.canteenOrder.findMany({
      where: {
        canteenOrgId,
        status: { in: ['PLACED', 'CONFIRMED', 'PREPARING'] },
        items: { some: { canteenCounterId: counterId } },
      },
      include: {
        items: {
          where: { canteenCounterId: counterId },
          include: { item: { select: { name: true } } },
        },
      },
      orderBy: { placedAt: 'asc' },
    });

    const serving = active.filter(o => o.status === 'PREPARING')[0] || null;
    const waiting = active.filter(o => o.status !== 'PREPARING');

    const counter = await prisma.canteenCounter.findUnique({ where: { id: counterId } });
    const aiETA = estimatePrepTime({ activeOrders: active.length });
    const crowdLevel = getCrowdLevel(active.length);

    res.json({ serving, waiting, counter, activeOrders: active.length, aiETA, crowdLevel });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// PATCH /api/canteen/order/:orderId/status — update order status (staff)
router.patch('/order/:orderId/status', authenticate, requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['CONFIRMED', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const existing = await prisma.canteenOrder.findUnique({ where: { id: req.params.orderId } });
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const now = new Date();
    const extra = {
      CONFIRMED: { confirmedAt: now },
      PREPARING: { prepStartAt: now },
      READY:     { readyAt: now },
      COLLECTED: { collectedAt: now },
    }[status] || {};

    const order = await prisma.canteenOrder.update({
      where: { id: req.params.orderId },
      data: { status, ...extra },
    });

    // Notify user
    if (existing.userId) {
      const msgs = {
        PREPARING: `Order ${order.orderNumber} is now being prepared.`,
        READY:     `Order ${order.orderNumber} is ready! Please collect from the counter.`,
        CANCELLED: `Order ${order.orderNumber} has been cancelled.`,
      };
      if (msgs[status]) {
        const notif = await prisma.notification.create({
          data: {
            userId: existing.userId, type: 'TOKEN_CALLED',
            title: `Canteen Order Update`,
            message: msgs[status],
            data: JSON.stringify({ orderNumber: order.orderNumber, status }),
          },
        });
        const io = req.app.get('io');
        emitNotification(io, existing.userId, notif);
      }
    }
    res.json({ order });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ── Admin routes ──────────────────────────────────────────────────

// GET /api/canteen/admin/:canteenOrgId/dashboard
router.get('/admin/:canteenOrgId/dashboard', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { canteenOrgId } = req.params;
    const today = new Date(); today.setHours(0,0,0,0);

    const [total, active, completed, cancelled, counters] = await Promise.all([
      prisma.canteenOrder.count({ where: { canteenOrgId, placedAt: { gte: today } } }),
      prisma.canteenOrder.count({ where: { canteenOrgId, status: { in: ['PLACED','CONFIRMED','PREPARING'] } } }),
      prisma.canteenOrder.count({ where: { canteenOrgId, status: 'COLLECTED', placedAt: { gte: today } } }),
      prisma.canteenOrder.count({ where: { canteenOrgId, status: 'CANCELLED', placedAt: { gte: today } } }),
      prisma.canteenCounter.findMany({ where: { canteenOrgId, isActive: true }, orderBy: { number: 'asc' } }),
    ]);

    // Recent orders (last 20)
    const recent = await prisma.canteenOrder.findMany({
      where: { canteenOrgId },
      include: { items: { include: { counter: { select: { name: true } } } } },
      orderBy: { placedAt: 'desc' },
      take: 20,
    });

    // AI recommendation
    const aiETA = estimatePrepTime({ activeOrders: active });
    const crowdLevel = getCrowdLevel(active);
    let recommendation = 'Queue is operating normally.';
    if (active > 10) recommendation = 'High crowd. Consider assigning additional staff to Counter 2.';
    else if (active > 6) recommendation = 'Moderate crowd. Monitor Counter 2 workload closely.';

    res.json({
      summary: { total, active, completed, cancelled, aiETA, crowdLevel },
      counters, recent, recommendation,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// PATCH /api/canteen/menu/:itemId — toggle availability (admin)
router.patch('/menu/:itemId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { availability } = req.body;
    const item = await prisma.menuItem.update({
      where: { id: req.params.itemId },
      data: { availability },
    });
    res.json({ item });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/canteen/counter/:counterId/status — open/close canteen counter (admin)
router.patch('/counter/:counterId/status', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    const counter = await prisma.canteenCounter.update({
      where: { id: req.params.counterId },
      data: { status },
    });
    res.json({ counter });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/canteen/admin/:canteenOrgId/analytics — hourly analytics
router.get('/admin/:canteenOrgId/analytics', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { canteenOrgId } = req.params;
    const today = new Date(); today.setHours(0,0,0,0);

    const orders = await prisma.canteenOrder.findMany({
      where: { canteenOrgId, placedAt: { gte: today } },
      include: { items: true },
    });

    // Group by hour
    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0, revenue: 0 }));
    for (const o of orders) {
      const h = new Date(o.placedAt).getHours();
      hourly[h].count++;
      hourly[h].revenue += o.totalAmount;
    }

    // Popular items
    const itemCounts = {};
    for (const o of orders) {
      for (const item of o.items) {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      }
    }
    const popular = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json({ hourly: hourly.filter(h => h.count > 0), popular, totalOrders: orders.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
