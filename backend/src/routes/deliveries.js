const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { writeLedgerEntry } = require('../lib/ledger');
const authGuard = require('../middleware/authGuard');

const deliverySchema = z.object({
  destinationNote: z.string().optional(),
  sourceLocationId: z.string().uuid('Must be a valid location ID'),
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().uuid('Must be a valid product ID'),
    quantity: z.number().positive('Quantity must be greater than zero'),
  })).min(1, 'At least one product line is required'),
});

// GET /deliveries
router.get('/', authGuard, async (req, res) => {
  const { status } = req.query;
  const deliveries = await prisma.operation.findMany({
    where: { type: 'delivery', ...(status && { status }) },
    include: { lines: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(deliveries);
});

// POST /deliveries — create draft delivery
router.post('/', authGuard, async (req, res) => {
  const result = deliverySchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ errors });
  }

  const { destinationNote, sourceLocationId, notes, lines } = result.data;

  const location = await prisma.location.findUnique({ where: { id: sourceLocationId } });
  if (!location) return res.status(404).json({ error: 'Source location not found.' });

  // Check stock availability for each line before creating
  for (const line of lines) {
    const stock = await prisma.stockItem.findUnique({
      where: { productId_locationId: { productId: line.productId, locationId: sourceLocationId } },
    });
    if (!stock || stock.quantity < line.quantity) {
      const product = await prisma.product.findUnique({ where: { id: line.productId } });
      return res.status(400).json({
        error: `Not enough stock for "${product?.name ?? line.productId}". Available: ${stock?.quantity ?? 0}, Requested: ${line.quantity}`,
      });
    }
  }

  const delivery = await prisma.operation.create({
    data: {
      type: 'delivery',
      status: 'draft',
      notes: notes ?? destinationNote,
      lines: {
        create: lines.map(line => ({
          productId: line.productId,
          quantity: line.quantity,
          fromLocationId: sourceLocationId,
        })),
      },
    },
    include: { lines: { include: { product: true } } },
  });

  res.status(201).json(delivery);
});

// PATCH /deliveries/:id/validate — confirm delivery, decrease stock
router.patch('/:id/validate', authGuard, async (req, res) => {
  const { id } = req.params;

  const delivery = await prisma.operation.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!delivery) return res.status(404).json({ error: 'Delivery not found.' });
  if (delivery.type !== 'delivery') return res.status(400).json({ error: 'Not a delivery.' });
  if (delivery.status === 'done') return res.status(400).json({ error: 'Already validated.' });
  if (delivery.status === 'canceled') return res.status(400).json({ error: 'Cannot validate a canceled delivery.' });

  // Check stock one more time before validating
  for (const line of delivery.lines) {
    const stock = await prisma.stockItem.findUnique({
      where: { productId_locationId: { productId: line.productId, locationId: line.fromLocationId } },
    });
    if (!stock || stock.quantity < line.quantity) {
      return res.status(400).json({ error: `Insufficient stock for product ${line.productId}` });
    }
  }

  for (const line of delivery.lines) {
    const locationId = line.fromLocationId;

    await prisma.stockItem.update({
      where: { productId_locationId: { productId: line.productId, locationId } },
      data: { quantity: { decrement: line.quantity } },
    });

    await writeLedgerEntry({
      productId: line.productId,
      locationId,
      delta: -line.quantity,
      operationId: delivery.id,
      reason: 'delivery',
    });
  }

  const updated = await prisma.operation.update({
    where: { id },
    data: { status: 'done' },
    include: { lines: { include: { product: true } } },
  });

  res.json(updated);
});

// PATCH /deliveries/:id/cancel
router.patch('/:id/cancel', authGuard, async (req, res) => {
  const delivery = await prisma.operation.findUnique({ where: { id: req.params.id } });
  if (!delivery) return res.status(404).json({ error: 'Delivery not found.' });
  if (delivery.status === 'done') return res.status(400).json({ error: 'Cannot cancel a completed delivery.' });

  const updated = await prisma.operation.update({
    where: { id: req.params.id },
    data: { status: 'canceled' },
  });
  res.json(updated);
});

module.exports = router;
