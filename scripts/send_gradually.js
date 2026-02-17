const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env' });

const CAMPAIGN_NAME = "Krishi Market Launch Campaign 1";
const DATA_DIR = path.join(__dirname, '../data');

// --- Helpers ---
function readJson(filename) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filename, data) {
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

function personalize(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match;
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
    console.log(`🐢 Starting Gradual Sender for: ${CAMPAIGN_NAME}`);

    // 1. Setup Transporter
    const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    };

    const transporter = nodemailer.createTransport(config);

    // 2. Load Data
    let campaigns = readJson('campaigns.json');
    let campaignIndex = campaigns.findIndex(c => c.name === CAMPAIGN_NAME);

    if (campaignIndex === -1) {
        console.error('❌ Campaign not found!');
        return;
    }

    let campaign = campaigns[campaignIndex];
    const sentCountAlready = campaign.stats.sent || 0;

    console.log(`📊 Current Status: ${sentCountAlready}/${campaign.contactIds.length} sent.`);

    if (sentCountAlready >= campaign.contactIds.length) {
        console.log('✅ Campaign already fully sent!');
        return;
    }

    // Determine remaining contacts
    // Assuming strictly sequential sending from previous run
    const remainingContactIds = campaign.contactIds.slice(sentCountAlready);

    const templates = readJson('templates.json');
    const template = templates.find(t => t.id === campaign.templateId);

    const allContacts = readJson('contacts.json');
    const contactsToSend = allContacts.filter(c => remainingContactIds.includes(c.id));

    // Re-order to match the ID list order (filter might lose order)
    const orderedContacts = remainingContactIds
        .map(id => allContacts.find(c => c.id === id))
        .filter(c => c);

    console.log(`📧 Resuming sending to ${orderedContacts.length} recipients...`);
    console.log(`⏱️  Delays will be between 45s and 75s.`);

    // 4. Send Emails Loop
    let successfulSendsInThisRun = 0;

    // Reset status to sending if needed
    campaigns[campaignIndex].status = 'sending';
    writeJson('campaigns.json', campaigns);

    for (let i = 0; i < orderedContacts.length; i++) {
        const contact = orderedContacts[i];
        console.log(`[${i + 1}/${orderedContacts.length}] Sending to: ${contact.email} (${contact.name})...`);

        const pSubject = personalize(template.subject, contact);
        const pBody = personalize(template.body, contact);

        try {
            await transporter.sendMail({
                from: process.env.FROM_EMAIL,
                to: contact.email,
                subject: pSubject,
                html: pBody,
            });
            console.log(`✅ Sent to ${contact.email}`);

            // Update stats immediately to persist progress
            campaigns = readJson('campaigns.json'); // Reload to be safe
            campaignIndex = campaigns.findIndex(c => c.name === CAMPAIGN_NAME);

            if (campaignIndex !== -1) {
                campaigns[campaignIndex].stats.sent += 1;
                // Update sentAt to now
                campaigns[campaignIndex].sentAt = new Date().toISOString();
                writeJson('campaigns.json', campaigns);
            }

            successfulSendsInThisRun++;

        } catch (err) {
            console.error(`❌ Failed to send to ${contact.email}:`, err.message);
            // We do NOT increment stats.sent here so we can retry later
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
}

main().catch(console.error);
