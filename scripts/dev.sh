#!/bin/bash
echo "🌱 Starting LeadSpark Dev Environment..."

pnpm --filter backend dev &

pnpm --filter frontend/portal dev &
pnpm --filter frontend/admin-portal dev &
pnpm --filter frontend/widget dev &
pnpm --filter frontend/landing-page dev

wait
