import { assertSafeDeliveryUrl } from "@/lib/integrations/http/assert-safe-delivery-url";
import { canonicalJson, signWebhookPayload } from "@/lib/webhooks/signing";

export interface WebhookHttpDeliveryRequest {
  targetUrl: string;
  secret: string;
  eventType: string;
  payload: unknown;
  /** Persisted hex from delivery row — used to rebuild header for replay consistency. */
  signatureHex: string;
  deliveryId: string;
}

export interface WebhookHttpDeliveryResult {
  ok: boolean;
  statusCode: number;
  errorMessage: string | null;
}

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * POST signed JSON to subscriber HTTPS endpoint.
 */
export async function deliverWebhookHttp(
  req: WebhookHttpDeliveryRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<WebhookHttpDeliveryResult> {
  const timestamp = new Date().toISOString();
  const body = {
    id: req.deliveryId,
    eventType: req.eventType,
    payload: req.payload,
  };
  const sig = signWebhookPayload(body, req.secret, timestamp);
  const bodyText = canonicalJson(body);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    assertSafeDeliveryUrl(req.targetUrl);
    const res = await fetchImpl(req.targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-HRERP-Event-Type": req.eventType,
        "X-HRERP-Delivery-Id": req.deliveryId,
        "X-HRERP-Signature-256": sig.header,
      },
      body: bodyText,
      signal: controller.signal,
      redirect: "error",
    });

    if (res.ok) {
      return { ok: true, statusCode: res.status, errorMessage: null };
    }
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      statusCode: res.status,
      errorMessage: text.slice(0, 500) || `HTTP ${res.status}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, statusCode: 0, errorMessage: message };
  } finally {
    clearTimeout(timer);
  }
}
