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

// --- Main ---
async function main() {
    console.log(`🚀 Starting Campaign: ${CAMPAIGN_NAME}`);

    // 1. Setup Transporter
    const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: true, // Zoho uses 465
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    };

    console.log('Using SMTP:', config.host, config.port, config.auth.user);
    const transporter = nodemailer.createTransport(config);

    // 2. Verify Connection
    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Verified');
    } catch (err) {
        console.error('❌ SMTP Connection Failed:', err);
        return;
    }

    // 3. Load Data
    let campaigns = readJson('campaigns.json');
    const campaignIndex = campaigns.findIndex(c => c.name === CAMPAIGN_NAME);

    if (campaignIndex === -1) {
        console.error('❌ Campaign not found!');
        return;
    }

    const campaign = campaigns[campaignIndex];
    if (campaign.status === 'sent') {
        console.warn('⚠️ Campaign already marked as sent. Continuing anyway...');
    }

    const templates = readJson('templates.json');
    const template = templates.find(t => t.id === campaign.templateId);
    if (!template) {
        console.error('❌ Template not found!');
        return;
    }

    const allContacts = readJson('contacts.json');
    const contacts = allContacts.filter(c => campaign.contactIds.includes(c.id));

    console.log(`📧 Sending to ${contacts.length} recipients...`);

    // 4. Send Emails
    let sentCount = 0;
    let failedCount = 0;

    // Update status to sending
    campaigns[campaignIndex].status = 'sending';
    writeJson('campaigns.json', campaigns);

    for (const contact of contacts) {
        console.log(`Sending to: ${contact.email} (${contact.name})...`);

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
            sentCount++;
        } catch (err) {
            console.error(`❌ Failed to send to ${contact.email}:`, err.message);
            failedCount++;
        }

        // Small delay to be polite to the SMTP server
        await new Promise(r => setTimeout(r, 1000));
    }

    // 5. Wrap Up
    campaigns = readJson('campaigns.json'); // Re-read to be safe
    campaigns[campaignIndex].status = 'sent';
    campaigns[campaignIndex].sentAt = new Date().toISOString();
    campaigns[campaignIndex].stats = {
        sent: sentCount,
        opened: 0,
        clicked: 0
    };

    writeJson('campaigns.json', campaigns);

    console.log('--- Campaign Finished ---');
    console.log(`✅ Sent: ${sentCount}`);
    console.log(`❌ Failed: ${failedCount}`);
}

main().catch(console.error);
