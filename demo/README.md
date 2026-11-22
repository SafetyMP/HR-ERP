# Friday payroll close

A payroll manager reconciles a three-person roster against two instructions before a synthetic 15:00 finance handoff. Two exceptions look similar in the queue. One points to an instruction that already exists and the other to an employee whose instruction is missing. The operator compares two instruction copies and two approved compensation records. An incorrect period or effective date consumes time without clearing the discrepancy. The desk shows the effects of the operator’s decisions on employee coverage, elapsed time, open exceptions and the final handoff.

## Run and verify

From the repository root, use Node 22 and the project npm version. Run `npm ci`, `npm run demo:build`, then `npm run demo:preview`. The static export lives in `demo/out` and defaults to the GitHub Pages path `/HR-ERP/`. Run `npm run demo:test` against the built export. Browser tests use the pinned Playwright Chromium.

The root and `#/case` open the desk. The separate `#/technical` reference maps the exercise to the run, exceptions, lifecycle, filing and authorization components. Historical employee and HR workspace hashes open this reference. A trip to the reference preserves the active batch. Restarting the exercise or reloading resets it.

## Stakeholders and evidence

The payroll lead owns the lock decision. HR supplies an approved effective compensation record. Finance receives the batch and any unresolved verification. The University of Florida shows how to spot employees missing from a preliminary paylist. Pittsburgh distinguishes corrections made before a retry deadline from later payment adjustments. UC Davis explains why payroll duties should be separated. These are examples of operating practices. The 20-minute cutoff and action costs are assumptions of this exercise. [Florida paylist review](https://training.hr.ufl.edu/instructionguides/time%26labor/reviewing_preliminary_final_paylists.pdf) · [Pittsburgh late-action charts](https://www.payroll.pitt.edu/late-action-charts) · [UC Davis payroll controls](https://cashier.ucdavis.edu/finance/controls-accountability/int-controls/practices/payroll)

Compare current manual roster reconciliation with a shadow pilot that routes exceptions to HR and retains the instruction match for finance. Measure reviewer time, missing instructions, on-time handoffs and off-cycle corrections per run. A pilot earns further investment if those local records support improved accuracy at a sustainable review cost.

## Model boundaries

All names, times and USD net amounts are synthetic. The targeted retry adds a fixed amount. The browser neither calculates statutory pay nor calls backend services. The backend permits a computed period to be locked while exceptions remain open. A closed exception alone does not create a payment instruction. The local summary displays counts and totals to explain this distinction. Production creates an artifact with additional fields and a hash. Payment settlement, off-cycle issuance and bank transmission are outside this exercise. See the [model](app/demo-model.ts), [component reference](app/component-reference.tsx) and [browser tests](../tests/demo/static-demo.spec.ts).
