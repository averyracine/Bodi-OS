# FunSculpting — Google Ads conversion tracking

Implementation package for measuring Google Ads conversions on the FunSculpting
provider landing page. The site is WordPress (Kadence + Elementor + WPCode);
GTM (**GTM-MP5XDZ**) and GA4 (**G-BCQCHJNLRB**) are already live with a dataLayer.
The gap this fixes: **no Google Ads conversion tag existed**, so Ads couldn't
optimize for leads.

> These files are deployment artifacts to paste into **WordPress (WPCode)** and
> **Google Tag Manager**. They are not application code — kept in their own
> folder to stay self-contained.

## Files
| File | Purpose |
|---|---|
| `wpcode-funsculpting-footer.html` | WPCode footer snippet — pushes dataLayer events on real completions |
| `gtm-config.md` | GTM tags/triggers + the Conversion ID/label placeholders + verification runbook |

## Conversions on `/funsculpting/` (verified against the live page)
| Event | Priority | Trigger | Mechanism |
|---|---|---|---|
| `demo_booked` | **PRIMARY** | Calendly booking **completed** | `calendly.event_scheduled` postMessage (links converted to on-page popups) |
| `financing_click` | Secondary | "Apply for Financing" click | Outbound click to `app.taycor.com` (cross-domain → click = intent, not funded app) |
| `calculate_revenue` | Optional | `#fs-roi` anchor click | Engagement only — **not** an Ads conversion |

Notes from live inspection: all 5 "Book Demo" CTAs were plain Calendly links
(no widget) — the snippet converts every `calendly.com/inspiredsurgical` link to
a popup so the booking event is catchable. No Gravity Forms / CF7 instances
render on this page, so form-submit tracking was intentionally dropped.

## Status / what's left
- [x] WPCode footer snippet — final, paste-ready
- [x] GTM config (Conversion Linker + 2 Custom Event triggers + 2 Ads tags) — final
- [x] Verification runbook
- [ ] **Blocker:** fill placeholders — **1 Conversion ID + 2 labels** (Demo Booked = Primary, Financing Click = Secondary). See `gtm-config.md`.
- [ ] Run the GTM Preview / Tag Assistant verification, then publish GTM.

## Parked (separate, lower priority): CME waitlist page
`/cme-physician-training/` uses **custom HTML forms** (`.cme-card`, `.cme-state-info`)
handled in JS — **not** Gravity/CF7, so the form-submit events don't apply. To
track it later, hook the page's custom submit-handler success branch (or an
existing `dataLayer.push`/custom DOM event) into a page-scoped `waitlist_submit`
event + a third Ads conversion.

## Environment caveat
This package was prepared in a headless Claude Code session with no browser and
no WordPress/GTM access, so the live Tag Assistant verification (Step 4) must be
run by a human. Findings about the live page came from manual inspection reported
during the session.
