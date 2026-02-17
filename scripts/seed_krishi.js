const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read/write JSON
function readJson(filename) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filename, data) {
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// 1. Define Targets (Contacts)
const contactsData = [
    // Universities & Institutes
    { name: "Director, CAZRI", email: "director.cazri@icar.gov.in", company: "Central Arid Zone Research Institute", tags: ["Research", "Government"] },
    { name: "Director, CFTRI", email: "director@cftri.res.in", company: "Central Food Technological Research Institute", tags: ["Research", "Government"] },
    { name: "Director, CIFRI", email: "cifri@vsncifri@vsnl.com", company: "Central Inland Fisheries Research Institute", tags: ["Research", "Government"] },
    { name: "Director, CICR", email: "cicrnagpur@gmail.com", company: "Central Institute for Cotton Research", tags: ["Research", "Government"] },
    { name: "Director, CPCRI", email: "director.cpcri@icar.gov.in", company: "Central Plantation Crops Research Institute", tags: ["Research", "Government"] },
    { name: "Registrar, NDUAT", email: "registrar.nd.15@gmail.com", company: "Acharya Narendra Deva University", tags: ["University", "Education"] },
    { name: "Registrar, JAU", email: "registrar@jau.in", company: "Junagadh Agricultural University", tags: ["University", "Education"] },
    { name: "Registrar, OUAT", email: "registrar@ouat.ac.in", company: "Orissa University of Agriculture", tags: ["University", "Education"] },
    { name: "Academic, PAU", email: "academic@pau.edu", company: "Punjab Agricultural University", tags: ["University", "Education"] },
    { name: "COE, PJTAU", email: "coe@pjtau.edu.in", company: "Professor Jayashankar Telangana Agricultural University", tags: ["University", "Education"] },

    // FPOs / KVKs
    { name: "KVK Jaipur", email: "kvkchomu@gmail.com", company: "Krishi Vigyan Kendra Jaipur", tags: ["KVK", "Outreach"] },
    { name: "KVK Buxar", email: "buxarkvk@gmail.com", company: "Krishi Vigyan Kendra Buxar", tags: ["KVK", "Outreach"] },
    { name: "KVK Dharwad", email: "kvk.Dharwad@icar.gov.in", company: "Krishi Vigyan Kendra Dharwad", tags: ["KVK", "Outreach"] },
    { name: "KVK Delhi", email: "kvkujwa@yahoo.com", company: "Krishi Vigyan Kendra Delhi", tags: ["KVK", "Outreach"] },
    { name: "Ballari FPO", email: "ballarifarmers@gmail.com", company: "Ballari Farmers Producer Company", tags: ["FPO", "Farmer Group"] },
    { name: "Hosakote FPO", email: "hoskotefpo@gmail.com", company: "Shri Venegopalaswamy Horticulture FPC", tags: ["FPO", "Farmer Group"] },
    { name: "Moynajhora FPO", email: "moynajhorafarmer.pcl@gmail.com", company: "Moynajhora Farmers Producer Company", tags: ["FPO", "Farmer Group"] },
    { name: "MAHAFPC", email: "mahafpc@gmail.com", company: "Maharashtra Maha Farmers Producer Company", tags: ["FPO", "Consortium"] },
    { name: "Agriva India", email: "agrivaindia@gmail.com", company: "Agriva India Hi-Tech Farmer Producer Company", tags: ["FPO", "Farmer Group"] },

    // Agritech / Startups
    { name: "Support, Agritek", email: "support@agritek.co.in", company: "ECOAGRITEK AI SOLUTIONS", tags: ["Startup", "Agritech"] },
    { name: "Info, Agritech Int", email: "info@agritechint.in", company: "Agritech International", tags: ["Startup", "Agritech"] }
];

// 2. Define Template
const templateData = {
    name: "Krishi Market Launch",
    subject: "Revolutionizing Agriculture with Real-Time Data - Krishi Market",
    body: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello {{name}},</h2>
        <p>I hope this email finds you well at <strong>{{company}}</strong>.</p>
        
        <p>I am excited to introduce you to <strong>Krishi Market</strong>, a new platform designed to empower Indian agriculture with real-time insights.</p>
        
        <p>Our platform offers:</p>
        <ul>
            <li><strong>Real-time Market Prices</strong>: Up-to-the-minute mandi prices across India.</li>
            <li><strong>Accurate Weather Updates</strong>: Hyper-local weather forecasts to aid farming decisions.</li>
            <li><strong>Agricultural Insights</strong>: Data-driven trends to maximize yield and profit.</li>
        </ul>
        
        <p>We believe this tool could be incredibly valuable for your network of farmers and researchers. We would love for you to try it out and share your feedback.</p>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="https://krishi-market-ten.vercel.app/" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Visit Krishi Market</a>
        </p>
        
        <p>Best regards,<br>The Krishi Market Team</p>
    </div>
    `
};

// --- Execution ---

console.log("Seeding Krishi Market Campaign Data...");

// 1. Add Contacts
const existingContacts = readJson('contacts.json');
const newContactIds = [];

contactsData.forEach(contact => {
    // Check if exists
    const exists = existingContacts.find(c => c.email === contact.email);
    if (!exists) {
        const newContact = {
            id: Date.now().toString() + Math.random().toString().slice(2, 6),
            ...contact,
            createdAt: new Date().toISOString()
        };
        existingContacts.push(newContact);
        newContactIds.push(newContact.id);
        console.log(`Added contact: ${contact.email}`);
    } else {
        console.log(`Contact exists: ${contact.email}`);
        newContactIds.push(exists.id);
    }
});
writeJson('contacts.json', existingContacts);

// 2. Add Template
const existingTemplates = readJson('templates.json');
let templateId;
const existingTemplate = existingTemplates.find(t => t.name === templateData.name);

if (existingTemplate) {
    console.log(`Template exists: ${templateData.name}`);
    templateId = existingTemplate.id;
    // Optionally update it? Let's keep it simple.
} else {
    const newTemplate = {
        id: Date.now().toString(),
        ...templateData,
        createdAt: new Date().toISOString()
    };
    existingTemplates.push(newTemplate);
    templateId = newTemplate.id;
    console.log(`Added template: ${templateData.name}`);
}
writeJson('templates.json', existingTemplates);

// 3. Create Campaign
const existingCampaigns = readJson('campaigns.json');
const campaignName = "Krishi Market Launch Campaign 1";
const existingCampaign = existingCampaigns.find(c => c.name === campaignName);

if (existingCampaign) {
    console.log(`Campaign exists: ${campaignName}`);
} else {
    const newCampaign = {
        id: Date.now().toString(),
        name: campaignName,
        templateId: templateId,
        contactIds: newContactIds,
        status: 'draft',
        sentAt: null,
        stats: { sent: 0, opened: 0, clicked: 0 },
        createdAt: new Date().toISOString()
    };
    existingCampaigns.push(newCampaign);
    console.log(`Created campaign: ${campaignName} with ${newContactIds.length} recipients.`);
}
writeJson('campaigns.json', existingCampaigns);

console.log("Seeding complete!");
