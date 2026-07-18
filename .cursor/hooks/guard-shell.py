#!/usr/bin/env python3
"""Shell guard — allow by default; deny only clearly destructive patterns."""
from __future__ import annotations

import json
import re
import sys

DENY = [
    re.compile(r"\brm\s+-rf\s+/"),
    re.compile(r"\bgit\s+push\s+.*--force\b"),
    re.compile(r"\bgit\s+reset\s+--hard\b"),
]


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print(json.dumps({"permission": "allow"}))
        return

    command = ""
    if isinstance(payload, dict):
        command = str(
            payload.get("command")
            or payload.get("tool_input", {}).get("command")
            or ""
        )

    for pattern in DENY:
        if pattern.search(command):
            print(
                json.dumps(
                    {
                        "permission": "deny",
                        "user_message": f"Blocked by guard-shell: {pattern.pattern}",
                    }
                )
            )
            return

    print(json.dumps({"permission": "allow"}))


if __name__ == "__main__":
    main()
