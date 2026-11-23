import { useState } from "react";
import { register, openCount, type Desk } from "./payroll-close-model";
import {
  evidence,
  historicalSource,
  leaveObservation,
  matchingRun,
  productSource,
  viewLink,
  selectView,
  type readView,
  type GuidePanel,
} from "./demo-model";

export function LeaveInspector({
  view,
  desk,
}: {
  view: ReturnType<typeof readView>;
  desk: Desk;
}) {
  const { selection, run, panel } = view;
  const [example, setExample] = useState<"service" | "migration" | "kernel">(
    "service",
  );
  const examples = {
    service: {
      label: "Manager decision service",
      path: "lib/leave/manager-team-time-off-service.ts",
      tier: "T1",
      effect:
        "The verifier checks the changed behavior. For Alex, test the manager decision and compare the employee balance for that same state.",
    },
    migration: {
      label: "Leave request database migration",
      path: "prisma/migrations/20260509210000_time_off_and_hr_case_requests/migration.sql",
      tier: "T2",
      effect:
        "The review plan adds a data custodian. A change to the stored request structure needs database review as well as behavior tests.",
    },
    kernel: {
      label: "Payroll calculation code",
      path: "packages/payroll-calc/src/index.ts",
      tier: "T3",
      effect:
        "The plan routes the change through counsel before implementation and includes sentinel and verifier reviews. A pay calculation can affect everyone in a run.",
    },
  };
  const active = examples[example];
  const panels: [GuidePanel, string][] = [
    ["request", "Balance trace"],
    ["evidence", "Browser replay"],
    ["payroll", "Payroll handoff"],
    ["governance", "Change review"],
  ];
  const { revision, status } = selection;
  const { request, opening, displayed, expected } = leaveObservation(
    revision,
    status,
  );
  const sameCase = run.id === matchingRun(selection);
  const difference = run.expectedHours - run.displayedHours;
  const decision = status === "Declined" ? "DENIED" : status.toUpperCase();
  return (
    <article className="case-frame case-guide">
      <p className="case-kicker">Technical inspector · Alex Morgan</p>
      <h1>Trace the leave calculation</h1>
      <p>
        Alex Morgan · {request.dates} · Revision {revision} · {status} ·{" "}
        {displayed} h displayed
      </p>
      <nav className="guide-tabs" aria-label="Technical components">
        {panels.map(([key, label]) => (
          <a
            key={key}
            href={viewLink(true, selection, run.id, key)}
            aria-current={panel === key ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      {panel === "request" && (
        <section className="tech-panel">
          <h2>Which record answers HR’s question?</h2>
          <p>
            The manager service updates a pending request. The employee summary
            reads a separately dated balance snapshot. Select a decision to see
            what the fixture expects HR to reconcile.
          </p>
          <div className="guide-tabs" aria-label="Request decision">
            {(["Pending", "Approved", "Declined"] as const).map((state) => (
              <a
                key={state}
                aria-current={state === status ? "true" : undefined}
                href={viewLink(
                  true,
                  { revision, status: state },
                  undefined,
                  "request",
                )}
              >
                {state}
              </a>
            ))}
          </div>
          <ol className="trace-stages" aria-label="Selected request trace">
            <li>
              <small>Request</small>
              <strong>{request.hours} hours</strong>
              <span>Alex starts with {opening} h and asks for one day.</span>
              <a
                href={
                  productSource + "/lib/time-off/time-off-requests-service.ts"
                }
              >
                Request dates
              </a>
            </li>
            <li>
              <small>Decision</small>
              <strong>{decision}</strong>
              <span>
                {status === "Pending"
                  ? "No manager decision. The policy keeps the full balance available."
                  : status === "Approved"
                    ? "The manager authorizes the deduction."
                    : "The manager closes the request without authorizing a deduction."}
              </span>
              <a
                href={
                  productSource + "/lib/leave/manager-team-time-off-service.ts"
                }
              >
                Manager decision record
              </a>
            </li>
            <li>
              <small>Employee statement</small>
              <strong>{displayed} h displayed</strong>
              <span>
                The policy expects {expected} h. Revision {revision} deducts{" "}
                {opening - displayed} h in this state.
              </span>
              <a href={historicalSource}>Original case calculation</a>
            </li>
          </ol>
          <p>
            For an application release, reconcile the authorized request with
            the balance for the same employee and effective date.{" "}
            <a href={productSource + "/lib/pto/get-pto-summary.ts"}>
              Employee balance query
            </a>
          </p>
        </section>
      )}
      {panel === "evidence" && (
        <section
          className="trace-evidence"
          aria-labelledby="trace-evidence-title"
        >
          <div>
            <p className="case-kicker">Evidence archive · Six replays</p>
            <h2 id="trace-evidence-title">Match a run to the change</h2>
            <p>
              Compare revision, decision and hours before attaching this
              evidence to a release recommendation.
            </p>
            <label htmlFor="trace-run">Recorded browser run</label>
            <select
              id="trace-run"
              value={run.id}
              onChange={(event) => {
                selectView(viewLink(true, selection, event.target.value));
              }}
            >
              {evidence.records.map((record) => (
                <option key={record.id} value={record.id}>
                  Revision {record.revision} · {record.state}
                </option>
              ))}
            </select>
          </div>
          <div className="trace-receipt" aria-live="polite">
            <p className="case-kicker">Replay {run.id}</p>
            <dl>
              <div>
                <dt>Opening balance</dt>
                <dd>{run.openingHours} h</dd>
              </div>
              <div>
                <dt>Policy expectation</dt>
                <dd>{run.expectedHours} h</dd>
              </div>
              <div>
                <dt>Captured portal display</dt>
                <dd>{run.displayedHours} h</dd>
              </div>
            </dl>
            <strong>
              {sameCase
                ? "Same revision and decision"
                : "Different review conditions"}
            </strong>
            <p>
              {sameCase
                ? difference
                  ? "This replay reproduces the " +
                    difference +
                    "-hour shortfall. Attach it to a hold for this revision."
                  : "This replay supports the selected state. Sign-off still depends on the other states and application checks."
                : "This run belongs to revision " +
                  run.revision +
                  " with a " +
                  run.state.toLowerCase() +
                  " request. It cannot establish the outcome for your selected change."}
            </p>
          </div>
        </section>
      )}
      {panel === "payroll" && (
        <section className="tech-panel">
          <h2>What does Finance receive?</h2>
          <p>
            The November practice desk models three separate operations. Closing
            an exception updates its status. A targeted pay run creates an
            eligible employee’s missing instruction. Locking a computed period
            closes it to later runs.
          </p>
          <dl className="technical-stats">
            <div>
              <dt>Register in this visit</dt>
              <dd>
                {register(desk).filter((row) => row.instruction).length} / 3
                employees
              </dd>
            </div>
            <div>
              <dt>Exception queue</dt>
              <dd>{openCount(desk)} open</dd>
            </div>
            <div>
              <dt>Period</dt>
              <dd>{desk.locked ? "Locked" : "Computed"}</dd>
            </div>
          </dl>
          <p>
            {desk.locked && !desk.newInstruction
              ? "Casey still lacks an instruction. Payroll needs a separate correction after lock."
              : desk.newInstruction
                ? "The modeled retry supplied PI-703 for Casey. The existing payment instructions stayed in place."
                : "Casey has no instruction yet. Waiving the exception alone would leave the register short."}
          </p>
          <p>
            <a href={productSource + "/lib/payroll/run-payroll.ts"}>
              Payroll run and retry
            </a>{" "}
            ·{" "}
            <a
              href={productSource + "/lib/payroll/payroll-period-lifecycle.ts"}
            >
              Period lock
            </a>
          </p>
        </section>
      )}
      {panel === "governance" && (
        <section className="tech-panel">
          <h2>Who reviews the software change?</h2>
          <p>
            The manifest classifies changed file paths and builds a review plan.
            Try three real paths to see how the review changes as more employee
            records could be affected.
          </p>
          <label htmlFor="tier-example">Changed component</label>
          <select
            id="tier-example"
            value={example}
            onChange={(e) =>
              setExample(e.target.value as keyof typeof examples)
            }
          >
            {Object.entries(examples).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
          <div className="trace-receipt" aria-live="polite">
            <b>
              {active.tier} · {active.label}
            </b>
            <p>
              <code>{active.path}</code>
            </p>
            <p>{active.effect}</p>
          </div>
          <p>
            These examples illustrate the repository’s T0–T4 governance for code
            changes. The manager decides the employee request.{" "}
            <a
              href={
                productSource + "/.cursor/governance/governance-manifest.yaml"
              }
            >
              Review manifest
            </a>
          </p>
        </section>
      )}
      <details className="tech-sources">
        <summary>Evidence and implementation</summary>
        <p>
          Six archived Chromium runs recorded the original{" "}
          <a href={historicalSource}>synthetic leave calculation</a>. They check
          the browser display. Application checks also need the authorized
          request and dated balance snapshot. The close desk uses illustrative
          amounts and elapsed time.
        </p>
      </details>
      <p>
        <a href={viewLink(false, selection)}>
          Return to revision {revision} · {status}
        </a>
      </p>
    </article>
  );
}
