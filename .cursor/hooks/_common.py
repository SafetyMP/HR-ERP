"""Shared helpers for Python Cursor hooks."""
from __future__ import annotations

import json
import sys
from typing import Any


def read_stdin_json() -> dict[str, Any]:
    try:
        data = json.load(sys.stdin)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def allow() -> None:
    print(json.dumps({"permission": "allow"}))


def deny(message: str) -> None:
    print(json.dumps({"permission": "deny", "user_message": message}))
