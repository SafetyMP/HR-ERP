import {
  evidence,
  historicalSource,
  leaveObservation,
  matchingRun,
  productSource,
  viewLink,
  selectView,
  type readView,
} from "./demo-model";

export function LeaveInspector({
  view,
}: {
  view: ReturnType<typeof readView>;
}) {
  const { selection, run } = view;
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
        Revision {revision} · {status} · {request.dates}. Follow the request you
        selected, then compare it with a recorded browser run.
      </p>
      <ol className="trace-stages" aria-label="Selected request trace">
        <li>
          <small>Request</small>
          <strong>{request.hours} hours</strong>
          <span>Alex starts with {opening} h and asks for one day.</span>
          <a
            href={productSource + "/lib/time-off/time-off-requests-service.ts"}
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
            href={productSource + "/lib/leave/manager-team-time-off-service.ts"}
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
      <section
        className="trace-evidence"
        aria-labelledby="trace-evidence-title"
      >
        <div>
          <p className="case-kicker">Evidence archive · Six replays</p>
          <h2 id="trace-evidence-title">Match a run to the change</h2>
          <p>
            Compare revision, decision and hours before attaching this evidence
            to a release recommendation.
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
      <h2>What the evidence covers</h2>
      <p>
        Each archive entry comes from a separate Chromium replay of the original
        synthetic leave review at commit <a href={historicalSource}>b03073d</a>.
        The replay records the three figures shown in Alex’s statement. The live
        trace calculates them again for your selection.
      </p>
      <p>
        The application stores a manager’s decision separately from the dated
        balance read by the employee summary. Before releasing a real change,
        reconcile the authorized request with the next balance snapshot for the
        same employee and effective date.{" "}
        <a href={productSource + "/lib/pto/get-pto-summary.ts"}>
          Employee balance query
        </a>{" "}
        ·{" "}
        <a
          href={
            productSource +
            "/tests/integration/workflows/pto-concurrency.integration.test.ts"
          }
        >
          Request concurrency tests
        </a>
      </p>
      <p>
        <a href={viewLink(false, selection)}>
          Return to revision {revision} · {status}
        </a>
      </p>
    </article>
  );
}
