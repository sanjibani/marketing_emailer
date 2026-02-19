const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const contacts = await prisma.contact.findMany();
    console.log(`Total Contacts: ${contacts.length}`);
    contacts.forEach(c => console.log(`- ${c.name} (${c.email}) [deletedAt: ${c.deletedAt}]`));
}

main();
