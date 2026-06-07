"""Configuration loading: YAML config + .env environment variables."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml

# Project root = the reddit-intel/ directory (parent of this package).
ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "config.yaml"
DATA_DIR = ROOT / "data"
REPORTS_DIR = ROOT / "reports"


def load_dotenv(path: Path | None = None) -> None:
    """Minimal .env loader (no external dependency).

    Only sets variables that aren't already present in the environment.
    """
    env_path = path or (ROOT / ".env")
    if not env_path.exists():
        return
    for raw in env_path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_config(path: Path | None = None) -> dict[str, Any]:
    """Load and lightly validate the YAML config."""
    cfg_path = path or CONFIG_PATH
    if not cfg_path.exists():
        raise FileNotFoundError(f"Config not found at {cfg_path}")
    with cfg_path.open() as fh:
        cfg = yaml.safe_load(fh) or {}

    cfg.setdefault("subreddits", [])
    cfg.setdefault("keywords", {})
    cfg.setdefault("scoring", {}).setdefault("weights", {})
    cfg.setdefault("search", {})
    cfg.setdefault("llm", {})
    cfg.setdefault("guardrails", [])

    # Index subreddits by name for quick lookup of weight / risk.
    cfg["_subreddit_index"] = {s["name"]: s for s in cfg["subreddits"]}
    return cfg


def ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
