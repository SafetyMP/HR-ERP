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
    <section className="case-pilot" aria-labelledby="pilot-heading">
      <h2 id="pilot-heading">Is the extra review worth funding?</h2>
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
    </section>
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
      ? "Your hold has a reproducible finding. " + evidence
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
  const { revision, status } = selection;
  const [reviewed, setReviewed] = useState<Record<Revision, RequestStatus[]>>({
    A: ["Approved"],
    B: ["Approved"],
  });
  const [recommendations, setRecommendations] = useState<
    Record<string, Disposition>
  >({});
  const { opening, request, expected, displayed } = leaveObservation(
    revision,
    status,
  );
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
          <a href={viewLink(true, selection)}>Technical inspector</a>
        )}
      </header>
      <main id="release-main" ref={mainRef} tabIndex={-1}>
        {technical && <LeaveInspector view={view} />}
        <div hidden={technical}>
          <section className="case-intro">
            <div className="case-frame case-opening">
              <div className="case-brief">
                <p className="case-kicker">
                  HR systems · Synthetic release review
                </p>
                <h1>Review Alex’s leave balance</h1>
                <p className="case-deck">
                  An agent changed how the portal deducts time off. Your QA
                  handoff shows 72 hours after approval in both revisions. Would
                  you sign off on either one?
                </p>
              </div>
              <section
                className="case-statement"
                aria-labelledby="statement-heading"
              >
                <h2 id="statement-heading">Employee leave statement</h2>
                <div className="statement-person">
                  <strong>Alex Morgan</strong>
                  <span>{request.dates}</span>
                </div>
                <dl>
                  <div>
                    <dt>Available before request</dt>
                    <dd>
                      {opening}
                      <span> h</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Requested leave</dt>
                    <dd>
                      {request.hours}
                      <span> h</span>
                    </dd>
                  </div>
                </dl>
                <div className="case-statement-strip" aria-hidden="true">
                  <span
                    style={{ width: `${(request.hours / opening) * 100}%` }}
                  />
                </div>
                <p className="case-statement-share">
                  This request covers {(request.hours / opening) * 100}% of
                  Alex’s opening balance.
                </p>
              </section>
            </div>
          </section>
          <div className="case-frame case-body">
            <section
              className="case-workbench"
              aria-label="Compare leave balance calculations"
            >
              <div className="case-controls">
                <h2>Review the change</h2>
                <p>
                  People operations charges leave when HR approves it. Inspect
                  the portal and its expected balance for any request state.
                  Your review record starts with the two approved examples.
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
                  <legend>HR decision</legend>
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
                        "Expected after " + status.toLowerCase() + " status",
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
                Revision {revision} · {observations.length} of {statuses.length}{" "}
                request states reviewed
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
            <figure className="case-proof case-flow">
              <figcaption>Trace Alex’s request</figcaption>
              <ol>
                <li>
                  <strong>Alex submits</strong>
                  <span>
                    {request.hours} hours for {request.dates}.
                  </span>
                </li>
                <li>
                  <strong>
                    {status === "Pending"
                      ? "HR review pending"
                      : "HR " + status.toLowerCase()}
                  </strong>
                  <span>
                    {status === "Approved"
                      ? "The approval authorizes a deduction."
                      : status === "Declined"
                        ? "The request closes without an approval."
                        : "No decision has been recorded."}
                  </span>
                </li>
                <li>
                  <strong>Alex checks the portal</strong>
                  <span>
                    The selected revision shows {displayed} hours. The fixture
                    rule expects {expected}.
                  </span>
                </li>
              </ol>
            </figure>
            <PilotWorksheet />
            <footer className="case-reading">
              <h2>Evidence for the reviewer</h2>
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
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
