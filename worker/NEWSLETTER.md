# Newsletter and shared contacts

Management entry: `https://newsletter.nutriallwellness.org/manage` (local Vite entry `/newsletter-admin`). Uses existing admin credentials with host-only, secure, HTTP-only sessions. The original operations dashboard links to it.

This release delivers contact management, a migrated KIT archive, and draft/template storage. It is **not a complete KIT replacement**. Broadcast sending, scheduling, automation execution, local public subscription forms, commerce and referral networks are not implemented. The `/send` endpoint rejects requests; migration sends nothing.

## Data

Migrations 0024 and 0025 add a normalized contact record and source relationships without rewriting appointment, member, signup or community records. Business-table triggers attach future records. Explicit website marketing preferences are respected; a booking never grants newsletter consent. Permanent suppression history blocks accidental reactivation, including through website preferences.

KIT imports use V4 all-state subscribers and exact API tag relationships. Do not split CSV tag names on commas. The original CSV supplements last-name fields. Repeated identical import batches are detected before execution. Imported content is read-only; duplication creates a new draft. Profiles and drafts use revision checks.

Production verification on 2026-10-28: 1,296 contacts, including 1,028 subscribed, 95 pending, 135 unsubscribed, 29 bounced, 2 complained and 7 unknown. Original bookings remain 40. Imported resources: 43 broadcasts, 24 tags, 14 templates, 9 form configurations, 1 sequence with 1 email, and 39 posts with content. Counts can change after new customer activity.

## Credentials and exports

`RESEND_API_KEY` is an encrypted Worker secret. `RESEND_DOMAIN_ID` and `NEWSLETTER_FROM` are nonsecret configuration in wrangler.toml. `news.nutriallwellness.org` is a separate verified sending domain; no existing receiving records were replaced. The admin summary reports current provider domain verification, but does not enable sending.

Local `.kit-migration-secrets.json` and `tmp/kit-private/` are ignored. They contain credentials and private snapshots. Never add them to Git or copy them into public assets, logs, test traces or client bundles. Source tools deliberately return counts rather than personal rows. Check staged files before committing.

The migration exports only read from KIT. No subscriber or old email is modified there. Exported V3 broadcast stats and full content are preserved; V4 supplies subscription states, exact tags, template bodies, sequence email bodies and posts. The standard APIs used here do not export visual automation graphs, so those have not been migrated.

## Operation

With Node installed, use:

```text
node scripts/audit-kit-import.mjs <original-csv> --compare-remote
node scripts/export-kit.mjs
node scripts/export-kit-v4.mjs
node scripts/export-kit-posts.mjs
node scripts/import-kit-snapshot.mjs prepare <original-csv>
node scripts/import-kit-snapshot.mjs local <original-csv>
node scripts/import-kit-snapshot.mjs remote <original-csv>
```

Only run exports after configuring the private local credentials. Import schema migrations first. `cloudflare-command.mjs` explicitly uses the existing authenticated desktop OAuth session; it does not store that credential in the repo. Import commands suppress raw Wrangler output, which could include customer SQL on failure. Private SQL is not a deployable source migration.

Emails preview inside an empty sandbox with a restrictive CSP. Network attributes are removed from the preview projection to avoid contacting historical tracking images; original content remains intact in storage. Private previews and the manager return noindex and no-store headers. Contacts, raw resources and CSV exports require server-side admin authentication.

Keep KIT running until sending, preference synchronization, automation cutover and old unsubscribe-link handling are complete. See `KIT_MIGRATION_PLAN.md` for the full feature and acceptance list.
