const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const jsonPath = path.resolve('/Users/sanjibanichoudhury/Downloads/contacts_master.json');

async function importContacts() {
    try {
        const data = fs.readFileSync(jsonPath, 'utf8');
        const contactsList = JSON.parse(data);

        console.log(`Loaded ${contactsList.length} contacts from JSON.`);
        let imported = 0;
        let skipped = 0;

        for (const item of contactsList) {
            if (!item.email || item.email.trim() === '') {
                skipped++;
                continue; // Can't import without an email address to use as unique identifier
            }

            const cleanEmail = item.email.trim().toLowerCase();

            // Generate tags array
            const tags = [];
            if (item.priority) tags.push(`priority:${item.priority.toLowerCase()}`);
            if (item.source) tags.push(`source:${item.source.toLowerCase()}`);
            const tagsString = tags.join(',');

            // Determine Name - we don't have one, so fallback to company name
            const name = item.company || 'Unknown';

            try {
                await prisma.contact.upsert({
                    where: { email: cleanEmail },
                    update: {
                        name: name,
                        company: item.company || null,
                        country: item.region || null,
                        website: item.website || null,
                        niche: item.niche || null,
                        tags: tagsString,
                        source: 'master-json-import',
                        deletedAt: null // Restore if previously soft-deleted
                    },
                    create: {
                        name: name,
                        email: cleanEmail,
                        company: item.company || '',
                        country: item.region || null,
                        website: item.website || null,
                        niche: item.niche || null,
                        tags: tagsString,
                        source: 'master-json-import'
                    }
                });
                imported++;
            } catch (err) {
                console.error(`Failed to upsert contact ${cleanEmail}:`, err.message);
            }
        }

        console.log(`\nImport complete.`);
        console.log(`Imported / Updated : ${imported}`);
        console.log(`Skipped (No Email): ${skipped}`);

    } catch (err) {
        console.error('Error reading JSON file or parsing:', err);
    } finally {
        await prisma.$disconnect();
    }
}

importContacts();
