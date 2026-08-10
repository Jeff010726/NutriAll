# NutriAll Weight & Nutrition Care

React website and Cloudflare Worker backend for NutriAll's one-to-one weight-loss nutrition, GLP-1 support, insurance verification, and medical weight-care pathways.

## Applications

- Frontend: React + Vite, deployed to GitHub Pages.
- API: Cloudflare Worker at `https://nutriall-api.xtdiabetescare.com`.
- Database: Cloudflare D1 database `nutriall-db`.
- Admin: `https://nutriall-api.xtdiabetescare.com/admin/`.
- Email: existing QQ SMTP account, configured as a Worker secret.

## Local development

```powershell
npm install
npm run dev
npm run worker:migrate:local
npm run worker:dev
```

The Vite site uses `http://127.0.0.1:5174/NutriAll/` during QA. The local Worker defaults to port `8787`.

## Verification

```powershell
npm run lint
npm run worker:types
npm run build
npx playwright test
```

## Production deployment

GitHub Actions deploys the frontend after a push to `main`. Worker changes are deployed separately:

```powershell
npm run worker:migrate:remote
npm run worker:deploy
```

Never commit `.dev.vars`, Wrangler OAuth credentials, SMTP authorization codes, or admin passwords.
