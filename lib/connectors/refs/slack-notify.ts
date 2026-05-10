import type {
  ConnectorAdapter,
  ConnectorEvent,
} from "@/lib/connectors/sdk";

/**
 * Reference Slack notification adapter — turns selected HR events into a
 * Slack-shaped block payload. The real adapter would POST this via an
 * outgoing webhook; here we only normalize the message so it can be unit
 * tested without touching the network.
 */
export interface SlackBlockPayload {
  channel: string;
  text: string;
  blocks: Array<{
    type: "section" | "header";
    text: { type: "plain_text" | "mrkdwn"; text: string };
  }>;
}

export interface SlackNotifyConfig {
  channel: string;
  /** Test hook — wire your real Slack `chat.postMessage` here in production. */
  poster?: (payload: SlackBlockPayload) => Promise<void>;
}

const SUPPORTED_EVENT_TYPES = [
  "domain.core_hr.case.opened",
  "domain.core_hr.workflow.instance.completed",
  "domain.core_hr.workflow.instance.rejected",
  "domain.recruiting.application.created",
] as const;

export function makeSlackNotifyAdapter(
  config: SlackNotifyConfig,
): ConnectorAdapter<Record<string, unknown>, SlackBlockPayload> {
  return {
    id: "slack-notify",
    eventTypes: SUPPORTED_EVENT_TYPES,
    transform(event) {
      const summary = humanSummary(event);
      if (!summary) return null;
      return {
        channel: config.channel,
        text: summary,
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: friendlyTitle(event.eventType) },
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: summary },
          },
        ],
      };
    },
    async emit(event, output) {
      if (config.poster) {
        await config.poster(output);
      } else {
        // Default no-op so the adapter is safe to wire up before a poster is configured.
        return;
      }
      void event;
    },
  };
}

function humanSummary(event: ConnectorEvent<Record<string, unknown>>): string | null {
  switch (event.eventType) {
    case "domain.core_hr.case.opened":
      return `:exclamation: New HR case opened (correlation: ${event.correlationId ?? "n/a"}).`;
    case "domain.core_hr.workflow.instance.completed":
      return `:white_check_mark: Workflow ${stringValue(event.payload.subjectType)} completed.`;
    case "domain.core_hr.workflow.instance.rejected":
      return `:x: Workflow ${stringValue(event.payload.subjectType)} rejected.`;
    case "domain.recruiting.application.created":
      return `:tada: New application against requisition ${stringValue(event.payload.requisitionId)}.`;
    default:
      return null;
  }
}

function stringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return value.toString();
  return "n/a";
}

function friendlyTitle(eventType: string): string {
  return eventType.replace(/^domain\./, "").replace(/_/g, " ");
}
