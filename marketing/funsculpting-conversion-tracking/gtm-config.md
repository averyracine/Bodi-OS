# GTM configuration — FunSculpting Google Ads conversions

Container: **GTM-MP5XDZ** · GA4 already live (**G-BCQCHJNLRB**) · dataLayer present.
No Google Ads conversion tag existed before this work.

> Build everything in a **GTM workspace** and keep it in **Preview** until verified.
> Do **not** Submit/Publish until the runbook below passes.

## Placeholders to fill (create in Google Ads → Goals → Conversions → *Website*)

Create **2 conversion actions**, then drop the values in the tag table:

| Placeholder | What it is | Notes |
|---|---|---|
| `{{Conversion ID}}` | Google Ads Conversion ID `AW-XXXXXXXXXX` (use number only in GTM) | Same for both tags |
| `{{demo label}}` | Conversion **label** for Demo Booked | Category *Submit lead form*, Count **One**, mark **Primary** (optimization goal) |
| `{{financing label}}` | Conversion **label** for Financing Click | Count **One**, **Secondary / observation** — it's a click, not a funded app |

## 1. Conversion Linker (required, once)
- Tag type: **Google Ads Conversion Linker**
- Trigger: **All Pages**
- Name: `Google Ads - Conversion Linker`
- (Persists `gclid` to a first-party cookie. GA4 base tag already loads via GTM, so no extra Google tag needed.)

## 2. Custom Event triggers
| Trigger name | Event name |
|---|---|
| `CE - demo_booked` | `demo_booked` |
| `CE - financing_click` | `financing_click` |

## 3. Google Ads Conversion Tracking tags
| Tag name | Conversion ID | Conversion Label | Trigger | Ads count/role |
|---|---|---|---|---|
| `Ads - Demo Booked (PRIMARY)` | `{{Conversion ID}}` | `{{demo label}}` | `CE - demo_booked` | One · **Primary** |
| `Ads - Financing Click` | `{{Conversion ID}}` | `{{financing label}}` | `CE - financing_click` | One · **Secondary/observation** |

Optional: a **GA4 Event** tag on a `CE - calculate_revenue` trigger (event `calculate_revenue`) for ROI-calculator engagement in GA4 — **no** Ads tag.

## Verification runbook (GTM Preview + Tag Assistant / Network tab; test desktop + phone)
1. **Calendly:** click each of the 5 CTAs → popup opens, **no** `demo_booked` yet. Complete a booking → `demo_booked` fires **once**, `Ads - Demo Booked` = Fired, one `googleadservices…/pagead/conversion/` hit. Open + close without booking → nothing.
2. **Financing:** click "Apply for Financing" → `financing_click` fires once, Ads tag Fired, **then** browser proceeds to `app.taycor.com` (~0.35s same-tab; instant if new tab). Confirm the pixel hit appears in Network before navigation.
3. **No double-fire:** rapid re-clicks / rebooking → single fire each (in-page flags + Count:One backstop).
4. **Mobile:** repeat both on a real phone.
5. Publish the GTM version once Preview passes.
