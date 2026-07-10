---
name: marketing-report
description: Pull live marketing performance data (Google Ads, GA4, Meta/Facebook Ads, Google Search Console, etc.) and turn it into a clear report with spend, CPA, ROAS, conversions, and trends for the Bodi-OS brands — funsculpting.com, inspiredsurgicalsupplies.com, inspiringphysicians.com. Use whenever the task is to report on, analyze, summarize, or review ad/marketing/website performance, build a weekly/monthly dashboard, or check how campaigns or conversions are doing. Reads real data via the Supermetrics and Windsor.ai MCP servers — never estimates from memory.
---

# Marketing report

Produce accurate performance reports from **live data**. Two connected data
sources are available — prefer whichever the user has authenticated; they
overlap, so pick one per request:

- **Supermetrics** (`mcp__Supermetrics_Marketing_Analytics__*`) — 150+ sources.
- **Windsor.ai** (`mcp__Windsor_ai__*`) — 350+ connectors, read + write.

**Never fabricate numbers.** Only report values returned by the tools. If a
source needs auth, surface the login link the tool returns and stop.

## Supermetrics workflow

1. `data_source_discovery()` — list sources + auth status; pick one (e.g. Google
   Ads, GA4, Facebook Ads).
2. `data_source_discovery(ds_id=X)` — read its config (accounts, fields, report
   types, date-range requirement).
3. If `has_account_list` → `accounts_discovery(ds_id=X)` to get the right account
   for the brand. If `has_fields` → `field_discovery(ds_id=X)` for metric/dim IDs
   (use IDs, not display names).
4. `data_query(...)` then `get_async_query_results(schedule_id=...)` until ready.

## Windsor.ai workflow

1. `get_connectors()` → pick the platform. `get_fields(connector)` for available
   fields. `get_data(...)` to read metrics for the account/date range.

## What to report (per brand)

- **funsculpting.com** — lead-gen focus: spend, leads/conversions, cost/lead
  (CPA), conversion rate, top campaigns/ads, and (if GA4/GSC) traffic + booked
  consults. Tie back to the existing FunSculpting conversion tracking.
- **inspiredsurgicalsupplies.com** — e-commerce: spend, ROAS, revenue, AOV,
  purchases, top products/campaigns, cart/checkout funnel if available.
- **inspiringphysicians.com** — content/lead focus: traffic, sign-ups/leads,
  cost/lead, email or webinar conversions, top organic pages (GSC).

## Output format

1. **Headline KPIs** — a compact table: Spend, Conversions, CPA/ROAS, CTR, CVR,
   with period-over-period % change.
2. **Trend** — brief read on what moved and why (up/down, which campaign).
3. **Top & bottom performers** — best and worst campaigns/ads/products.
4. **Recommendations** — 3–5 concrete actions (shift budget, pause X, scale Y,
   fix landing page). Where a change is safe and the user confirms, offer to
   execute it via Windsor.ai write actions (`execute_action`).

## Guidance

- Always state the exact date range and account used.
- Label any estimate or partial-data caveat explicitly.
- Default to last 7 days vs. prior 7, unless asked otherwise.
- Keep it skimmable — tables + a short narrative, not a data dump.
