import capture from "./leave-evidence.json";

export const statuses = ["Pending", "Approved", "Declined"] as const;
export type RequestStatus = (typeof statuses)[number];
export type Revision = "A" | "B";
export type Selection = { revision: Revision; status: RequestStatus };

export const request = { dates: "Dec 14, 2026", hours: 8 } as const;
export const evidence = capture;
export const source = "https://github.com/SafetyMP/HR-ERP/blob";
export const productSource = source + "/24b8bc9";
export const historicalSource =
  source + "/" + capture.sourceCommit + "/demo/app/release-case.tsx";

export function leaveObservation(revision: Revision, status: RequestStatus) {
  const opening = 80;
  const expected = status === "Approved" ? opening - request.hours : opening;
  const displayed =
    revision === "A" || status === "Approved"
      ? opening - request.hours
      : opening;
  return { status, opening, request, expected, displayed };
}

export function matchingRun({ revision, status }: Selection) {
  return revision + "-" + status.toLowerCase();
}

export function viewLink(
  technical: boolean,
  selection: Selection,
  run = matchingRun(selection),
) {
  const params = new URLSearchParams({
    revision: selection.revision,
    state: selection.status,
  });
  if (technical) params.set("run", run);
  return "#/" + (technical ? "technical" : "case") + "?" + params.toString();
}

export function selectView(link: string) {
  if (window.location.hash === link) return;
  window.history.pushState(null, "", link);
  window.dispatchEvent(new Event("hashchange"));
}

export function readView(hash: string) {
  const [route, query] = hash.split("?");
  const params = new URLSearchParams(query);
  const revision = params.get("revision") === "B" ? "B" : "A";
  const status =
    statuses.find((value) => value === params.get("state")) ?? "Approved";
  const selection: Selection = { revision, status };
  const run =
    evidence.records.find((record) => record.id === params.get("run")) ??
    evidence.records.find((record) => record.id === matchingRun(selection))!;
  return {
    technical: /^#\/?(technical|employee|hr)(\/|$)/.test(route),
    selection,
    run,
  };
}
