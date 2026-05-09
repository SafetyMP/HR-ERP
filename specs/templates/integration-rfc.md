# Integration RFC — <feature slug>

**Vendor / system:** <name>  
**Phase:** <Phase1_MVP>

## Summary

## Data classifications exchanged

Link to Legal PII table.

## Auth

- OAuth2 authorization code + PKCE / client credentials / API key  
- Token storage: **encrypted** at rest; KMS/vault; rotation

## Webhooks (if inbound)

- Signature algorithm + clock skew  
- Replay / dedupe idempotency key  
- Fast 2xx then async worker

## Outbound API

- Timeouts, retries, backoff, **Idempotency-Key**  
- Error taxonomy (retryable vs fatal)

## Async / queues

- Bus vs in-process — must match phase ADR

## Vendor / subprocessors

| Item | Status |
| --- | --- |
| DPA executed | |
| Subprocessors reviewed | |
| Data residency region | |
| SOC / ISO report | |
| Incident notification SLA | |

## Observability

- Correlation ID to vendor logs (no PII payloads)

## Open risks

| Risk | Owner |
| --- | --- |
