#!/usr/bin/env bash
# Read-only audit of GitHub branch protection / rulesets for main.
# Local or workflow_dispatch only — not part of PR Quality gate.
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
BRANCH="${GITHUB_PROTECTION_BRANCH:-main}"

pass=0
fail=0

ok() { echo "  PASS  $*"; pass=$((pass + 1)); }
bad() { echo "  FAIL  $*"; fail=$((fail + 1)); }

echo "== github-protection-audit ($REPO@$BRANCH) =="

ruleset_count=$(gh api "repos/$REPO/rulesets" --jq 'length' 2>/dev/null || echo 0)
if [[ "$ruleset_count" -gt 0 ]]; then
  ok "rulesets non-empty (count=$ruleset_count)"
else
  bad "rulesets empty — prefer a Ruleset on $BRANCH with required checks + PR reviews"
fi

prot_json=$(gh api "repos/$REPO/branches/$BRANCH/protection" 2>/dev/null || echo '{}')

review_count=$(echo "$prot_json" | python3 -c '
import json,sys
d=json.load(sys.stdin)
r=d.get("required_pull_request_reviews") or {}
print(r.get("required_approving_review_count", -1) if r else -1)
' 2>/dev/null || echo -1)

if [[ "$review_count" -ge 1 ]]; then
  ok "classic required_approving_review_count=$review_count"
else
  # Rulesets may enforce reviews instead of classic protection.
  ruleset_reviews=$(gh api "repos/$REPO/rulesets" --jq '
    [ .[] | .rules[]? | select(.type=="pull_request")
      | .parameters.required_approving_review_count // 0 ] | max // 0
  ' 2>/dev/null || echo 0)
  if [[ "$ruleset_reviews" -ge 1 ]]; then
    ok "ruleset pull_request required_approving_review_count=$ruleset_reviews"
  else
    bad "required_approving_review_count < 1 (classic=$review_count ruleset_max=$ruleset_reviews)"
  fi
fi

codeowners=$(echo "$prot_json" | python3 -c '
import json,sys
d=json.load(sys.stdin)
r=d.get("required_pull_request_reviews") or {}
print("1" if r.get("require_code_owner_reviews") else "0")
' 2>/dev/null || echo 0)

if [[ "$codeowners" == "1" ]]; then
  ok "classic require_code_owner_reviews=true"
else
  ruleset_co=$(gh api "repos/$REPO/rulesets" --jq '
    any(.[]; any(.rules[]?; .type=="pull_request" and (.parameters.require_code_owner_review == true)))
  ' 2>/dev/null || echo false)
  if [[ "$ruleset_co" == "true" ]]; then
    ok "ruleset require_code_owner_review=true"
  else
    bad "CODEOWNERS reviews not required (provision teams in CODEOWNERS first)"
  fi
fi

# Required checks: classic contexts or ruleset required_status_checks
contexts=$(echo "$prot_json" | python3 -c '
import json,sys
d=json.load(sys.stdin)
rsc=d.get("required_status_checks") or {}
ctxs=rsc.get("contexts") or rsc.get("checks") or []
if ctxs and isinstance(ctxs[0], dict):
  print("\n".join(c.get("context","") for c in ctxs))
else:
  print("\n".join(ctxs))
' 2>/dev/null || true)

required_needles=(
  "ci / web"
  "python-pipelines"
  "vitest-shard"
  "integration"
  "e2e"
)

checks_ok=1
for needle in "${required_needles[@]}"; do
  if echo "$contexts" | grep -qiF "$needle"; then
    ok "classic required check mentions '$needle'"
  else
    # Also scan ruleset required_status_checks if present on expanded rulesets
    found=$(gh api "repos/$REPO/rulesets" --jq --arg n "$needle" '
      any(.[]; any(.rules[]?;
        .type=="required_status_checks" and
        any((.parameters.required_status_checks // [])[];
          ((.context // .name // "") | ascii_downcase) | contains(($n | ascii_downcase)))))
    ' 2>/dev/null || echo false)
    if [[ "$found" == "true" ]]; then
      ok "ruleset required check mentions '$needle'"
    else
      bad "missing required check covering '$needle' (classic contexts empty or mismatched)"
      checks_ok=0
    fi
  fi
done

echo "-> $pass passed, $fail failed"
if [[ "$fail" -gt 0 ]]; then
  echo "-> apply Settings per docs/community/github-branch-protection.md then re-run"
  exit 1
fi
echo "-> github protection audit OK"
exit 0
