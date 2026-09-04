# SANAD — Environment & Secrets Setup

## Environments
- development
- staging
- production

Do not share production secrets with dev.

## Expected server-side secrets

Examples:
- Supabase URL
- Supabase anon/public key where required
- Supabase service-role key server-only
- R2 account/endpoint
- R2 access key
- R2 secret key
- R2 bucket
- licensing server URL
- licensing application credential if required
- PDF service secret if external renderer later used

## Rules

- `.env` excluded from source control.
- provide `.env.example` with names only.
- service-role/R2 secret never shipped to browser.
- rotate compromised credentials.
- staging uses separate bucket/database where possible.

## Migrations
- versioned migrations
- repeatable local setup
- seed command for dummy data

## Local dev
Document commands in repository README:
- install
- migrate
- seed
- run
- test
- build
