# Manual Tesla validation checklist

**Target vehicle:** Avery's 2023 Model X Plaid. **Status: NOT STARTED. Nothing below has been tested.**

Do every test with the vehicle **in Park**. Don't advertise compatibility or accept subscriptions based on a service working until it's marked ✅ here with a date and software version. Re-test after each vehicle software update.

Legend: ⬜ untested · ✅ works · ⚠️ partial (add notes) · ❌ doesn't work

## 0. Environment record

| Item | Value |
| --- | --- |
| Test date | ⬜ |
| Vehicle software version (Controls → Software) | ⬜ |
| Browser user agent (`navigator.userAgent`, shown on a debug page) | ⬜ |
| Chromium/engine version, if visible | ⬜ |
| Connectivity (Wi-Fi SSID type / LTE / Premium Connectivity) | ⬜ |
| Deployed URL + commit tested | ⬜ |

## 1. Viewport and input

| Check | Result | Notes |
| --- | --- | --- |
| Actual usable viewport (`innerWidth × innerHeight`) with the browser chrome visible | ⬜ | Dev used 1280×800 and 1920×1080. Those are not claims about the car. |
| Viewport in the browser's fullscreen mode, if offered | ⬜ | |
| `devicePixelRatio` | ⬜ | |
| 56px touch targets comfortable from the driver's seat | ⬜ | |
| Dock fully visible, not covered by the car UI | ⬜ | |
| Text legible at arm's length (Graphite / Midnight / High contrast) | ⬜ | |
| On-screen keyboard covers inputs? (search, custom link, scratchpad) | ⬜ | |
| Drag-to-reorder works with touch (Move buttons are the fallback) | ⬜ | |
| `prefers-reduced-motion` reported | ⬜ | |

## 2. Storage and sessions

| Check | Result | Notes |
| --- | --- | --- |
| localStorage persists after closing the browser | ⬜ | |
| localStorage persists after the car sleeps overnight | ⬜ | |
| localStorage persists after a vehicle software update | ⬜ | |
| Supabase session cookie persists (sign in on phone, pair car, sleep, wake) | ⬜ | |
| `tcc_device` httpOnly cookie persists across sleep | ⬜ | |
| Third-party cookies needed by services (blocked or allowed?) | ⬜ | |
| sessionStorage behavior (Focus timer restore) | ⬜ | |

## 3. Pairing

| Check | Result | Notes |
| --- | --- | --- |
| `/pair/car` shows code + QR readable from the phone | ⬜ | |
| QR scan opens `/pair` on phone; sign-in via magic link works | ⬜ | |
| Approve → car finishes within ~5s | ⬜ | |
| Code expires after 5 min (car shows "expired") | ⬜ | |
| Reusing a code fails | ⬜ | |
| Revoking in phone Settings stops sync on the car | ⬜ | |

## 4. Navigation behavior

| Check | Result | Notes |
| --- | --- | --- |
| `target=_blank` opens a new tab, or replaces the page? | ⬜ | |
| Can the user return to the dashboard easily (back / tabs)? | ⬜ | |
| "This tab" launch mode returns via Back | ⬜ | |
| Popups or `window.open` blocked? (we don't use them) | ⬜ | |

## 5. Per-service results

For each service, record: page loads · login works · playback starts · audio plays · fullscreen available · survives tab switch · notes. Fill these in only from real tests.

| Service | Loads | Login | Playback | Audio | Fullscreen | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| YouTube | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Netflix | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | DRM: may differ from desktop |
| Disney+ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | DRM |
| Prime Video | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | DRM |
| Twitch | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Plex | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Spotify (open.spotify.com) | ⬜ | ⬜ | ⬜ | ⬜ | n/a | Web player may block unsupported browsers |
| Apple Music | ⬜ | ⬜ | ⬜ | ⬜ | n/a | |
| YouTube Music | ⬜ | ⬜ | ⬜ | ⬜ | n/a | |
| Xbox Cloud Gaming | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Needs controller? |
| GeForce NOW | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Google Calendar | ⬜ | ⬜ | n/a | n/a | n/a | |
| Google Docs | ⬜ | ⬜ | n/a | n/a | n/a | |
| Notion | ⬜ | ⬜ | n/a | n/a | n/a | |

## 6. Resilience

| Check | Result | Notes |
| --- | --- | --- |
| Resume after the browser is backgrounded (switch to another car app and back) | ⬜ | |
| Resume after the car sleeps and wakes | ⬜ | |
| Focus timer stays accurate after suspension | ⬜ | |
| Network loss: "Offline" badge appears; tiles warn before launching | ⬜ | |
| Network restore: badge clears; Settings "Try again" works | ⬜ | |
| Audio behavior when the car's own media is playing | ⬜ | |
| Behavior when the car is shifted out of Park (observe only; we don't detect or block it) | ⬜ | Record what the vehicle itself does. |

## 7. Sign-off

- [ ] All sections above have results recorded
- [ ] Landing copy and the catalog's `teslaStatus` updated to match results
- [ ] Re-test plan written for the next vehicle software update
