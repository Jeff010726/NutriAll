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

## Booking copies in Google Sheets

The configured destination is the owner's sheet:
https://docs.google.com/spreadsheets/d/19D6efp7M1h0KJKf7Gu74iT2PYbWeImLPH4WwrbxNBlA/edit

Use a Google Cloud service account with Google Sheets API enabled. Share this spreadsheet
with the service account's `client_email` as Editor (do not make the sheet public).
Save the account email and private key as Cloudflare secrets:
`GOOGLE_SHEETS_CLIENT_EMAIL` and `GOOGLE_SHEETS_PRIVATE_KEY`.
Keep the JSON key file outside the repository and do not paste it into logs or chats.

Apply migration `0021_booking_sheet_sync.sql`. After configuration, open Bookings in the
admin dashboard and select **Sync next 5 bookings**. This creates a dedicated
`NutriAll Bookings` tab if needed, validates its header, and copies up to five pending
bookings. Repeat to backfill the remaining records; refresh shows the count still waiting.
Existing tabs and nonmatching headers are never overwritten.

New bookings are committed to D1 before background Google sync begins. Google errors cannot
turn a saved booking into a failed form submission. Errors/pending records remain in D1;
use the same admin action to retry. An interrupted sync lease can be retried after five minutes.
The integration checks Booking ID in column N before appending, including retries after
a lost Google response. Keep that ID column intact. Do not delete or manually duplicate
synced rows; rows are not recreated while their D1 status is already synced.

Columns A:O contain submission time in UTC, brand, requested service, name, email, phone,
age, language, callback window, client time zone, source page, campaign attribution,
patient type, Booking ID, and insurance company. Dates/times remain explicit UTC text;
phone numbers and user text are written with RAW input mode so Google does not interpret
them as formulas or drop leading zeroes. Insurance member IDs and birth dates remain
in the authenticated admin dashboard.

Columns P:S contain editable status, owner, next contact, and notes, seeded once from the
website record. Sync appends new rows and does not replace existing rows. Manual sheet
edits do not sync back into D1. No scheduled retry or two-way synchronization is enabled.
