const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const authGuard = require('../middleware/authGuard');

const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
});

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
});

router.get('/', authGuard, async (req, res) => {
  const warehouses = await prisma.warehouse.findMany({
    include: { locations: true },
  });
  res.json(warehouses);
});

router.post('/', authGuard, async (req, res) => {
  const result = warehouseSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({ field: e.path[0], message: e.message }));
    return res.status(400).json({ errors });
  }
  const warehouse = await prisma.warehouse.create({
    data: { name: result.data.name },
    include: { locations: true },
  });
  res.status(201).json(warehouse);
});

router.post('/:id/locations', authGuard, async (req, res) => {
  const result = locationSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({ field: e.path[0], message: e.message }));
    return res.status(400).json({ errors });
  }

  const warehouse = await prisma.warehouse.findUnique({ where: { id: req.params.id } });
  if (!warehouse) return res.status(404).json({ error: 'Warehouse not found.' });

  const location = await prisma.location.create({
    data: { name: result.data.name, warehouseId: req.params.id },
  });
  res.status(201).json(location);
});

module.exports = router;
