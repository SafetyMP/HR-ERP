const repo = "https://github.com/SafetyMP/HR-ERP/blob/main/";
const components = [
  [
    "Run service",
    "lib/payroll/run-payroll.ts",
    "Computes instructions for a period or selected employees. An existing instruction is skipped by default. A missing compensation record produces no instruction.",
  ],
  [
    "Exception register",
    "lib/payroll/payroll-exceptions.ts",
    "Records NO_COMPENSATION and SKIPPED_EXISTING. Resolving or waiving an open exception changes its disposition. It does not create an instruction.",
  ],
  [
    "Period lifecycle",
    "lib/payroll/payroll-period-lifecycle.ts",
    "A computed period can be locked. Locked and artifact-generated periods reject further pay runs.",
  ],
  [
    "Lock and artifact service",
    "lib/payroll/payroll-filing-service.ts",
    "Checks the period state when locking it. The filing artifact includes instruction data and the count of open exceptions.",
  ],
  [
    "Authorization",
    "src/app/api/v1/payroll/runs/[periodId]/lock/route.ts",
    "The service route checks permission and access policy. The browser exercise has no identity or database connection.",
  ],
];
export function ComponentReference() {
  return (
    <article className="reference">
      <p className="eyebrow">HR ERP / Implementation</p>
      <h1>Component reference</h1>
      <p>
        The close desk is an educational model of payroll operations in this
        governance scaffold. The source application supplies the services below.
      </p>
      <dl>
        {components.map(([name, path, detail]) => (
          <div key={path}>
            <dt>
              <a href={repo + path}>{name}</a>
            </dt>
            <dd>{detail}</dd>
          </div>
        ))}
      </dl>
      <h2>What this exercise models</h2>
      <p>
        Three synthetic employees, fixed USD instruction amounts, a 20-minute
        deadline and estimated task durations. Obtaining HR’s approved record
        stands in for an upstream correction. The desk models a local artifact
        summary. It does not run the payroll kernel, authenticate employees,
        send money or submit filings.
      </p>
      <p>
        <a href={repo + "tests/unit/payroll/payroll-period-lifecycle.test.ts"}>
          Period lifecycle tests
        </a>{" "}
        ·{" "}
        <a href={repo + "tests/demo/static-demo.spec.ts"}>
          Browser decision paths
        </a>
      </p>
      <p>
        <a href="#/case">Return to the close desk</a>
      </p>
    </article>
  );
}
