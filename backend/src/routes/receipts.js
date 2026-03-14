const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { writeLedgerEntry } = require('../lib/ledger');
const authGuard = require('../middleware/authGuard');

const receiptSchema = z.object({
  supplier: z.string().min(1, 'Supplier name is required'),
  destinationLocationId: z.string().uuid('Must be a valid location ID'),
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().uuid('Must be a valid product ID'),
    quantity: z.number().positive('Quantity must be greater than zero'),
  })).min(1, 'At least one product line is required'),
});

// GET /receipts
router.get('/', authGuard, async (req, res) => {
  const { status } = req.query;
  const receipts = await prisma.operation.findMany({
    where: { type: 'receipt', ...(status && { status }) },
    include: { lines: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(receipts);
});

// POST /receipts — create draft receipt
router.post('/', authGuard, async (req, res) => {
  const result = receiptSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ errors });
  }

  const { supplier, destinationLocationId, notes, lines } = result.data;

  const location = await prisma.location.findUnique({ where: { id: destinationLocationId } });
  if (!location) return res.status(404).json({ error: 'Destination location not found.' });

  const receipt = await prisma.operation.create({
    data: {
      type: 'receipt',
      status: 'draft',
      supplierId: supplier,
      notes,
      lines: {
        create: lines.map(line => ({
          productId: line.productId,
          quantity: line.quantity,
          toLocationId: destinationLocationId,
        })),
      },
    },
    include: { lines: { include: { product: true } } },
  });

  res.status(201).json(receipt);
});

// PATCH /receipts/:id/validate — confirm receipt, increase stock
router.patch('/:id/validate', authGuard, async (req, res) => {
  const { id } = req.params;

  const receipt = await prisma.operation.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!receipt) return res.status(404).json({ error: 'Receipt not found.' });
  if (receipt.type !== 'receipt') return res.status(400).json({ error: 'Not a receipt.' });
  if (receipt.status === 'done') return res.status(400).json({ error: 'Already validated.' });
  if (receipt.status === 'canceled') return res.status(400).json({ error: 'Cannot validate a canceled receipt.' });

  for (const line of receipt.lines) {
    const locationId = line.toLocationId;

    await prisma.stockItem.upsert({
      where: { productId_locationId: { productId: line.productId, locationId } },
      update: { quantity: { increment: line.quantity } },
      create: { productId: line.productId, locationId, quantity: line.quantity },
    });

    await writeLedgerEntry({
      productId: line.productId,
      locationId,
      delta: line.quantity,
      operationId: receipt.id,
      reason: 'receipt',
    });
  }

  const updated = await prisma.operation.update({
    where: { id },
    data: { status: 'done' },
    include: { lines: { include: { product: true } } },
  });

  res.json(updated);
});

// PATCH /receipts/:id/cancel
router.patch('/:id/cancel', authGuard, async (req, res) => {
  const receipt = await prisma.operation.findUnique({ where: { id: req.params.id } });
  if (!receipt) return res.status(404).json({ error: 'Receipt not found.' });
  if (receipt.status === 'done') return res.status(400).json({ error: 'Cannot cancel a completed receipt.' });

  const updated = await prisma.operation.update({
    where: { id: req.params.id },
    data: { status: 'canceled' },
  });
  res.json(updated);
});

module.exports = router;
