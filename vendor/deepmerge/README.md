# Local deepmerge security fork

`deepmerge@4.3.1-patched.1` is an HR ERP-maintained local fork of upstream **4.3.1**, not an upstream release or a claim that an upstream patched version exists. The package retains the MIT license and upstream TypeScript declarations. The standalone CommonJS file contains the upstream bundled mergeability helper and requires no runtime dependencies.

## Provenance

- Upstream project: <https://github.com/TehShrike/deepmerge>
- Original package: <https://registry.npmjs.org/deepmerge/-/deepmerge-4.3.1.tgz>
- Original lockfile integrity: `sha512-3sUqbMEc77XqpdNO7FRyRog+eW3ph+GYCbj+rK+uYyRMuwsVy0rMiVtPn+QJlKFvWP/1PYpapqYn0Me2knFn+A==`
- Source copied from the installed locked package on November 14, 2026. `dist/cjs.js` was renamed to `index.cjs` and narrowly patched; `index.d.ts` and `license.txt` were copied without edits.

Original file SHA-256 digests, before modification:

| Upstream file | SHA-256                                                            |
| ------------- | ------------------------------------------------------------------ |
| `dist/cjs.js` | `2e5160f84a1141bd927264afe4d15766f1e6cf07daef182b37ff53fea121de7d` |
| `index.d.ts`  | `146ba4b99c5feb82663e17a671bf9f53bb39c704cd76345d6c5a801c26372f44` |
| `license.txt` | `6cfc4687cb2f2d86f4a77e6b526290d3878e5e512f3fec2f4cb36a9cb36f798b` |

The audit baseline is retained at `artifacts/dependency-release/audit-before.json` by the parent task. The [GitHub advisory GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), checked November 14, 2026, lists upstream versions 4.2.0 through 4.3.1 as affected and no patched release.

## Patch

Upstream `mergeObject` creates a plain destination object and assigns copied keys with `destination[key] = value`. An enumerable own `__proto__` from the target bypasses the source-only safety check. A null-prototype target also allows that key through the source check. In both cases assignment invokes the destination's inherited prototype setter.

The local patch adds `setOwnDataProperty` and uses it at **all three destination-write sites**: target copy, source recursive/custom merge, and source clone. `Object.defineProperty` creates enumerable, configurable, writable own data properties, bypassing inherited setters. A copied `__proto__` remains an own data field and does not change the result's prototype. The existing inherited/nonenumerable-source guard remains intact. Array concatenation, symbols, clone options, mergeability options, custom merge hooks, and `deepmerge.all` are otherwise unchanged.

Only the attribution comment, helper, and three write calls differ from the upstream bundled runtime. Upstream JavaScript is intentionally retained rather than translated, keeping this security patch directly reviewable against the published source. The package entry and distribution metadata are local to this repository.

## Reproduction and checks

Against the original installed 4.3.1 implementation, both `deepmerge(JSON.parse('{"__proto__":{"marker":true}}'), {})` and `deepmerge(Object.create(null), JSON.parse('{"__proto__":{"marker":true}}'))` produced a returned object whose prototype was not `Object.prototype` and whose inherited `marker` was true. These probes did not modify the global `Object.prototype`.

Regression cases and compatibility controls live in `tests/unit/security/deepmerge-vendor.test.ts`. Run them with:

```sh
npm test -- tests/unit/security/deepmerge-vendor.test.ts
```

The tests import the installed `deepmerge` package entry, so the regression probes also check that the root override resolves to this patch. Consumer resolution and clean-install checks are recorded with the root lockfile change. Audit disappearance alone is not proof that the payloads are safe. Likewise this narrow patch does not turn arbitrary merge hooks, accessor getters, cyclic data, or resource-exhaustion inputs into a general safe deserializer.

When upstream publishes a fix, compare its behavior with these cases and replace the local override after testing consumers. Do not silently relabel this fork as an upstream release.
