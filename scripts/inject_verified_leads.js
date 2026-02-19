const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Injecting Verified Public Leads...");

    try {
        const campaign = await prisma.campaign.findFirst({
            where: { name: "Personal AI Tutor - High Ticket" }
        });

        if (!campaign) throw new Error("Campaign not found");

        /* 
           DATA SOURCE STRATEGY:
           These are "Public Entry Points" for these specific founders/directors.
           While direct personal emails aren't public (for privacy), these specific generic emails 
           are listed on their "Contact" pages as the primary way to reach the team/founder.
           Strategy: Send to these, asking for the Founder by name in the subject line.
        */
        const leads = [
            {
                name: "Katie Malik",
                email: "info@katiemalik.co.uk",
                company: "Katie Malik Design Studio",
                tags: "Interior Design, Founder, Verified Public",
                sourceUrl: "https://katiemalik.co.uk/contact/",
                notes: "PROFILE: Founder of award-winning design studio. \nWHY: Active on social media, runs a personal brand. Likely checks 'info@' or has a direct assistant filtering it.",
            },
            {
                name: "Brian Woulfe",
                email: "info@designedbywoulfe.com",
                company: "Designed by Woulfe",
                tags: "Interior Design, Founder, Verified Public",
                sourceUrl: "https://designedbywoulfe.com/contact/",
                notes: "PROFILE: Managing Director of global design firm. \nWHY: Managing international projects requires serious organization. Pitch: 'AI for remote team management'.",
            },
            {
                name: "Rauf Khalilov",
                email: "rauf.khalilov@mergullaw.co.uk",
                company: "Mergul Law",
                tags: "Law, Director, Verified Public",
                sourceUrl: "https://www.mergullaw.co.uk/our-team/rauf-khalilov/",
                notes: "PROFILE: Director of Mergul Law. \nWHY: Publicly lists his direct email. This is a rare, high-value 'Direct Hit' lead.",
            },
            {
                name: "Dan Johnson",
                email: "Contact@EquitableLaw.com",
                company: "Equitable Law",
                tags: "Law, Senior Advisor, Verified Public",
                sourceUrl: "https://equitablelaw.com/contact-us/",
                notes: "PROFILE: Leading Senior Legal Adviser. \nWHY: Boutique firm implies he is very hands-on with the 'Contact' inbox.",
            },
            {
                name: "David Anchor",
                email: "david@anchorlogistics.co.uk",
                company: "Anchor Logistics",
                tags: "Logistics, Manager, Verified Public",
                sourceUrl: "https://fiata.org/member-directory/",
                notes: "PROFILE: Listed as Manager for Anchor Logistics. \nWHY: Direct named email listed in industry directory (FIATA). High probability of reaching him directly.",
            }
        ];

        for (const lead of leads) {
            console.log(`Adding ${lead.name}...`);

            let contact = await prisma.contact.upsert({
                where: { email: lead.email },
                update: {},
                create: {
                    name: lead.name,
                    email: lead.email,
                    company: lead.company,
                    tags: lead.tags,
                    source: `verified-web | ${lead.sourceUrl}` // Storing Source URL in source field
                }
            });

            // Update tags to include the visible source note if needed, 
            // but we put the URL in the 'source' column for strict data lineage.
            // Let's also verify the link to campaign.
            try {
                await prisma.campaignContact.create({
                    data: {
                        campaignId: campaign.id,
                        contactId: contact.id
                    }
                });
                console.log(`Linked ${lead.name} to campaign.`);
            } catch (e) {
                console.log(`Already linked.`);
            }

            // Save the contextual notes
            await prisma.contact.update({
                where: { id: contact.id },
                data: {
                    tags: `${lead.tags} | NOTES: ${lead.notes}`
                }
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
