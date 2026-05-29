# Cowork handoff — FunSculpting Google Ads conversion tracking

**Goal:** make Google Ads able to measure and optimize for FunSculpting demo bookings.
All decisions are already made below — this is **execution only**. Source files live in this
same folder: `wpcode-funsculpting-footer.html` (the snippet) and `gtm-config.md` (full GTM spec).

**Environment (already live, do not recreate):**
- WordPress: Kadence + Elementor + **WPCode** installed.
- Landing page: `https://inspiredsurgicalsupplies.com/funsculpting/`
- **GTM-MP5XDZ** + **GA4 G-BCQCHJNLRB** + a dataLayer are already running. There was **no Google Ads conversion tag** — that is the gap to close.

**Guardrails (follow exactly):**
- Do **not** edit core or parent-theme files. Use **WPCode snippets + GTM only**.
- Keep GTM in **Preview** — **do NOT Publish** until a human approves.
- Don't change DNS, plugins, or hosting settings.
- The Calendly conversion must fire only on a **completed booking**, never on popup open.

---

## Step 1 — Revoke a leaked token (GitHub)
A fine-grained PAT starting `github_pat_11BTRV5K…` was exposed in a chat transcript.
Go to github.com → **Settings → Developer settings → Personal access tokens → Fine-grained tokens** → delete that token. (Leave "bodi-os write token" intact.)

## Step 2 — Create 2 conversion actions (Google Ads)
Google Ads → **Goals → Conversions → + New conversion action → Website → Add manually**.
When asked how to install the tag, choose **Use Google Tag Manager**.

**Action A — `FunSculpting – Demo Booked` (PRIMARY)**
- Category: **Submit lead form**
- Value: don't use a value (optional flat proxy value if value-bidding later)
- Count: **One**
- Click-through window 30d · Engaged-view 3d · View-through 1d · Attribution: Data-driven
- Goal setting: **Primary** (Ads optimizes toward this)

**Action B — `FunSculpting – Financing Click` (SECONDARY)**
- Category: **Other** (it's an outbound intent click, not a verified application)
- Value: don't use a value
- Count: **One**
- Click-through window 30d · Attribution: Data-driven
- Goal setting: **Secondary** (observation only — must NOT drive bidding)

**Record and report back:** the **Conversion ID** (`AW-XXXXXXXXXX`, same for both) and each
action's **Conversion label**. You'll need them in Step 3.

## Step 3 — Configure GTM (container GTM-MP5XDZ)
Work in a new workspace. Build:

1. **Conversion Linker tag** → trigger **All Pages**. Name: `Google Ads - Conversion Linker`.
2. **Custom Event triggers:**
   - `CE - demo_booked` → Event name `demo_booked`
   - `CE - financing_click` → Event name `financing_click`
3. **Google Ads Conversion Tracking tags** (fill ID/label from Step 2):

   | Tag name | Conversion ID | Conversion Label | Trigger | Ads role |
   |---|---|---|---|---|
   | `Ads - Demo Booked (PRIMARY)` | `AW-__________` | `__________` | `CE - demo_booked` | Count One · Primary |
   | `Ads - Financing Click` | `AW-__________` | `__________` | `CE - financing_click` | Count One · Secondary |

   *(Optional: a GA4 Event tag on a `CE - calculate_revenue` trigger for ROI-calculator engagement — no Ads tag.)*

## Step 4 — Add the WPCode snippet (WordPress)
WordPress admin → **WPCode → Add Snippet → Code Type: HTML Snippet**.
- Paste the entire contents of `wpcode-funsculpting-footer.html` (in this folder).
- Location: **Site-Wide Footer**.
- Smart Conditional Logic: **Page URL contains `/funsculpting/`**.
- **Save & Activate.**

What the snippet does (already written, no edits needed): converts all 5 "Book Demo" Calendly
links to on-page popups and pushes `demo_booked` on `calendly.event_scheduled`; pushes
`financing_click` on outbound clicks to `app.taycor.com` (holding same-tab navigation ~350ms so
the pixel sends first); pushes optional `calculate_revenue` on the `#fs-roi` anchor. It is
idempotent (guards against double-bind and double-fire).

## Step 5 — Verify, then hand back for publish approval
GTM **Preview** on `/funsculpting/`, with Tag Assistant / Network tab, on **desktop and a phone**:
1. Open each Calendly CTA → popup opens, **no** `demo_booked` yet. Complete a real booking →
   `demo_booked` fires **once**, `Ads - Demo Booked` = Fired, one `googleadservices…/pagead/conversion/` hit.
2. Click "Apply for Financing" → `financing_click` fires once, then navigates to `app.taycor.com`.
3. Rapidly re-click / rebook → still a single fire each (no double-counting).
4. Confirm the same on mobile.

**Stop here.** Present the Preview results to a human for sign-off **before** publishing the GTM version.

---

## Notes / scope boundaries
- **No Gravity Forms / CF7 forms render on `/funsculpting/`**, so there is intentionally no form-submit tracking on this page.
- **Financing is cross-domain** (`app.taycor.com`): we can only catch the outbound click (intent), not the funded application — hence Secondary/observation.
- **Parked (separate task):** `/cme-physician-training/` waitlist uses custom HTML forms (`.cme-card`, `.cme-state-info`) handled in JS — not GF/CF7. To track later, hook that page's submit-success into a `waitlist_submit` dataLayer event + a third Ads conversion.
