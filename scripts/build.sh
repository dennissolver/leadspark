#!/bin/bash
echo "📦 Building All LeadSpark Apps..."

pnpm --filter backend build
pnpm --filter frontend/portal build
pnpm --filter frontend/admin-portal build
pnpm --filter frontend/widget build
pnpm --filter frontend/landing-page build
