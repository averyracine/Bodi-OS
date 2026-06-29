# Execution log — Google Ads repoint (Task 1)

**Date:** 2026-06-29 · **Account:** Inspired Surgical Supplies `4797123095` ·
**Campaign:** `ISS - Body Contouring Revenue - Physicians` (`23660906143`) ·
**Executed via:** Supermetrics `campaign_update` (after the team's AW write-access toggle was enabled).

## What was done — DONE ✅
All **7** ads repointed from the ISS domain to the canonical landing page with correct UTMs:
- `…/funsculpting/` → `https://funsculpting.com/providers-v2/?utm_source=google&utm_medium=cpc&utm_campaign=physicians_body_contouring&utm_content=funsculpting`
- `…/body-contouring*` → `…&utm_content=body_contouring`

Confirmed in the API response: every ad's `final_urls` now resolves to `/providers-v2/`. No ad points at `inspiredsurgicalsupplies.com` anymore.

## Important side effect — ACTION NEEDED ⚠️
**Google Ads does not support in-place ad edits**, so the API **removed and recreated**
each ad. Recreated ads always come back **PAUSED** and **pending review**, and they get
**new ad IDs**. The Supermetrics tool recreates on *every* update — including a
status-only change — so **ads cannot be re-enabled through the MCP** (each attempt just
recreates a fresh paused ad). **Re-enabling must be done in the Google Ads UI.**

### Old → new ad IDs (after repoint)
| Old ID | New ID | Ad group | Final URL UTM | Was serving before? |
|---|---|---|---|---|
| 812972823074 | `814555679515` | Ad group 1 | funsculpting | **Yes — re-enable** |
| 812887859183 | `814555975639` | Ad group 1 | body_contouring | **Yes — re-enable** |
| 812972600315 | `814631290277` | Ad group 1 | funsculpting | **Yes — re-enable** |
| 805574637721 | `814631246393` | Ad group 1 | funsculpting | No (was paused) |
| 800434905338 | `814631265038` | Ad group 1 | funsculpting | No (was paused; held the 40 historical conv) |
| 812024733264 | `814524024204` | Equipment Buyers (paused group) | body_contouring | No (was paused + DISAPPROVED, TODO copy) |
| 810503889810 | `814524030900` | Brand - FunSculpting (paused group) | funsculpting | No (ad group paused) |

> Note: ad `812887859183` was recreated twice (a status-enable attempt churned it again),
> so its current live ID is `814555975639`, not the `814524030606` that briefly appeared.

### Re-enable these 3 in Google Ads (to restore the prior serving state)
`814555679515`, `814555975639`, `814631290277` — all in **Ad group 1**.
Campaign link: https://ads.google.com/aw/campaigns?campaignId=23660906143&ocid=4797123095

The other 4 were already paused (or sit in paused ad groups) — leave as-is unless you want them live.
The disapproved ad `814524024204` still has placeholder "TODO" copy — finish the copy before enabling.

## Still not done from here
- **Verify `/providers-v2/` actually loads** before re-enabling. The previously
  disapproved ad was flagged `DESTINATION_NOT_WORKING`; this session can't load
  `funsculpting.com` (egress blocked) to confirm the page + inline scheduler render.
- **Sitelinks + lead form** on this campaign still point at `inspiredsurgicalsupplies.com`
  (8 sitelinks, 1 lead form). Out of scope for "ad final URLs" — repoint separately if wanted.
- **Task 3** (301, GA4 dedupe, Calendly mobile) and **Task 4** live booking test — need site access.
