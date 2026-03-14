const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { writeLedgerEntry } = require('../lib/ledger');
const authGuard = require('../middleware/authGuard');

const transferSchema = z.object({
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().uuid('Must be a valid product ID'),
    quantity: z.number().positive('Quantity must be greater than zero'),
    fromLocationId: z.string().uuid('Must be a valid source location ID'),
    toLocationId: z.string().uuid('Must be a valid destination location ID'),
  })).min(1, 'At least one product line is required'),
});

// GET /transfers
router.get('/', authGuard, async (req, res) => {
  const { status } = req.query;
  const transfers = await prisma.operation.findMany({
    where: { type: 'transfer', ...(status && { status }) },
    include: { lines: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(transfers);
});

// POST /transfers — create draft transfer
router.post('/', authGuard, async (req, res) => {
  const result = transferSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ errors });
  }

  const { notes, lines } = result.data;

  // Check stock availability for each line
  for (const line of lines) {
    if (line.fromLocationId === line.toLocationId) {
      return res.status(400).json({ error: 'Source and destination locations cannot be the same.' });
    }
    const stock = await prisma.stockItem.findUnique({
      where: { productId_locationId: { productId: line.productId, locationId: line.fromLocationId } },
    });
    if (!stock || stock.quantity < line.quantity) {
      const product = await prisma.product.findUnique({ where: { id: line.productId } });
      return res.status(400).json({
        error: `Not enough stock for "${product?.name ?? line.productId}". Available: ${stock?.quantity ?? 0}, Requested: ${line.quantity}`,
      });
    }
  }

  const transfer = await prisma.operation.create({
    data: {
      type: 'transfer',
      status: 'draft',
      notes,
      lines: {
        create: lines.map(line => ({
          productId: line.productId,
          quantity: line.quantity,
          fromLocationId: line.fromLocationId,
          toLocationId: line.toLocationId,
        })),
      },
    },
    include: { lines: { include: { product: true } } },
  });

  res.status(201).json(transfer);
});

// PATCH /transfers/:id/validate — move stock between locations
router.patch('/:id/validate', authGuard, async (req, res) => {
  const transfer = await prisma.operation.findUnique({
    where: { id: req.params.id },
    include: { lines: true },
  });

  if (!transfer) return res.status(404).json({ error: 'Transfer not found.' });
  if (transfer.type !== 'transfer') return res.status(400).json({ error: 'Not a transfer.' });
  if (transfer.status === 'done') return res.status(400).json({ error: 'Already validated.' });
  if (transfer.status === 'canceled') return res.status(400).json({ error: 'Cannot validate a canceled transfer.' });

  for (const line of transfer.lines) {
    const { fromLocationId, toLocationId } = line;

    // Subtract from source
    await prisma.stockItem.update({
      where: { productId_locationId: { productId: line.productId, locationId: fromLocationId } },
      data: { quantity: { decrement: line.quantity } },
    });

    // Add to destination
    await prisma.stockItem.upsert({
      where: { productId_locationId: { productId: line.productId, locationId: toLocationId } },
      update: { quantity: { increment: line.quantity } },
      create: { productId: line.productId, locationId: toLocationId, quantity: line.quantity },
    });

    // Log both movements
    await writeLedgerEntry({ productId: line.productId, locationId: fromLocationId, delta: -line.quantity, operationId: transfer.id, reason: 'transfer_out' });
    await writeLedgerEntry({ productId: line.productId, locationId: toLocationId, delta: line.quantity, operationId: transfer.id, reason: 'transfer_in' });
  }

  const updated = await prisma.operation.update({
    where: { id: req.params.id },
    data: { status: 'done' },
    include: { lines: { include: { product: true } } },
  });

  res.json(updated);
});

// PATCH /transfers/:id/cancel
router.patch('/:id/cancel', authGuard, async (req, res) => {
  const transfer = await prisma.operation.findUnique({ where: { id: req.params.id } });
  if (!transfer) return res.status(404).json({ error: 'Transfer not found.' });
  if (transfer.status === 'done') return res.status(400).json({ error: 'Cannot cancel a completed transfer.' });

  const updated = await prisma.operation.update({
    where: { id: req.params.id },
    data: { status: 'canceled' },
  });
  res.json(updated);
});

module.exports = router;
