const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/sectors
router.get('/', async (_req, res) => {
  const sectors = await prisma.sector.findMany({
    where: { isActive: true },
    include: { _count: { select: { organizations: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(sectors);
});

// GET /api/sectors/:slug
router.get('/:slug', async (req, res) => {
  const sector = await prisma.sector.findUnique({
    where: { slug: req.params.slug },
    include: { organizations: { where: { isActive: true }, orderBy: { name: 'asc' } } },
  });
  if (!sector) return res.status(404).json({ error: 'Sector not found' });
  res.json(sector);
});

module.exports = router;
