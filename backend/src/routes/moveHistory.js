const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authGuard = require('../middleware/authGuard');

router.get('/', authGuard, async (req, res) => {
  try {
    const { productId, reason, from, to, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const entries = await prisma.ledgerEntry.findMany({
      where: {
        ...(productId && productId !== '' && { productId }),
        ...(reason && reason !== '' && { reason }),
        ...(from && from !== '' && { createdAt: { gte: new Date(from) } }),
        ...(to && to !== '' && { createdAt: { lte: new Date(to + 'T23:59:59.000Z') } }),
      },
      include: {
        operation: { select: { type: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    });

    const productIds = [...new Set(entries.map(e => e.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));

    const enriched = entries.map(e => ({
      ...e,
      product: productMap[e.productId] ?? { name: 'Unknown', sku: '' },
    }));

    const total = await prisma.ledgerEntry.count();
    res.json({ entries: enriched, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
