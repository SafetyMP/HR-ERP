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

ruleset_ids=$(gh api "repos/$REPO/rulesets" --jq '.[].id' 2>/dev/null || true)
ruleset_count=$(echo "$ruleset_ids" | grep -c '^[0-9]' || true)
if [[ "$ruleset_count" -gt 0 ]]; then
  ok "rulesets non-empty (count=$ruleset_count)"
else
  bad "rulesets empty — prefer a Ruleset on $BRANCH with required checks + PR reviews"
fi

# Expand each ruleset (list endpoint omits rule parameters).
ruleset_json='[]'
for id in $ruleset_ids; do
  one=$(gh api "repos/$REPO/rulesets/$id" 2>/dev/null || echo '{}')
  ruleset_json=$(RULESET_ONE="$one" RULESETS="$ruleset_json" python3 -c '
import json,os
arr=json.loads(os.environ["RULESETS"])
arr.append(json.loads(os.environ["RULESET_ONE"]))
print(json.dumps(arr))
')
done

prot_json=$(gh api "repos/$REPO/branches/$BRANCH/protection" 2>/dev/null || echo '{}')

review_count=$(echo "$prot_json" | python3 -c '
import json,sys
d=json.load(sys.stdin)
r=d.get("required_pull_request_reviews") or {}
print(r.get("required_approving_review_count", -1) if r else -1)
' 2>/dev/null || echo -1)

ruleset_reviews=$(RULESETS="$ruleset_json" python3 -c '
import json,os
arr=json.loads(os.environ["RULESETS"])
vals=[]
for rs in arr:
  for rule in rs.get("rules") or []:
    if rule.get("type")=="pull_request":
      vals.append((rule.get("parameters") or {}).get("required_approving_review_count") or 0)
print(max(vals) if vals else 0)
')

# Solo personal accounts cannot self-approve: PR gate with 0 reviews is OK.
# Require reviews/CODEOWNERS only when configured (org / multi-reviewer).
has_pr_gate=$(RULESETS="$ruleset_json" python3 -c '
import json,os
arr=json.loads(os.environ["RULESETS"])
print("true" if any(r.get("type")=="pull_request" for rs in arr for r in (rs.get("rules") or [])) else "false")
')

if [[ "$review_count" -ge 1 ]]; then
  ok "classic required_approving_review_count=$review_count"
elif [[ "$ruleset_reviews" -ge 1 ]]; then
  ok "ruleset pull_request required_approving_review_count=$ruleset_reviews"
elif [[ "$has_pr_gate" == "true" ]]; then
  ok "ruleset pull_request gate present (required_approving_review_count=$ruleset_reviews; solo-owner OK)"
else
  bad "no pull_request gate and required_approving_review_count < 1 (classic=$review_count ruleset_max=$ruleset_reviews)"
fi

codeowners=$(echo "$prot_json" | python3 -c '
import json,sys
d=json.load(sys.stdin)
r=d.get("required_pull_request_reviews") or {}
print("1" if r.get("require_code_owner_reviews") else "0")
' 2>/dev/null || echo 0)

ruleset_co=$(RULESETS="$ruleset_json" python3 -c '
import json,os
arr=json.loads(os.environ["RULESETS"])
print("true" if any(
  (r.get("type")=="pull_request" and (r.get("parameters") or {}).get("require_code_owner_review") is True)
  for rs in arr for r in (rs.get("rules") or [])
) else "false")
')

if [[ "$codeowners" == "1" ]]; then
  ok "classic require_code_owner_reviews=true"
elif [[ "$ruleset_co" == "true" ]]; then
  ok "ruleset require_code_owner_review=true"
elif [[ "$has_pr_gate" == "true" ]]; then
  ok "CODEOWNERS review not required (solo-owner; enable after org/multi-reviewer)"
else
  bad "CODEOWNERS reviews not required and no pull_request gate"
fi

contexts=$(echo "$prot_json" | python3 -c '
import json,sys
d=json.load(sys.stdin)
rsc=d.get("required_status_checks") or {}
ctxs=rsc.get("contexts") or rsc.get("checks") or []
if ctxs and isinstance(ctxs[0], dict):
  print("\n".join(c.get("context","") for c in ctxs))
else:
  print("\n".join(str(c) for c in ctxs))
' 2>/dev/null || true)

ruleset_contexts=$(RULESETS="$ruleset_json" python3 -c '
import json,os
arr=json.loads(os.environ["RULESETS"])
names=[]
for rs in arr:
  for rule in rs.get("rules") or []:
    if rule.get("type")!="required_status_checks":
      continue
    for c in (rule.get("parameters") or {}).get("required_status_checks") or []:
      names.append(c.get("context") or c.get("name") or "")
print("\n".join(names))
')

all_contexts=$(printf '%s\n%s\n' "$contexts" "$ruleset_contexts")

required_needles=(
  "ci / web"
  "python-pipelines"
  "vitest-shard"
  "integration"
  "e2e"
)

for needle in "${required_needles[@]}"; do
  if echo "$all_contexts" | grep -qiF "$needle"; then
    ok "required check mentions '$needle'"
  else
    bad "missing required check covering '$needle'"
  fi
done

echo "-> $pass passed, $fail failed"
if [[ "$fail" -gt 0 ]]; then
  echo "-> apply Settings per docs/community/github-branch-protection.md then re-run"
  exit 1
fi
echo "-> github protection audit OK"
exit 0
