"""Market-research extraction.

Reads scored threads and pulls out:
  pain_points, objections, doctor_language, revenue_concerns, demand_signals,
  operational_concerns, competitor_mentions, pricing_expectations, buying_triggers

Then maps those into actionable assets:
  apollo_angles, website_copy_ideas, webinar_topics, faq_answers,
  objection_handling, social_content_ideas

Deterministic keyword buckets do the baseline extraction; Claude (if available)
enriches it. Either way you get usable output.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from typing import Any

from .llm import LLM
from .scoring import ScoredPost

# Signal phrase buckets for deterministic extraction.
_BUCKETS: dict[str, list[str]] = {
    "pain_points": [
        "patients churn", "lose patients", "no shows", "no-shows", "slow month",
        "margins are thin", "thin margins", "burned out", "burnout", "overhead",
        "can't compete", "commoditized", "race to the bottom", "declining reimbursement",
        "insurance", "reimbursement", "staffing", "hard to hire", "turnover",
    ],
    "objections": [
        "too expensive", "expensive", "not worth it", "gimmick", "snake oil",
        "doesn't work", "no evidence", "liability", "scope of practice",
        "already tried", "saturated", "competitive", "risk", "regret",
        "scam", "overhyped", "lease trap", "stuck with",
    ],
    "revenue_concerns": [
        "roi", "return on investment", "payback", "break even", "break-even",
        "profit margin", "margin", "cash flow", "revenue per", "per treatment",
        "monthly payment", "financing", "capital", "expensive equipment",
    ],
    "demand_signals": [
        "patients asking", "patients want", "demand for", "everyone wants",
        "keep getting asked", "waitlist", "booked out", "after glp", "after ozempic",
        "loose skin", "saggy", "tone", "stubborn fat", "post weight loss",
    ],
    "operational_concerns": [
        "who runs it", "staff", "training", "chair time", "room", "workflow",
        "physician time", "delegate", "medical director", "protocol",
        "downtime", "treatment time", "throughput",
    ],
    "competitor_mentions": [
        "coolsculpting", "emsculpt", "emsculpt neo", "sculpsure", "vanquish",
        "trusculpt", "morpheus", "evolve", "btl", "inmode", "kybella",
        "semaglutide", "tirzepatide", "ozempic", "wegovy", "zepbound", "mounjaro",
    ],
    "pricing_expectations": [
        "charge", "pricing", "price point", "per session", "package",
        "per treatment", "membership", "$", "cost per", "what do you charge",
    ],
    "buying_triggers": [
        "thinking of adding", "looking to add", "want to add", "should i add",
        "evaluating", "demo", "quote", "comparing", "narrowed down", "ready to buy",
        "expanding", "new service", "opening", "scaling",
    ],
}


def _scan(text: str, terms: list[str]) -> list[str]:
    low = text.lower()
    return [t for t in terms if t in low]


def extract_insights(scored: list[ScoredPost]) -> dict[str, Any]:
    """Deterministic extraction across all scored threads."""
    buckets: dict[str, Counter] = {k: Counter() for k in _BUCKETS}
    quotes: dict[str, list[str]] = {k: [] for k in _BUCKETS}
    language = Counter()

    for sp in scored:
        text = sp.post.text
        for bucket, terms in _BUCKETS.items():
            for hit in _scan(text, terms):
                buckets[bucket][hit] += 1
                snippet = _quote_around(text, hit)
                if snippet and len(quotes[bucket]) < 5:
                    quotes[bucket].append(f"r/{sp.post.subreddit}: “{snippet}”")
        # Capture actual doctor language: notable multi-word phrases.
        for phrase in re.findall(r"[a-z][a-z' ]{8,40}[a-z]", text.lower()):
            if any(w in phrase for w in ("margin", "patient", "revenue", "cash", "staff", "roi")):
                language[phrase.strip()] += 1

    insights: dict[str, Any] = {}
    for bucket in _BUCKETS:
        insights[bucket] = {
            "top": buckets[bucket].most_common(8),
            "examples": quotes[bucket],
        }
    insights["doctor_language"] = language.most_common(15)
    return insights


def _quote_around(text: str, term: str, width: int = 120) -> str:
    low = text.lower()
    idx = low.find(term)
    if idx < 0:
        return ""
    start = max(0, idx - width // 2)
    end = min(len(text), idx + len(term) + width // 2)
    snippet = text[start:end].replace("\n", " ").strip()
    return re.sub(r"\s+", " ", snippet)


def map_to_assets(insights: dict[str, Any], cfg: dict, llm: LLM) -> dict[str, Any]:
    """Turn raw insights into Apollo angles, website copy, etc."""
    enriched = _llm_assets(insights, cfg, llm)
    if enriched:
        return enriched
    return _template_assets(insights)


def _llm_assets(insights: dict, cfg: dict, llm: LLM) -> dict[str, Any] | None:
    compact = {
        k: insights[k]["top"] if isinstance(insights[k], dict) else insights[k]
        for k in insights
    }
    system = (
        "You are a B2B healthcare growth strategist for a cash-pay, staff-administered "
        "body recomposition service line sold to clinics. Be specific, honest, and "
        "non-hype. No clinical claims."
    )
    prompt = f"""\
From these Reddit-derived signals about clinic owners, produce JSON with keys:
apollo_angles, website_copy_ideas, webinar_topics, faq_answers,
objection_handling, social_content_ideas. Each value is an array of 3-5 short
strings. objection_handling items are "objection -> response" pairs.

Signals:
{json.dumps(compact, indent=2)[:4000]}

Output ONLY valid JSON."""
    text = llm.complete(system=system, prompt=prompt, max_tokens=1500)
    if not text:
        return None
    try:
        # Tolerate code fences.
        text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except Exception:
        return None
    return None


def _template_assets(insights: dict) -> dict[str, Any]:
    def top_terms(bucket: str, n: int = 4) -> list[str]:
        items = insights.get(bucket, {}).get("top", [])
        return [t for t, _ in items[:n]]

    pains = top_terms("pain_points") or ["thin margins", "patient churn"]
    objections = top_terms("objections") or ["too expensive", "doesn't work"]
    triggers = top_terms("buying_triggers") or ["thinking of adding", "evaluating"]
    competitors = top_terms("competitor_mentions")

    return {
        "apollo_angles": [
            f"Subject angle: \"The retention gap after GLP-1\" — practices keep the weight-loss revenue but lose the patient.",
            f"Subject angle: \"What a new cash-pay line really costs in physician time\" — leads with {pains[0]}.",
            "Subject angle: \"How clinics model payback on an aesthetic service line\" — ROI framework, not a demo ask.",
            "Subject angle: \"Monetizing the patients you already have\" — LTV lift over new acquisition.",
        ],
        "website_copy_ideas": [
            f"Headline that names the real pain: \"{pains[0].title()}? Add margin without adding physician hours.\"",
            "A transparent ROI section: chair time, staff-vs-MD time, payback period — show the math.",
            "An \"is this a fit?\" block keyed to existing GLP-1 / weight-loss / hormone patient panels.",
            "FAQ that pre-answers the top objections instead of hiding them.",
        ],
        "webinar_topics": [
            "Clinic economics of a cash-pay body recomposition line (live ROI model walkthrough).",
            "The GLP-1 retention playbook: keeping patients after goal weight.",
            "Staff-administered service lines: protecting physician time while adding revenue.",
        ],
        "faq_answers": [
            "How much physician time does it require? — Built around a staff-administered workflow with physician oversight.",
            "What's the payback period? — Model it on labor cost, chair time, and realistic repeat cadence; we'll share the template.",
            "Will it fit my patient panel? — Strongest fit for clinics already seeing GLP-1, weight-loss, hormone, or aesthetic patients.",
        ],
        "objection_handling": [
            f"{objections[0]} -> Reframe around payback period and labor cost, not sticker price.",
            f"{objections[1] if len(objections) > 1 else 'doesn’t work'} -> Lead with operational fit and honest expectations; never overclaim outcomes.",
            "saturated market -> Differentiate on which existing patients it monetizes, not on the device.",
        ],
        "social_content_ideas": [
            f"\"Buying triggers we keep hearing: {', '.join(triggers)}.\" — a short operator note.",
            "A teardown of how to evaluate a high-ticket service line (carousel).",
            f"\"Most-mentioned competitors in the wild: {', '.join(competitors) or 'n/a'} — here's how clinics actually compare them.\"",
        ],
    }
