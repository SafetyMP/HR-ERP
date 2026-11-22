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
} from "./payroll-close-model";

export function PayrollClose({
  desk,
  update,
  guide,
}: {
  desk: Desk;
  update: (d: Desk) => void;
  guide: string;
}) {
  const rows = register(desk);
  const count = rows.filter((row) => row.instruction).length;
  function option(action: DeskAction, label = String(actions[action].label)) {
    return (
      <button
        type="button"
        disabled={!canRun(desk, action)}
        onClick={() => update(advance(desk, action))}
      >
        {label}
      </button>
    );
  }
  return (
    <details className="close-case">
      <summary>Reopen the November payroll handoff</summary>
      <p>
        At 14:40, Finance needs the November 1–15 register by 15:00. Three
        employees are due pay. Help Payroll match Alex’s instruction and supply
        Casey’s effective record, or hand the batch over with work outstanding.
      </p>
      <div className="close-strip">
        <b>
          {clock(desk.minutes)} · {desk.locked ? "Locked" : "Working register"}
        </b>
        <span>{count} of 3 employees covered</span>
        <span>{openCount(desk)} open exceptions</span>
      </div>
      <table className="pay-register">
        <caption>Payment instructions on file</caption>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Instruction</th>
            <th>Net pay</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.employee}>
              <th>{row.employee}</th>
              <td>{row.instruction ?? "Missing"}</td>
              <td>{row.amount === null ? "—" : usd(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!desk.locked && (
        <div className="close-work">
          <section>
            <h3>Alex · {desk.existing}</h3>
            <p>
              Two archive entries show the same amount. Which one belongs to
              this period?
            </p>
            <div className="close-actions">
              {option("tracePrior", "PI-686 · Oct 16–31")}
              {option("trace", "PI-702 · Nov 1–15")}
              {option("waiveExisting", "Waive Alex’s check")}
            </div>
          </section>
          <section>
            <h3>Casey · {desk.missing}</h3>
            <p>
              HR has two approved compensation records. Which one was effective
              for this run?
            </p>
            <div className="close-actions">
              {option("sourceFuture", "HR-58 · effective Nov 16")}
              {option("source", "HR-52 · effective Nov 1")}
              {desk.sourceAttached && option("retry")}
              {desk.newInstruction && option("resolveMissing")}
              {option("waiveMissing", "Waive Casey’s check")}
            </div>
          </section>
        </div>
      )}
      <p className="desk-feedback" aria-live="polite">
        {desk.history.at(-1)?.message}
      </p>
      {desk.locked ? (
        <p>
          <strong>
            Finance handoff ·{" "}
            {desk.minutes > cutoffMinutes ? "after cutoff" : "by cutoff"}.
          </strong>{" "}
          {count === 3
            ? "All three employees have instructions."
            : "Casey has no instruction. Payroll must arrange a correction."}{" "}
          {desk.existing === "Waived"
            ? "Alex’s instruction still needs independent verification."
            : ""}{" "}
          {openCount(desk) > 0 ? "Open exceptions still need an owner." : ""}
        </p>
      ) : (
        <div className="close-actions">
          {option("lock", "Lock this register for Finance")}
        </div>
      )}
      {desk.locked &&
        (desk.artifact ? (
          <p className="trace-receipt">
            Finance summary · {count} instructions ·{" "}
            {usd(rows.reduce((total, row) => total + (row.amount ?? 0), 0))} net
            · {openCount(desk)} open exceptions.
          </p>
        ) : (
          <div className="close-actions">{option("artifact")}</div>
        ))}
      <div className="case-links">
        <a href={guide}>Trace this payroll handoff</a>
        <button type="button" onClick={() => update(openDesk)}>
          Restart the close
        </button>
      </div>
    </details>
  );
}
