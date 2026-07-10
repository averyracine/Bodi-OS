---
name: ad-copy
description: Write and variate high-converting ad copy (headlines, descriptions, primary text, CTAs) for Google Search/PMax and Meta (Facebook/Instagram) ads across the Bodi-OS brands — funsculpting.com, inspiredsurgicalsupplies.com, and inspiringphysicians.com. Use whenever the task is to create, rewrite, A/B-vary, or refresh ad text, ad headlines, ad descriptions, RSA assets, or campaign messaging. Pairs with the nano-banana (image) and veo-video (video) skills to assemble complete creatives.
---

# Ad copy

Produce ready-to-ship, on-brand ad copy that fits each platform's character
limits and each brand's audience. Output should be paste-ready or pushable to
the platform (via the Windsor.ai `google_ads` write actions for responsive
search ads).

## Brand voice & audience

- **funsculpting.com** — B2C body contouring / aesthetics. Audience: local
  consumers wanting non-invasive fat reduction / body sculpting. Tone: warm,
  confident, results-driven, aspirational but honest. Emphasize outcomes,
  comfort, no downtime, financing/consultation offers. Avoid medical claims that
  overpromise; stay compliant (no guaranteed results).
- **inspiredsurgicalsupplies.com** — B2B e-commerce, surgical/medical supplies.
  Audience: clinics, surgery centers, procurement. Tone: precise, trustworthy,
  value + reliability. Emphasize quality, compliance/certifications, bulk
  pricing, fast fulfillment, account terms.
- **inspiringphysicians.com** — physician audience (education/coaching/community).
  Tone: credible, peer-to-peer, respectful of clinicians' time. Emphasize career
  growth, CME/value, community, avoiding burnout. No hype.

## Platform specs (write to these limits)

**Google Responsive Search Ads (RSA)**
- Headlines: up to 15, each ≤ 30 chars. Provide 12–15.
- Descriptions: up to 4, each ≤ 90 chars. Provide 4.
- Pin sparingly; make headlines mix benefit / offer / brand / CTA.

**Google Performance Max asset group**
- Headlines ≤ 30 chars (5+), long headlines ≤ 90 chars (5), descriptions ≤ 90
  chars (1 short ≤ 60 + up to 4), business name, CTA.

**Meta (Facebook/Instagram)**
- Primary text: ~125 chars before "See more" (write 3 variants, 1 short).
- Headline ≤ 40 chars. Description ≤ 30 chars. Provide 3–5 of each.

## Workflow

1. Confirm the brand, the offer/landing page, the target audience/segment, and
   the campaign goal (leads, purchases, awareness). Infer from context; ask only
   if genuinely missing.
2. Draft a message angle set (benefit, pain/relief, offer, social proof,
   urgency) — don't write 15 headlines on one angle.
3. Write to the exact limits above. Keep a clear CTA and one core promise per ad.
4. Deliver as a table grouped by asset type, ready to paste. Note any pins.
5. If the user wants it live, offer to push an RSA via Windsor.ai
   `execute_action` (`google_ads`) — confirm the exact change first.
6. Offer to generate matching visuals with `nano-banana` / `veo-video`.

## Guidance

- One promise per ad; lead with the benefit, not the brand.
- Mirror landing-page language for message match (Quality Score + conversion).
- Include the offer/CTA in at least a few headlines.
- Compliance: FunSculpting — no guaranteed medical outcomes; ISS — accurate
  product/regulatory claims only; physicians — no unverifiable stats.
- Always give variants for A/B testing; label the angle of each set.
