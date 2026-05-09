/** BullMQ queue name — single ingress for integration work. */
export const INTEGRATION_QUEUE_NAME = "integration-jobs";

export const JOB_TYPES = {
  NOOP_TEST: "NOOP_TEST",
  WEBHOOK_PROCESS: "WEBHOOK_PROCESS",
  DEMO_FETCH_PERSON: "DEMO_FETCH_PERSON",
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

export const VENDOR_KEYS = {
  DEMO: "demo",
  SYSTEM: "system",
} as const;
