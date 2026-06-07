# Reddit Intelligence + Engagement Assistant — FunSculpting

A "Reddit operating system" that helps you **find, monitor, understand, and
draft** engagement for conversations where doctors, med spa owners, hormone/TRT
clinics, weight-loss clinics, functional/regenerative medicine practices, and
private-practice owners discuss business growth, cash-pay services, body
contouring, GLP-1s, patient retention, and new service lines.

It is built to make you a **credible "medical practice growth / clinic
economics" contributor** — not to run a device-sales spam bot.

> **This tool never posts to Reddit.** It only researches, scores, summarizes,
> and **drafts** comments/posts for your review. You edit and post manually.
> Every guardrail from the brief is enforced (see [Guardrails](#guardrails)).

---

## What it does

| Capability | Where |
|---|---|
| **1. Subreddit monitoring** — searches target subs for your keywords | `pull`, `daily` |
| **2. Opportunity scoring (1–10)** — relevance, buyer presence, engagement, recency, value-add | `redditintel/scoring.py` |
| **3. Daily dashboard** — top 10 threads, summaries, angles, risk, action | `daily` → markdown + HTML |
| **4. Comment drafting** — human, useful, non-promotional, no links/pitch | `drafts`, `daily` |
| **5. Post idea generator** — discussion-starting original posts | `posts`, `daily` |
| **6. Market-research extraction** — pain points, objections, demand signals, pricing, etc. → Apollo angles, website copy, webinars, FAQs, objection scripts, social ideas | `research`, `daily` |
| **7. Account strategy** — persona handle recommendations (never "FunSculpting") | `config.yaml` |
| **8. Rules & guardrails** — baked into prompts and surfaced in every report | `config.yaml` |
| **9. Output dashboard** — sections A–H as markdown + a no-server HTML page | `reports/` |
| **10. Weekly report** — best subs/topics/threads, objections, new angles, warm leads | `weekly` |

---

## Quick start (no credentials needed)

The system ships with realistic **sample data** so you can see the full output
immediately, with zero setup:

```bash
cd marketing/reddit-intel
pip install -r requirements.txt          # only PyYAML+requests are required
python3 -m redditintel.cli daily --offline
```

This writes:
- `reports/daily-YYYY-MM-DD.md` — the full dashboard (sections A–G)
- `reports/daily-YYYY-MM-DD.html` — open it in a browser, no server required

Try the rest:

```bash
python3 -m redditintel.cli weekly  --offline          # weekly insights report
python3 -m redditintel.cli posts                       # original post ideas
python3 -m redditintel.cli drafts  --offline           # comment drafts
python3 -m redditintel.cli research --offline          # market research + assets
```

---

## No-app live mode (`--public`)

If you can't create an API app yet, pull live data through Reddit's public
search — no credentials needed:

```bash
python3 -m redditintel.cli daily --public
```

Tradeoffs: best-effort and **rate-limited** (a few requests/minute; may return
429/403; not guaranteed long-term). Run it from a normal/residential network —
datacenter and cloud IPs are often blocked by Reddit for unauthenticated
requests. For reliable, higher-volume pulls, set up the authenticated app below.

## Going live (real Reddit data)

### Reddit API vs scraping — and why this uses the API

| | Official API (this tool) | HTML / `.json` scraping |
|---|---|---|
| Reliability | High — stable, documented | Brittle — markup changes, anti-bot |
| ToS | Supported for reading | Gray area; increasingly blocked |
| Rate limits | Clear, generous for read | Unpredictable IP blocks |
| Setup | ~3 min (free "script" app) | None, but fragile |
| Right call for a **credibility-first brand** | ✅ | ❌ |

A credibility play should not be built on a scraping hack that can get your
brand IP-banned. A free Reddit "script" app is enough for search, so the client
uses OAuth. The client is **read-only by design** — there is no posting code.

### Setup (≈3 minutes)

1. Go to <https://www.reddit.com/prefs/apps> → **create another app…**
   - type: **script**
   - redirect uri: `http://localhost:8080` (unused but required)
2. Copy the **client id** (under the app name) and the **secret**.
3. `cp .env.example .env` and fill in:
   ```
   REDDIT_CLIENT_ID=...
   REDDIT_CLIENT_SECRET=...
   REDDIT_USERNAME=Active_Law_1788              # permanent username (display name: MedicalGrowthOps)
   REDDIT_PASSWORD=...
   REDDIT_USER_AGENT=reddit-intel:funsculpting:v0.1 (by /u/Active_Law_1788)
   ```
4. Run without `--offline`:
   ```bash
   python3 -m redditintel.cli pull          # search + cache today's threads
   python3 -m redditintel.cli daily         # build the dashboard
   ```

If credentials are missing, every command **gracefully falls back** to sample
data so nothing breaks.

### Optional: LLM-written drafts (Claude)

Comment/post drafting and research mapping use **Claude** when available, and
fall back to high-quality templates otherwise. To enable:

```bash
pip install anthropic
export ANTHROPIC_API_KEY=sk-ant-...        # or put it in .env
```

Model and effort are configurable under `llm:` in `config.yaml`
(default `claude-opus-4-8`, adaptive thinking).

---

## Daily workflow

```bash
# 1. Pull fresh threads (caches to data/)
python3 -m redditintel.cli pull

# 2. Build today's dashboard
python3 -m redditintel.cli daily

# 3. Open reports/daily-<date>.html, review section A (Best Threads),
#    edit the drafts in section B, post the ones you like MANUALLY.

# 4. Once a week:
python3 -m redditintel.cli weekly
```

Recommended: schedule `pull` + `daily` each morning via cron, then review the
HTML over coffee. (Scheduling the *generation* is safe — it never posts.)

---

## Configuration

Everything is editable in **`config.yaml`**:

- `subreddits` — add/remove subs; each has a buyer-likelihood `weight` and a
  `risk_profile` (low/medium/high) that drives the recommended action.
- `keywords` — `high_value`, `medium_value`, and `buyer_signal` terms used for
  both **search** and **scoring**.
- `scoring.weights` — tune what the 1–10 score prioritizes.
- `actions` — score thresholds for comment / monitor / save / ignore.
- `comment_style` / `guardrails` — enforced in drafting prompts.
- `account_strategy` — recommended persona handles & positioning.
- `post_idea_seeds` — seeds for the original-post generator.

### How scoring works

Five subscores (0–1) → weighted → mapped to 1–10:

| Subscore | Meaning |
|---|---|
| `relevance` | topical match to FunSculpting buyer conversations |
| `buyer_presence` | subreddit buyer-likelihood + "my practice / our clinic" signals |
| `engagement` | upvotes + comments (log-scaled) |
| `recency` | newer = more actionable |
| `value_add` | is it advice-seeking / can you add value without selling? |

The recommended **action** combines score + subreddit risk: high-risk subs
(e.g. r/medicine) never get an auto "comment" recommendation even at high
scores — they're credibility-only.

---

## Guardrails

Surfaced in every report and baked into every drafting prompt:

- Do not spam · Do not auto-post · Do not fake being a doctor · Do not give
  medical advice · Do not pretend to be a patient · Do not use deceptive
  testimonials · Do not claim clinical outcomes we can't support · Do not
  mention FunSculpting unless strategically appropriate **and approved** · Do
  not drop links in cold comments · Do not DM people automatically · Always
  prioritize credibility over short-term lead generation.

Drafts are additionally **post-filtered** to strip any links or "DM me"
artifacts before they ever reach you.

---

## Project layout

```
marketing/reddit-intel/
├── config.yaml                # the control surface — edit freely
├── .env.example               # Reddit + Anthropic credentials template
├── requirements.txt
├── redditintel/
│   ├── cli.py                 # entry point: pull/daily/weekly/drafts/posts/research
│   ├── config.py              # YAML + .env loading
│   ├── reddit_client.py       # read-only OAuth client (+ offline sample loader)
│   ├── scoring.py             # 1–10 opportunity scoring
│   ├── drafts.py              # comment + post draft generation
│   ├── research.py            # market-research extraction → assets
│   ├── llm.py                 # optional Claude wrapper (template fallback)
│   ├── reports.py             # daily/weekly markdown + HTML dashboard
│   └── sample_posts.json      # realistic offline demo data
├── data/                      # cached pulls (gitignored)
└── reports/                   # generated dashboards (gitignored)
```

## Notes & roadmap

- **MVP scope delivered:** config, search/pull, scoring, daily markdown report
  (+HTML), comment/post draft generator, weekly insights report, market-research
  extraction with Apollo/website/webinar/FAQ mapping.
- Comment/thread **comment-level** monitoring (not just submissions) and
  direct Apollo push are natural next steps — Apollo and Supabase MCP
  integrations are available in this workspace if you want lead capture wired up.
