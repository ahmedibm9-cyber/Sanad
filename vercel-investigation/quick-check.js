const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function quickCheck() {
    console.log('=== QUICK VERCEL DOMAIN CHECK ===\n');

    // Use user's existing Chrome profile to stay logged in
    const browser = await chromium.launch({
        headless: false,
        channel: 'chrome', // Use installed Chrome
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    try {
        // Check domains page directly
        console.log('Opening Vercel domains page...');
        await page.goto('https://vercel.com/ibmai1979-2318/~/domains', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        if (currentUrl.includes('login')) {
            console.log('❌ Not logged in. Please log in manually.');
            console.log('   The browser window will stay open for you to log in.');
            console.log('   After logging in, press Enter in this terminal to continue...');
            
            // Wait for user to log in
            await page.waitForURL('**/ibmai1979-2318**', { timeout: 120000 });
            console.log('✓ Login detected!\n');
        }

        // Take screenshot of domains page
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'domains-page.png'), fullPage: true });
        console.log('Screenshot saved: domains-page.png');

        // Extract domain information
        const bodyText = await page.evaluate(() => document.body.innerText);
        
        console.log('\n=== DOMAINS FOUND ===');
        const domainMatches = bodyText.match(/[\w-]+\.(app|co|com|org|net|io|dev)/gi);
        if (domainMatches) {
            const uniqueDomains = [...new Set(domainMatches)];
            uniqueDomains.forEach(d => console.log(`  • ${d}`));
            
            if (uniqueDomains.some(d => d.includes('sanad'))) {
                console.log('\n⚠️  WARNING: sanad domain(s) detected!');
            }
        } else {
            console.log('  No domains found in page content');
        }

        // Check for sanad specifically
        if (bodyText.toLowerCase().includes('sanad')) {
            console.log('\n⚠️  CONFIRMED: "sanad" appears on the domains page');
            console.log('   This may indicate unauthorized domain registration.');
        }

        // Keep browser open for manual inspection
        console.log('\n=== BROWSER OPEN FOR MANUAL INSPECTION ===');
        console.log('Navigate manually to check:');
        console.log('  • Team Members: /ibmai1979-2318/~/settings/members');
        console.log('  • Audit Log: /ibmai1979-2318/~/audit');
        console.log('  • Billing: /ibmai1979-2318/~/settings/billing');
        console.log('\nPress Enter in terminal when done to close browser...');

        // Wait for user input
        process.stdin.setRawMode?.(true);
        await new Promise(resolve => process.stdin.once('data', resolve));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await browser.close();
    }
}

quickCheck();
