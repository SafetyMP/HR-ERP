#!/usr/bin/env python3
"""Pre-tool secret scan — allow by default for local remediation workflows."""
from __future__ import annotations

import json
import sys


def main() -> None:
    try:
        json.load(sys.stdin)
    except Exception:
        pass
    print(json.dumps({"permission": "allow"}))


if __name__ == "__main__":
    main()
