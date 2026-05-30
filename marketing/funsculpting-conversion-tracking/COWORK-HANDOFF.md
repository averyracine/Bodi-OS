# FunSculpting conversion tracking — execution brief (source of truth)

**Goal:** make Google Ads able to measure and optimize for FunSculpting demo bookings.
This brief reflects **what was actually built**, which differs from the original GTM-based plan.

> **Why the approach changed (read this first):**
> The original plan was to create *manual* Google Ads conversion actions (a `AW-…`
> Conversion ID + per-action labels) and fire them from **GTM** "Google Ads Conversion
> Tracking" tags on custom-event triggers. That path was abandoned during setup for two
> concrete reasons:
> 1. **The Google Ads account is GA4-linked.** Its conversion wizard only offers **GA4 key
>    events** as the website data source — it never exposes the manual `AW-` + label path.
>    So the conversions were created as **GA4 key events imported into Ads**, not manual tags.
> 2. **No signed-in Google account had access to the GTM container (GTM-MP5XDZ)** — GTM
>    couldn't be configured at all. But the live page loads the Google tag directly
>    (`gtag/js?id=G-BCQCHJNLRB`), so `window.gtag` is available. Events are therefore fired
>    **directly via `gtag`, with no GTM.**

**Environment (live, do not recreate):** WordPress (Kadence + Elementor + **WPCode**).
Landing page `https://inspiredsurgicalsupplies.com/funsculpting/`. **GA4 G-BCQCHJNLRB** loads
on the page via the global site tag. **GTM-MP5XDZ exists but is not used** (no access).

**Guardrails:** WPCode snippet only — **no core or parent/child-theme edits**. Financing is
**cross-domain** (`app.taycor.com`), so only the **outbound click** is measurable, never the
funded application. The CME waitlist page (`/cme-physician-training/`) is **still parked**
(custom JS-handled HTML forms, separate task).

---

## Step 1 — Revoke any leaked token (GitHub)
Earlier a fine-grained PAT (`github_pat_11BTRV5K…`) was pasted into a chat transcript. If it
still exists, delete it: github.com → **Settings → Developer settings → Personal access
tokens**. *(If it's already absent/revoked, this step is done — nothing to do.)*

## Step 2 — Conversions (Google Ads, GA4 key events)
Account: **Inspired Surgical Supplies (479-712-3095)**, GA4-linked. Both conversions were
created as **GA4 key events imported into Google Ads** (the only path this account exposes):

**`demo_booked` — PRIMARY**
- Category: **Submit lead form**
- Goal: **Primary** (drives bidding)
- Count: **One**
- Click-through window: **30 days** · Engaged-view: **3 days**
- Attribution: **Data-driven** · Value: **none**

**`financing_click` — observation-only**
- Category: **Outbound click**
- Count: **One** · Click-through window: **30 days** · Value: **none**
- **Observation-only mechanism:** in this GA4-linked account the per-action *Secondary*
  radio was disabled, so "secondary" is achieved by turning the **account-default toggle for
  the "Outbound click" goal OFF**. Result: **0 campaigns optimize toward it** while it still
  records for reporting.

**Notes / expected states:**
- Campaign bidding is currently **Maximize clicks**, so **no conversion-based bidding happens
  yet**. Planned switch to **Maximize Conversions** after ~**15–30** conversions accumulate.
- Both GA4 events show **Inactive** in Ads until live data flows — **expected**, not a fault.

## No GTM — events fire via direct `gtag`
There is **no GTM configuration** in this build. Because (a) the account is GA4-linked and
the conversions are GA4 key events, and (b) no one had GTM container access, the events are
sent **straight through the page's existing `gtag`** (`G-BCQCHJNLRB`). GA4 then forwards the
key events to Google Ads. No Conversion Linker, no GTM tags/triggers, no `AW-` IDs are
involved. *(The old GTM spec is preserved as `gtm-config.md` with a SUPERSEDED banner.)*

## Step 4 — Site snippet (WPCode, direct gtag)
Source file: **`wpcode-funsculpting-gtag.html`** (this folder).
- WordPress → **WPCode → Add Snippet → HTML Snippet**.
- Paste the full contents of `wpcode-funsculpting-gtag.html`.
- Location: **Site-Wide Footer** · Smart Conditional Logic: **Page URL contains
  `/funsculpting/`** · **Active**.
- The snippet self-guards to `/funsculpting/` paths, converts Calendly links to on-page
  popups, and fires the three GA4 events via `gtag`: `demo_booked` (Calendly
  `event_scheduled`), `financing_click` (outbound `taycor.com`, holding same-tab navigation
  ~350ms so the event sends first), and optional `calculate_revenue` (ROI CTA). It is
  idempotent — guards against double-injection, double-bind, and double-fire.

*(The previous dataLayer/GTM snippet `wpcode-funsculpting-footer.html` is deprecated and kept
for history only — do not install it.)*

## Step 5 — Verify (GA4 Realtime / DebugView, not GTM)
On `/funsculpting/`, with the snippet active:
1. **GA4 Realtime / DebugView:** trigger each action and confirm the event appears —
   `demo_booked`, `financing_click`, `calculate_revenue`. (DebugView is the precise check;
   use the GA Debugger extension or `?_dbg=1`-style debug mode.)
2. **Scoping:** confirm events fire **only** on `/funsculpting/` (load another page and verify
   nothing fires).
3. **Single-fire:** rapid re-clicks / rebooking → **one** event per genuine action (the
   snippet's time/flag guards + GA4 key-event "Count: one" backstop).
4. **Desktop + mobile:** repeat on a real phone.
5. **End-to-end:** complete **one real Calendly booking** and confirm `demo_booked` shows in
   GA4 Realtime (and, after processing latency, in the Ads conversion's status). Opening the
   Calendly popup **without** booking must **not** fire `demo_booked`.

Once GA4 shows the events, the Ads key events flip from **Inactive** to recording. After
~15–30 conversions, switch the campaign to **Maximize Conversions** to begin optimizing
toward `demo_booked`.
