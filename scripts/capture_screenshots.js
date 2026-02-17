const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '../public/screenshots');

async function capture() {
    // Ensure directory exists
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    console.log('📸 Launching browser for screenshots...');
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Set viewport to a standard desktop size
    await page.setViewport({ width: 1280, height: 800 });

    const pages = [
        { name: 'dashboard', path: '/' },
        { name: 'campaigns', path: '/campaigns' },
        { name: 'contacts', path: '/contacts' },
        { name: 'templates', path: '/templates' }
    ];

    for (const p of pages) {
        const url = `${BASE_URL}${p.path}`;
        console.log(`Navigating to ${url}...`);

        try {
            await page.goto(url, { waitUntil: 'networkidle0' });
            // Small delay to ensure rendering
            await new Promise(r => setTimeout(r, 1000));

            const filePath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
            await page.screenshot({ path: filePath, fullPage: true });
            console.log(`✅ Saved ${p.name}.png`);
        } catch (err) {
            console.error(`❌ Failed to capture ${p.name}:`, err.message);
        }
    }

    await browser.close();
    console.log('✨ Screenshots captured!');
}

capture().catch(console.error);
