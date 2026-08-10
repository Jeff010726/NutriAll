# Cloudflare Setup

The production resources are created in Cloudflare account `811cbfdf5fdcd2556b4ef1a0143312f8`:

- Worker: `nutriall-api`
- D1: `nutriall-db`
- Custom domain: `nutriall-api.xtdiabetescare.com`
- Workers.dev fallback: `nutriall-api.nutriall-medical-weight-care.workers.dev`

Authenticate without sharing API keys:

```powershell
$env:XDG_CONFIG_HOME = "C:\Projects\NutriAll\.wrangler-config"
npx wrangler login --device
```

Apply migrations and deploy:

```powershell
npm run worker:migrate:remote
npm run worker:deploy
```

Configure secrets interactively with `scripts/configure_cloudflare_secrets.ps1`. Do not place secret values in `wrangler.toml`.
