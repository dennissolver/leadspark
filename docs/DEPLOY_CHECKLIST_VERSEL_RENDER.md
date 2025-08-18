# Deploy Checklist – Vercel (Frontend) & Render (Backend)

## Render (Backend)
- [ ] Add env vars: SUPABASE_URL, SUPABASE_KEY, SUPABASE_DB_URL
- [ ] Add AI keys: OPENAI_API_KEY, (optional) ANTHROPIC_API_KEY, GROQ_API_KEY
- [ ] Add notifications: SLACK_* and/or EMAIL_*, TWILIO_*
- [ ] Expose `/api/healthz` route
- [ ] Set instance type for LLM load
- [ ] Enable CORS for widget host origin

## Vercel (Frontends)
- [ ] Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_API_BASE where used
- [ ] Configure project `root` for each app in monorepo
- [ ] Confirm build succeeds for `portal`, `admin-portal`, `landing-page`
- [ ] Preview deployments enabled

## Widget Host (Vercel Static or CDN)
- [ ] Deploy `packages/frontend/widget/dist/`
- [ ] Host `public/leadspark-widget.js`
- [ ] Provide embed snippet (window.LEADSPARK_CONFIG)
- [ ] Run `healthCheckWidget.ts`

## Supabase
- [ ] Deploy edge functions:
  ```bash
  supabase functions deploy bookDiscoveryCall --no-verify-jwt
  supabase functions deploy transferConversation --no-verify-jwt
  ```
- [ ] Confirm RLS for tenant isolation
