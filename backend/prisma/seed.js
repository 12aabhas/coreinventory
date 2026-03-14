require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@demo.com',
      passwordHash: await bcrypt.hash('demo1234', 12),
      role: 'manager',
    },
  });
  console.log('Created user:', user.email);

  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'warehouse-main' },
    update: {},
    create: { id: 'warehouse-main', name: 'Main Warehouse' },
  });

  const location = await prisma.location.upsert({
    where: { id: 'location-rack-a' },
    update: {},
    create: { id: 'location-rack-a', name: 'Rack A', warehouseId: warehouse.id },
  });

  const category = await prisma.category.upsert({
    where: { name: 'Raw Materials' },
    update: {},
    create: { name: 'Raw Materials' },
  });

  const product = await prisma.product.upsert({
    where: { sku: 'STL-001' },
    update: {},
    create: {
      name: 'Steel Rods',
      sku: 'STL-001',
      unitOfMeasure: 'kg',
      categoryId: category.id,
      stockItems: {
        create: { locationId: location.id, quantity: 100 },
      },
    },
  });

  await prisma.reorderRule.upsert({
    where: { productId: product.id },
    update: {},
    create: { productId: product.id, minQuantity: 20, reorderQty: 100 },
  });

  console.log('Seed complete!');
  console.log('Login: admin@demo.com / demo1234');
}

main().catch(console.error).finally(() => prisma.$disconnect());
