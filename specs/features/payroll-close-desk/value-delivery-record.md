# Payroll close desk

A payroll lead needs to decide whether a computed batch is ready for the finance handoff. HR supplies approved source changes. Finance receives the instructions and any remaining verification work. [Sources and assumptions](../../../demo/README.md)

## Acceptance

1. Load the static export at the repository path without API access. The opening register covers two of the three employees.
2. Waive both exceptions and lock the batch. The queue is clear, yet Casey still has no instruction. The artifact summary preserves the distinction.
3. Verify Alex, obtain Casey’s approved record, rerun Casey and resolve the exception. All three employees have one instruction and a full reconciliation crosses the illustrative cutoff.
4. Waive Alex’s exception, correct Casey’s instruction and lock at the cutoff. The batch includes everyone and finance inherits Alex’s verification. Mobile navigation and the component reference preserve the active exercise.

5. Select an instruction from the wrong period and a future-dated compensation record. Both consume review time and leave the discrepancy open. Compare the dates to recover with the eligible source.

These checks exercise the browser teaching model. Employee receipt of wages and the benefits of a business pilot require local operating evidence. [Browser scenarios](../../../tests/demo/static-demo.spec.ts)
