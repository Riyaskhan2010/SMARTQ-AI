const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/appointments
router.get('/', authenticate, async (req, res) => {
  const appts = await prisma.appointment.findMany({
    where: { userId: req.user.id },
    include: { service: { include: { department: { include: { organization: true } } } } },
    orderBy: { scheduledDate: 'desc' },
  });
  res.json(appts);
});

// POST /api/appointments
router.post('/', authenticate, async (req, res) => {
  try {
    const { serviceId, scheduledDate, scheduledTime, isFollowUp, notes } = req.body;
    if (!serviceId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ error: 'serviceId, scheduledDate, scheduledTime are required' });
    }
    const appt = await prisma.appointment.create({
      data: {
        userId: req.user.id, serviceId,
        scheduledDate: new Date(scheduledDate), scheduledTime,
        isFollowUp: !!isFollowUp, notes,
      },
      include: { service: { include: { department: { include: { organization: true } } } } },
    });
    res.status(201).json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', authenticate, async (req, res) => {
  const appt = await prisma.appointment.findUnique({ where: { id: req.params.id } });
  if (!appt || appt.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  await prisma.appointment.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
  res.json({ success: true });
});

module.exports = router;
