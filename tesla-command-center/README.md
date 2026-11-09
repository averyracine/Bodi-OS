# Command Center for Tesla (working name: Tesla Command Center)

A premium browser dashboard for **parked** Tesla downtime. Next.js 16 (App Router) + TypeScript + Tailwind v4, with Supabase Auth/Postgres, Stripe Billing (test mode) and phone-to-car pairing.

> Independent project. Not affiliated with Tesla, Inc. Nothing here has been validated on a vehicle yet. See [`docs/TESLA_VALIDATION_CHECKLIST.md`](docs/TESLA_VALIDATION_CHECKLIST.md).

## Run

```bash
cd tesla-command-center
npm install
cp .env.example .env.local   # optional: leave blank for demo mode
npm run dev                  # http://localhost:3000
```

Checks:

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run start -- -p 3100 & BASE_URL=http://localhost:3100 node e2e/smoke.cjs
```

`e2e/smoke.cjs` uses the system Playwright/Chromium and runs 79 browser checks in demo mode, at 1280×800, 1440×900, 1920×1080 and 390×844 plus the phone onboarding pages. It writes screenshots to `docs/screenshots/`.

`npm run build:demo` (after `npm run build`) writes a single-file browser-only demo to `standalone/dist/`.

## V2 dashboard (current)

- **Modes**: Watch, Listen, Work and Drive. These are screen layouts, not vehicle modes. Storage ids are `watch`, `listen`, `focus` (shown as Work) and `drive`, so saved v1 setups carry over.
- **Widgets** (`src/components/widgets/*`, `src/lib/widgets.ts`): Clock, Weather, Markets, Calendar, Quick Launch and Quick Notes. Each mode keeps its own order and compact/expanded sizes. Hiding a widget never deletes its data. Use *Customize widgets* on Home, or reset them in Settings.
- **Preferences v2** (`src/lib/prefs.ts`): adds the `drive` list, `widgets`, `quickLaunch`, `clockFormat` and `weather`. `sanitizePreferences` migrates v1 data in place.
- **Navigation**: compact header (mode, parked-use note, connection, account, time), a slim static ticker, and a floating dock with Home, Library, Focus, Discover and Settings. On phones, Discover and Settings move under *More*.
- **Library**: 28 apps across Streaming, Music, AI, Productivity, Gaming and Utilities, with category counts. Starring can add to any mode or to Quick Launch.
- **Discover** (`/app/discover`): ready-made setups. Applying one replaces a mode's apps after an in-page confirmation.
- **Icons**: one shared `AppIcon` component (`src/components/ServiceTile.tsx`) renders every app icon: favorites, Quick Launch, Library, Discover, Recently opened and Arrange. It uses bundled brand logos (`assets/brand-icons/*.svg` → `npm run icons` → `src/lib/brand-icon-data.ts`, all `data:` URIs, so there are no network requests). Each logo sits on its brand-appropriate tile (`src/lib/brand-icons.ts`). Custom links, PlugShare (no published SVG) and any image that fails to load fall back to initials, so an icon is never blank. Sources and notes are in `assets/brand-icons/SOURCES.md`. The logos are their owners' trademarks; set `NEXT_PUBLIC_SERVICE_LOGOS=off` to hide them.
- **Weather**: `/api/weather` and `/api/geocode` call fixed Open-Meteo hosts with validated input, cache for 10 minutes and rate-limit per client. The free tier is non-commercial only, so production needs `OPEN_METEO_API_KEY` (a paid plan; pricing at open-meteo.com/en/pricing). Without one, the widget shows labelled sample weather. Location is a city you type, or this device's location only after you tap the button and the browser asks for permission. The car's location is never used.
- **Calendar**: a real local month view plus links to Google Calendar and Outlook. No account is connected, so no events are shown or invented.

## What's where

| Area | Files |
| --- | --- |
| Landing page + live preview (same components as `/app`) | `src/app/page.tsx`, `src/components/DashboardPreview.tsx` |
| Dashboard shell, dock, views | `src/components/AppShell.tsx`, `src/components/views/*`, `src/app/app/*` |
| Catalog, URL validation, preferences | `src/lib/catalog.ts`, `src/lib/url.ts`, `src/lib/prefs.ts`, `src/lib/prefs-store.ts` |
| Analytics (consent-gated, allowlisted) | `src/lib/analytics*.ts`, `src/app/api/events` |
| Supabase clients, proxy session refresh | `src/lib/supabase/*`, `src/proxy.ts`, `src/app/auth/*` |
| Billing (Checkout, Portal, webhook reconciliation) | `src/lib/billing/*`, `src/app/api/billing/*`, `src/app/api/stripe/webhook` |
| Pairing (code + QR, approve, claim, revoke) | `src/lib/pairing/*`, `src/app/api/pair/*`, `src/app/api/devices/*`, `src/app/pair/*` |
| Schema + RLS | `supabase/migrations/20261109000000_init.sql` |
| Unit tests | `tests/*.test.ts` |

## Modes

- **Demo mode** (no env vars): fully functional local dashboard. A visible "Demo mode" badge is shown. Account, billing, sync and pairing show an explicit *not configured* state, and their APIs return `503 not_configured`. No pretend payments.
- **Live mode**: set Supabase values to enable sign-in via email magic link. Add Stripe and `SUPABASE_SECRET_KEY` to enable billing, sync and pairing.

## Security model (summary)

- **Premium access** is decided server-side from the `subscriptions` table, which only the verified Stripe webhook writes. The checkout success URL only *polls* status. localStorage never grants anything.
- **Webhook**: signature verified on the raw body. Event ids are deduplicated (`stripe_events`). For every subscription-related event the current subscription is **re-fetched from Stripe**, so out-of-order events can't regress state. If the fetch fails, the event id is released so Stripe's retry is processed.
- **Price**: resolved on the server by lookup key or id, and refused unless it's exactly USD 10.00 per month.
- **Pairing**: 8-character code (31-symbol alphabet) plus a 256-bit poll secret. Both are stored only as HMAC hashes. Codes expire after 5 minutes. Approval requires a signed-in, subscribed phone. Claims are single-use via compare-and-set. Start, approve and claim are rate limited. The device token goes in an httpOnly cookie, is scoped to `dashboard`, and is revocable in Settings.
- **RLS** is on for every table. Users can read only their own rows. Server-owned tables have no policies, so only the service role can touch them. Device `token_hash` isn't selectable by users.
- **Links**: custom links must be public `https://` URLs. Credentials, private IPs, odd ports, `javascript:`, `data:` and `file:` are rejected. Links open as top-level navigations with `noopener noreferrer`. The server never fetches them, so there's no SSRF surface. Nothing is embedded or proxied.
- **Pages**: never frameable (`frame-ancestors 'none'`). State-changing cookie routes check `Origin`.
- **Analytics**: off until the visitor allows it. Event names and props come from an allowlist on both client and server. No notes, codes, emails, URLs or user ids are sent. UTM values must be token-shaped, and only `source/medium/campaign` are saved to the profile.

## Setting up live services (test mode)

1. **Supabase**: create a project, run `supabase/migrations/*.sql` (`supabase db push` or the SQL editor), enable Email auth, and add `${NEXT_PUBLIC_APP_URL}/auth/confirm` to Auth → URL Configuration → Redirect URLs.
2. **Stripe (test mode)**: create a Product with a recurring **USD 10.00 / month** Price and set lookup key `command_center_monthly_usd_10`. Enable the Customer Portal (allow cancellation). Add a webhook endpoint at `/api/stripe/webhook` with events `checkout.session.completed`, `customer.subscription.created|updated|deleted|paused|resumed`, `invoice.paid` and `invoice.payment_failed`. For local work: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
3. Fill in `.env.local` from `.env.example`.

## Implemented vs. mocked vs. unverified

**Implemented and tested locally (demo mode, browser + unit tests), V2:** modes, widgets (show, hide, reorder, resize, reset, persist), v1→v2 migration, Discover setups, Quick Launch, the mobile dock overflow, ticker without clipping, dock clearance and reduced motion.

**Implemented and tested locally, V1:** the landing page with its interactive preview; Home (favorites, presets, Move-button and drag reorder, recents, clock, scratchpad); the Library (search, categories, favorites, custom links, per-service launch behavior); the Focus workspace (timer, scratchpad, checklist, split prototype); Settings (themes, reduced motion, presets, export/import/reset, consent); and the offline, error, loading and unavailable states.

**Implemented but not exercised against real services** (no credentials in this environment): live weather (Open-Meteo was rate-limited from this sandbox, so only the response mapping is unit-tested), live quotes (Finnhub, needs a key), Supabase magic-link auth, preference sync, the Stripe Checkout, Portal and webhook routes, the Supabase-backed pairing and device stores, and analytics storage. Their core logic (`reconcile.ts`, `pairing/service.ts`) is unit-tested with in-memory stores.

**Unverified vehicle behavior:** everything about the car's browser (viewport, cookies, tabs, playback, audio, fullscreen, suspension). See the checklist.

**Not built on purpose:** Park detection, safety locks, in-motion unlocks, embedding or proxying third-party apps, DRM or header workarounds, and third-party credential storage.
