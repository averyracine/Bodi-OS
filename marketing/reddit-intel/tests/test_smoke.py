"""Smoke tests — run with: python3 -m pytest tests/  (or python3 tests/test_smoke.py)

These verify the full offline pipeline works and that core invariants hold:
  - scoring produces values in [1, 10]
  - high-risk subreddits never get an auto "comment" recommendation
  - drafts never contain links or "DM me"
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from redditintel.config import load_config
from redditintel.drafts import draft_comment, generate_post_ideas
from redditintel.llm import LLM
from redditintel.reddit_client import load_sample_posts
from redditintel.reports import (
    build_daily_markdown,
    build_html_dashboard,
    build_weekly_markdown,
)
from redditintel.research import extract_insights, map_to_assets
from redditintel.scoring import score_and_rank


def _setup():
    cfg = load_config()
    posts = load_sample_posts()
    scored = score_and_rank(posts, cfg)
    return cfg, scored


def test_scores_in_range():
    cfg, scored = _setup()
    assert scored, "expected scored posts"
    for s in scored:
        assert 1.0 <= s.total <= 10.0, f"score out of range: {s.total}"


def test_ranking_descending():
    _, scored = _setup()
    totals = [s.total for s in scored]
    assert totals == sorted(totals, reverse=True)


def test_high_risk_never_auto_comments():
    _, scored = _setup()
    for s in scored:
        if s.risk == "high":
            assert s.action != "comment", f"high-risk sub got comment: r/{s.post.subreddit}"


def test_drafts_clean():
    cfg, scored = _setup()
    llm = LLM(cfg)  # template fallback in CI
    for s in scored[:6]:
        text = draft_comment(s, cfg, llm).lower()
        assert "http" not in text
        assert "dm me" not in text
        assert "funsculpting" not in text


def test_reports_build():
    cfg, scored = _setup()
    llm = LLM(cfg)
    comments = {s.post.id: draft_comment(s, cfg, llm) for s in scored[:5]}
    insights = extract_insights(scored)
    assets = map_to_assets(insights, cfg, llm)
    ideas = generate_post_ideas(cfg, llm)

    md = build_daily_markdown(scored, comments, ideas, insights, assets, cfg)
    assert "Today's Best Threads" in md
    weekly = build_weekly_markdown(scored, insights, assets, ideas, cfg)
    assert "Weekly Report" in weekly
    html = build_html_dashboard(scored, comments, ideas, insights, assets, cfg)
    assert "<html" in html and "FunSculpting" in html


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in fns:
        fn()
        print(f"ok  {fn.__name__}")
    print(f"\n{len(fns)} tests passed")
