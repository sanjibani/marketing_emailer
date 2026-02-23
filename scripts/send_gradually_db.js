const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

// The campaign you want to send
const CAMPAIGN_NAME = "SMB Outreach Campaign - US/CA/AU";

// --- Helpers ---
function personalize(template, contact) {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return contact[key] || match;
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate random delay between min and max seconds
function getRandomDelay(minSeconds, maxSeconds) {
    return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
}

// --- Main ---
async function main() {
    console.log(`🐢 Starting DB Gradual Sender for: ${CAMPAIGN_NAME}`);

    // 1. Setup Transporter
    const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    };

    const transporter = nodemailer.createTransport(config);

    // Verify SMTP connection before starting
    try {
        await transporter.verify();
        console.log("✅ SMTP connection verified successfully.");
    } catch (error) {
        console.error("❌ SMTP connection failed:", error.message);
        process.exit(1);
    }

    // 2. Fetch Campaign
    const campaign = await prisma.campaign.findFirst({
        where: { name: CAMPAIGN_NAME },
        include: {
            template: true,
            stats: true,
            recipients: {
                include: {
                    contact: true
                }
            }
        }
    });

    if (!campaign) {
        console.error(`❌ Campaign '${CAMPAIGN_NAME}' not found!`);
        return;
    }

    if (!campaign.template) {
        console.error(`❌ Campaign has no template linked!`);
        return;
    }

    // Ensure stats exist
    let stats = campaign.stats;
    if (!stats) {
        stats = await prisma.campaignStats.create({
            data: { campaignId: campaign.id }
        });
    }

    const allContacts = campaign.recipients.map(r => r.contact);
    const totalContacts = allContacts.length;
    const sentCountAlready = stats.sent || 0;

    console.log(`📊 Current Status: ${sentCountAlready}/${totalContacts} sent.`);

    if (sentCountAlready >= totalContacts) {
        console.log('✅ Campaign already fully sent!');
        return;
    }

    // Assuming we resume sending sequentially
    const orderedContacts = allContacts.slice(sentCountAlready);

    console.log(`📧 Resuming sending to ${orderedContacts.length} recipients...`);
    console.log(`⏱️  Delays will be between 45s and 75s.`);

    // Update campaign status
    await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'sending' }
    });

    let successfulSendsInThisRun = 0;

    // 4. Send Emails Loop
    for (let i = 0; i < orderedContacts.length; i++) {
        const contact = orderedContacts[i];
        console.log(`[${i + 1}/${orderedContacts.length}] Sending to: ${contact.email} (${contact.name})...`);

        const pSubject = personalize(campaign.template.subject, contact);
        const pBody = personalize(campaign.template.body, contact);

        try {
            await transporter.sendMail({
                from: process.env.FROM_EMAIL,
                to: contact.email,
                subject: pSubject,
                html: pBody,
            });
            console.log(`✅ Sent to ${contact.email}`);

            // Update stats immediately
            await prisma.campaignStats.update({
                where: { campaignId: campaign.id },
                data: { sent: { increment: 1 } }
            });

            // Log it
            await prisma.emailLog.create({
                data: {
                    campaignId: campaign.id,
                    recipient: contact.email,
                    status: 'sent'
                }
            });

            // Update sentAt to now
            await prisma.campaign.update({
                where: { id: campaign.id },
                data: { sentAt: new Date() }
            });

            successfulSendsInThisRun++;

        } catch (err) {
            console.error(`❌ Failed to send to ${contact.email}:`, err.message);

            await prisma.emailLog.create({
                data: {
                    campaignId: campaign.id,
                    recipient: contact.email,
                    status: 'failed',
                    error: err.message
                }
            });
            // We do NOT increment stats.sent here so we can retry later (based on how the old script worked)
        }

        // Wait unless it's the last one
        if (i < orderedContacts.length - 1) {
            const delay = getRandomDelay(45, 75);
            console.log(`💤 Waiting ${delay / 1000}s...`);
            await sleep(delay);
        }
    }

    console.log('--- Batch Finished ---');
    console.log(`✅ Configured to send: ${orderedContacts.length}`);
    console.log(`✅ Successfully sent: ${successfulSendsInThisRun}`);

    // If we finished everything
    if (successfulSendsInThisRun + sentCountAlready >= totalContacts) {
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: 'sent' }
        });
        console.log('✅ Marked campaign as fully sent.');
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
