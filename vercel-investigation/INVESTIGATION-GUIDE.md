# Vercel Domain Investigation Guide

## Quick Start

### Option 1: Playwright Investigation (Recommended)

```bash
cd D:\SANAD\vercel-investigation
npm install
npx playwright install chromium
node investigate.js
```

**What happens:**
1. A browser window opens to Vercel login
2. **Log in manually** with the ibmai1979-2318 account credentials
3. The script automatically navigates through key pages
4. Screenshots saved to `./screenshots/` folder
5. Review screenshots for anomalies

### Option 2: Manual Browser Investigation

Visit these URLs while logged in:

| Page | URL | What to Check |
|------|-----|---------------|
| Dashboard | `https://vercel.com/ibmai1979-2318` | All projects listed |
| Domains | `https://vercel.com/ibmai1979-2318/~/domains` | **Look for sanad.app, sanad.co** |
| Team Members | `https://vercel.com/ibmai1979-2318/~/settings/members` | **Unknown users?** |
| Audit Log | `https://vercel.com/ibmai1979-2318/~/audit` | **When were domains added?** |
| Activity | `https://vercel.com/ibmai1979-2318/~/activity` | Recent changes |
| Billing | `https://vercel.com/ibmai1979-2318/~/settings/billing` | Domain charges |

### Option 3: Vercel CLI Check

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# List domains
vercel domains ls

# Check team
vercel teams list
```

## What to Look For

### Red Flags
- [ ] **sanad.app** or **sanad.co** appear in domains list
- [ ] Domain creation date is recent and unfamiliar
- [ ] Unknown email addresses in team members
- [ ] Unrecognized GitHub accounts connected
- [ ] Unexpected billing charges for domain registration
- [ ] Audit log shows actions from unknown users

### Domain Registration Cost
Vercel domain pricing (approximate):
- `.app` domains: ~$14-20/year
- `.co` domains: ~$30-35/year
- `.com` domains: ~$15-20/year

## Immediate Actions if Anomalies Found

1. **Document Everything**
   - Screenshot all evidence
   - Note dates, times, and user names

2. **Check Connected Services**
   - GitHub: `https://github.com/settings/applications`
   - GitLab: Check authorized applications
   - Check for unauthorized OAuth tokens

3. **Remove Unknown Team Members**
   - Go to Settings → Members
   - Remove any unrecognized users

4. **Transfer or Remove Domains**
   - If you own them: transfer to your registrar
   - If unauthorized: contact Vercel support immediately

5. **Contact Vercel Support**
   - Email: support@vercel.com
   - Include: account ID, screenshots, timeline of unauthorized activity

6. **Secure Your Account**
   - Change password immediately
   - Enable 2FA if not already active
   - Review and revoke unknown API keys

## Vercel Support Contact

When contacting support, provide:
- Team ID: ibmai1979-2318
- Specific domains in question: sanad.app, sanad.co
- Screenshots of audit log showing when they were added
- Any unknown team members found
- Timeline of when you first noticed the issue
