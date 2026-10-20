# FunSculpting Provider Ad: Claim Verification (pre-launch)

Every factual or regulatory-sensitive statement in the cut, who has to confirm it, and the fallback if it can't be confirmed. **Don't launch until each row is signed off.**

| # | Claim (as spoken / shown) | Where | Risk | Verify against | If not confirmed |
|---|---|---|---|---|---|
| 1 | "Our program includes **hands-on training**…" | Avery 1747, 23.7–31.1 s; captions | Offer claim | Provider contract / onboarding SOW | Drop the `avery_prog` segment and the 90-DAY overlay |
| 2 | "…and **marketing support for the first 90 days**" + overlay **90-DAY MARKETING SUPPORT** | 1747; overlay | Offer claim, specific duration | Contract: term, scope and what "marketing support" includes | Change the overlay to "MARKETING SUPPORT" (edit `edl.json`), or drop the segment |
| 3 | "…**implementation guidance**" | 1747 | Offer claim | Onboarding SOW | Same as row 1 |
| 4 | "physician-based body contouring and **regenerative medicine platform**" | Mike 1744 | **High.** Meta's health/medical policy and FDA/FTC sensitivity around "regenerative medicine" | Device clearance/indications; legal | **Recommended: remove `mike_what` from the flagship sequence** (1745 already covers what it is) |
| 5 | "…helps clinics… **add additional revenues**" / "add **revenue streams**" | 1744, 1729 | Implied earnings claim | Keep it framed as opportunity and evaluation, not outcome | Fine as long as there are no numbers, ROI or "guaranteed" language. Don't add any. |
| 6 | "we're delivering a **business in a box**… pre-op to post-op, and all the marketing" | Mike 1745 | Scope claim | Contract deliverables (pre-/post-op protocols, marketing assets) | Trim to "business in a box … front end to back end" (edit `end_text`) |
| 7 | "**cash-pay** service line" + overlay NEW CASH-PAY SERVICE LINE? | 1746, hook overlay | Low (it's a question). Make sure the treatment isn't billed to insurance anywhere. | Ops | Change the overlay to "NEW SERVICE LINE?" |
| 8 | "Schedule the **practice growth call**" / end card "BOOK A PRIVATE PROVIDER WALKTHROUGH" | 1751, end card | Consistency | The landing page and Calendly event names must match | Rename the end card in `edl.json → end_card` |
| 9 | Speaker identity, "Dr. Dean" (seated 1725–1729, standing 1733–1738) | Rationale/EDL only, nothing on screen | Misattribution | **Avery to confirm the standing speaker is Dr. Dean.** Also confirm his credential if a "Dr." super is added later. | Leave name supers off (current state) |
| 10 | Landing URL on the end card: `inspiredsurgicalsupplies.com/funsculpting` | End card | Destination accuracy | Live page and the ad's destination URL | Change `brand.url` in `edl.json` (empty string hides it) |

## Imagery / policy checks
- [ ] No before/after or body imagery anywhere. Only the brochure **cover** (IMG_1752, 0–2 s) is used. Scrub the 1752 cutaway and the end-card background frame to confirm no inside page is visible.
- [ ] No implied guaranteed outcome or income anywhere in captions, overlays or primary text.
- [ ] Ad copy (primary text/headline written in Ads Manager) follows the same rules as the video.
- [ ] Music: none used. If a track is added, keep the licence on file.
- [ ] Meta special ad category: not housing/credit/employment. Health and wellness targeting restrictions still apply; target by job title and interest (physicians, practice owners), not health conditions.
