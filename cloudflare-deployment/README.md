# Cloudflare Deployment Guide

## Overview

SANAD uses a hybrid Cloudflare + Supabase architecture:

- **Cloudflare Pages** — Frontend SPA hosting
- **Cloudflare Workers** — r2-proxy (file upload/download/delete)
- **Supabase** — Auth, PostgreSQL, RLS (kept from original setup)
- **Cloudflare R2** — File storage (kept from original setup)

## Live URLs

| Service | URL |
|---------|-----|
| SPA (Cloudflare Pages) | `https://221448fd.sanad-etl.pages.dev` |
| Worker (r2-proxy) | `https://sanad-r2-proxy.r2-proxy.workers.dev` |
| Supabase | `https://mvhawhcfzujkuyhkejty.supabase.co` |

## Supabase Project

- **Project Ref**: `mvhawhcfzujkuyhkejty`
- **Org ID**: `koeabylrudjhbsnwvbec`
- **Region**: Oceania (Sydney)
- **Status**: Fresh project, all migrations applied

## Prerequisites

1. Cloudflare account with API access
2. Wrangler CLI installed: `npm install -g wrangler`
3. Authenticated: `wrangler login`
4. Supabase CLI installed: `npm install -g supabase`
5. Authenticated: `supabase login --token <PAT>`

## Quick Start

### 1. Deploy Worker

```bash
cd cloudflare-deployment/r2-proxy
wrangler deploy
```

### 2. Deploy Frontend

```bash
cd app
npm run build
npx wrangler pages deploy dist --project-name sanad
```

### 3. Full Deployment

```bash
npm run deploy:cf
```

### 4. Deploy Worker Only

```bash
npm run deploy:cf:worker
```

## Configuration

### Worker Environment Variables

Edit `cloudflare-deployment/r2-proxy/wrangler.toml`:

```toml
[vars]
SUPABASE_URL = "https://mvhawhcfzujkuyhkejty.supabase.co"
SUPABASE_ANON_KEY = "..."  # From supabase projects api-keys
CORS_ALLOWED_ORIGINS = "https://sanad-etl.pages.dev,https://221448fd.sanad-etl.pages.dev,http://localhost:5173"
```

### Frontend Environment Variables

In `app/.env.local`:

```env
VITE_SUPABASE_URL=https://mvhawhcfzujkuyhkejty.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_R2_PROXY_URL=https://sanad-r2-proxy.r2-proxy.workers.dev
```

## Architecture

```
┌──────────────────────────────────────────────┐
│         Cloudflare Pages (SPA)              │
│  React 18 SPA + React Router               │
│  VITE_R2_PROXY_URL → Worker URL            │
└──────────────┬───────────────────────────────┘
               │ HTTPS
┌──────────────┴───────────────────────────────┐
│         Cloudflare Workers (r2-proxy)       │
│  Upload / Download / Delete                │
│  Auth: Supabase JWT validation             │
│  Storage: Native R2 binding                │
└──────────────┬───────────────────────────────┘
               │
┌──────────────┴───────────────────────────────┐
│         Cloudflare R2 (storage)              │
│  companies/{id}/...                          │
│  backups/{id}/...                            │
└──────────────────────────────────────────────┘
               │ (optional)
┌──────────────┴───────────────────────────────┐
│         Supabase (auth + DB)                │
│  Auth, PostgreSQL, RLS                     │
│  (unchanged from original setup)            │
└──────────────────────────────────────────────┘
```

## Development

### Local Development

```bash
cd app
npm run dev
```

The app will use `VITE_R2_PROXY_URL` from .env.local (set to Worker URL in production, empty in dev).

When empty, it falls back to `${SUPABASE_URL}/functions/v1/r2-proxy`.

### Supabase CLI

```bash
# Link to project
cd app
supabase link --project-ref mvhawhcfzujkuyhkejty

# Push migrations
supabase db push

# Seed data
supabase db seed

# Generate types
npm run db:types
```

## Security Notes

- R2 credentials never reach the browser (Worker handles all R2 operations)
- All file operations require valid Supabase JWT
- Company isolation enforced in Worker (key ownership validation)
- Permission checks via Supabase REST API (check_user_permission RPC)
- Supabase RLS still enforced at database layer
- `.env.local` is gitignored — never commit secrets
