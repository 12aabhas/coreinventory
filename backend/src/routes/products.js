const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const authGuard = require('../middleware/authGuard');

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string().uuid().optional(),
  unitOfMeasure: z.string().default('unit'),
  initialStock: z.number().min(0).optional(),
  locationId: z.string().uuid().optional(),
});

router.get('/', authGuard, async (req, res) => {
  const { search, categoryId } = req.query;
  const products = await prisma.product.findMany({
    where: {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { categoryId }),
    },
    include: {
      category: true,
      stockItems: { include: { location: { include: { warehouse: true } } } },
    },
  });
  res.json(products);
});

router.post('/', authGuard, async (req, res) => {
  const result = productSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({ field: e.path[0], message: e.message }));
    return res.status(400).json({ errors });
  }

  const { name, sku, categoryId, unitOfMeasure, initialStock, locationId } = result.data;

  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) {
    return res.status(409).json({ errors: [{ field: 'sku', message: 'A product with this SKU already exists' }] });
  }

  const product = await prisma.product.create({
    data: {
      name, sku, categoryId, unitOfMeasure,
      ...(initialStock && locationId && {
        stockItems: {
          create: { locationId, quantity: initialStock },
        },
      }),
    },
    include: { category: true, stockItems: true },
  });

  res.status(201).json(product);
});

router.patch('/:id', authGuard, async (req, res) => {
  const { id } = req.params;
  const { name, categoryId, unitOfMeasure } = req.body;

  const product = await prisma.product.update({
    where: { id },
    data: { name, categoryId, unitOfMeasure },
  });

  res.json(product);
});

router.delete('/:id', authGuard, async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: 'Product deleted.' });
});

module.exports = router;
