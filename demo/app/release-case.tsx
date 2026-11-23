import { useState, type RefObject } from "react";
import {
  leaveObservation,
  statuses,
  viewLink,
  selectView,
  type readView,
  type Revision,
  type RequestStatus,
} from "./demo-model";
import { PayrollClose } from "./payroll-close";
import { openDesk } from "./payroll-close-model";
import { LeaveInspector } from "./leave-inspector";

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function ComparisonBars({
  caption,
  rows,
  maximum,
  format,
}: {
  caption: string;
  rows: { label: string; amount: number }[];
  maximum: number;
  format: (value: number) => string;
}) {
  return (
    <figure className="case-bars">
      <figcaption>{caption}</figcaption>
      <dl>
        {rows.map(({ label, amount }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <strong>{format(amount)}</strong>
              <span className="bar-track" aria-hidden="true">
                <span style={{ width: `${(amount / maximum) * 100}%` }} />
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

function PilotWorksheet() {
  const [changes, setChanges] = useState(24);
  const [minutes, setMinutes] = useState(15);
  const [budget, setBudget] = useState(600);
  const hourlyRate = 75;
  const capacity = (changes * minutes * hourlyRate) / 60;
  const threshold = (60 * budget) / (changes * hourlyRate);

  return (
    <details className="case-pilot" aria-labelledby="pilot-heading">
      <summary id="pilot-heading">
        Would the HR systems owner fund a four-week pilot?
      </summary>
      <p>
        The HR systems owner has one change budget. Keep the reviewer checklist,
        fund a balance test that runs with every change, or pilot a harness that
        collects test evidence across changes. If one balance rule accounts for
        the only recurring defect, start by pricing the single test.
      </p>
      <h3>Four-week shadow pilot</h3>
      <p>
        Ask the QA lead to time comparable reviews with the checklist and the
        harness. Have people operations record balance errors that either review
        missed. Keep the current release approver throughout. At four weeks, the
        systems owner can compare the value of time recovered with pilot cost
        and check whether errors or release delays increased.
      </p>
      <div className="case-review-actions">
        <button
          type="button"
          aria-pressed={minutes === 15}
          onClick={() => setMinutes(15)}
        >
          15 minutes recovered
        </button>
        <button
          type="button"
          aria-pressed={minutes === 30}
          onClick={() => setMinutes(30)}
        >
          30 minutes recovered
        </button>
      </div>
      <details>
        <summary>Adjust pilot assumptions</summary>
        <div className="case-inputs">
          <label htmlFor="pilot-changes">
            Changes reviewed <span>{changes}</span>
            <input
              id="pilot-changes"
              type="range"
              min="1"
              max="80"
              value={changes}
              onChange={(e) => setChanges(Number(e.target.value))}
            />
          </label>
          <label htmlFor="pilot-minutes">
            Minutes saved per change <span>{minutes}</span>
            <input
              id="pilot-minutes"
              type="range"
              min="0"
              max="60"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>
          <label htmlFor="pilot-budget">
            Pilot cost <span>{dollars.format(budget)}</span>
            <input
              id="pilot-budget"
              type="range"
              min="0"
              max="3000"
              step="25"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </label>
        </div>
      </details>
      <ComparisonBars
        caption="Four-week capacity value and pilot cost"
        maximum={Math.max(capacity, budget, 1)}
        rows={[
          { label: "Reviewer time recovered", amount: capacity },
          { label: "Pilot cost", amount: budget },
        ]}
        format={(value) => dollars.format(value)}
      />
      <div className="case-totals" aria-live="polite">
        <div>
          <small>Capacity value less pilot cost</small>
          <strong>{dollars.format(capacity - budget)}</strong>
        </div>
        <div>
          <small>Break-even time per change</small>
          <strong>
            {threshold.toLocaleString("en-US", { maximumFractionDigits: 1 })}{" "}
            min
          </strong>
        </div>
      </div>
      <p className="case-note">
        Illustrative assumptions. Reviewer hours saved × $75/hour gives the
        value of time available for other work. Include setup, training and
        operation in pilot cost. Check whether reviewers can use that capacity
        and whether failures still reach release before expanding.
      </p>
    </details>
  );
}

type Disposition = "Sign off" | "Hold";

function reviewFeedback(
  disposition: Disposition,
  observations: ReturnType<typeof leaveObservation>[],
) {
  const mismatch = observations.find((row) => row.expected !== row.displayed);
  if (mismatch) {
    const evidence =
      "The " +
      mismatch.status.toLowerCase() +
      " request shows " +
      mismatch.displayed +
      " hours. People operations expects " +
      mismatch.expected +
      ".";
    return disposition === "Hold"
      ? "Your hold has a reproducible finding. " +
          evidence +
          " Send QA this revision and decision so they can reproduce the missing hours before the change reaches employees."
      : "Reconsider sign-off. " + evidence;
  }
  if (observations.length < statuses.length) {
    return disposition === "Hold"
      ? "The checks you reviewed agree with policy. A hold buys time to gather evidence about the unexamined states."
      : "The checks you reviewed agree with policy. The unexamined states still leave this sign-off open.";
  }
  return disposition === "Hold"
    ? "All three modeled states match. A continued hold would need a separate concern, such as a failure in the actual portal."
    : "Your sign-off is supported for this fixture. All three modeled balances match. The application still needs its normal release checks.";
}

export function ReleaseCase({
  mainRef,
  view,
}: {
  mainRef: RefObject<HTMLElement | null>;
  view: ReturnType<typeof readView>;
}) {
  const { technical, selection } = view;
  const [desk, setDesk] = useState(openDesk);
  const { revision, status } = selection;
  const [reviewed, setReviewed] = useState<Record<Revision, RequestStatus[]>>({
    A: ["Approved"],
    B: ["Approved"],
  });
  const [recommendations, setRecommendations] = useState<
    Record<string, Disposition>
  >({});
  const { opening, expected, displayed } = leaveObservation(revision, status);
  const observations = [...new Set([...reviewed[revision], status])].map(
    (value) => leaveObservation(revision, value),
  );

  const reviewKey =
    revision +
    ":" +
    status +
    ":" +
    observations
      .map((row) => row.status)
      .sort()
      .join(",");
  const disposition = recommendations[reviewKey];

  function inspect(nextRevision: Revision, nextStatus: RequestStatus) {
    selectView(
      viewLink(false, {
        revision: nextRevision,
        status: nextStatus,
      }),
    );
    setReviewed((previous) => {
      const updated = {
        ...previous,
        [revision]: [...new Set([...previous[revision], status])],
      };
      updated[nextRevision] = [
        ...new Set([...updated[nextRevision], nextStatus]),
      ];
      return updated;
    });
  }

  return (
    <div className="release-case">
      <a
        className="case-skip"
        href="#release-main"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="case-top">
        <span>
          <b>HR ERP</b> / Release review
        </span>
        {technical ? (
          <a href={viewLink(false, selection)}>Leave review</a>
        ) : (
          <a href={viewLink(true, selection, undefined, "request")}>
            Technical guide
          </a>
        )}
      </header>
      <main id="release-main" ref={mainRef} tabIndex={-1}>
        {technical && <LeaveInspector view={view} desk={desk} />}
        <div hidden={technical}>
          <section className="case-intro">
            <div className="case-frame case-opening">
              <div className="case-brief">
                <p className="case-kicker">
                  People operations · Fictional HR service desk
                </p>
                <h1>Can Alex count on those hours?</h1>
                <p className="case-deck">
                  People Operations supports a team that plans shift coverage
                  around time off. Alex Morgan wants one day off in December.
                  Alex checks the portal before making plans, while the manager
                  checks the rota. Both turn to HR when the leave balance and
                  the request seem to disagree.
                </p>
              </div>
              <section
                className="case-statement"
                aria-labelledby="statement-heading"
              >
                <h2 id="statement-heading">One day off, three views</h2>
                <ol className="hr-route">
                  <li>
                    <b>Employee</b>
                    <span>Requests eight hours for December 14.</span>
                  </li>
                  <li>
                    <b>Manager</b>
                    <span>Reviews the request and records a decision.</span>
                  </li>
                  <li>
                    <b>People operations</b>
                    <span>
                      Checks the decision against the balance Alex sees.
                    </span>
                  </li>
                </ol>
              </section>
            </div>
          </section>
          <div className="case-frame case-body">
            <section className="hr-brief">
              <h2>Why this lands on HR’s desk</h2>
              <p>
                In November, Payroll needed HR to find the right dated record
                before sending a pay run to Finance. Now QA has two versions of
                an agent-written change to the leave portal. HR must establish
                which behavior employees can rely on. If the portal removes a
                day too early, Alex might cancel plans and HR has to reconstruct
                the request by hand.
              </p>
              <h3>How HR ERP helps review a change</h3>
              <ol className="framework-strip">
                <li>
                  <b>Classify the change</b>
                  <span>
                    HR systems starts with what the software change could
                    affect. The framework assigns a T0–T4 risk tier from the
                    files it touches and identifies who needs to review it.
                  </span>
                </li>
                <li>
                  <b>Test the HR rule</b>
                  <span>
                    People operations defines when a day counts as used. QA
                    compares what employees see across decision states in the
                    same software revision.
                  </span>
                </li>
                <li>
                  <b>Hand off the evidence</b>
                  <span>
                    The HR systems owner gets the revision, state and observed
                    result. The release approver can request a specific
                    correction or accept the tested change.
                  </span>
                </li>
              </ol>
              <a
                className="case-action"
                href={viewLink(false, selection)}
                onClick={(e) => {
                  e.preventDefault();
                  selectView(viewLink(false, selection));
                  requestAnimationFrame(() =>
                    document.getElementById("file-heading")?.focus(),
                  );
                }}
              >
                {view.opened
                  ? "Return to Alex’s file"
                  : "Open Alex’s leave file"}
              </a>
            </section>
            {view.opened && (
              <>
                <section
                  className="case-workbench"
                  aria-label="Compare leave balance calculations"
                >
                  <div className="case-controls">
                    <p className="case-kicker">
                      Alex Morgan · December 14 · Eight hours requested
                    </p>
                    <h2 id="file-heading" tabIndex={-1}>
                      Review the leave change
                    </h2>
                    <p>
                      Alex starts with 80 hours. Under this team’s rule, leave
                      counts as used only after the manager approves it. QA
                      supplied an approved example for each revision of the
                      portal. Try another state, then decide what the evidence
                      supports.
                    </p>
                    <fieldset>
                      <legend>Portal revision</legend>
                      <div className="case-options">
                        {(["A", "B"] as const).map((value) => (
                          <label key={value}>
                            <input
                              type="radio"
                              name="revision"
                              checked={revision === value}
                              onChange={() => inspect(value, status)}
                            />
                            Revision {value}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend>Manager decision</legend>
                      <div className="case-options">
                        {statuses.map((value) => (
                          <label key={value}>
                            <input
                              type="radio"
                              name="decision"
                              checked={status === value}
                              onChange={() => inspect(revision, value)}
                            />
                            {value}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                  <div
                    className="case-ledger"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <p className="case-kicker">Employee view · Alex Morgan</p>
                    <div className="case-balance">
                      {displayed}
                      <span> hours available</span>
                    </div>
                    <ComparisonBars
                      caption="Available hours for this request"
                      maximum={opening}
                      rows={[
                        { label: "Before the request", amount: opening },
                        {
                          label:
                            "Expected after " +
                            status.toLowerCase() +
                            " status",
                          amount: expected,
                        },
                        { label: "Displayed in portal", amount: displayed },
                      ]}
                      format={(value) => value + " h"}
                    />
                    <a href={viewLink(true, selection)}>
                      Inspect this balance calculation
                    </a>
                  </div>
                </section>
                <section
                  className="case-review-record"
                  aria-labelledby="record-title"
                >
                  <h2 id="record-title">Your release recommendation</h2>
                  <p>
                    Revision {revision} · {observations.length} of{" "}
                    {statuses.length} request states with evidence. QA supplied
                    the Approved example.
                  </p>
                  <table>
                    <caption className="sr-only">
                      Review record for revision {revision}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Request state</th>
                        <th scope="col">Expected</th>
                        <th scope="col">Portal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {observations.map((row) => (
                        <tr key={row.status}>
                          <th scope="row">{row.status}</th>
                          <td>{row.expected} h</td>
                          <td>{row.displayed} h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="case-review-actions">
                    {(["Sign off", "Hold"] as const).map((value) => (
                      <button
                        type="button"
                        key={value}
                        aria-pressed={disposition === value}
                        onClick={() =>
                          setRecommendations((previous) => ({
                            ...previous,
                            [reviewKey]: value,
                          }))
                        }
                      >
                        {value} revision {revision}
                      </button>
                    ))}
                  </div>
                  <div role="status">
                    {disposition && (
                      <p>{reviewFeedback(disposition, observations)}</p>
                    )}
                  </div>
                </section>
                <section className="case-proof">
                  <h2>Would you trust a closed ticket?</h2>
                  <p>
                    Alex’s leave review raises the same question HR faced at the
                    November payroll close: does the record support the next
                    action? Revisit that earlier handoff to see what Finance
                    would actually receive.
                  </p>
                  <PayrollClose
                    desk={desk}
                    update={setDesk}
                    guide={viewLink(true, selection, undefined, "payroll")}
                  />
                </section>
                <PilotWorksheet />
              </>
            )}
            <details className="case-reading">
              <summary>Case sources and operating assumptions</summary>
              <p>
                The employee, software revisions and pay register are synthetic.
                The handoffs draw on{" "}
                <a href="https://hr.wisc.edu/hr-guides/for-managers-and-supervisors/managing-employees-time-off-requests/">
                  UW–Madison’s manager guidance
                </a>{" "}
                and the{" "}
                <a href="https://cfo.ufl.edu/procedures-training-resources/payroll/timekeeping-review-and-approval/">
                  University of Florida’s payroll review procedure
                </a>
                .
              </p>
              <p>
                CIPD describes how people professionals bring employee needs
                into self-service design. The UK Service Manual assigns
                acceptance of completed work to product management and overall
                service quality to the service owner. These responsibilities
                inform the roles in this exercise.{" "}
                <a href="https://www.cipd.org/en/the-people-profession/the-profession-map/explore-the-profession-map/core-knowledge/technology-people/">
                  CIPD Profession Map
                </a>
                {" · "}
                <a href="https://www.gov.uk/service-manual/the-team/what-each-role-does-in-service-team">
                  GOV.UK service team roles
                </a>
              </p>
              <p>
                NIST’s secure development framework describes integrating review
                and verification into a development lifecycle. DORA’s delivery
                metrics pair change lead time with indicators of instability,
                useful checks on a pilot that aims to save review time.{" "}
                <a href="https://csrc.nist.gov/pubs/sp/800/218/final">
                  NIST SSDF
                </a>{" "}
                ·{" "}
                <a href="https://dora.dev/guides/dora-metrics/">
                  DORA delivery metrics
                </a>
              </p>
              <p>
                <a href={viewLink(true, selection)}>
                  Inspect the rule, fixtures and browser tests
                </a>
              </p>
            </details>
          </div>
        </div>
      </main>
    </div>
  );
}
