const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newLeads = [
    // Architecture & Design - Verified Personal Emails
    {
        name: "Mark Baker",
        email: "mark.baker@shape-london.co.uk",
        company: "Shape Architecture",
        source: "verified-web|https://shapearchitecture.co.uk",
        tags: ["high-net-worth", "architecture", "director", "verified"]
    },
    {
        name: "Jessica Inwood",
        email: "jessica.inwood@shape-london.co.uk",
        company: "Shape Architecture",
        source: "verified-web|https://shapearchitecture.co.uk",
        tags: ["high-net-worth", "architecture", "managing-director", "verified"]
    },
    {
        name: "Stuart Carruthers",
        email: "stuart.carruthers@shape-london.co.uk",
        company: "Shape Architecture",
        source: "verified-web|https://shapearchitecture.co.uk",
        tags: ["architecture", "director", "verified"]
    },
    {
        name: "Paul Shedden",
        email: "Paul@pod-architects.com",
        company: "POD Architects",
        source: "verified-web|https://pod-architects.com",
        tags: ["high-net-worth", "architecture", "managing-director", "verified"]
    },
    {
        name: "Ryan Shedden",
        email: "Ryan@pod-architects.com",
        company: "POD Architects",
        source: "verified-web|https://pod-architects.com",
        tags: ["architecture", "design-director", "verified"]
    },

    // Wealth Management & Law - Verified Personal Emails
    {
        name: "Michael Easton",
        email: "michael.easton@hayhillwealth.com",
        company: "Hay Hill Wealth",
        source: "verified-web|https://hayhillwealth.com",
        tags: ["ultra-high-net-worth", "finance", "ceo", "verified"]
    },
    {
        name: "Alex Davies",
        email: "alex.davies@charles-stanley.co.uk",
        company: "Charles Stanley",
        source: "verified-web|https://charles-stanley.co.uk",
        tags: ["wealth-management", "director", "verified"]
    },
    {
        name: "Abbas Owainati",
        email: "abbas.owainati@charles-stanley.co.uk",
        company: "Charles Stanley",
        source: "verified-web|https://charles-stanley.co.uk",
        tags: ["wealth-management", "portfolio-manager", "verified"]
    },
    {
        name: "Mark Freedman",
        email: "mark.freedman@osborneslaw.com",
        company: "Osbornes Law",
        source: "verified-web|https://osborneslaw.com",
        tags: ["law", "partner", "high-net-worth", "verified"]
    },

    // Gatekeeper Route
    {
        name: "Ufuk Bahar (via Megane)",
        email: "megane@urbanistarchitecture.co.uk",
        company: "Urbanist Architecture",
        source: "verified-web|https://urbanistarchitecture.co.uk",
        tags: ["architecture", "founder", "gatekeeper-route", "verified"]
    }
];

async function main() {
    console.log("Injecting 10 High Potential Leads...");

    // 1. Find Campaign
    const campaign = await prisma.campaign.findFirst({
        where: { name: { contains: 'Personal AI Tutor' } }
    });

    if (!campaign) {
        console.error("Critical: 'Personal AI Tutor' campaign not found!");
        return;
    }
    console.log(`Target Campaign: ${campaign.name} (${campaign.id})`);

    // 2. Inject Leads
    for (const lead of newLeads) {
        const tags = lead.tags.join(',');

        // Create/Update Contact
        const contact = await prisma.contact.upsert({
            where: { email: lead.email },
            update: {
                name: lead.name,
                company: lead.company,
                source: lead.source,
                tags: tags,
                deletedAt: null // Ensure not deleted
            },
            create: {
                name: lead.name,
                email: lead.email,
                company: lead.company,
                source: lead.source,
                tags: tags
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

        console.log(`- Injected & Linked: ${contact.name} (${contact.email})`);
    }

    console.log("Done!");
}

main();
