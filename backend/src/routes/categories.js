const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const authGuard = require('../middleware/authGuard');

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

router.get('/', authGuard, async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

router.post('/', authGuard, async (req, res) => {
  const result = categorySchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({ field: e.path[0], message: e.message }));
    return res.status(400).json({ errors });
  }

  const existing = await prisma.category.findUnique({ where: { name: result.data.name } });
  if (existing) {
    return res.status(409).json({ errors: [{ field: 'name', message: 'Category already exists' }] });
  }

  const category = await prisma.category.create({ data: { name: result.data.name } });
  res.status(201).json(category);
});

module.exports = router;
