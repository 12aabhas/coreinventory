const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { writeLedgerEntry } = require('../lib/ledger');
const authGuard = require('../middleware/authGuard');

const transferSchema = z.object({
  fromLocationId: z.string().uuid('Must be a valid source location ID'),
  toLocationId: z.string().uuid('Must be a valid destination location ID'),
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().uuid('Must be a valid product ID'),
    quantity: z.number().positive('Quantity must be greater than zero'),
  })).min(1, 'At least one product line is required'),
});

router.get('/', authGuard, async (req, res) => {
  try {
    const { status } = req.query;
    const transfers = await prisma.operation.findMany({
      where: { type: 'transfer', ...(status && { status }) },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(transfers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.post('/', authGuard, async (req, res) => {
  try {
    const result = transferSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ errors });
    }

    const { fromLocationId, toLocationId, notes, lines } = result.data;

    if (fromLocationId === toLocationId) {
      return res.status(400).json({ error: 'Source and destination locations must be different.' });
    }

    for (const line of lines) {
      const stock = await prisma.stockItem.findUnique({
        where: { productId_locationId: { productId: line.productId, locationId: fromLocationId } },
      });
      if (!stock || stock.quantity < line.quantity) {
        const product = await prisma.product.findUnique({ where: { id: line.productId } });
        return res.status(400).json({ error: `Not enough stock for "${product?.name}" at source location.` });
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
            fromLocationId,
            toLocationId,
          })),
        },
      },
      include: { lines: true },
    });

    res.status(201).json(transfer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.patch('/:id/validate', authGuard, async (req, res) => {
  try {
    const transfer = await prisma.operation.findUnique({
      where: { id: req.params.id },
      include: { lines: true },
    });
    if (!transfer) return res.status(404).json({ error: 'Transfer not found.' });
    if (transfer.status === 'done') return res.status(400).json({ error: 'Already validated.' });

    for (const line of transfer.lines) {
      const { fromLocationId, toLocationId } = line;

      await prisma.stockItem.update({
        where: { productId_locationId: { productId: line.productId, locationId: fromLocationId } },
        data: { quantity: { decrement: line.quantity } },
      });

      await prisma.stockItem.upsert({
        where: { productId_locationId: { productId: line.productId, locationId: toLocationId } },
        update: { quantity: { increment: line.quantity } },
        create: { productId: line.productId, locationId: toLocationId, quantity: line.quantity },
      });

      await writeLedgerEntry({ productId: line.productId, locationId: fromLocationId, delta: -line.quantity, operationId: transfer.id, reason: 'transfer_out' });
      await writeLedgerEntry({ productId: line.productId, locationId: toLocationId, delta: line.quantity, operationId: transfer.id, reason: 'transfer_in' });
    }

    const updated = await prisma.operation.update({
      where: { id: req.params.id },
      data: { status: 'done' },
      include: { lines: true },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
