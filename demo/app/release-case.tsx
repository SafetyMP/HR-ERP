import { useState, type RefObject } from "react";
import { TIME_OFF_OPTIONS, type RequestStatus } from "./demo-model";

const source = "https://github.com/SafetyMP/HR-ERP/blob/main";
const statuses = ["Pending", "Approved", "Declined"] as const;
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

function TechnicalGuide() {
  return (
    <article className="case-frame case-guide">
      <h1>Technical guide</h1>
      <p>
        This browser model compares two versions of a leave-balance calculation.
        The synthetic December 14 request starts with 80 hours and asks for
        eight.
      </p>
      <h2>When the balance changes</h2>
      <p>
        The submission revision deducts the hours as soon as Alex asks. The
        approval revision deducts them only when HR approves. The expected
        balance follows the approval rule. Each comparison evaluates one request
        against the same opening balance.
      </p>
      <h2>Reproduce the approval path</h2>
      <p>
        Submit the December 14 request in Alex’s workspace. Open HR’s queue to
        approve or decline it, then return to Alex’s time off to inspect the
        balance. Reloading resets the synthetic workspace.
      </p>
      <div className="case-links">
        <a className="case-action" href="#/employee/pto">
          Open Alex’s time off
        </a>
        <a href="#/hr/review-queue">Open the HR review queue</a>
      </div>
      <h2>Evidence and limits</h2>
      <p>
        The fixture supplies the date and hours. The browser tests exercise the
        employee and HR views plus the modeled comparison. The static demo uses
        local React state. A production release also needs evidence from the
        actual application and its approval process.
      </p>
      <div className="case-links">
        <a href={source + "/demo/app/demo-model.ts"}>Request fixtures</a>
        <a href={source + "/tests/demo/static-demo.spec.ts"}>Browser tests</a>
        <a href={source + "/AGENTS.md"}>Governance contract</a>
      </div>
      <p>
        <a href="#/case">Return to the leave review</a>
      </p>
    </article>
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
        collects test evidence across changes. If early deduction is the only
        recurring defect, start by pricing the single test.
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

export function ReleaseCase({
  mainRef,
  technical,
}: {
  mainRef: RefObject<HTMLElement | null>;
  technical: boolean;
}) {
  const [revision, setRevision] = useState("submission");
  const [status, setStatus] = useState<RequestStatus>("Pending");
  const opening = 80;
  const request = TIME_OFF_OPTIONS[0];
  const expected = status === "Approved" ? opening - request.hours : opening;
  const displayed =
    revision === "submission" || status === "Approved"
      ? opening - request.hours
      : opening;
  const matches = displayed === expected;

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
          <a href="#/case">Leave review</a>
        ) : (
          <a href="#/technical">Technical guide</a>
        )}
      </header>
      <main id="release-main" ref={mainRef} tabIndex={-1}>
        {technical && <TechnicalGuide />}
        <div hidden={technical}>
          <section className="case-intro">
            <div className="case-frame case-opening">
              <div className="case-brief">
                <p className="case-kicker">
                  HR systems · Synthetic release review
                </p>
                <h1>Review Alex’s leave balance</h1>
                <p className="case-deck">
                  An agent changed how the portal deducts time off. You own the
                  HR system. Before accepting the change, check what Alex sees
                  when a request is still pending.
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
                  People operations defines when leave is spent. As the QA lead,
                  compare each portal revision against the expected balance for
                  the same HR decision.
                </p>
                <fieldset>
                  <legend>Portal revision</legend>
                  <div className="case-options">
                    <label>
                      <input
                        type="radio"
                        name="revision"
                        checked={revision === "submission"}
                        onChange={() => setRevision("submission")}
                      />
                      Deduct on submission
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="revision"
                        checked={revision === "approval"}
                        onChange={() => setRevision("approval")}
                      />
                      Deduct on approval
                    </label>
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
                          onChange={() => setStatus(value)}
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
                <h3>{matches ? "This check passes" : "Hold the change"}</h3>
                <p>
                  {!matches
                    ? "The portal deducted eight hours without an approval. Return this revision to its author."
                    : revision === "submission"
                      ? "Both revisions agree after approval. Check pending and declined requests before signing off."
                      : "This result matches the fixture rule. Check the other decisions and run the repository tests before release."}
                </p>
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
                <a href="#/technical">
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
