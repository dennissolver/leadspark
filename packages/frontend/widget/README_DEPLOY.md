# LeadSpark Widget – Production Deploy

## Build
```bash
pnpm -F @leadspark/widget build
```
This outputs a static bundle (e.g., `dist/`). Host it on Vercel (static project) or any CDN.

## Embed
Serve `index.html` from your host (e.g. `https://widget.leadspark.app/index.html`).  
Then add this to the client's website:
```html
<script src="https://widget.leadspark.app/leadspark-widget.js" defer></script>
<script>
  window.LEADSPARK_CONFIG = {
    backendBaseUrl: "https://api.leadspark.app",  // Render backend base URL
    widgetUrl: "https://widget.leadspark.app/index.html",
    tenantId: "TENANT_ID",
    width: "380px",
    height: "560px"
  };
</script>
```
*No hardcoded URLs in the loader; everything is configurable via `window.LEADSPARK_CONFIG`.*

## CORS
Allow the widget host origin on your backend (Render) and Supabase policies if you call Supabase directly from the widget.

## Health Check
Set `WIDGET_URL=https://widget.leadspark.app`  
```bash
ts-node tools/playwright/scripts/healthCheckWidget.ts
```
