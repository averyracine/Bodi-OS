# Cowork handoff — FunSculpting `/providers-v2/` consolidation (Google + site, **no Meta**)

**Goal:** every provider-facing **Google** ad lands on one page —
`https://funsculpting.com/providers-v2/` — with correct UTMs, so providers reach the
inline "Schedule a Practice Walkthrough" booking. Goal metric = provider Calendly
bookings on the canonical slug `practice-walkthrough`.

This is **execution + verification only** — the routing decisions are made and the ad
changes are already applied (see "Already done"). Meta is intentionally **out of scope**
for this handoff. Full spec/context: `routing-before-after.md`, `site-redirects-and-tracking.md`,
`verification-runbook.md`, `execution-log.md` (this folder). Tracked on PR #5.

## Canonical values
- **Landing URL:** `https://funsculpting.com/providers-v2/`
- **Calendly:** `https://calendly.com/d/cx5d-v5w-9gn/practice-walkthrough`
- **Google Ads conv:** `AW-18016354641/Ulx2CIzryb4cENGC745D` · **Meta Pixel** (FYI only): `1476485404279440`
- **GA4 — keep one:** `G-BCQCHJNLRB` · **drop:** `G-ZE1Z508V14`
- **Google account:** Inspired Surgical Supplies `4797123095` · **Campaign:** `ISS - Body Contouring Revenue - Physicians` (`23660906143`)

---

## Already done (live, by the prior session) — do not redo
1. **All 7 Google ad final URLs** repointed to `/providers-v2/` with UTMs
   (`utm_source=google&utm_medium=cpc&utm_campaign=physicians_body_contouring&utm_content=funsculpting|body_contouring`).
2. **All 8 sitelinks + the lead-form privacy URL** moved off `inspiredsurgicalsupplies.com`
   onto `funsculpting.com` (callouts / structured snippets / images preserved).

> Caveat from editing: Google **recreates** ads on a final-URL change, so all 7 ads came
> back **PAUSED** with **new IDs**. That is why Step 1 below exists.

---

## Step 1 — Re-enable the 3 Google ads (REQUIRED — campaign isn't serving until this is done)
In Google Ads → campaign `23660906143` → **Ad group 1**, set these to **Enabled**:
- `814555679515`, `814555975639`, `814631290277`

Leave the other 4 recreated ads paused (they were paused before):
`814631246393`, `814631265038`, `814524024204` (Equipment Buyers — also has "TODO" placeholder
copy + was disapproved), `814524030900` (Brand ad group is paused).
Campaign link: https://ads.google.com/aw/campaigns?campaignId=23660906143&ocid=4797123095

## Step 2 — Verify two pages load (before relying on the ads)
- `https://funsculpting.com/providers-v2/` → 200, with the inline "Schedule a Practice
  Walkthrough" scheduler on the canonical slug `practice-walkthrough`.
- `https://funsculpting.com/privacy-policy/` → 200 (the lead form now points here; a dead
  URL can get the lead form disapproved). If it 404s, set the lead-form privacy URL to the
  real funsculpting.com privacy page.

## Step 3 — Confirm Google conversion tracking on `/providers-v2/`
- A completed Calendly booking fires the Google Ads conversion
  (`AW-18016354641/Ulx2CIzryb4cENGC745D`) via Astra hook 4337 — verify in Tag Assistant /
  a `googleadservices…/pagead/conversion/` hit. Must fire on **completed booking only**, not on open.
- Note: ad `800434905338` (now `814631265038`, paused) historically logged **40 conversions**
  on `/funsculpting/`, so a conversion action already works — make sure the same action fires
  on `/providers-v2/` so attribution isn't lost.

## Step 4 — Site / redirects / tracking (WordPress: Kadence + Elementor + WPCode)
- **301** `/for-providers/` → `/providers-v2/`, preserving query string — see the snippet in
  `site-redirects-and-tracking.md`. *(Sequencing note: this is safe now from the Google side,
  but Meta ads — out of scope here — may still point at `/for-providers/`; confirm before relying on it.)*
- **GA4 dedupe:** two properties fire (`G-BCQCHJNLRB`, `G-ZE1Z508V14`). Keep `G-BCQCHJNLRB`,
  remove the other from its source (GTM tag / WPCode / theme), re-verify each event fires once.
- **Inline Calendly mobile:** confirm the embed is responsive on a 360–390px viewport and uses
  slug `practice-walkthrough`.

## Step 5 — Verify end-to-end & sign off
Run `verification-runbook.md`: for each Google ad, load the final URL and confirm it (1) resolves
to `/providers-v2/`, (2) carries the UTMs + gclid, (3) reaches the inline scheduler, (4) a test
booking fires the conversion once. Fill the before/after table and present for sign-off.

## Guardrails
- WPCode snippets + GTM/GA4 only — don't edit core/parent-theme files.
- Keep the canonical Calendly slug `practice-walkthrough` everywhere.
- Conversion fires on **completed booking only**, never on scheduler open.
- Don't touch Meta in this handoff.

## Environment note
The prior session was headless with egress to `funsculpting.com` / `calendly.com` blocked, so
it could not load the live page or run a real booking — hence Steps 2–5 are for a human / a
session with site + ad-account access.
