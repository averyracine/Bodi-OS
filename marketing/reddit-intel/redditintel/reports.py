"""Report builders: daily markdown, weekly markdown, and an HTML dashboard.

The daily report is the operating surface. Sections map to the spec:
  A. Today's Best Threads
  B. Suggested Comments
  C. Suggested Original Posts
  D. Market Research Insights
  E. Apollo Outreach Angles
  F. Website Copy Ideas
  G. Saved Leads / High-Intent Users
  H. (Weekly summary lives in the weekly report)
"""

from __future__ import annotations

import html
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any

from .scoring import ScoredPost


def _ts() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def _risk_badge(risk: str) -> str:
    return {"low": "🟢 low", "medium": "🟡 medium", "high": "🔴 high"}.get(risk, risk)


def build_daily_markdown(
    scored: list[ScoredPost],
    comments: dict[str, str],
    post_ideas: list[dict[str, Any]],
    insights: dict[str, Any],
    assets: dict[str, Any],
    cfg: dict[str, Any],
    *,
    top_n: int = 10,
) -> str:
    min_surface = cfg.get("scoring", {}).get("min_score_to_surface", 4.0)
    surfaced = [s for s in scored if s.total >= min_surface]
    top = surfaced[:top_n]
    saved = [s for s in scored if s.action == "save"]

    lines: list[str] = []
    lines.append(f"# Reddit Daily Dashboard — FunSculpting practice-growth desk")
    lines.append(f"_Generated {_ts()} · {len(scored)} threads analyzed · "
                 f"{len(surfaced)} surfaced (score ≥ {min_surface})_")
    lines.append("")
    lines.append("> Research + drafts only. Nothing is posted automatically. "
                 "Review, edit, and post manually.")
    lines.append("")

    # Guardrails reminder up top.
    lines.append("**Guardrails:** " + " · ".join(cfg.get("guardrails", [])[:6]) + " …")
    lines.append("")

    # ---- A. Today's Best Threads ----
    lines.append("## A. Today's Best Threads")
    lines.append("")
    if not top:
        lines.append("_No threads cleared the surfacing threshold today._")
    else:
        lines.append("| # | Score | Subreddit | Thread | Why it matters | Risk | Action |")
        lines.append("|--:|--:|---|---|---|---|---|")
        for i, s in enumerate(top, 1):
            title = s.post.title.replace("|", "\\|")
            link = f"[{title}]({s.post.full_permalink})"
            why = s.why_it_matters.replace("|", "\\|")[:160]
            lines.append(
                f"| {i} | {s.total:.1f} | r/{s.post.subreddit} | {link} | {why} "
                f"| {_risk_badge(s.risk)} | **{s.action}** |"
            )
    lines.append("")

    # Per-thread detail with summary + angle.
    if top:
        lines.append("### Thread detail")
        lines.append("")
        for i, s in enumerate(top, 1):
            lines.append(f"**{i}. r/{s.post.subreddit} — {s.post.title}**  ")
            lines.append(f"{s.post.full_permalink}  ")
            lines.append(
                f"Score {s.total:.1f} · {_risk_badge(s.risk)} · action: **{s.action}** · "
                f"👍 {s.post.score} · 💬 {s.post.num_comments}  "
            )
            summary = (s.post.selftext or "(link/title-only post)").strip()
            if len(summary) > 320:
                summary = summary[:320] + " …"
            lines.append(f"_Summary:_ {summary}  ")
            lines.append(f"_Suggested angle:_ {s.angle}  ")
            sub = ", ".join(f"{k} {v:.2f}" for k, v in s.subscores.items())
            lines.append(f"_Subscores:_ {sub}")
            lines.append("")

    # ---- B. Suggested Comments ----
    lines.append("## B. Suggested Comments")
    lines.append("")
    lines.append("_Drafts for threads marked **comment**. Edit before posting. "
                 "No links, no product names, no pitch._")
    lines.append("")
    commentables = [s for s in top if s.action == "comment"]
    if not commentables:
        lines.append("_No low-risk, high-score threads to comment on today — "
                     "monitor the table above instead._")
    for s in commentables:
        draft = comments.get(s.post.id, "")
        lines.append(f"**r/{s.post.subreddit} — {s.post.title}**  ")
        lines.append(f"{s.post.full_permalink}")
        lines.append("")
        lines.append("```text")
        lines.append(draft)
        lines.append("```")
        lines.append("")

    # ---- C. Suggested Original Posts ----
    lines.append("## C. Suggested Original Posts")
    lines.append("")
    for idea in post_ideas:
        lines.append(f"**r/{idea['subreddit']} — {idea['title']}** "
                     f"({_risk_badge(idea['risk'])})  ")
        lines.append(f"_Audience:_ {idea['intended_audience']}  ")
        lines.append(f"_Angle:_ {idea['angle']}  ")
        lines.append(f"_Why it works:_ {idea['why_it_works']}")
        lines.append("")
        lines.append("```text")
        lines.append(idea["body"])
        lines.append("```")
        lines.append("")

    # ---- D. Market Research Insights ----
    lines.append("## D. Market Research Insights")
    lines.append("")
    lines.extend(_render_insights(insights))

    # ---- E. Apollo Outreach Angles ----
    lines.append("## E. Apollo Outreach Angles")
    lines.append("")
    for a in assets.get("apollo_angles", []):
        lines.append(f"- {a}")
    lines.append("")

    # ---- F. Website Copy Ideas ----
    lines.append("## F. Website Copy Ideas")
    lines.append("")
    for a in assets.get("website_copy_ideas", []):
        lines.append(f"- {a}")
    lines.append("")
    if assets.get("objection_handling"):
        lines.append("**Objection handling**")
        for a in assets["objection_handling"]:
            lines.append(f"- {a}")
        lines.append("")
    if assets.get("faq_answers"):
        lines.append("**FAQ answers**")
        for a in assets["faq_answers"]:
            lines.append(f"- {a}")
        lines.append("")
    if assets.get("webinar_topics"):
        lines.append("**Webinar topics**")
        for a in assets["webinar_topics"]:
            lines.append(f"- {a}")
        lines.append("")
    if assets.get("social_content_ideas"):
        lines.append("**Social content ideas**")
        for a in assets["social_content_ideas"]:
            lines.append(f"- {a}")
        lines.append("")

    # ---- G. Saved Leads / High-Intent Users ----
    lines.append("## G. Saved Leads / High-Intent Users")
    lines.append("")
    lines.append("_Threads with buyer signals worth watching (action: save/monitor). "
                 "Research only — do not DM automatically._")
    lines.append("")
    watch = [s for s in scored if s.action in ("save", "monitor") and s.matched_keywords]
    if not watch:
        lines.append("_None flagged._")
    else:
        lines.append("| Subreddit | Author | Thread | Signals |")
        lines.append("|---|---|---|---|")
        for s in watch[:25]:
            sig = ", ".join(s.matched_keywords[:4]).replace("|", "\\|")
            title = s.post.title.replace("|", "\\|")[:60]
            lines.append(
                f"| r/{s.post.subreddit} | u/{s.post.author} | "
                f"[{title}]({s.post.full_permalink}) | {sig} |"
            )
    lines.append("")

    lines.append("---")
    lines.append(f"_Account strategy reminder: post as "
                 f"{', '.join(cfg.get('account_strategy', {}).get('recommended_handles', [])[:3])} — "
                 f"never as “FunSculpting”._")
    return "\n".join(lines)


def _render_insights(insights: dict[str, Any]) -> list[str]:
    out: list[str] = []
    label = {
        "pain_points": "Pain points",
        "objections": "Objections",
        "revenue_concerns": "Revenue concerns",
        "demand_signals": "Patient demand signals",
        "operational_concerns": "Operational concerns",
        "competitor_mentions": "Competitor mentions",
        "pricing_expectations": "Pricing expectations",
        "buying_triggers": "Buying triggers",
    }
    for key, name in label.items():
        bucket = insights.get(key, {})
        top = bucket.get("top", []) if isinstance(bucket, dict) else []
        if not top:
            continue
        terms = ", ".join(f"{t} ({c})" for t, c in top)
        out.append(f"**{name}:** {terms}")
        examples = bucket.get("examples", []) if isinstance(bucket, dict) else []
        for ex in examples[:2]:
            out.append(f"  - {ex}")
        out.append("")
    lang = insights.get("doctor_language", [])
    if lang:
        out.append("**Language doctors actually use:** "
                   + ", ".join(f"“{t}”" for t, _ in lang[:10]))
        out.append("")
    return out


# --------------------------------------------------------------------------- #
# Weekly report
# --------------------------------------------------------------------------- #
def build_weekly_markdown(
    scored: list[ScoredPost],
    insights: dict[str, Any],
    assets: dict[str, Any],
    post_ideas: list[dict[str, Any]],
    cfg: dict[str, Any],
) -> str:
    by_sub: dict[str, list[ScoredPost]] = defaultdict(list)
    for s in scored:
        by_sub[s.post.subreddit].append(s)

    sub_perf = sorted(
        (
            (sub, sum(x.total for x in items) / len(items), len(items))
            for sub, items in by_sub.items()
        ),
        key=lambda r: r[1],
        reverse=True,
    )

    topic_counter: Counter = Counter()
    for s in scored:
        for kw in s.matched_keywords:
            topic_counter[kw] += 1

    best_threads = sorted(scored, key=lambda s: s.total, reverse=True)[:10]

    lines: list[str] = []
    lines.append("# Reddit Weekly Report — FunSculpting practice-growth desk")
    lines.append(f"_Generated {_ts()} · {len(scored)} threads across "
                 f"{len(by_sub)} subreddits_")
    lines.append("")

    lines.append("## Best-performing subreddits (avg opportunity score)")
    lines.append("")
    lines.append("| Subreddit | Avg score | Threads |")
    lines.append("|---|--:|--:|")
    for sub, avg, n in sub_perf:
        lines.append(f"| r/{sub} | {avg:.1f} | {n} |")
    lines.append("")

    lines.append("## Best topics this week")
    lines.append("")
    for kw, c in topic_counter.most_common(12):
        lines.append(f"- {kw} — {c} mentions")
    lines.append("")

    lines.append("## Most useful threads")
    lines.append("")
    for s in best_threads:
        lines.append(f"- [{s.post.title}]({s.post.full_permalink}) "
                     f"(r/{s.post.subreddit}, score {s.total:.1f}, {s.action})")
    lines.append("")

    lines.append("## Common objections")
    lines.append("")
    for t, c in insights.get("objections", {}).get("top", []):
        lines.append(f"- {t} ({c})")
    lines.append("")

    lines.append("## New messaging angles")
    lines.append("")
    for a in assets.get("apollo_angles", [])[:5]:
        lines.append(f"- {a}")
    lines.append("")

    lines.append("## Recommended next posts")
    lines.append("")
    for idea in post_ideas[:4]:
        lines.append(f"- **r/{idea['subreddit']}**: {idea['title']} "
                     f"({_risk_badge(idea['risk'])})")
    lines.append("")

    lines.append("## Recommended Apollo email tests")
    lines.append("")
    for a in assets.get("apollo_angles", [])[:3]:
        lines.append(f"- A/B test — {a}")
    lines.append("")

    lines.append("## Warm leads / accounts to research")
    lines.append("")
    warm = [s for s in scored if s.matched_keywords and s.action in ("save", "monitor", "comment")]
    warm.sort(key=lambda s: s.total, reverse=True)
    for s in warm[:15]:
        lines.append(f"- u/{s.post.author} in r/{s.post.subreddit} — "
                     f"[{s.post.title[:60]}]({s.post.full_permalink}) "
                     f"({', '.join(s.matched_keywords[:3])})")
    lines.append("")
    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# HTML dashboard (no server needed — open the file in a browser)
# --------------------------------------------------------------------------- #
def build_html_dashboard(
    scored: list[ScoredPost],
    comments: dict[str, str],
    post_ideas: list[dict[str, Any]],
    insights: dict[str, Any],
    assets: dict[str, Any],
    cfg: dict[str, Any],
    *,
    top_n: int = 10,
) -> str:
    e = html.escape
    min_surface = cfg.get("scoring", {}).get("min_score_to_surface", 4.0)
    top = [s for s in scored if s.total >= min_surface][:top_n]

    def risk_pill(r: str) -> str:
        color = {"low": "#1a7f37", "medium": "#9a6700", "high": "#cf222e"}.get(r, "#555")
        return f'<span class="pill" style="background:{color}">{e(r)}</span>'

    rows = ""
    for i, s in enumerate(top, 1):
        rows += f"""
        <tr>
          <td>{i}</td><td><b>{s.total:.1f}</b></td>
          <td>r/{e(s.post.subreddit)}</td>
          <td><a href="{e(s.post.full_permalink)}" target="_blank">{e(s.post.title)}</a></td>
          <td>{e(s.why_it_matters)}</td>
          <td>{risk_pill(s.risk)}</td>
          <td><b>{e(s.action)}</b></td>
        </tr>"""

    comment_cards = ""
    for s in [x for x in top if x.action == "comment"]:
        comment_cards += f"""
        <div class="card">
          <div class="muted">r/{e(s.post.subreddit)} · <a href="{e(s.post.full_permalink)}" target="_blank">{e(s.post.title)}</a></div>
          <pre>{e(comments.get(s.post.id, ''))}</pre>
        </div>"""

    post_cards = ""
    for idea in post_ideas:
        post_cards += f"""
        <div class="card">
          <div><b>r/{e(idea['subreddit'])}</b> — {e(idea['title'])} {risk_pill(idea['risk'])}</div>
          <div class="muted">{e(idea['angle'])}</div>
          <pre>{e(idea['body'])}</pre>
        </div>"""

    def asset_list(key: str) -> str:
        return "".join(f"<li>{e(str(a))}</li>" for a in assets.get(key, []))

    insight_html = ""
    label = {
        "pain_points": "Pain points", "objections": "Objections",
        "revenue_concerns": "Revenue concerns", "demand_signals": "Demand signals",
        "operational_concerns": "Operational concerns",
        "competitor_mentions": "Competitor mentions",
        "pricing_expectations": "Pricing expectations", "buying_triggers": "Buying triggers",
    }
    for key, name in label.items():
        top_items = insights.get(key, {}).get("top", []) if isinstance(insights.get(key), dict) else []
        if not top_items:
            continue
        chips = "".join(f'<span class="chip">{e(t)} · {c}</span>' for t, c in top_items)
        insight_html += f'<div class="insight"><h4>{name}</h4>{chips}</div>'

    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reddit Dashboard — FunSculpting</title>
<style>
  :root {{ color-scheme: light dark; }}
  body {{ font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
         margin: 0; background:#f6f7f9; color:#1b1f24; }}
  header {{ background:#11161c; color:#fff; padding:20px 28px; }}
  header h1 {{ margin:0 0 4px; font-size:20px; }}
  header .sub {{ opacity:.7; font-size:13px; }}
  main {{ max-width:1100px; margin:0 auto; padding:24px; }}
  h2 {{ font-size:16px; border-bottom:2px solid #e2e5e9; padding-bottom:6px; margin-top:34px; }}
  table {{ width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; }}
  th, td {{ text-align:left; padding:9px 11px; font-size:13px; border-bottom:1px solid #eef0f3; vertical-align:top; }}
  th {{ background:#fafbfc; }}
  a {{ color:#0969da; text-decoration:none; }}
  .pill {{ color:#fff; padding:1px 8px; border-radius:10px; font-size:11px; }}
  .card {{ background:#fff; border:1px solid #e6e9ec; border-radius:8px; padding:12px 14px; margin:10px 0; }}
  .muted {{ color:#656d76; font-size:12px; margin-bottom:6px; }}
  pre {{ white-space:pre-wrap; background:#f6f8fa; padding:10px; border-radius:6px; font-size:13px; margin:6px 0 0; }}
  .chip {{ display:inline-block; background:#eaeef2; border-radius:12px; padding:2px 9px; margin:3px; font-size:12px; }}
  .insight {{ margin:10px 0; }} .insight h4 {{ margin:4px 0; font-size:13px; }}
  .grid2 {{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }}
  .banner {{ background:#fff3cd; border:1px solid #ffe69c; padding:8px 12px; border-radius:6px; font-size:13px; }}
  @media (max-width:720px) {{ .grid2 {{ grid-template-columns:1fr; }} }}
</style></head>
<body>
<header>
  <h1>Reddit Daily Dashboard — FunSculpting practice-growth desk</h1>
  <div class="sub">Generated {_ts()} · {len(scored)} threads analyzed · research + drafts only, nothing auto-posts</div>
</header>
<main>
  <div class="banner"><b>Guardrails:</b> {e(' · '.join(cfg.get('guardrails', [])[:6]))} …</div>

  <h2>A. Today's Best Threads</h2>
  <table><thead><tr><th>#</th><th>Score</th><th>Sub</th><th>Thread</th><th>Why it matters</th><th>Risk</th><th>Action</th></tr></thead>
  <tbody>{rows or '<tr><td colspan=7>No threads surfaced.</td></tr>'}</tbody></table>

  <h2>B. Suggested Comments</h2>
  {comment_cards or '<p class="muted">No low-risk, high-score threads to comment on today.</p>'}

  <h2>C. Suggested Original Posts</h2>
  {post_cards}

  <h2>D. Market Research Insights</h2>
  {insight_html or '<p class="muted">No signals extracted.</p>'}

  <div class="grid2">
    <div><h2>E. Apollo Outreach Angles</h2><ul>{asset_list('apollo_angles')}</ul></div>
    <div><h2>F. Website Copy Ideas</h2><ul>{asset_list('website_copy_ideas')}</ul></div>
  </div>
</main>
</body></html>"""
