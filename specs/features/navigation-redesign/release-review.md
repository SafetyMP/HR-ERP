# Independent release review

## Scope and authority

The user explicitly requested dependency remediation, complete release checks, and GitHub Pages publication after checks pass. Implementation choices remain agent decisions within that request. Source PR remains open to avoid a separate Vercel production deployment. T3 classification is triggered by the standalone payroll package dependency manifests; its calculation implementation is unchanged.

## Completed independent evidence

- `navigation_audit` independently reviewed application navigation and ran 14 navigation/home tests; no actionable findings remained in that review.
- `home_redesign` independently reviewed the static demo and confirmed earlier path/focus findings were repaired.
- `navigation_audit` independently reviewed the local deepmerge patch, reproduced both upstream poisoning paths, ran 12 regression cases and 1,500 ordinary-data differential cases, and verified installed html-to-text resolution. No patch defect found.
- `navigation_audit` verified all seven minimatch consumers and compatible brace exports. Authentication compatibility findings from the initial review were treated as blockers and repaired; the final adapter review is recorded below when complete.
- `static_demo` implemented only the payroll package manifest/lock updates. Isolated clean npm install and audit passed with zero known findings; all 16 existing tests passed.
- `home_redesign` independently verified the payroll manifests match the tested artifacts and all 20 other tracked package files remain byte-identical, including source, tests, math, tax tables, canonical serialization and fingerprints. Every resolved dependency is development-only; runtime exports/version are unchanged. No findings.

## Counsel applicability / legal checklist

The independent `home_redesign` assessment is an engineering scope review, not professional counsel approval. No wage, overtime, tax, rounding, withholding, jurisdiction or employment-policy interpretation changes. No new worker category, PII field, retention rule, biometric/health data or I-9/immigration touchpoint is introduced. Existing pure calculation code, bigint money handling, rational rates, semantic version, canonical input fingerprints and golden vectors are unchanged. The regulated payroll drill applies when pay math or persisted pay/time behavior changes; it is not applicable to these development dependency updates. No new legal source interpretation is required by this scope.

## Verification boundaries

The coordinator's complete clean-install gate passed 267 unit, 9 UI and 16 payroll tests; ten database-dependent cases were skipped locally. Four application navigation and four static demo browser scenarios passed. Root npm audit reported zero known findings. The standalone payroll audit and tests are separately verified. Remote integration/database tests passed for the initial PR commit, but the final commit must pass again.

The first remote run identified a preview-server file-check/read race, one synthetic test secret flagged by gitleaks, and two outdated/ambiguous UI selectors. Those are being repaired without suppressing gates; final exact-commit remote results and live publication evidence belong in PR #237. No green remote release, provider integration or customer usability outcome is inferred from local tests.

## Final adapter and release repair review

`navigation_audit` completed the final read-only review with no blocking findings. The upstream token endpoint requires the authenticated session and searches only that user's accounts by internal row ID; the route and real-SDK tests preserve this boundary and fail closed. The preview server inspects and reads the same opened descriptor with O_NOFOLLOW. The valid HR alert list, exact browser selectors and repeated synthetic fixture repairs were also reviewed. This completes local output review; publication remains gated on final exact-commit remote checks.
