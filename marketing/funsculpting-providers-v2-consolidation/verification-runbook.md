# Verification runbook (Task 4)

Run **after** repointing each source and after the site/tracking steps. Requires
access to the live site and the ad accounts — **not possible from the headless
session that authored this package** (egress to `funsculpting.com` / `calendly.com`
is blocked by policy). Run this from a browser with the accounts connected.

## Per-ad-source checks

For **each** ad source, click/preview the live ad's final URL and confirm:

1. **Resolves to `/providers-v2/`** — the landing page is the canonical provider page
   (not `/funsculpting/`, not `/for-providers/`, not the homepage, not a raw Calendly link).
2. **UTMs present** — the address bar shows the exact UTMs from `routing-before-after.md`
   (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`); Google ads also carry `gclid`.
3. **Inline scheduler reachable** — the "Schedule a Practice Walkthrough" widget loads
   and is usable on **desktop and mobile**, on the canonical slug `practice-walkthrough`.
4. **Test booking fires the conversion** — completing a booking fires `booking_completed`
   → Meta `Schedule` (pixel `1476485404279440`) + Google Ads conversion
   (`AW-18016354641/Ulx2CIzryb4cENGC745D`), **once**, and not on open.

## Tools
- GA4 → Realtime / DebugView
- Meta Events Manager → Test Events
- Google Tag Assistant (or Network tab → `googleadservices…/pagead/conversion/`)
- A real phone (or device emulation) for the mobile pass

## Before/after destination table — fill the "verified" column

Copy the table from `routing-before-after.md` and add the result of step 1–4 per ad:

| Source | Ad | New Final URL | Resolves to /providers-v2/? | UTMs ok? | Scheduler ok? | Conv fired? |
|---|---|---|---|---|---|---|
| Google | 805574637721 (+4 on /funsculpting/) | …`utm_content=funsculpting` | ☐ | ☐ | ☐ | ☐ |
| Google | 812887859183 / 812024733264 (body-contouring) | …`utm_content=body_contouring` | ☐ | ☐ | ☐ | ☐ |
| Meta | New Traffic Ad (homepage) | …`utm_campaign=new_traffic&utm_content=homepage_ad` | ☐ | ☐ | ☐ | ☐ |
| Meta | FS_GLP1_Ad3_Quote (+Copy) | …`utm_content=fs_glp1_ad3_quote` | ☐ | ☐ | ☐ | ☐ |
| Meta | FS_TRT_Ad3_Quote | …`utm_content=fs_trt_ad3_quote` | ☐ | ☐ | ☐ | ☐ |
| Meta | New Leads Ad (was wrong slug) | …`utm_campaign=provider_leads_jun2026&utm_content=new_leads_ad` | ☐ | ☐ | ☐ | ☐ |
| Meta | Reels ×8 | CTA → /providers-v2/ **or** awareness-only | ☐ | ☐ | ☐ | ☐ |

## Redirect check
`curl -I https://funsculpting.com/for-providers/?utm_source=test` → expect `301` →
`Location: …/providers-v2/?utm_source=test`. Only after ads no longer point at `/for-providers/`.

## Sign-off
Present the completed table to the business owner. Done = every live provider ad
resolves to `/providers-v2/` with correct UTMs, the inline scheduler books on
`practice-walkthrough`, and one (and only one) conversion fires end-to-end.
