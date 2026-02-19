const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Testing Soft Delete...");

    // 1. Create a dummy contact
    const contact = await prisma.contact.create({
        data: {
            name: "Delete Me",
            email: "delete.me@example.com",
            source: "test"
        }
    });
    console.log(`Created contact: ${contact.id}`);

    // 2. Perform Soft Delete (Simulation of API logic)
    await prisma.contact.update({
        where: { id: contact.id },
        data: { deletedAt: new Date() }
    });
    console.log("Soft deleted contact.");

    // 3. Verify it still exists in DB but has deletedAt
    const checked = await prisma.contact.findUnique({
        where: { id: contact.id }
    });

    if (checked && checked.deletedAt) {
        console.log("SUCCESS: Record exists with deletedAt: " + checked.deletedAt);
    } else {
        console.error("FAILURE: Record is missing or deletedAt is null");
    }

    // 4. Verify findMany filters it out (Simulation of GET API)
    const all = await prisma.contact.findMany({
        where: { deletedAt: null }
    });
    const found = all.find(c => c.id === contact.id);

    if (!found) {
        console.log("SUCCESS: Record is hidden from default view.");
    } else {
        console.error("FAILURE: Record is still visible in default view.");
    }

    // Cleanup
    await prisma.contact.delete({ where: { id: contact.id } }); // Hard delete for cleanup
}

main();
