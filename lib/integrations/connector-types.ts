export type ParsedWebhookEnvelope = {
  eventType: string;
  rawPayload: Record<string, unknown>;
};

/** Contract each vendor module implements (subset used per integration). */
export type VendorConnector = {
  readonly vendorKey: string;

  /** Optional: parse vendor webhook into a normalized envelope. */
  parseWebhookPayload?(body: unknown): ParsedWebhookEnvelope;

  /**
   * Map external object into internal domain shape (validated by caller with Zod).
   */
  mapExternalPersonToEmployee(input: unknown): {
    email: string;
    firstName?: string;
    lastName?: string;
    externalId: string;
  };
};
