const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authGuard = require('../middleware/authGuard');

router.get('/', authGuard, async (req, res) => {
  const totalProducts = await prisma.product.count();

  const stockByProduct = await prisma.stockItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
  });

  const outOfStock = stockByProduct.filter(s => (s._sum.quantity ?? 0) === 0).length;

  const reorderRules = await prisma.reorderRule.findMany();
  let lowStock = 0;
  for (const rule of reorderRules) {
    const stock = stockByProduct.find(s => s.productId === rule.productId);
    const qty = stock?._sum.quantity ?? 0;
    if (qty > 0 && qty < rule.minQuantity) lowStock++;
  }

  const pendingReceipts = await prisma.operation.count({
    where: { type: 'receipt', status: { in: ['draft', 'waiting', 'ready'] } },
  });
  const pendingDeliveries = await prisma.operation.count({
    where: { type: 'delivery', status: { in: ['draft', 'waiting', 'ready'] } },
  });
  const pendingTransfers = await prisma.operation.count({
    where: { type: 'transfer', status: { in: ['draft', 'waiting', 'ready'] } },
  });

  res.json({
    totalProducts,
    outOfStock,
    lowStock,
    pendingReceipts,
    pendingDeliveries,
    pendingTransfers,
  });
});

module.exports = router;
