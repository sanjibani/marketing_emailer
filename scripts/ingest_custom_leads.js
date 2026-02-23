const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    // 1. Read JSON file
    const dataPath = process.argv[2];
    if (!dataPath) {
        console.error("Please provide the path to the JSON file.");
        process.exit(1);
    }

    let leads = [];
    try {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        leads = JSON.parse(rawData);
    } catch (e) {
        console.error("Error reading or parsing JSON file:", e);
        process.exit(1);
    }

    console.log(`Loaded ${leads.length} leads.`);

    // 2. Create the Campaign
    const campaignName = process.argv[3] || "SMB Outreach Campaign - US/CA/AU";

    // First, let's make sure we have at least one template to link to
    let template = await prisma.template.findFirst();
    if (!template) {
        // Create a dummy template if none exists
        template = await prisma.template.create({
            data: {
                name: "Default Default Template",
                subject: "Quick Question",
                body: "Hi {{name}},\n\nI noticed your company {{company}}...\n\nBest,\nMe"
            }
        });
        console.log("Created a default template since none existed.");
    }

    const campaign = await prisma.campaign.create({
        data: {
            name: campaignName,
            description: "Targeting SMBs in US, Canada, and Australia",
            status: "draft",
            templateId: template.id
        }
    });
    console.log(`Created Campaign: ${campaign.name} (${campaign.id})`);

    // 3. Inject Leads & Map to Campaign
    let successCount = 0;
    for (const lead of leads) {
        if (!lead.email) {
            console.log(`Skipping invalid lead: ${JSON.stringify(lead)}`);
            continue;
        }

        try {
            // Create/Update Contact
            const contact = await prisma.contact.upsert({
                where: { email: lead.email },
                update: {
                    name: lead.name || lead.email.split('@')[0], // Fallback if no name
                    company: lead.company,
                    // Ensure not deleted if they exist
                    deletedAt: null
                },
                create: {
                    name: lead.name || lead.email.split('@')[0],
                    email: lead.email,
                    company: lead.company,
                    source: lead.source || "json-import"
                }
            });

            // Link to Campaign
            await prisma.campaignContact.upsert({
                where: {
                    campaignId_contactId: {
                        campaignId: campaign.id,
                        contactId: contact.id
                    }
                },
                update: {},
                create: {
                    campaignId: campaign.id,
                    contactId: contact.id
                }
            });
            successCount++;
        } catch (e) {
            console.error(`Error processing ${lead.email}:`, e.message);
        }
    }

    console.log(`Successfully ingested and mapped ${successCount}/${leads.length} leads to campaign '${campaign.name}'.`);
    console.log("\nTo start sending, ensure the automated sending script is running or triggered.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
