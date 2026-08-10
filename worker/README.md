# NutriAll Worker

The Worker owns the production API, consultation intake, D1 persistence, internal and customer email notifications, analytics collection, authentication, and the operations dashboard.

## Public routes

- `GET /api/health`
- `POST /api/contact`
- `POST /api/analytics/collect`
- `GET /admin/`

The contact endpoint stores insurance Member ID and date of birth in D1. Those fields are intentionally excluded from QQ email bodies, analytics metadata, and the optional Google Sheet sync.

## Lead workflow

Booking leads support these statuses: `new`, `contacted`, `benefits_check`, `scheduled`, `converted`, and `closed`. The admin can also store an assignee, follow-up time, last-contacted timestamp, and internal notes.

## Required secrets

- `SMTP_PASSWORD`: QQ SMTP authorization code.
- `ADMIN_PASSWORD`: NutriAll operations dashboard password.

Optional Google Sheets secrets remain supported but D1 is the authoritative store.
