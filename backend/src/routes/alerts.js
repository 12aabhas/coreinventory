const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authGuard = require('../middleware/authGuard');

// GET /alerts/low-stock
router.get('/low-stock', authGuard, async (req, res) => {
  const rules = await prisma.reorderRule.findMany({
    include: { product: { include: { stockItems: true } } },
  });

  const lowStockItems = rules
    .map(rule => {
      const totalQty = rule.product.stockItems.reduce((sum, s) => sum + s.quantity, 0);
      return {
        product: rule.product,
        totalQuantity: totalQty,
        minQuantity: rule.minQuantity,
        reorderQty: rule.reorderQty,
        isOutOfStock: totalQty === 0,
      };
    })
    .filter(item => item.totalQuantity < item.minQuantity);

  res.json(lowStockItems);
});

module.exports = router;
