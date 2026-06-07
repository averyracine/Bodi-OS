"""Reddit access.

Two modes:
  1. Authenticated search via the official OAuth API (recommended). Uses a
     "script" app + your persona account. Reliable and ToS-compliant for read.
  2. Offline / sample mode — loads bundled sample posts so the entire pipeline
     (scoring, drafting, reports) is demonstrable with zero credentials.

We deliberately do NOT implement any write/post capability here. This client
is read-only by design: research in, drafts out, human posts manually.

--- Why OAuth API and not scraping? ----------------------------------------
Reddit's API is the supported, rate-limited, ToS-aligned path for reading
public content, and a free "script" app is enough for search. Scraping HTML or
hitting the old `.json` endpoints without auth is increasingly blocked, brittle,
and a ToS gray area. For a credibility-first brand play, stay on the API.
"""

from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

import requests

from .config import DATA_DIR

USER_AGENT_FALLBACK = "reddit-intel:funsculpting:v0.1"
OAUTH_TOKEN_URL = "https://www.reddit.com/api/v1/access_token"
OAUTH_API_BASE = "https://oauth.reddit.com"


@dataclass
class Post:
    """Normalized Reddit submission."""

    id: str
    subreddit: str
    title: str
    selftext: str
    author: str
    url: str
    permalink: str
    score: int
    num_comments: int
    created_utc: float
    matched_keywords: list[str] = field(default_factory=list)

    @property
    def full_permalink(self) -> str:
        return f"https://www.reddit.com{self.permalink}"

    @property
    def text(self) -> str:
        return f"{self.title}\n\n{self.selftext}".strip()


class RedditAuthError(RuntimeError):
    pass


class RedditClient:
    """Thin OAuth read client for Reddit search."""

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        username: str,
        password: str,
        user_agent: str = USER_AGENT_FALLBACK,
    ) -> None:
        self.client_id = client_id
        self.client_secret = client_secret
        self.username = username
        self.password = password
        self.user_agent = user_agent or USER_AGENT_FALLBACK
        self._token: str | None = None
        self._token_expiry: float = 0.0

    @classmethod
    def from_env(cls, env: dict[str, str] | None = None) -> "RedditClient":
        import os

        e = env or os.environ
        missing = [
            k
            for k in (
                "REDDIT_CLIENT_ID",
                "REDDIT_CLIENT_SECRET",
                "REDDIT_USERNAME",
                "REDDIT_PASSWORD",
            )
            if not e.get(k)
        ]
        if missing:
            raise RedditAuthError(
                "Missing Reddit credentials: "
                + ", ".join(missing)
                + ". See .env.example, or run with --offline to use sample data."
            )
        return cls(
            client_id=e["REDDIT_CLIENT_ID"],
            client_secret=e["REDDIT_CLIENT_SECRET"],
            username=e["REDDIT_USERNAME"],
            password=e["REDDIT_PASSWORD"],
            user_agent=e.get("REDDIT_USER_AGENT", USER_AGENT_FALLBACK),
        )

    def _ensure_token(self) -> str:
        if self._token and time.time() < self._token_expiry - 60:
            return self._token
        resp = requests.post(
            OAUTH_TOKEN_URL,
            auth=(self.client_id, self.client_secret),
            data={
                "grant_type": "password",
                "username": self.username,
                "password": self.password,
            },
            headers={"User-Agent": self.user_agent},
            timeout=30,
        )
        if resp.status_code != 200:
            raise RedditAuthError(
                f"Reddit auth failed ({resp.status_code}): {resp.text[:200]}"
            )
        payload = resp.json()
        self._token = payload["access_token"]
        self._token_expiry = time.time() + int(payload.get("expires_in", 3600))
        return self._token

    def _get(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        token = self._ensure_token()
        resp = requests.get(
            f"{OAUTH_API_BASE}{path}",
            params=params,
            headers={
                "Authorization": f"bearer {token}",
                "User-Agent": self.user_agent,
            },
            timeout=30,
        )
        if resp.status_code == 429:
            time.sleep(2)
            resp = requests.get(
                f"{OAUTH_API_BASE}{path}",
                params=params,
                headers={
                    "Authorization": f"bearer {token}",
                    "User-Agent": self.user_agent,
                },
                timeout=30,
            )
        resp.raise_for_status()
        return resp.json()

    def search_subreddit(
        self,
        subreddit: str,
        query: str,
        *,
        time_filter: str = "week",
        sort: str = "relevance",
        limit: int = 25,
    ) -> list[Post]:
        """Search a single subreddit for a query string."""
        data = self._get(
            f"/r/{subreddit}/search",
            {
                "q": query,
                "restrict_sr": "true",
                "sort": sort,
                "t": time_filter,
                "limit": limit,
                "type": "link",
            },
        )
        posts: list[Post] = []
        for child in data.get("data", {}).get("children", []):
            d = child.get("data", {})
            posts.append(
                Post(
                    id=d.get("id", ""),
                    subreddit=d.get("subreddit", subreddit),
                    title=d.get("title", ""),
                    selftext=d.get("selftext", "") or "",
                    author=d.get("author", "") or "[deleted]",
                    url=d.get("url", ""),
                    permalink=d.get("permalink", ""),
                    score=int(d.get("score", 0) or 0),
                    num_comments=int(d.get("num_comments", 0) or 0),
                    created_utc=float(d.get("created_utc", 0) or 0),
                )
            )
        # Be polite to the API.
        time.sleep(1.0)
        return posts


# --------------------------------------------------------------------------- #
# Sample / offline data so the pipeline runs with no credentials.
# --------------------------------------------------------------------------- #
def load_sample_posts() -> list[Post]:
    sample_path = Path(__file__).resolve().parent / "sample_posts.json"
    raw = json.loads(sample_path.read_text())
    posts = []
    for d in raw:
        d.setdefault("matched_keywords", [])
        posts.append(Post(**d))
    return posts


def posts_to_json(posts: list[Post]) -> list[dict[str, Any]]:
    return [asdict(p) for p in posts]


def save_pull(posts: list[Post], label: str) -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / f"pull-{label}.json"
    path.write_text(json.dumps(posts_to_json(posts), indent=2))
    return path


def load_pull(path: Path) -> list[Post]:
    raw = json.loads(Path(path).read_text())
    out = []
    for d in raw:
        d.setdefault("matched_keywords", [])
        out.append(Post(**{k: d[k] for k in d if k in Post.__annotations__}))
    return out
