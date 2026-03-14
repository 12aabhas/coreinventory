const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { writeLedgerEntry } = require('../lib/ledger');
const authGuard = require('../middleware/authGuard');

const adjustmentSchema = z.object({
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  countedQuantity: z.number().min(0, 'Counted quantity cannot be negative'),
  reason: z.string().optional(),
});

// GET /adjustments
router.get('/', authGuard, async (req, res) => {
  const adjustments = await prisma.operation.findMany({
    where: { type: 'adjustment' },
    include: { lines: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(adjustments);
});

// POST /adjustments — fix stock count immediately
router.post('/', authGuard, async (req, res) => {
  const result = adjustmentSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({ field: e.path[0], message: e.message }));
    return res.status(400).json({ errors });
  }

  const { productId, locationId, countedQuantity, reason } = result.data;

  // Verify product and location exist
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location) return res.status(404).json({ error: 'Location not found.' });

  // Get current recorded stock
  const currentStock = await prisma.stockItem.findUnique({
    where: { productId_locationId: { productId, locationId } },
  });
  const currentQty = currentStock?.quantity ?? 0;
  const delta = countedQuantity - currentQty;

  // Update or create stock item
  await prisma.stockItem.upsert({
    where: { productId_locationId: { productId, locationId } },
    update: { quantity: countedQuantity },
    create: { productId, locationId, quantity: countedQuantity },
  });

  // Create the operation record
  const adjustment = await prisma.operation.create({
    data: {
      type: 'adjustment',
      status: 'done',
      notes: reason,
      lines: {
        create: [{ productId, quantity: countedQuantity, toLocationId: locationId }],
      },
    },
    include: { lines: { include: { product: true } } },
  });

  // Log to ledger
  await writeLedgerEntry({
    productId,
    locationId,
    delta,
    operationId: adjustment.id,
    reason: 'adjustment',
  });

  res.status(201).json({
    adjustment,
    previousQuantity: currentQty,
    newQuantity: countedQuantity,
    delta,
  });
});

module.exports = router;
