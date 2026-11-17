# builtbycv.com: CV Capital website + CRM

Website and team CRM for **CV Capital** (CV Property Investments Inc., Arizona ROC #368875, KB-1).

- **Website**: public pages, price calculator, estimate form, 8 service pages, 10 service-area pages, projects.
- **CRM** at `/crm`: lead inbox, customers, projects, drag-and-drop pipeline, tasks, notes, photos, dashboard.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL (Drizzle ORM) · Vercel Blob (photos) · Resend (email).

## Run it locally

Needs Node 20+ and a Postgres database.

```bash
npm install
cp .env.example .env.local   # then edit values
npm run db:migrate           # create tables
npm run db:seed              # pipeline stages + first admin (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev                  # http://localhost:5000, CRM at /crm
```

Other commands: `npm run build`, `npm test`, `npm run typecheck`, `npm run lint`,
`npm run db:generate` (after editing `src/lib/db/schema.ts`),
`npm run db:seed -- --reset-password` (reset the admin password from env).

## Where to edit content

Everything visitors read lives in `src/content/`. No code changes are needed for content edits.

| File | What |
|---|---|
| `site.ts` | Name, phone, email, license, hours, socials, Google rating, stats, founder |
| `pricing.ts` | Calculator rules: starting prices, ranges, finish levels, budget options |
| `services.ts` | Service pages |
| `projects.ts` | Portfolio projects (photos go in `public/projects/<slug>/`) |
| `areas.ts` | Service-area pages |
| `copy.ts` | Hero, free offers, comparison table, process, FAQ, financing, testimonials, before/after |

**Placeholders.** Anything unconfirmed is flagged in code (`verified: false`, `null`, empty lists) and shows a yellow ⚑ tag on the site. Set `NEXT_PUBLIC_SHOW_PLACEHOLDERS=false` at launch to hide everything unverified.

## How leads flow

1. A visitor submits the estimate form or the price calculator. The calculator only shows its figure after the visitor gives name, phone and email.
2. The server checks the honeypot field, submit timing and rate limits (5 per IP per 10 minutes, 20 per day), then validates the input.
3. The submission is saved as a **lead** with its source (UTM tags, gclid/fbclid, referrer, landing page).
4. The customer is matched by email or phone, or created. A **project** is added to the first pipeline stage.
5. A **"Call new lead" task** is created, due the next business day (Phoenix time, Mon–Fri).
6. The owner gets an **email** at `LEAD_NOTIFY_EMAIL`.

## Deploying (owner's accounts)

1. **GitHub**: push this folder to a private repo owned by the business.
2. **Vercel**: import the repo. Framework: Next.js. Root directory: this folder.
3. **Database**: Vercel → Storage → Neon Postgres (or any Postgres). This sets `DATABASE_URL`.
4. **Photos**: Vercel → Storage → Blob. This sets `BLOB_READ_WRITE_TOKEN`.
5. **Email**: create a Resend account and verify the `builtbycv.com` domain. Set `RESEND_API_KEY`, `EMAIL_FROM` and `LEAD_NOTIFY_EMAIL`.
6. Set `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL=https://www.builtbycv.com`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_NAME`.
7. Run `npm run db:migrate && npm run db:seed` once against the production `DATABASE_URL`.
8. Point the domain's DNS at Vercel, but only when ready to switch from the current site.

All secrets stay on the server. Only `NEXT_PUBLIC_*` values reach the browser, and those are not secrets.

## Built for later

- **Roles**: `office`, `sales` and `field` exist in `src/lib/permissions.ts`.
- **Timeline**: the `activities` table takes new event types (SMS, email sequences, bookings, time entries) without new tables.
- **Photos**: the `photos` table has `taken_at`, `latitude` and `longitude` columns ready for GPS-stamped field photos.
- **Texting**: phones are stored in E.164 format (`+16025551234`).
