# Release candidate review

User direction supersedes the earlier Vercel redeploy request: retain the application package, deprecate Vercel demo hosting, and use GitHub Pages. No branch protection change, new privileged credential, backend mutation, or deletion of existing Vercel resources is part of this repair.

## Independent review

Native `release_review` independently reviewed the integrated changes against main. It found a container `latest` ordering race; `release_design` added a repository-wide job concurrency group, which the reviewer rechecked. Final review reported no remaining merge blockers. It independently ran 11 release-gate tests and additional negative probes for missing/pending jobs, stale main, and PR execution; all behaved as required. The reviewer did not implement these changes. This is engineering review evidence, not a claimed human approval.

## Local verification

`./scripts/verify.sh` passed on 2026-11-14: clean npm install; zero known audit findings; lint, typecheck, security/governance, contracts, Prisma generation, application build, 278 unit tests (10 configured DB-dependent skips), 9 UI tests, and 16 payroll tests. No local database was configured; integration and end-to-end results require remote CI. Log: ignored `artifacts/dependency-release/package-pages-verify.log`.

Official actionlint 1.7.12, downloaded from its GitHub release and checked against its published checksum, passed all four changed workflow files. `git diff --check` passed. Required governance classification is T2/release_ops. No package dependency or payroll calculation source changed.

## External acceptance still required

Required PR and main CI/QA, hosted Pages source identity/browser checks, successful tag/release and signed container publication, and unchanged branch-protection/ruleset snapshots remain separate application milestones. The historical successful PR #237 deployment is not proof for this candidate. Record final observed identities and results in the PR and ignored `artifacts/dependency-release/` receipts.

## Security follow-up before merge

The first candidate's CodeQL analysis reported alert #84 (`js/file-access-to-http`): an event-file SHA reached a GitHub request URL. The follow-up removes whole-event-file ingestion, passes only six explicit workflow identity fields through the same validation, and restricts authenticated requests to fixed GitHub read endpoints with redirects refused. Independent `release_review` re-reviewed the change and ran 13 targeted tests plus URL-escape and manual-trigger probes; no blocking findings remained. Typecheck, targeted lint, actionlint, and diff checks passed. Remote CodeQL must establish that alert #84 is fixed on the replacement commit before merge; the earlier successful job status alone was insufficient.

## Container build-context follow-up

After PR #238 merged, main validation, hosted Pages browser checks, and semantic release succeeded at `350c310`; tag `v2.15.0` identifies that exact commit and main did not receive a version-bump commit. All 33 hosted files matched the main artifact. The container job then failed before push/signing: `.dockerignore` excluded `.cursor/hooks`, while the unchanged TypeScript project includes governance tests that import those modules. The missing imports are a build-input defect, not a reason to disable typechecking.

The follow-up retains only `.cursor/hooks` in the build context, preserving the exclusions for other Cursor configuration/state. A no-push AMD64 full-image build is added to reusable CI so this build path runs in PR and main gates before future release publication. Existing required check names and branch protections remain unchanged. Verification for this follow-up must include isolated TypeScript context reproduction, independent review, the full local gate, an actual remote container build, and a successful later package publication; `v2.15.0` container publication remains a recorded failed attempt and its tag is not moved.

Inspection also found an obsolete final-stage copy of `node_modules/.prisma`: this project's `prisma-client` generator writes to `src/app/generated/prisma` instead. The copy is removed; the generated application client remains in Next's standalone bundle and the existing `@prisma` runtime copy is retained. CI now loads the full image and probes its unauthenticated `/api/health` endpoint, without a database or credentials. This is packaged liveness evidence, not backend/tenant acceptance.

Follow-up local results: the full repository gate passed again (280 unit tests, 9 UI tests, 16 payroll tests; 10 configured DB skips). In an isolated source snapshot with normal Prisma output, excluding hook source produced exactly the four observed TS2307 errors; restoring only the hook directory made TypeScript pass. Actionlint and diff checks passed. This does not substitute for the remote full-image build and smoke check.

Independent `release_review` approved the follow-up with no blockers, including the narrow Docker context exception, current Prisma generator output, read-only/no-push CI, and loopback liveness probe. Each HTTP probe has a five-second timeout. No branch-protection change is required.
