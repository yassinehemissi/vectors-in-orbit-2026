from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from openai import OpenAI

from .config import OpenAIConfig


@dataclass
class LLMClient:
    config: OpenAIConfig

    def _client(self) -> OpenAI:
        import os

        api_key = os.getenv(self.config.api_key_env)
        if not api_key:
            raise ValueError(f"Missing {self.config.api_key_env}")
        base_url = os.getenv(self.config.base_url_env) or self.config.base_url_default
        return OpenAI(api_key=api_key, base_url=base_url, timeout=self.config.timeout_sec)

    def chat_json(self, model: str, messages: list[dict], temperature: float = 0.2) -> Any:
        client = self._client()
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
        )
        raw = resp.choices[0].message.content or ""
        data = _safe_json(raw)
        if data is not None:
            return data
        # one retry with explicit instruction
        retry_msgs = messages + [
            {"role": "system", "content": "Return STRICT JSON only. No markdown. No prose."}
        ]
        resp = client.chat.completions.create(
            model=model,
            messages=retry_msgs,
            temperature=0.0,
        )
        return _safe_json(resp.choices[0].message.content or "")


def _safe_json(text: str) -> Any:
    try:
        return json.loads(text)
    except Exception:
        return None
