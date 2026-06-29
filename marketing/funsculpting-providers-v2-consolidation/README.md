# FunSculpting — consolidate provider ad traffic to `/providers-v2/`

Execution package to route **every** provider-facing ad (Meta + Google) to one page —
`https://funsculpting.com/providers-v2/` — with correct UTMs, so providers reach the
inline "Schedule a Practice Walkthrough" booking. Goal metric: **provider Calendly
bookings** on the canonical slug `practice-walkthrough`.

These are **deployment artifacts**, not application code — the exact spec to execute in
Google Ads, Meta/Manus, and WordPress. They live in their own folder to stay
self-contained (same pattern as `../funsculpting-conversion-tracking/`).

## Canonical values
- **Landing URL:** `https://funsculpting.com/providers-v2/`
- **Calendly:** `https://calendly.com/d/cx5d-v5w-9gn/practice-walkthrough`
- **Meta Pixel:** `1476485404279440` · **Google Ads conv:** `AW-18016354641/Ulx2CIzryb4cENGC745D`
- **GA4 (keep one):** `G-BCQCHJNLRB` (drop the duplicate `G-ZE1Z508V14`)

## Files
| File | Task | Contents |
|---|---|---|
| `routing-before-after.md` | 1 & 2 | Live before-state + exact new Final URLs for every Google + Meta ad |
| `site-redirects-and-tracking.md` | 3 | `/for-providers/`→`/providers-v2/` 301 (sequenced), inline-Calendly mobile, event + GA4 dedupe |
| `verification-runbook.md` | 4 | Per-ad resolve/UTM/scheduler/conversion checks + before/after sign-off table |

## What this session could and could not do

**Done here (live data, read-only):**
- Pulled the real current ad inventory, destinations, and 90-day spend for both
  platforms via Supermetrics (Google Ads `4797123095`, Meta `1515861149899091`) and
  built an accurate before/after routing spec for all of them.

**Executable from here once unblocked:**
- **Google Ads repoint (Task 1).** Supermetrics `campaign_update` *can* edit an ad's
  `final_urls`, and the exact 7-ad update is staged against the live structure
  (campaign `23660906143`). It is currently blocked only by a Supermetrics **write-access
  toggle** for AW account `4797123095` (team `inspiringphysicians`): enable at
  `https://hub.supermetrics.com/write-settings?platform=AW&teamId=qY8m4wQ4u_VE6SfXSXSc`,
  after which the repoint can run in one call.

**Must be done by a human / a session with access (not possible here):**
- **Meta repoints (Task 2).** Out of scope for this session at the user's instruction.
- **Anything on `funsculpting.com` / `calendly.com`** (see below) — egress blocked.
- **Anything on `funsculpting.com` / `calendly.com`.** This session's egress policy
  blocks both domains (403 from the policy proxy), so the live page, the 301, the
  inline scheduler, and a real test booking could not be verified from here. The 301
  and tracking changes are WordPress-side and need site access.

## Two findings to act on before executing
1. **Premise correction (Google):** the brief says the ISS ads logged 0 conversions
   because the ISS domain is untracked. Live data shows ad `800434905338` (→ `/funsculpting/`)
   logged **40 conversions** in 90 days — a conversion path there is already firing.
   Identify that conversion action and make sure repointing to `/providers-v2/`
   **preserves** it (see `site-redirects-and-tracking.md` §3).
2. **Reels decision (Meta):** 8 `facebook.com/reel/…` ads (~$1,167/90d) have no website
   link. Decide per ad: add a CTA → `/providers-v2/` (make them lead drivers) or
   reclassify as awareness-only and stop counting them as lead drivers.

## Order of operations
1. Repoint Google Ads (Task 1) → confirm in Ads/Tag Assistant.
2. Repoint Meta ads (Task 2) → confirm in Events Manager.
3. **Only then** 301 `/for-providers/` → `/providers-v2/` (Task 3).
4. Dedupe GA4, verify inline Calendly on mobile, confirm events end-to-end.
5. Run `verification-runbook.md` and sign off.
