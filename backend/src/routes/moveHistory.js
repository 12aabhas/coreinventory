const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authGuard = require('../middleware/authGuard');

// GET /move-history
router.get('/', authGuard, async (req, res) => {
  const { productId, reason, from, to, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const entries = await prisma.ledgerEntry.findMany({
    where: {
      ...(productId && { productId }),
      ...(reason && { reason }),
      ...(from && { createdAt: { gte: new Date(from) } }),
      ...(to && { createdAt: { lte: new Date(to) } }),
    },
    include: {
      product: { select: { name: true, sku: true } },
      operation: { select: { type: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: parseInt(limit),
  });

  const total = await prisma.ledgerEntry.count();
  res.json({ entries, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

module.exports = router;