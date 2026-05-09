## [2.0.5](https://github.com/SafetyMP/HR-ERP/compare/v2.0.4...v2.0.5) (2026-05-09)

### Bug Fixes

* use vercel env run for jwt:dev:vercel (encrypted secrets) ([bfaa51b](https://github.com/SafetyMP/HR-ERP/commit/bfaa51b863dff72a6543f99387e8205de29bc050))

## [2.0.4](https://github.com/SafetyMP/HR-ERP/compare/v2.0.3...v2.0.4) (2026-05-09)

### Bug Fixes

* **vercel:** drop experimentalServices to fix Deploying outputs failures ([ab132e7](https://github.com/SafetyMP/HR-ERP/commit/ab132e7ad7ee7780105fe42dcb6c9cac7bbb2a05))

## [2.0.3](https://github.com/SafetyMP/HR-ERP/compare/v2.0.2...v2.0.3) (2026-05-09)

### Bug Fixes

* **ci:** trim JWT_SECRET before vercel build ([b6c6499](https://github.com/SafetyMP/HR-ERP/commit/b6c64990da72240fe6557926b126aee573e30a24))

## [2.0.2](https://github.com/SafetyMP/HR-ERP/compare/v2.0.1...v2.0.2) (2026-05-09)

### Bug Fixes

* **ci:** pass JWT_SECRET from GitHub production env for prebuilt Vercel build ([8bb51fa](https://github.com/SafetyMP/HR-ERP/commit/8bb51fa036ef6e146c90f15de8f420af687319e7))

## [2.0.1](https://github.com/SafetyMP/HR-ERP/compare/v2.0.0...v2.0.1) (2026-05-09)

### Bug Fixes

* **deploy:** use Vercel JWT_SECRET in prebuilt Edge middleware ([bec2ec8](https://github.com/SafetyMP/HR-ERP/commit/bec2ec89f865e7422cf4a120f3f4ffba7beb54f4))

## [2.0.0](https://github.com/SafetyMP/HR-ERP/compare/v1.1.0...v2.0.0) (2026-05-09)

### ⚠ BREAKING CHANGES

* **security:** remove HTTP JWT mint endpoint and bearer issuer

### Bug Fixes

* **security:** remove HTTP JWT mint endpoint and bearer issuer ([7914996](https://github.com/SafetyMP/HR-ERP/commit/7914996f77481f0bf408f81115494c9c2ca82a41))

## [1.1.0](https://github.com/SafetyMP/HR-ERP/compare/v1.0.0...v1.1.0) (2026-05-09)

### Features

* **auth:** POST /api/auth/token with issuer secret for access JWTs ([7458ef1](https://github.com/SafetyMP/HR-ERP/commit/7458ef100131ad0376c4272680ed5bc1453b5726))

## 1.0.0 (2026-05-09)

### Features

* employee HR self-service through profiles, pay, PTO, leave, onboarding ([1ee2636](https://github.com/SafetyMP/HR-ERP/commit/1ee26362470972fa2ecf2801672c9c943dd27472))
* HR ERP scaffold — Next.js app, Prisma, workers, contracts, docs ([f72a488](https://github.com/SafetyMP/HR-ERP/commit/f72a4883b983a1925c51255d90b5ef9b61ef3366))
* **hr:** phase 2 next slate workflows and UI ([97145c5](https://github.com/SafetyMP/HR-ERP/commit/97145c578bdd97d2c5305da6dd1ca7e7aef701e4))
* OpenAPI + e2e parity for features 006–010 and stable demo manager id ([5f937e7](https://github.com/SafetyMP/HR-ERP/commit/5f937e7821e630e76c3872f5a692b36d575eef6d))
* **vercel:** add experimentalServices for Next.js and ml-serving ([1f0e4b2](https://github.com/SafetyMP/HR-ERP/commit/1f0e4b24e963dc5bca7e4016b174f5aa4501380a))

### Bug Fixes

* **db:** attendance_punches migration RLS only (baseline owns DDL) ([bc23e16](https://github.com/SafetyMP/HR-ERP/commit/bc23e16d7716a06f4364898cd955c283196c2b9e))
* JSON-safe v1 bearer auth, dev JWT flow, and accessible UI ([5e943bb](https://github.com/SafetyMP/HR-ERP/commit/5e943bb6c7d0a6df26e87cfe2dcb131c7635f9c3))
* **jurisdiction-form:** align zod record with useForm resolver types ([e30c394](https://github.com/SafetyMP/HR-ERP/commit/e30c394416763ae290ecc73ccf06195558956773))
* **ml-serving:** expose FastAPI as top-level app for Vercel ([b341783](https://github.com/SafetyMP/HR-ERP/commit/b34178395c0caa6578d6968e40297da834182ccf))
* **prisma:** lazy-init client so next build works without DATABASE_URL ([967658f](https://github.com/SafetyMP/HR-ERP/commit/967658fd7f37c2924a04b1b087e3a276eb13a50b))

# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Releases are automated with **[`semantic-release`](https://github.com/semantic-release/semantic-release)** on **`main` / `master`** ([`.github/workflows/semantic-release.yml`](.github/workflows/semantic-release.yml)): Conventional Commits drive semver, this file, and **`v*`** GitHub Releases (which trigger [`publish-ghcr.yml`](.github/workflows/publish-ghcr.yml) for container images).

## [Unreleased]

- GitHub repository governance scaffolding (SECURITY, Conduct, consolidated workflows, Dependabot defaults).
- **security:** remove `POST /api/auth/token` bearer-issuer mint flow; use local `jwt:dev` (same `JWT_SECRET` as target env) or IdP integration when added.
- **deploy:** production prebuilt Vercel build uses GitHub Environment `JWT_SECRET` (must match Vercel Production) so Edge middleware inlines the real secret; assert step fails fast if unset.
- **deploy:** strip `JWT_SECRET` whitespace in CI before `vercel build` to avoid newline/paste-related failures and signature drift.
- **vercel:** drop `experimentalServices` (Next + Python) from `vercel.json` — builds completed but **Deploying outputs** repeatedly errored; use `ML_SERVING_URL` for churn FastAPI instead.
