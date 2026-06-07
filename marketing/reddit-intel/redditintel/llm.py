"""Optional Claude wrapper for drafting and research extraction.

If the `anthropic` SDK is installed AND ANTHROPIC_API_KEY is set AND
llm.enabled is true, we use Claude. Otherwise every caller falls back to a
deterministic template so the system always works offline.

Model defaults to claude-opus-4-8 with adaptive thinking (see config.llm).
"""

from __future__ import annotations

import os
from typing import Any


class LLM:
    def __init__(self, cfg: dict[str, Any]) -> None:
        llm_cfg = cfg.get("llm", {})
        self.model = llm_cfg.get("model", "claude-opus-4-8")
        self.effort = llm_cfg.get("effort", "medium")
        self.enabled = bool(llm_cfg.get("enabled", True))
        self._client = None
        self.available = False
        self._init_client()

    def _init_client(self) -> None:
        if not self.enabled:
            return
        if not os.environ.get("ANTHROPIC_API_KEY"):
            return
        try:
            import anthropic  # noqa: F401
        except ImportError:
            return
        try:
            import anthropic

            self._client = anthropic.Anthropic()
            self.available = True
        except Exception:
            self.available = False

    def complete(self, system: str, prompt: str, *, max_tokens: int = 1200) -> str | None:
        """Return text, or None if the LLM is unavailable / errored."""
        if not self.available or self._client is None:
            return None
        try:
            resp = self._client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                thinking={"type": "adaptive"},
                output_config={"effort": self.effort},
                system=system,
                messages=[{"role": "user", "content": prompt}],
            )
            parts = [b.text for b in resp.content if getattr(b, "type", "") == "text"]
            text = "\n".join(parts).strip()
            return text or None
        except Exception:
            # Never let a drafting failure break the pipeline.
            return None
