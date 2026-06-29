# Routing before/after — consolidate provider ad traffic to `/providers-v2/`

**Goal:** every provider-facing ad lands on `https://funsculpting.com/providers-v2/`
with correct UTMs, so providers reach the inline "Schedule a Practice Walkthrough"
booking. Goal metric = provider Calendly bookings on the canonical slug
`practice-walkthrough`.

**Canonical landing URL:** `https://funsculpting.com/providers-v2/`
**Canonical Calendly:** `https://calendly.com/d/cx5d-v5w-9gn/practice-walkthrough`

> **Before-state data below is live**, pulled from Supermetrics on 2026-06-29 for the
> trailing 90 days (Google Ads account *Inspired Surgical Supplies* `4797123095`;
> Meta ad account `1515861149899091`). Cost is in the account's reporting currency
> (no currency dimension returned; treat as USD unless the account says otherwise).
>
> **These are live ad-destination edits.** Apply them per-account in each ad UI,
> review the diff first, and do **not** 301 `/for-providers/` until every Meta +
> Google ad that points there has been repointed (see `site-redirects-and-tracking.md`).
> Neither connected MCP (Windsor.ai, Supermetrics) exposes a write action that edits
> an ad's **final/destination URL**, so the repoints themselves are manual in
> Google Ads and Meta/Manus — this table is the exact spec to execute.

---

## UTM convention

- **Google Ads:** `?utm_source=google&utm_medium=cpc&utm_campaign=physicians_body_contouring&utm_content={AD}` — keep auto-gclid (leave "Auto-tagging" on).
- **Meta Ads:** `?utm_source=meta&utm_medium=paid_social&utm_campaign={CAMPAIGN}&utm_content={AD_NAME}`.

---

## Task 1 — Google Ads (account: Inspired Surgical Supplies `4797123095`)

Campaign **`ISS - Body Contouring Revenue - Physicians`**. Repoint by current Final URL.
Group the live ads by their current destination:

| Ad ID | Ad group | Current Final URL | 90d cost | Clicks | Conv | New Final URL |
|---|---|---|---:|---:|---:|---|
| 805574637721 | Ad group 1 | `inspiredsurgicalsupplies.com/funsculpting/` | 1187.51 | 323 | 0 | `https://funsculpting.com/providers-v2/?utm_source=google&utm_medium=cpc&utm_campaign=physicians_body_contouring&utm_content=funsculpting` |
| 800434905338 | Ad group 1 | `inspiredsurgicalsupplies.com/funsculpting/` | 752.92 | 260 | **40** | same as above (`utm_content=funsculpting`) |
| 812972600315 | Ad group 1 | `inspiredsurgicalsupplies.com/funsculpting/` | 64.47 | 20 | 0 | same as above (`utm_content=funsculpting`) |
| 812972823074 | Ad group 1 | `inspiredsurgicalsupplies.com/funsculpting/` | 27.54 | 9 | 0 | same as above (`utm_content=funsculpting`) |
| 810503889810 | Brand - FunSculpting | `inspiredsurgicalsupplies.com/funsculpting/` | 0 | 0 | 0 | same as above (`utm_content=funsculpting`) |
| 812887859183 | Ad group 1 | `www.inspiredsurgicalsupplies.com/body-contouring` | 371.83 | 111 | 0 | `https://funsculpting.com/providers-v2/?utm_source=google&utm_medium=cpc&utm_campaign=physicians_body_contouring&utm_content=body_contouring` |
| 812024733264 | Equipment Buyers - Phrase+Exact | `www.inspiredsurgicalsupplies.com/body-contouring/physicians` | 0 | 0 | 0 | `…&utm_content=body_contouring` |

**Notes**
- The brief listed 2 ads; the live account has **7** (5 → `/funsculpting/`, 2 → `/body-contouring*`). All are mapped above by destination so none is missed.
- **Premise correction:** the brief states these ads showed *0 conversions because they pointed at the untracked ISS domain.* Live data shows ad `800434905338` (→ `/funsculpting/`) recorded **40 conversions** in the last 90 days — i.e. a conversion path on `/funsculpting/` **is** already firing. Before repointing, confirm in Google Ads which conversion action those 40 belong to so the move to `/providers-v2/` **preserves** that working path rather than dropping it. (See the conversion-action check in `site-redirects-and-tracking.md`.)
- After repointing, confirm the Google Ads conversion action fires on `/providers-v2/` — gtag `AW-18016354641/Ulx2CIzryb4cENGC745D` is reported to fire there on Calendly booking via Astra hook 4337. Verify per the runbook.

---

## Task 2 — Meta Ads (account `1515861149899091`, run via Manus — supply this spec)

All provider ads → `https://funsculpting.com/providers-v2/` with Meta UTMs. Live ads
by current destination:

### 2a. Direct-link ads — repoint the website URL

| Campaign | Ad name | Current destination | 90d cost | New destination |
|---|---|---|---:|---|
| New Traffic Campaign with recommended settings | New Traffic Ad with recommended settings | `funsculpting.com/` (homepage) | 250.01 | `https://funsculpting.com/providers-v2/?utm_source=meta&utm_medium=paid_social&utm_campaign=new_traffic&utm_content=homepage_ad` |
| FS_Demo_2026Q2_Tonight_Launch | FS_GLP1_Ad3_Quote - Copy | `funsculpting.com/for-providers/` | 313.67 | `https://funsculpting.com/providers-v2/?utm_source=meta&utm_medium=paid_social&utm_campaign=fs_demo_tonight_launch&utm_content=fs_glp1_ad3_quote` |
| FS_Demo_2026Q2_Tonight_Launch | FS_GLP1_Ad3_Quote | `funsculpting.com/for-providers/` | 1.55 | `…&utm_campaign=fs_demo_tonight_launch&utm_content=fs_glp1_ad3_quote` |
| FS_Demo_2026Q2_Tonight_Launch | FS_TRT_Ad3_Quote | `funsculpting.com/for-providers/?utm_source=meta&utm_medium=paid&utm_campaign=fs_demo&utm_content=ad3_quote` | 1.08 | `…&utm_campaign=fs_demo_tonight_launch&utm_content=fs_trt_ad3_quote` (also normalizes the old `utm_medium=paid` → `paid_social`) |

### 2b. Wrong-Calendly-slug ad — repoint to the page (let the inline scheduler book)

| Campaign | Ad name | Current destination | 90d cost | New destination |
|---|---|---|---:|---|
| FunSculpting - Provider Leads - Jun 2026 | New Leads Ad | `calendly.com/d/cx5d-v5w-9gn/funsculpting-demo?utm_id=…` (wrong slug) | 481.14 | `https://funsculpting.com/providers-v2/?utm_source=meta&utm_medium=paid_social&utm_campaign=provider_leads_jun2026&utm_content=new_leads_ad` |

> The live slug here is `funsculpting-demo`. Canonical is `practice-walkthrough`.
> Pointing the ad at `/providers-v2/` lets the page's inline scheduler handle the
> booking on the canonical slug, so the bad slug stops being hit directly.

### 2c. Facebook reels with **no website link** (campaign `FunSculpting_Sales_2026Q2_CalendlyBooking`, plus one in `FS_Demo…`)

Eight reel ads currently link only to `facebook.com/reel/…` (no outbound site link):

| Ad set | Reel | 90d cost |
|---|---|---:|
| FS_UntappedPatients_Cold_v2_invitee | reel/3330448917129306 | 644.95 |
| FS_BundleMultiplier_Cold_v1 | reel/1758967992129302 | 625.51 |
| FS_UntappedPatients_Cold_v1 | reel/2060741041465636 | 252.71 |
| FS_BundleMultiplier_Cold_v2_invitee | reel/989227514029742 | 128.92 |
| FS_UntappedPatients_Cold_v1_px1867 | reel/1659987138415675 | 49.06 |
| FS_BundleMultiplier_Cold_v1 | reel/28361940053407774 | 36.20 |
| FS_BundleMultiplier_Cold_v1_px1867 | reel/3135739953302620 | 26.76 |
| FS_AntiCoolSculpting_Cold_v1 | reel/1363544418996733 | 3.28 |

**Decision required (pick one, per ad):**
1. **Make them lead drivers** — add a website-link CTA → `https://funsculpting.com/providers-v2/?utm_source=meta&utm_medium=paid_social&utm_campaign=calendlybooking_q2&utm_content={ad_name}`, **or**
2. **Reclassify as awareness-only** — leave as reels but stop counting them as lead drivers in reporting (they carry ~$1,167/90d that currently produces no on-site bookings).

This is a strategy call, not a mechanical repoint — flag to the human/Manus owner.

### Pixel / event check (Meta)
Confirm the Meta Pixel on these ads is `1476485404279440` and the `Lead`/`Schedule`
event fires on `/providers-v2/` (reported wired via Astra hook 4337). Verify in Meta
Events Manager per the runbook.

---

## Coverage summary

| Source | Live ads found | Mapped to `/providers-v2/` |
|---|---:|---:|
| Google Ads (ISS) | 7 | 7 |
| Meta — direct link | 4 | 4 |
| Meta — wrong Calendly slug | 1 | 1 |
| Meta — reels (no link) | 8 | decision required (CTA vs awareness) |

No ad in either account currently points at `/providers-v2/` — consistent with the brief.
