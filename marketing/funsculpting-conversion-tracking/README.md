# FunSculpting — Google Ads conversion tracking

Measures Google Ads conversions on the FunSculpting landing page
(`/funsculpting/` on inspiredsurgicalsupplies.com — WordPress: Kadence + Elementor + WPCode).
The gap this closes: Google Ads couldn't see or optimize for demo bookings.

> **Implementation note — the approach changed during execution.** The original plan
> (manual `AW-` Google Ads conversion actions fired from **GTM** tags) was dropped because:
> 1. the Ads account is **GA4-linked**, so its wizard only offers **GA4 key events** (no
>    manual `AW-` + label path), and
> 2. **no signed-in account had GTM access** (container GTM-MP5XDZ).
>
> What shipped instead: conversions are **GA4 key events imported into Ads**, fired **directly
> through the page's `gtag` (G-BCQCHJNLRB)** from a WPCode snippet — **no GTM, no `AW-` IDs.**

## Files
| File | Status | Purpose |
|---|---|---|
| `wpcode-funsculpting-gtag.html` | ✅ **current source of truth** | WPCode footer snippet; fires GA4 events via direct `gtag`. |
| `COWORK-HANDOFF.md` | ✅ current | Full execution brief (conversions, snippet, verification). |
| `gtm-config.md` | ⛔ superseded | Old GTM plan, kept for history (banner at top). |
| `wpcode-funsculpting-footer.html` | ⛔ deprecated | Old dataLayer/GTM snippet — do not install. |

## Conversions (GA4 key events imported into Google Ads)
Account: **Inspired Surgical Supplies (479-712-3095)**.

| Event | Role | Category | Settings |
|---|---|---|---|
| `demo_booked` | **PRIMARY** (drives bidding) | Submit lead form | Count One · CTW 30d · engaged-view 3d · data-driven · no value |
| `financing_click` | Observation-only | Outbound click | Count One · CTW 30d · no value · account-default goal toggle **OFF** so 0 campaigns optimize toward it |
| `calculate_revenue` | Optional engagement | — | GA4 event only; not an Ads conversion |

How tracking flows: WPCode snippet → `gtag('event', …)` → **GA4 (G-BCQCHJNLRB)** → GA4 key
events imported into **Google Ads**. No GTM in the path.

`demo_booked` = completed Calendly booking (`calendly.event_scheduled`); the snippet converts
all Calendly CTAs to on-page popups so the booking event is catchable. `financing_click` =
outbound click to `app.taycor.com` (cross-domain → click is intent, not a funded application).

## Status / what's left
- [x] GA4 key-event conversions created in Ads (`demo_booked` primary, `financing_click` observation)
- [x] Direct-gtag WPCode snippet written (`wpcode-funsculpting-gtag.html`)
- [ ] Snippet installed & active in WPCode (Site-Wide Footer, URL contains `/funsculpting/`)
- [ ] Verified in **GA4 Realtime / DebugView** (events fire once, scoped to `/funsculpting/`, desktop + mobile, one real Calendly booking)
- [ ] After ~15–30 conversions, switch campaign from **Maximize clicks** → **Maximize Conversions**

Both Ads key events read **Inactive** until live data flows — expected.

## Parked: CME waitlist page
`/cme-physician-training/` uses custom JS-handled HTML forms (`.cme-card`, `.cme-state-info`) —
not Gravity/CF7. To track later, fire a `waitlist_submit` GA4 event from that page's
submit-success branch. Separate task.
