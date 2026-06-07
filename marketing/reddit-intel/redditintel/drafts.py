"""Comment and original-post draft generation.

Every draft is REVIEW-ONLY. Nothing here posts. Drafts follow the comment-style
rules and guardrails from config. When Claude is available the drafts are
LLM-written in the persona's voice; otherwise high-quality templates are used.
"""

from __future__ import annotations

import textwrap
from typing import Any

from .llm import LLM
from .scoring import ScoredPost

PERSONA_SYSTEM = """\
You write Reddit comments and posts as a credible operator focused on MEDICAL \
PRACTICE GROWTH and CLINIC ECONOMICS. You are NOT a device salesperson. Your \
goal is long-term credibility, not leads.

Hard rules (never violate):
- Never pitch or name any product or company. No links. No "DM me". No emojis.
- Never claim to be a doctor and never give medical advice.
- Never pretend to be a patient; never use testimonials or invented outcomes.
- No marketing tone, no hype, no calls to action.

Voice:
- Short, conversational, useful, doctor-appropriate.
- Lead with a concrete insight, framework, or honest tradeoff.
- Sound like a real human operator who has seen the numbers.
- It is fine to ask a sharp follow-up question to invite discussion.
"""


def _style_rules(cfg: dict) -> str:
    rules = cfg.get("comment_style", [])
    guard = cfg.get("guardrails", [])
    return "Style: " + "; ".join(rules) + ".\nGuardrails: " + "; ".join(guard) + "."


def draft_comment(sp: ScoredPost, cfg: dict[str, Any], llm: LLM) -> str:
    """Draft a single review-ready comment for a scored thread."""
    text = llm.complete(
        system=PERSONA_SYSTEM,
        prompt=_comment_prompt(sp, cfg),
        max_tokens=500,
    )
    if text:
        return _strip_pitch(text)
    return _template_comment(sp)


def _comment_prompt(sp: ScoredPost, cfg: dict) -> str:
    p = sp.post
    body = textwrap.shorten(p.selftext or "(no body text)", width=900, placeholder=" …")
    return f"""\
Draft ONE Reddit comment (2-5 sentences) replying to this thread.

Subreddit: r/{p.subreddit}
Title: {p.title}
Body: {body}

Suggested angle (for you, not to quote): {sp.angle}

{_style_rules(cfg)}

Output only the comment text — no preamble, no quotes, no signature."""


def _template_comment(sp: ScoredPost) -> str:
    """Deterministic fallback comment built from the angle + topic."""
    sub = sp.post.subreddit
    matched = sp.matched_keywords
    topic = matched[0] if matched else "this"

    if any("glp-1" in m.lower() or "semaglutide" in m.lower() or "tirzepatide" in m.lower() for m in matched):
        return (
            "The pattern I keep seeing: patients hit goal weight, then the visit "
            "cadence drops off a cliff because there's nothing to keep them in the "
            "practice. The clinics that hold onto that revenue tend to have a "
            "next-step service ready before the taper, not after. What's your "
            "current plan for those patients once they're maintaining?"
        )
    if any(k in topic.lower() for k in ("body contouring", "body composition", "liposuction")):
        return (
            "Before adding anything in this category I'd model it on three numbers: "
            "chair time per treatment, whether staff or the physician has to run it, "
            "and realistic repeat cadence. A service that looks high-margin per "
            "treatment can quietly eat your best provider's hours. Have you mapped "
            "out who actually delivers it day to day?"
        )
    if any(k in topic.lower() for k in ("cash pay", "cash-pay", "service line", "procedure revenue")):
        return (
            "The filter I'd use for any new cash-pay line: margin after labor, how "
            "much physician time it really needs, and payback period on whatever you "
            "buy or lease. The ones that work usually fit the patients you already "
            "have rather than chasing a new audience. What does your existing panel "
            "already ask you for?"
        )
    if any(k in topic.lower() for k in ("retention", "lifetime value")):
        return (
            "Retention math is where most of these decisions actually get made. If a "
            "service line adds even one or two extra visits per patient per year, the "
            "LTV shift usually dwarfs the per-treatment margin people fixate on. Are "
            "you tracking LTV by service or just per-visit revenue right now?"
        )
    return (
        f"Speaking from the operations side rather than clinical: the practices that "
        f"do well with this tend to be ruthless about labor cost and physician time, "
        f"not just top-line revenue. Happy to talk through how I'd frame the economics "
        f"if that's useful — what's the constraint you're most worried about?"
    )


def _strip_pitch(text: str) -> str:
    """Last-line defense: remove links and obvious pitch artifacts."""
    bad_markers = ("http://", "https://", "www.", "dm me", "DM me")
    lines = []
    for line in text.splitlines():
        if any(b in line for b in bad_markers):
            continue
        lines.append(line)
    return "\n".join(lines).strip()


# --------------------------------------------------------------------------- #
# Original post idea generator
# --------------------------------------------------------------------------- #
def generate_post_ideas(cfg: dict[str, Any], llm: LLM) -> list[dict[str, Any]]:
    seeds = cfg.get("post_idea_seeds", [])
    sub_index = cfg.get("_subreddit_index", {})
    ideas: list[dict[str, Any]] = []
    for seed in seeds:
        sub = seed.get("subreddit", "medspa")
        risk = sub_index.get(sub, {}).get("risk_profile", "medium")
        body = _draft_post_body(seed, cfg, llm)
        ideas.append(
            {
                "subreddit": sub,
                "title": seed.get("title", ""),
                "angle": seed.get("angle", ""),
                "body": body,
                "intended_audience": _audience_for(sub, sub_index),
                "risk": risk,
                "why_it_works": _why_post_works(seed),
            }
        )
    return ideas


def _audience_for(sub: str, sub_index: dict) -> str:
    note = sub_index.get(sub, {}).get("note", "")
    return note or f"Members of r/{sub}"


def _why_post_works(seed: dict) -> str:
    return (
        f"Opens a genuine operator question about {seed.get('angle','clinic economics')}. "
        "It invites war stories and numbers, surfaces objections and demand signals, "
        "and builds credibility without mentioning any product."
    )


def _draft_post_body(seed: dict, cfg: dict, llm: LLM) -> str:
    prompt = f"""\
Draft a short Reddit POST body (3-6 sentences) for r/{seed.get('subreddit')}.

Title: {seed.get('title')}
Angle: {seed.get('angle')}

This is a discussion starter to build credibility — it must NOT pitch anything.
Ask a real question, share one small honest observation to prime replies, and
end with an open question. {_style_rules(cfg)}

Output only the post body."""
    text = llm.complete(system=PERSONA_SYSTEM, prompt=prompt, max_tokens=400)
    if text:
        return _strip_pitch(text)
    return _template_post_body(seed)


def _template_post_body(seed: dict) -> str:
    angle = seed.get("angle", "clinic economics")
    return (
        f"Trying to get past the marketing noise on {angle}. For the owners and "
        f"operators here: when you look back, what actually moved the numbers versus "
        f"what just sounded good in a vendor pitch? I'm less interested in the shiny "
        f"option and more in the boring operational stuff — labor cost, physician "
        f"time, repeat cadence. What would you tell someone evaluating this today?"
    )
