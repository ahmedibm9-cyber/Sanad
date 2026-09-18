#!/usr/bin/env bash
# SANAD Cloudflare Deployment Script
# Deploys r2-proxy Worker and SPA to Cloudflare Pages
set -e

echo "=== SANAD Cloudflare Deployment ==="
echo ""

# Resolve paths once so the script works from any invocation directory.
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT_DIR/app"
WORKER_DIR="$ROOT_DIR/cloudflare-deployment/r2-proxy"

if [ -z "${VITE_R2_PROXY_URL:-}" ] && ! grep -q '^VITE_R2_PROXY_URL=' "$APP_DIR/.env.local" 2>/dev/null; then
  echo "ERROR: VITE_R2_PROXY_URL is required for the production R2 contract"
  exit 1
fi

# Check prerequisites
echo "Checking prerequisites..."
command -v npx >/dev/null 2>&1 || { echo "ERROR: npx not found"; exit 1; }

# Verify wrangler is authenticated
echo "Verifying wrangler authentication..."
npx wrangler whoami || { echo "ERROR: Not authenticated with Cloudflare. Run: npx wrangler login"; exit 1; }

# Build the frontend
echo ""
echo "=== Building frontend ==="
cd "$APP_DIR"
npm run build

# Deploy r2-proxy Worker
echo ""
echo "=== Deploying r2-proxy Worker ==="
cd "$WORKER_DIR"
npx wrangler deploy

# Deploy SPA to Cloudflare Pages
echo ""
echo "=== Deploying SPA to Cloudflare Pages ==="
cd "$APP_DIR"
npx wrangler pages deploy dist --project-name sanad

echo ""
echo "=== Deployment complete ==="
echo "SPA URL: https://sanad-etl.pages.dev"
echo "Worker URL: https://sanad-r2-proxy.r2-proxy.workers.dev"
echo ""
echo "IMPORTANT: Ensure .env.local has VITE_R2_PROXY_URL set to the Worker URL"
