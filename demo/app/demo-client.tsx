"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ComponentReference } from "./component-reference";
import {
  actions,
  advance,
  canRun,
  clock,
  cutoffMinutes,
  openCount,
  openDesk,
  register,
  usd,
  type Desk,
  type DeskAction,
} from "./demo-model";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
function route() {
  return window.location.hash.slice(1) || "/case";
}

function Action({
  action,
  desk,
  run,
}: {
  action: DeskAction;
  desk: Desk;
  run: (action: DeskAction) => void;
}) {
  return (
    <button disabled={!canRun(desk, action)} onClick={() => run(action)}>
      {actions[action].label}
      {actions[action].minutes > 0 && (
        <small>{actions[action].minutes} min</small>
      )}
    </button>
  );
}

function CloseDesk({
  desk,
  run,
  reset,
}: {
  desk: Desk;
  run: (action: DeskAction) => void;
  reset: () => void;
}) {
  const entries = register(desk);
  const included = entries.filter((row) => row.instruction).length;
  const net = entries.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const remaining = cutoffMinutes - desk.minutes;
  return (
    <>
      <header className="close-header">
        <div>
          <p className="eyebrow">Payroll operations / November 20</p>
          <h1>Friday payroll close</h1>
          <p>
            Three people are due pay. Two exceptions landed in your queue after
            a retry. Reconcile the register, then decide when to lock it for the
            15:00 handoff.
          </p>
        </div>
        <div className="clockcard">
          <span>Desk clock</span>
          <strong>{clock(desk.minutes)}</strong>
          <span>
            {remaining >= 0
              ? remaining + " min to cutoff"
              : -remaining + " min past cutoff"}
          </span>
          <meter
            aria-label="Review time used"
            min={0}
            max={cutoffMinutes}
            value={Math.min(cutoffMinutes, desk.minutes)}
          />
        </div>
      </header>
      <div className="desk-layout">
        <div className="desk-main">
          <section className="register">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Period ending Nov 15</p>
                <h2>Preliminary pay register</h2>
              </div>
              <span className="stage">
                {desk.artifact
                  ? "Artifact prepared"
                  : desk.locked
                    ? "Locked"
                    : "Computed"}
              </span>
            </div>
            <table>
              <caption className="sr-only">
                Roster compared to payment instructions
              </caption>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Instruction</th>
                  <th>Net amount</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => (
                  <tr key={row.employee}>
                    <th scope="row">{row.employee}</th>
                    <td>{row.instruction || "Missing"}</td>
                    <td>{row.amount == null ? "—" : usd(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td>{included} of 3</td>
                  <td>{usd(net)}</td>
                </tr>
              </tfoot>
            </table>
          </section>
          <section className="queue">
            <div className="panel-heading">
              <h2>Exception queue</h2>
              <span className="stage">{openCount(desk)} open</span>
            </div>
            <article>
              <div className="ticket-head">
                <div>
                  <p className="eyebrow">Existing instruction skipped</p>
                  <h3>Alex Morgan</h3>
                </div>
                <strong>{desk.existing}</strong>
              </div>
              <p>
                The retry found an existing instruction. Compare the register
                with the archive before closing the exception, or waive the
                check and hand verification to finance.
              </p>
              <fieldset className="source-packet">
                <legend>Instruction archive · Alex Morgan</legend>
                <div className="source-options">
                  <div>
                    <b>PI-686</b>
                    <span>Oct 16–31 · $1,760 net</span>
                    <Action action="tracePrior" desk={desk} run={run} />
                  </div>
                  <div>
                    <b>PI-702</b>
                    <span>Nov 1–15 · $1,760 net</span>
                    <Action action="trace" desk={desk} run={run} />
                  </div>
                </div>
              </fieldset>
              <div className="actions">
                <Action action="waiveExisting" desk={desk} run={run} />
              </div>
            </article>
            <article>
              <div className="ticket-head">
                <div>
                  <p className="eyebrow">No compensation record</p>
                  <h3>Casey Rivera</h3>
                </div>
                <strong>{desk.missing}</strong>
              </div>
              <p>
                Casey worked this period.{" "}
                {desk.sourceAttached
                  ? "HR’s approved record is attached."
                  : "The run found no effective compensation record. HR can retrieve the approved source."}{" "}
                {desk.newInstruction
                  ? "The targeted retry produced PI-703."
                  : "There is no instruction for Casey."}
              </p>
              <fieldset className="source-packet">
                <legend>Approved HR records · Casey Rivera</legend>
                <div className="source-options">
                  <div>
                    <b>HR-58 · Rate change</b>
                    <span>Effective Nov 16 · $51,600/year</span>
                    <Action action="sourceFuture" desk={desk} run={run} />
                  </div>
                  <div>
                    <b>HR-52 · Hire record</b>
                    <span>Effective Nov 1 · $48,000/year</span>
                    <Action action="source" desk={desk} run={run} />
                  </div>
                </div>
              </fieldset>
              <div className="actions">
                {(["retry", "resolveMissing", "waiveMissing"] as const).map(
                  (action) => (
                    <Action
                      key={action}
                      action={action}
                      desk={desk}
                      run={run}
                    />
                  ),
                )}
              </div>
            </article>
          </section>
        </div>
        <aside className="handoff">
          <p className="eyebrow">Payroll lead</p>
          <h2>{desk.locked ? "Handoff outcome" : "Release decision"}</h2>
          <div className="coverage">
            <strong>
              {included}
              <small> / 3</small>
            </strong>
            <span>employees with instructions</span>
            <div className="coverage-bars" aria-hidden="true">
              {entries.map((row) => (
                <i key={row.employee} data-filled={!!row.instruction} />
              ))}
            </div>
          </div>
          {desk.locked ? (
            <>
              <h3>
                {remaining >= 0 ? "Locked by cutoff" : "Locked after cutoff"}
              </h3>
              <p>
                {included === 3
                  ? "All three employees are in the register."
                  : "Casey has no instruction in this batch. Payroll must arrange a separate correction."}{" "}
                {remaining < 0 && "Finance needs to agree on a later handoff."}
              </p>
              {desk.artifact ? (
                <p className="receipt">
                  <b>Artifact summary</b>
                  <br />
                  {included} instructions · {usd(net)} net
                  <br />
                  {openCount(desk)} open exceptions
                </p>
              ) : (
                <Action action="artifact" desk={desk} run={run} />
              )}
            </>
          ) : (
            <>
              <p>
                Locking freezes this computed period. You can keep working past
                15:00, but the handoff will be late.
              </p>
              <Action action="lock" desk={desk} run={run} />
            </>
          )}
          {desk.existing === "Waived" && (
            <p className="receipt">
              Alex’s existing instruction was waived without a match. Finance
              inherits that verification task.
            </p>
          )}
          {desk.history.length > 0 && (
            <p className="receipt" role="status">
              {desk.history.at(-1)?.message}
            </p>
          )}
          {desk.history.length > 0 && (
            <button className="replay" onClick={reset}>
              Restart exercise
            </button>
          )}
        </aside>
      </div>
      <section className="activity">
        <h2>Review trail</h2>
        <ol>
          <li>
            <time>14:40</time>
            <span>
              Computed batch received. Two instructions and two open exceptions.
            </span>
          </li>
          {desk.history.map((event, i) => (
            <li key={i}>
              <time>{clock(event.minute)}</time>
              <span>{event.message}</span>
            </li>
          ))}
        </ol>
      </section>
      <details className="basis">
        <summary>Business case and sources</summary>
        <p>
          A payroll manager can test whether pre-close checks catch missing pay
          early enough to avoid a separate correction. Benchmark current
          reviewer minutes, on-time handoffs, missed employees and off-cycle
          corrections per run. Compare a simple roster check with a pilot that
          routes exceptions and collects evidence.
        </p>
        <p>
          The University of Florida’s preliminary paylist guide calls out
          employees missing a paycheck. Pittsburgh’s payroll team documents
          which approved corrections can enter a retry before cutoff. UC Davis
          explains why different people should perform and review key payroll
          duties. These practices shaped the payroll lead, HR data steward and
          finance reviewer in the exercise.
        </p>
        <p>
          <a href="https://training.hr.ufl.edu/instructionguides/time%26labor/reviewing_preliminary_final_paylists.pdf">
            Florida paylist review
          </a>{" "}
          ·{" "}
          <a href="https://www.payroll.pitt.edu/late-action-charts">
            Pittsburgh late-action charts
          </a>{" "}
          ·{" "}
          <a href="https://cashier.ucdavis.edu/finance/controls-accountability/int-controls/practices/payroll">
            UC Davis payroll controls
          </a>
        </p>
        <p>
          People, amounts, task durations and the cutoff are illustrative. An
          instruction is a record for downstream processing. It does not
          establish receipt of wages.
        </p>
      </details>
    </>
  );
}
export function DemoClient() {
  const currentRoute = useSyncExternalStore(subscribe, route, () => "/case");
  const reference = currentRoute !== "/case";
  const [desk, setDesk] = useState(openDesk);
  const main = useRef<HTMLElement>(null);
  const lastRoute = useRef(currentRoute);
  useEffect(() => {
    if (lastRoute.current !== currentRoute) {
      main.current?.focus();
      window.scrollTo(0, 0);
      lastRoute.current = currentRoute;
    }
  }, [currentRoute]);
  return (
    <div className="payroll-desk">
      <a
        className="skip"
        href="#content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="mast">
        <div>
          <b>HR ERP</b>
          <span> / Payroll desk</span>
        </div>
        <nav aria-label="Demo views">
          <a href="#/case" aria-current={!reference ? "page" : undefined}>
            Close desk
          </a>
          <a href="#/technical" aria-current={reference ? "page" : undefined}>
            Component reference
          </a>
        </nav>
      </header>
      <main ref={main} id="content" tabIndex={-1}>
        {reference ? (
          <ComponentReference />
        ) : (
          <CloseDesk
            desk={desk}
            run={(action) => setDesk((previous) => advance(previous, action))}
            reset={() => setDesk(openDesk)}
          />
        )}
      </main>
      <footer>Synthetic payroll exercise · Browser session only</footer>
    </div>
  );
}
