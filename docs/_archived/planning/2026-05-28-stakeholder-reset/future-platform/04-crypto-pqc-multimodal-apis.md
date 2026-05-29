# Cryptography Abstraction — PQC Preparedness & Multimodal API Conventions

## Design principle

Treat cryptography as **versioned capability surfaces** orchestrated behind internal interfaces (`CryptoService`). Application features depend on **`CryptoService` contracts**, never on vendor-specific PQ primitives directly.

```
Application → CryptoService facade → KMS / libs / PQ adapters
```

## Current baseline (now — 2026)

| Capability | Requirement |
|------------|--------------|
| Transport | TLS **1.3** minimum everywhere user or employee data transits |
| At-rest | KMS/HSM-managed keys where regulated; distinguish **encryption** vs **signing** keys |
| Key rotation | Runbook + telemetry on upcoming expirations (< 90d warning) |
| Inventory | Maintain **crypto algorithm register** listing algorithms, scopes, deprecation dates |

Abstraction enums (example — adjust to language):

```
enum EncryptionScheme { AES_256_GCM_V1 ... }
enum SignatureScheme { ECDSA_P256_SHA256_V1 ... }
enum KdfScheme { HKDF_SHA256_V1 ... }
```

## Post-quantum (PQ) readiness checklist

| Step | Detail |
|------|--------|
| 1 Inventory | Identify long-lived ciphertext + signatures (> 10y retention archives, exported PDFs signed with org keys) |
| 2 PQ policy | Decide **harvest-now/decrypt-later** posture per data class; escalate legal retention alignment |
| 3 Platform TLS | Prefer **CDN/proxy PQ hybrid handshake** adoption when infra vendor certifies SLA (no bespoke TLS in-app) |
| 4 Signing dual-stack | Evaluate **dual signatures** (`classic + PQ hybrid`) for archival artifacts needing future verify |
| 5 PQ algorithm pin | Pilot **Kyber/Dilithium (NIST-approved profiles)** ONLY via audited libs tied to KMS vendor roadmap |
| 6 Fallback tests | PQ-off clients still connect using classic paths until mandated cutoffs |
| 7 Metrics | Alerts on PQ handshake/cert failures segmented by tenant & client SKU |

### Avoid until reviewed as crypto product work

Embedding raw PQ primitives in payroll calculation paths  
DIY PQ implementation or pre-standard experimental parameter sets tied to salaries

---

## Multimodal (voice / spatial) API conventions

The **domain vocabulary** stays stable; modality-specific transports are adapters.

### Resource naming — stable commands

Prefer **intent-oriented** routes or RPC verbs:

```
POST /v1/commands/create-leave-request
POST /v1/commands/search-employees
GET  /v1/queries/employee-directory-preview
```

**Avoid** modality paths like `/voice/foo` coupling policy to UX.

### Request envelope (recommended JSON shape)

```json
{
  "commandId": "uuid-v4-client-generated-or-server",
  "idempotencyKey": "opaque",
  "actor": {
    "userId": "uuid",
    "tenantId": "uuid",
    "locale": "en-US",
    "deviceClass": "VoiceAssistant | Web | SpatialHUD"
  },
  "intent": {
    "name": "SearchEmployees",
    "parameters": {}
  },
  "clientHints": {
    "uiSurface": "voice",
    "sessionId": "...",
    "capabilityClaims": []
  },
  "rawTranscriptMeta": null
}
```

Voice clients send **intent + canonical parameters extracted server-side via NLU gateway** rather than prompting model to secretly craft SQL.

### Responses — structured multimodal payloads

Responses include modality-agnostic `data` plus optional `presentation` hints:

```json
{
  "status": "OK",
  "data": {},
  "presentation": {
    "voiceBrief": "...",
    "spatialAnchorsOptional": [],
    "citations": [{"sourceType": "...", "sourceId": "...", "snippet": "..."}]
  }
}
```

### State machines for regulated flows

Destructive/regulated intents (`approvePayrollAdjustment`, bulk export) MUST map to deterministic **wizard states** keyed by `{tenantId,userId,wizard}` with server-side TTL — voice/spatial wrappers cannot shortcut server validation.

### Security notes

- MFA / elevation challenges flow through identical command channels — no parallel hidden bypass.
- Log **intent name + redacted slots** (`AuditLog` action pattern from Phase A docs).

---

## Traceability matrix (for audits)

Map each cryptography operation to SOC2-ish controls:

| Operation | Classification | KMS key | PQ status | Owner |
|-----------|---------------|---------|-----------|-------|
| DB column encryption … | PHI / PII … | ARN … | Planned hybrid … | SEC … |

Update quarterly with PQ pilot notes.

---

## References

- [`01-phase-a-core-boundaries.md`](./01-phase-a-core-boundaries.md)
- [`02-phase-bc-edge-semantic-search.md`](./02-phase-bc-edge-semantic-search.md)
