const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const niches = await prisma.contact.findMany({
    select: { niche: true },
    distinct: ['niche']
  });
  console.log("Niches:", niches.map(n => n.niche).filter(Boolean));
}

main().catch(console.error).finally(() => prisma.$disconnect());
