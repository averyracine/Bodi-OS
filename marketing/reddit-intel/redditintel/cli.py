"""Command-line interface for the Reddit intelligence assistant.

Subcommands:
  pull      Search target subreddits and cache the raw threads.
  daily     Build today's dashboard (markdown + HTML) with comments/posts/research.
  weekly    Build the weekly insights report.
  drafts    Print comment drafts for the top threads.
  posts     Print original-post ideas.
  research  Print extracted market-research insights + mapped assets.

Use --offline anywhere to run on bundled sample data (no Reddit credentials).
Nothing in this tool posts to Reddit. It only researches and drafts.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from . import __version__
from .config import REPORTS_DIR, ensure_dirs, load_config, load_dotenv
from .drafts import draft_comment, generate_post_ideas
from .llm import LLM
from .reddit_client import (
    Post,
    PublicRedditClient,
    RedditAuthError,
    RedditClient,
    load_pull,
    load_sample_posts,
    save_pull,
)
from .reports import (
    build_daily_markdown,
    build_html_dashboard,
    build_weekly_markdown,
)
from .research import extract_insights, map_to_assets
from .scoring import score_and_rank


def _today_label() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _gather_posts(args, cfg) -> list[Post]:
    """Either load offline sample data, a cached pull, or hit the live API."""
    if getattr(args, "offline", False):
        print("[offline] using bundled sample posts", file=sys.stderr)
        return load_sample_posts()

    if getattr(args, "input", None):
        print(f"[load] {args.input}", file=sys.stderr)
        return load_pull(Path(args.input))

    # Unauthenticated public-JSON pull (no API app needed).
    if getattr(args, "public", False):
        import os

        ua = os.environ.get("REDDIT_USER_AGENT") or "reddit-intel:funsculpting:v0.1"
        print("[public] using Reddit public search (best-effort, rate-limited)",
              file=sys.stderr)
        return _live_pull(PublicRedditClient(ua), cfg)

    # Authenticated live pull.
    try:
        client = RedditClient.from_env()
    except RedditAuthError as exc:
        print(f"[warn] {exc}", file=sys.stderr)
        print("[warn] tip: run with --public for no-credentials live data, "
              "or --offline for sample data", file=sys.stderr)
        print("[warn] falling back to sample posts", file=sys.stderr)
        return load_sample_posts()

    return _live_pull(client, cfg)


def _live_pull(client: RedditClient, cfg) -> list[Post]:
    search = cfg.get("search", {})
    kw = cfg.get("keywords", {})
    # Prioritize high-value keywords, then medium.
    query_terms = kw.get("high_value", []) + kw.get("medium_value", [])
    max_kw = int(search.get("max_keywords_per_sub", 8))
    terms = query_terms[:max_kw]

    all_posts: list[Post] = []
    for sub in cfg.get("subreddits", []):
        name = sub["name"]
        for term in terms:
            try:
                found = client.search_subreddit(
                    name,
                    term,
                    time_filter=search.get("time_filter", "week"),
                    sort=search.get("sort", "relevance"),
                    limit=int(search.get("limit_per_query", 25)),
                )
                all_posts.extend(found)
                print(f"[pull] r/{name} '{term}' -> {len(found)}", file=sys.stderr)
            except Exception as exc:  # noqa: BLE001
                print(f"[warn] r/{name} '{term}' failed: {exc}", file=sys.stderr)
    return all_posts


def _build_everything(scored, cfg, llm):
    """Shared assembly used by daily/weekly/etc."""
    insights = extract_insights(scored)
    assets = map_to_assets(insights, cfg, llm)
    post_ideas = generate_post_ideas(cfg, llm)
    return insights, assets, post_ideas


def cmd_pull(args) -> int:
    cfg = load_config()
    ensure_dirs()
    posts = _gather_posts(args, cfg)
    label = args.label or _today_label()
    path = save_pull(posts, label)
    print(f"Saved {len(posts)} posts -> {path}")
    return 0


def cmd_daily(args) -> int:
    cfg = load_config()
    ensure_dirs()
    llm = LLM(cfg)
    if not llm.available:
        print("[info] LLM unavailable — using template drafts.", file=sys.stderr)

    posts = _gather_posts(args, cfg)
    scored = score_and_rank(posts, cfg)
    top_n = args.top
    top = [s for s in scored if s.total >= cfg["scoring"].get("min_score_to_surface", 4.0)][:top_n]

    comments = {
        s.post.id: draft_comment(s, cfg, llm)
        for s in top
        if s.action == "comment"
    }
    insights, assets, post_ideas = _build_everything(scored, cfg, llm)

    md = build_daily_markdown(scored, comments, post_ideas, insights, assets, cfg, top_n=top_n)
    html = build_html_dashboard(scored, comments, post_ideas, insights, assets, cfg, top_n=top_n)

    label = _today_label()
    md_path = REPORTS_DIR / f"daily-{label}.md"
    html_path = REPORTS_DIR / f"daily-{label}.html"
    md_path.write_text(md)
    html_path.write_text(html)

    print(f"Daily report  -> {md_path}")
    print(f"HTML dashboard-> {html_path}")
    if args.show:
        print("\n" + md)
    return 0


def cmd_weekly(args) -> int:
    cfg = load_config()
    ensure_dirs()
    llm = LLM(cfg)
    posts = _gather_posts(args, cfg)
    scored = score_and_rank(posts, cfg)
    insights, assets, post_ideas = _build_everything(scored, cfg, llm)
    md = build_weekly_markdown(scored, insights, assets, post_ideas, cfg)
    label = _today_label()
    path = REPORTS_DIR / f"weekly-{label}.md"
    path.write_text(md)
    print(f"Weekly report -> {path}")
    if args.show:
        print("\n" + md)
    return 0


def cmd_drafts(args) -> int:
    cfg = load_config()
    llm = LLM(cfg)
    posts = _gather_posts(args, cfg)
    scored = score_and_rank(posts, cfg)
    top = [s for s in scored if s.total >= cfg["scoring"].get("min_score_to_surface", 4.0)][: args.top]
    for s in top:
        print(f"\n=== r/{s.post.subreddit} · score {s.total:.1f} · {s.action} ===")
        print(s.post.title)
        print(s.post.full_permalink)
        if s.action in ("comment", "monitor"):
            print("\n--- draft comment ---")
            print(draft_comment(s, cfg, llm))
    return 0


def cmd_posts(args) -> int:
    cfg = load_config()
    llm = LLM(cfg)
    ideas = generate_post_ideas(cfg, llm)
    for idea in ideas:
        print(f"\n### r/{idea['subreddit']} — {idea['title']} ({idea['risk']} risk)")
        print(f"Audience: {idea['intended_audience']}")
        print(f"Angle: {idea['angle']}")
        print(f"Why it works: {idea['why_it_works']}")
        print("\n" + idea["body"])
    return 0


def cmd_research(args) -> int:
    cfg = load_config()
    llm = LLM(cfg)
    posts = _gather_posts(args, cfg)
    scored = score_and_rank(posts, cfg)
    insights = extract_insights(scored)
    assets = map_to_assets(insights, cfg, llm)
    if args.json:
        print(json.dumps({"insights": insights, "assets": assets}, indent=2))
    else:
        for key, val in insights.items():
            print(f"\n## {key}")
            if isinstance(val, dict):
                for t, c in val.get("top", []):
                    print(f"  - {t} ({c})")
            else:
                for t, c in val:
                    print(f"  - {t} ({c})")
        print("\n## mapped assets")
        print(json.dumps(assets, indent=2))
    return 0


def _add_common(p: argparse.ArgumentParser) -> None:
    p.add_argument("--offline", action="store_true",
                   help="Use bundled sample posts (no Reddit credentials needed).")
    p.add_argument("--public", action="store_true",
                   help="Pull live data via Reddit's public search (no API app; "
                        "best-effort, rate-limited).")
    p.add_argument("--input", help="Load a cached pull JSON instead of searching.")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="reddit-intel",
        description="Reddit intelligence + engagement assistant for FunSculpting "
                    "(research/score/draft only — never posts).",
    )
    p.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    sub = p.add_subparsers(dest="command", required=True)

    sp = sub.add_parser("pull", help="Search subreddits and cache results.")
    _add_common(sp)
    sp.add_argument("--label", help="Label for the saved pull file.")
    sp.set_defaults(func=cmd_pull)

    sp = sub.add_parser("daily", help="Build today's dashboard (md + html).")
    _add_common(sp)
    sp.add_argument("--top", type=int, default=10)
    sp.add_argument("--show", action="store_true", help="Also print the report.")
    sp.set_defaults(func=cmd_daily)

    sp = sub.add_parser("weekly", help="Build the weekly insights report.")
    _add_common(sp)
    sp.add_argument("--show", action="store_true")
    sp.set_defaults(func=cmd_weekly)

    sp = sub.add_parser("drafts", help="Print comment drafts for top threads.")
    _add_common(sp)
    sp.add_argument("--top", type=int, default=10)
    sp.set_defaults(func=cmd_drafts)

    sp = sub.add_parser("posts", help="Print original-post ideas.")
    sp.set_defaults(func=cmd_posts)

    sp = sub.add_parser("research", help="Print extracted market research.")
    _add_common(sp)
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(func=cmd_research)

    return p


def main(argv: list[str] | None = None) -> int:
    load_dotenv()
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
