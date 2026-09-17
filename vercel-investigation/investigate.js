const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const VIDEO_DIR = path.join(__dirname, 'videos');

[SCREENSHOT_DIR, VIDEO_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

async function screenshot(page, name) {
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`  ✓ Screenshot: ${name}.png`);
    return filePath;
}

async function investigate() {
    console.log('=== VERCEL DOMAIN INVESTIGATION ===');
    console.log('Target account: ibmai1979-2318');
    console.log('Suspected domains: sanad.app, sanad.co\n');

    const userDataDir = path.join(__dirname, 'browser-data');
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: { width: 1920, height: 1080 },
        args: ['--start-maximized'],
    });

    const page = context.pages()[0] || await context.newPage();
    const findings = [];

    try {
        // 1. Dashboard landing - WILL REQUIRE LOGIN
        console.log('[1/9] Navigating to Vercel dashboard...');
        await page.goto('https://vercel.com/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        await screenshot(page, '01-dashboard');

        const url1 = page.url();
        console.log(`  URL: ${url1}`);
        if (url1.includes('login') || url1.includes('signin')) {
            console.log('\n⚠️  NOT LOGGED IN. Please log in manually in the browser window.');
            console.log('  Waiting up to 120 seconds for login...');
            try {
                await page.waitForURL('**/dashboard**', { timeout: 120000 });
                console.log('  ✓ Login detected!');
            } catch {
                console.log('  ❌ Login timeout. Please log in and restart the script.');
                await screenshot(page, '01b-login-required');
                await context.close();
                return;
            }
            await page.waitForTimeout(3000);
            await screenshot(page, '01c-dashboard-after-login');
        }

        // 2. Team dashboard
        console.log('\n[2/9] Navigating to team ibmai1979-2318...');
        await page.goto('https://vercel.com/ibmai1979-2318', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        await screenshot(page, '02-team-dashboard');

        // 3. Domains page
        console.log('\n[3/9] Checking domains...');
        await page.goto('https://vercel.com/ibmai1979-2318/~/domains', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        await screenshot(page, '03-domains');

        const bodyText = await page.evaluate(() => document.body.innerText);
        const hasSanad = bodyText.toLowerCase().includes('sanad');
        if (hasSanad) {
            console.log('  ⚠️  CONFIRMED: "sanad" found on domains page!');
            findings.push('sanad domain(s) confirmed present on domains page');
        }

        // Extract all visible domain names
        const domainMatches = bodyText.match(/[\w-]+\.(app|co|com|org|net|io|dev)/gi);
        if (domainMatches) {
            console.log('  Visible domains:', [...new Set(domainMatches)].join(', '));
            findings.push(`Domains visible: ${[...new Set(domainMatches)].join(', ')}`);
        }

        // 4. Click on sanad domain if found for details
        console.log('\n[4/9] Looking for domain details...');
        const sanadLink = await page.$('a:has-text("sanad")');
        if (sanadLink) {
            console.log('  Found sanad link, clicking for details...');
            await sanadLink.click();
            await page.waitForTimeout(2000);
            await screenshot(page, '04-sanad-domain-details');
            
            const detailText = await page.evaluate(() => document.body.innerText);
            const createdMatch = detailText.match(/created[:\s]+([^\n]+)/i);
            if (createdMatch) {
                console.log('  Creation info:', createdMatch[1]);
                findings.push(`Domain creation: ${createdMatch[1]}`);
            }
        }

        // 5. Billing
        console.log('\n[5/9] Checking billing...');
        await page.goto('https://vercel.com/ibmai1979-2318/~/settings/billing', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        await screenshot(page, '05-billing');

        const billingText = await page.evaluate(() => document.body.innerText);
        if (billingText.toLowerCase().includes('sanad')) {
            console.log('  ⚠️  sanad mentioned in billing!');
            findings.push('sanad domain(s) appear in billing section');
        }

        // Look for domain purchase entries
        const billingLines = billingText.split('\n').filter(l =>
            l.toLowerCase().includes('domain') || l.toLowerCase().includes('register')
        );
        if (billingLines.length > 0) {
            console.log('  Billing domain entries:');
            billingLines.slice(0, 10).forEach(l => console.log(`    ${l.trim()}`));
        }

        // 6. Team members
        console.log('\n[6/9] Checking team members...');
        await page.goto('https://vercel.com/ibmai1979-2318/~/settings/members', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        await screenshot(page, '06-team-members');

        const membersText = await page.evaluate(() => document.body.innerText);
        const memberEmails = membersText.match(/[\w.+-]+@[\w-]+\.[\w.]+/g);
        if (memberEmails) {
            console.log('  Team member emails found:');
            [...new Set(memberEmails)].forEach(e => console.log(`    ${e}`));
            findings.push(`Team members: ${[...new Set(memberEmails)].join(', ')}`);
        }

        // 7. Audit log
        console.log('\n[7/9] Checking audit log...');
        await page.goto('https://vercel.com/ibmai1979-2318/~/audit', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        await screenshot(page, '07-audit-log');

        const auditText = await page.evaluate(() => document.body.innerText);
        if (auditText.toLowerCase().includes('sanad')) {
            console.log('  ⚠️  sanad mentioned in audit log!');
            findings.push('sanad domain(s) appear in audit log');
        }

        // Look for domain registration events
        const auditLines = auditText.split('\n').filter(l =>
            l.toLowerCase().includes('domain') || l.toLowerCase().includes('register') || l.toLowerCase().includes('purchase')
        );
        if (auditLines.length > 0) {
            console.log('  Audit domain entries:');
            auditLines.slice(0, 20).forEach(l => console.log(`    ${l.trim()}`));
            findings.push(`Audit entries about domains: ${auditLines.length}`);
        }

        // 8. Activity log
        console.log('\n[8/9] Checking activity log...');
        await page.goto('https://vercel.com/ibmai1979-2318/~/activity', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        await screenshot(page, '08-activity-log');

        const activityText = await page.evaluate(() => document.body.innerText);
        if (activityText.toLowerCase().includes('sanad')) {
            console.log('  ⚠️  sanad mentioned in activity log!');
            findings.push('sanad domain(s) appear in activity log');
        }

        // 9. Final overview
        console.log('\n[9/9] Final overview...');
        await page.goto('https://vercel.com/ibmai1979-2318', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        await screenshot(page, '09-final-overview');

        // Summary
        console.log('\n=== INVESTIGATION COMPLETE ===');
        console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
        console.log(`\n=== FINDINGS (${findings.length}) ===`);
        findings.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

        if (findings.length === 0) {
            console.log('  No specific anomalies found via text extraction.');
            console.log('  Review screenshots manually for visual evidence.');
        }

        console.log('\n=== RECOMMENDED NEXT STEPS ===');
        console.log('  1. Review all screenshots in ./screenshots/ folder');
        console.log('  2. Check domain registration dates vs your memory');
        console.log('  3. Verify team members - are all recognized?');
        console.log('  4. Check billing for unexpected charges');
        console.log('  5. Contact Vercel support if anomalies confirmed');
        console.log('  6. Review connected GitHub accounts for unauthorized access');

    } catch (err) {
        console.error('\nError:', err.message);
        try { await screenshot(page, 'error-state'); } catch {}
    } finally {
        await context.close();
    }
}

investigate();
