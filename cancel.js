const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.scheduledEmail.updateMany({
    where: { status: 'pending' },
    data: { status: 'cancelled' }
  });
  console.log("All pending scheduled emails cancelled.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
