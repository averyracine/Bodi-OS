"""Opportunity scoring: turn a Post into a 1-10 opportunity with rationale.

Scoring is deterministic and rule-based (no LLM required) so it's fast, free,
and explainable. Five subscores (each 0-1) are combined with the configured
weights and mapped to 1-10:

  relevance       topical match to FunSculpting buyer conversations
  buyer_presence  likelihood a doctor / practice owner is in the thread
  engagement      upvotes + comments (log-scaled)
  recency         newer = more actionable
  value_add       can Avery add value without sounding promotional?
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from typing import Any

from .reddit_client import Post

# Phrases that signal a thread is advice-seeking / discussion (good to engage).
_VALUE_ADD_CUES = (
    "how do you",
    "how are you",
    "what do you",
    "anyone else",
    "looking for advice",
    "advice",
    "recommend",
    "worth it",
    "worth adding",
    "should i",
    "thoughts on",
    "experience with",
    "roi",
    "return on",
    "best way",
    "what works",
    "?",
)

_WINDOW_HOURS = {
    "hour": 1,
    "day": 24,
    "week": 24 * 7,
    "month": 24 * 30,
    "year": 24 * 365,
    "all": 24 * 365 * 3,
}


@dataclass
class ScoredPost:
    post: Post
    subscores: dict[str, float]
    total: float  # 1-10
    risk: str  # low | medium | high
    action: str  # comment | save | monitor | ignore
    angle: str
    why_it_matters: str
    matched_keywords: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        from dataclasses import asdict

        d = asdict(self.post)
        d.update(
            {
                "subscores": {k: round(v, 3) for k, v in self.subscores.items()},
                "total": round(self.total, 2),
                "risk": self.risk,
                "action": self.action,
                "angle": self.angle,
                "why_it_matters": self.why_it_matters,
                "matched_keywords": self.matched_keywords,
                "permalink_full": self.post.full_permalink,
            }
        )
        return d


def _matches(text: str, terms: list[str]) -> list[str]:
    low = text.lower()
    return [t for t in terms if t.lower() in low]


def _relevance(post: Post, kw: dict[str, list[str]]) -> tuple[float, list[str]]:
    text = post.text
    high = _matches(text, kw.get("high_value", []))
    med = _matches(text, kw.get("medium_value", []))
    # High-value matches count double. Saturate so a few strong hits = strong.
    raw = len(high) * 2 + len(med)
    score = 1 - math.exp(-raw / 3.0)  # 0 -> 0, ~3 hits -> ~0.6, lots -> ~1
    return score, high + med


def _buyer_presence(
    post: Post, kw: dict[str, list[str]], sub_cfg: dict[str, Any]
) -> tuple[float, list[str]]:
    sub_weight = float(sub_cfg.get("weight", 0.5))
    signals = _matches(post.text, kw.get("buyer_signal", []))
    signal_score = 1 - math.exp(-len(signals) / 2.0)
    score = 0.6 * sub_weight + 0.4 * signal_score
    return min(1.0, score), signals


def _engagement(post: Post) -> float:
    raw = post.score + post.num_comments * 2
    if raw <= 0:
        return 0.0
    return min(1.0, math.log10(raw + 1) / 3.0)  # ~1000 weighted -> 1.0


def _recency(post: Post, time_filter: str) -> float:
    if not post.created_utc:
        return 0.4  # unknown age -> neutral-ish
    age_hours = max(0.0, (time.time() - post.created_utc) / 3600.0)
    window = _WINDOW_HOURS.get(time_filter, _WINDOW_HOURS["week"])
    return max(0.0, min(1.0, 1.0 - age_hours / window))


def _value_add(post: Post) -> float:
    low = post.text.lower()
    hits = sum(1 for cue in _VALUE_ADD_CUES if cue in low)
    base = 1 - math.exp(-hits / 2.0)
    # A reasonable amount of discussion (some comments) helps.
    if post.num_comments >= 5:
        base = min(1.0, base + 0.15)
    return base


def _risk_for(sub_cfg: dict[str, Any]) -> str:
    return str(sub_cfg.get("risk_profile", "medium")).lower()


def _decide_action(total: float, risk: str, buyer_signals: int, cfg: dict) -> str:
    actions = cfg.get("actions", {})
    comment_min = float(actions.get("comment_min_score", 6.5))
    monitor_min = float(actions.get("monitor_min_score", 5.0))

    if total >= comment_min and risk != "high":
        return "comment"
    if total >= comment_min and risk == "high":
        # Strong thread but strict sub -> engage carefully, treat as monitor.
        return "monitor"
    if total >= monitor_min:
        return "monitor"
    if buyer_signals > 0:
        return "save"
    return "ignore"


def _angle_for(matched: list[str], sub: str) -> str:
    """A short, human suggestion for how to add value (not a pitch)."""
    m = " ".join(matched).lower()
    if any(k in m for k in ("glp-1", "semaglutide", "tirzepatide")):
        return (
            "Share what you've seen on the GLP-1 retention gap — patients lose "
            "weight, then churn. Frame body recomposition as the natural next "
            "service without naming a product."
        )
    if any(k in m for k in ("body contouring", "body composition", "liposuction")):
        return (
            "Talk through how practices evaluate contouring demand and unit "
            "economics (chair time, staff vs MD time, repeat cadence). Stay "
            "vendor-neutral."
        )
    if any(k in m for k in ("cash pay", "cash-pay", "service line", "procedure revenue")):
        return (
            "Offer a clear-eyed framework for evaluating a new cash-pay line: "
            "margin, staff burden, payback period, and fit with the existing panel."
        )
    if any(k in m for k in ("patient retention", "patient lifetime value")):
        return (
            "Discuss LTV math and how an added service line changes retention. "
            "Concrete numbers > opinions here."
        )
    if any(k in m for k in ("aesthetic device", "equipment lease")):
        return (
            "Help them pressure-test lease-vs-buy and utilization assumptions. "
            "Credibility comes from honest downside cases."
        )
    return (
        f"Add an operator's perspective on practice growth / clinic economics "
        f"relevant to r/{sub}. Lead with usefulness, not the product."
    )


def score_post(post: Post, cfg: dict[str, Any]) -> ScoredPost:
    kw = cfg.get("keywords", {})
    sub_cfg = cfg.get("_subreddit_index", {}).get(post.subreddit, {})
    weights = cfg.get("scoring", {}).get("weights", {})
    time_filter = cfg.get("search", {}).get("time_filter", "week")

    rel, rel_kw = _relevance(post, kw)
    buy, buy_signals = _buyer_presence(post, kw, sub_cfg)
    eng = _engagement(post)
    rec = _recency(post, time_filter)
    val = _value_add(post)

    subscores = {
        "relevance": rel,
        "buyer_presence": buy,
        "engagement": eng,
        "recency": rec,
        "value_add": val,
    }

    wsum = sum(float(weights.get(k, 1.0)) for k in subscores) or 1.0
    weighted = sum(float(weights.get(k, 1.0)) * v for k, v in subscores.items())
    normalized = weighted / wsum  # 0-1
    total = round(1 + normalized * 9, 2)  # 1-10

    risk = _risk_for(sub_cfg)
    matched = sorted(set(rel_kw + buy_signals))
    action = _decide_action(total, risk, len(buy_signals), cfg)
    angle = _angle_for(matched, post.subreddit)

    why = _why_it_matters(subscores, sub_cfg, len(buy_signals), matched)

    return ScoredPost(
        post=post,
        subscores=subscores,
        total=total,
        risk=risk,
        action=action,
        angle=angle,
        why_it_matters=why,
        matched_keywords=matched,
    )


def _why_it_matters(
    subscores: dict[str, float], sub_cfg: dict, buyer_signals: int, matched: list[str]
) -> str:
    bits: list[str] = []
    if subscores["relevance"] >= 0.5:
        bits.append("strong topical fit")
    if subscores["buyer_presence"] >= 0.6 or buyer_signals:
        bits.append("likely a practice owner / operator")
    if subscores["engagement"] >= 0.5:
        bits.append("active thread")
    if subscores["recency"] >= 0.6:
        bits.append("recent")
    if not bits:
        bits.append("adjacent / lower-intent")
    note = sub_cfg.get("note", "")
    matched_str = ", ".join(matched[:5]) if matched else "no direct keyword hits"
    tail = f" Keywords: {matched_str}."
    if note:
        tail += f" Sub: {note}"
    return (", ".join(bits)).capitalize() + "." + tail


def score_and_rank(
    posts: list[Post], cfg: dict[str, Any], *, dedupe: bool = True
) -> list[ScoredPost]:
    seen: set[str] = set()
    scored: list[ScoredPost] = []
    for p in posts:
        if dedupe:
            key = p.id or p.permalink or p.title
            if key in seen:
                continue
            seen.add(key)
        scored.append(score_post(p, cfg))
    scored.sort(key=lambda s: s.total, reverse=True)
    return scored
