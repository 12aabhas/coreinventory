const prisma = require('./prisma');

async function writeLedgerEntry({ productId, locationId, delta, operationId, reason }) {
  return prisma.ledgerEntry.create({
    data: { productId, locationId, delta, operationId, reason }
  });
}

module.exports = { writeLedgerEntry };
