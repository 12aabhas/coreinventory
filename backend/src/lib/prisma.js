const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
