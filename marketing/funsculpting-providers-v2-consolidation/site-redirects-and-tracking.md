# Site / redirects / tracking (Task 3)

WordPress site (Kadence + Elementor + WPCode). All steps below are **WPCode snippet
+ GTM/GA4 + Calendly** changes — do **not** edit core or parent-theme files.

> Environment note: this package was prepared in a headless session whose egress
> policy **blocks `funsculpting.com` and `calendly.com`**, so the live page, the
> redirect, the inline scheduler, and a real test booking **could not be checked
> from here**. Each verification step is written for a human (or a session with
> site access) to run. See `verification-runbook.md`.

---

## 1. 301 redirect `/for-providers/` → `/providers-v2/`

**Sequencing (hard rule):** apply this **only after** every Meta + Google ad that
points at `/for-providers/` has been repointed (see `routing-before-after.md` §2a).
Today **3 live Meta ads** still target `/for-providers/` — if you 301 first, those
ads briefly chain through a redirect (and any cached/aggressive setups can 404).
Repoint ads → confirm in Events Manager/Ads → then add the redirect.

Preserve any query string (so UTMs/gclid survive the hop). Options, simplest first:

**A. Redirection plugin (preferred, no code):**
- Source: `/for-providers/` → Target: `/providers-v2/`
- Type: **301 Permanent**, "Ignore & pass query parameters" / regex passthrough enabled.

**B. WPCode PHP snippet** (run everywhere, server-side), if no redirect plugin:
```php
add_action( 'template_redirect', function () {
    $req = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '';
    $path = strtok( $req, '?' );
    if ( rtrim( $path, '/' ) === '/for-providers' ) {
        $qs = isset( $_SERVER['QUERY_STRING'] ) && $_SERVER['QUERY_STRING'] !== ''
            ? '?' . $_SERVER['QUERY_STRING'] : '';
        wp_safe_redirect( home_url( '/providers-v2/' ) . $qs, 301 );
        exit;
    }
}, 1 );
```

After publishing: `curl -I https://funsculpting.com/for-providers/?utm_source=test`
should return `301` with `Location: …/providers-v2/?utm_source=test`.

---

## 2. Inline Calendly on `/providers-v2/` — mobile check

Confirm the embedded "Schedule a Practice Walkthrough" scheduler:
- Loads on mobile (iframe is responsive; no fixed pixel height that clips the widget).
- Uses the **canonical slug** `https://calendly.com/d/cx5d-v5w-9gn/practice-walkthrough`
  (not `funsculpting-demo`).
- Is reachable without horizontal scroll on a 360–390px viewport.

If the inline embed sets a fixed height, prefer Calendly's responsive inline-widget
(`data-url` + `min-width:320px; height:700px` with the official `inline` embed) so the
booking is reachable on phones.

---

## 3. Analytics events — confirm end-to-end (do not assume)

All reported wired in **Astra hook 4337**. Verify each actually fires:

| Event | Where to confirm |
|---|---|
| `calendly_open` | GA4 DebugView / Realtime on `/providers-v2/` |
| `booking_completed` | GA4 + fires Meta `Schedule` + Google Ads conversion |
| `scroll_depth` | GA4 DebugView |
| `cta_click` | GA4 DebugView |
| Meta `Lead` / `Schedule` | Meta Events Manager → Test Events (pixel `1476485404279440`) |
| Google Ads conversion | Tag Assistant — `AW-18016354641/Ulx2CIzryb4cENGC745D` on booking |

**Critical (carry over from the prior tracking package):** the booking conversion must
fire on **completed booking only** (`calendly.event_scheduled`), never on popup/inline
open. Verify a real test booking fires it exactly **once**.

**Conversion-action audit (ties to the Google premise correction):** Google ad
`800434905338` already shows **40 conversions** while pointing at `/funsculpting/`.
Before repointing, open Google Ads → Goals → Conversions and identify which action
those belong to and on which page/event it fires. The goal of consolidation is to
move that working conversion onto `/providers-v2/` — verify the same action fires
there post-repoint so you don't lose attribution that's currently working.

---

## 4. GA4 dedupe — two properties currently fire

Two GA4 measurement IDs are reported live: **`G-BCQCHJNLRB`** and **`G-ZE1Z508V14`**.
Running both double-counts sessions/events and splits reporting.

- Decide the **system-of-record** property. `G-BCQCHJNLRB` is the one referenced in the
  existing conversion-tracking package (`../funsculpting-conversion-tracking/`), so keep
  that one unless the business says otherwise.
- Remove the second tag (whichever is duplicate) from its source — GTM tag, WPCode
  snippet, or theme/Elementor header. Find where each ID is injected before removing.
- Re-verify in GA4 Realtime that each event fires **once** after dedupe.

> Keep one GA4 property; keep the canonical Calendly slug `practice-walkthrough`
> everywhere.
