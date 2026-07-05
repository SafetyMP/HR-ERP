#!/usr/bin/env bash
# OSS publish metadata + agent-harness audit for HR ERP.
#
# HR ERP intentionally ships an in-repo agent harness (.cursor/hooks.json, mcp.json,
# skills/, governance/) — see docs/meta/evergreen-open-source-positioning.md.
# Generic `harness publish-doctor` warns on hooks/mcp; this script applies the
# repo-specific policy and is the CI gate.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
pass=0
ok() { echo "  ok   $1: $2"; pass=$((pass + 1)); }
bad() { echo "  FAIL $1: $2"; fail=$((fail + 1)); }

echo "== publish-check ($ROOT) =="

# git remote origin → GitHub
origin_slug=""
if origin="$(git remote get-url origin 2>/dev/null || true)" && [[ -n "$origin" ]]; then
  if [[ "$origin" =~ github\.com[:/]([^/]+/[^/.]+) ]]; then
    origin_slug="$(echo "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')"
    ok "git-remote-origin" "origin → $origin_slug"
  else
    bad "git-remote-origin" "origin URL not recognized as GitHub: $origin"
  fi
else
  bad "git-remote-origin" "No git remote 'origin'"
fi

# package.json repository (optional)
if [[ -f package.json ]]; then
  pkg_slug="$(python3 - <<'PY' 2>/dev/null || true
import json, re, sys
from pathlib import Path
pkg = json.loads(Path("package.json").read_text())
repo = pkg.get("repository")
url = repo if isinstance(repo, str) else (repo or {}).get("url") if isinstance(repo, dict) else None
if not url:
    sys.exit(0)
for pat in (r"^git@github\.com:([^/]+/[^/]+)", r"^https?://github\.com/([^/]+/[^/]+)"):
    m = re.match(pat, url.strip().removesuffix(".git"), re.I)
    if m:
        print(m.group(1).lower())
        break
PY
)"
  if [[ -z "$pkg_slug" ]]; then
    bad "package-repository" "package.json missing or has no parseable repository.url"
  elif [[ -n "$origin_slug" && "$pkg_slug" != "$origin_slug" ]]; then
    bad "package-repository" "package.json repository ($pkg_slug) ≠ origin ($origin_slug)"
  else
    ok "package-repository" "package.json repository → $pkg_slug"
  fi
else
  ok "package-repository" "No package.json — skipped repository.url check"
fi

# CI workflows
wf="$ROOT/.github/workflows"
if [[ ! -d "$wf" ]]; then
  bad "ci-workflows" "No .github/workflows/"
else
  count="$(find "$wf" -maxdepth 1 \( -name '*.yml' -o -name '*.yaml' \) | wc -l | tr -d ' ')"
  if [[ "$count" -gt 0 ]]; then
    ok "ci-workflows" "$count workflow file(s) in .github/workflows/"
  else
    bad "ci-workflows" ".github/workflows/ exists but has no .yml/.yaml files"
  fi
fi

# OSS files
missing=()
for f in LICENSE README.md SECURITY.md; do
  [[ -f "$ROOT/$f" ]] || missing+=("$f")
done
if ((${#missing[@]})); then
  bad "oss-files" "Missing OSS files: ${missing[*]}"
else
  ok "oss-files" "OSS files present: LICENSE, README.md, SECURITY.md"
fi

# .opencode/
if [[ -d "$ROOT/.opencode" ]]; then
  bad "agent-harness-opencode" ".opencode/ present — keep OpenCode harness local unless intentional"
else
  ok "agent-harness-opencode" "No .opencode/ — agent harness not in tree (OK for public app repos)"
fi

# .cursor/ — HR ERP ships in-repo harness intentionally
cursor="$ROOT/.cursor"
if [[ ! -d "$cursor" ]]; then
  bad "agent-harness-cursor" "Missing .cursor/ — HR ERP is a harness reference app; ship curated .cursor/"
else
  harness_issues=()

  [[ -d "$cursor/rules" ]] || harness_issues+=("missing .cursor/rules/")
  [[ -f "$cursor/hooks.json" ]] || harness_issues+=("missing .cursor/hooks.json (governance hooks)")
  [[ -f "$cursor/mcp.json" ]] || harness_issues+=("missing .cursor/mcp.json (team MCP allowlist)")
  [[ -d "$cursor/skills" ]] || harness_issues+=("missing .cursor/skills/")
  [[ -f "$cursor/governance/governance-manifest.yaml" ]] || harness_issues+=("missing governance-manifest.yaml")

  if git ls-files --error-unmatch .cursor/agents >/dev/null 2>&1 || [[ -d "$cursor/agents" && -n "$(git ls-files .cursor/agents/ 2>/dev/null)" ]]; then
    harness_issues+=("tracked .cursor/agents/ — keep custom agents local")
  fi

  path_hits=()
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    if grep -qE '"/Users/|"/home/|file:///Users/|file:///home/' "$f" 2>/dev/null; then
      path_hits+=("$f")
    fi
  done < <(git ls-files '.cursor/' 2>/dev/null || true)

  if ((${#path_hits[@]})); then
    harness_issues+=("absolute home paths in: ${path_hits[*]}")
  fi

  if ((${#harness_issues[@]})); then
    bad "agent-harness-cursor" "${harness_issues[*]}"
  else
    ok "agent-harness-cursor" "in-repo harness audited (rules/, hooks.json, mcp.json, skills/, governance/)"
  fi
fi

# No absolute home paths in committed governance learning JSON (machine-specific artifacts)
path_hits=()
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if grep -qE '"/Users/|"/home/' "$f" 2>/dev/null; then
    path_hits+=("$f")
  fi
done < <(git ls-files 'specs/governance/learning/**/*.json' 2>/dev/null || true)

if ((${#path_hits[@]})); then
  bad "learning-path-redaction" "Absolute home paths in: ${path_hits[*]}"
else
  ok "learning-path-redaction" "No absolute /Users or /home paths in tracked learning JSON"
fi

echo "  -> $pass passed, $fail failed"
if [[ "$fail" -gt 0 ]]; then
  echo "  -> fix before claiming OSS-ready"
  exit 1
fi
echo "  -> publish metadata OK (HR ERP harness policy)"
exit 0
