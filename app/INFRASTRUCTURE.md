# SANAD Infrastructure Setup

## Overview

This document describes the infrastructure setup for Milestone 1 of SANAD.

## Prerequisites

1. **Node.js** v18 or later
2. **Supabase CLI** installed globally
3. **Supabase Account** (free tier works for development)
4. **Cloudflare R2 Account** (for file storage)

## Quick Start

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and keys

#### Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Run Migrations

```bash
npx supabase db push
```

#### Seed Development Data

```bash
npx supabase db seed
```

### 3. Set Up Cloudflare R2 (Optional for Development)

For development, R2 is optional. The application will work with mock storage in dev mode.

For production:

1. Create an R2 bucket
2. Generate API tokens
3. Add to `.env.local`:

```
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-key-id
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET=sanad-production
```

### 4. Start Development Server

```bash
npm run dev
```

## Project Structure

```
app/
├── src/
│   ├── lib/                    # Core utilities
│   │   ├── env.ts             # Environment configuration
│   │   ├── supabase.ts        # Supabase client
│   │   ├── r2.ts              # R2 storage adapter
│   │   ├── errors.ts          # Error handling
│   │   ├── logger.ts          # Application logging
│   │   ├── api.ts             # API utilities
│   │   └── services/          # Service layer
│   │       └── base.ts        # Base service class
│   └── types/
│       └── database.ts        # Supabase generated types
├── supabase/
│   └── migrations/            # Database migrations
│       └── 001_initial_schema.sql
├── tests/                     # Test files
│   ├── setup.ts              # Test configuration
│   └── lib/                  # Unit tests
├── .env.example              # Environment template
└── vitest.config.ts          # Test configuration
```

## Database Schema

### Foundational Tables

1. **deployments** - Deployment metadata
2. **users** - User profiles (linked to Supabase Auth)
3. **companies** - Company information
4. **company_memberships** - User-company relationships
5. **permission_catalog** - Available permissions
6. **membership_permissions** - Per-company user permissions

### RLS Policies

Row Level Security is enabled on all tables. Policies enforce:
- Users can read their own profile
- Members can read company data
- Admins have full access
- System admins have full access

## Testing

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Development Workflow

1. **Start Supabase locally** (optional):
   ```bash
   npx supabase start
   ```

2. **Run migrations**:
   ```bash
   npx supabase db push
   ```

3. **Start dev server**:
   ```bash
   npm run dev
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

## Environment Variables

### Client-Side (VITE_ prefix)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `VITE_LICENSE_SERVER_URL` | Licensing server URL | No |
| `VITE_LICENSE_KEY` | Deployment license key | No |
| `VITE_APP_NAME` | Application name | No |
| `VITE_APP_VERSION` | Application version | No |
| `VITE_APP_ENV` | Environment (development/staging/production) | No |

### Server-Side

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `R2_ENDPOINT` | R2 API endpoint | No* |
| `R2_ACCESS_KEY_ID` | R2 access key ID | No* |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key | No* |
| `R2_BUCKET` | R2 bucket name | No* |
| `R2_PUBLIC_URL` | R2 public URL | No |

*R2 is optional for development

## Security Notes

- **Never** commit `.env.local` to source control
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- **Never** expose R2 secrets to the browser
- Use short-lived signed URLs for file access
- Rotate compromised credentials immediately

## Next Steps

After Milestone 1 is complete:
- Milestone 2: Authentication & Licensing
- Milestone 3: Companies, Memberships & Permissions
- Milestone 4: Company Settings
- Milestone 5: Customers & Materials
- ...and so on
