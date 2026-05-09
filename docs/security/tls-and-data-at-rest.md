# TLS 1.3 (in transit) & AES-256-GCM (at rest)

This document operationalizes the blueprint for the default hosting model: **Vercel + managed PostgreSQL (Neon/RDS) + object storage with SSE** and **KMS-backed field encryption** for regulated fields.

## Data in transit — TLS 1.3

**Requirement:** All externally exposed HTTP(S) surfaces terminate with **TLS 1.3 minimum** (no TLS 1.0/1.1; no client-negotiated downgrade to weak ciphers).

| Surface | Control |
|---------|---------|
| Browser ↔ Vercel | Platform TLS termination; enable **HSTS** at the apex domain once stable; review preview URL exposure for HR data. |
| Application ↔ Postgres | Use provider connection strings that enforce TLS (Neon/RDS require TLS); reject `sslmode=disable`. |
| Application ↔ Redis / queues | TLS-only endpoints (Upstash/ElastiCache in-transit encryption). |
| Service ↔ service | Prefer private networking; if over public internet, **mTLS** or signed workload identity. |

**Cipher governance:** defer exact suite lists to the platform (Vercel/AWS). Verify with an external scanner (sslyze, testssl) after go-live; re-test on certificate rotation.

## Data at rest — layered model

| Layer | Mechanism |
|-------|------------|
| Disk / volume | Cloud provider **volume encryption** + database service encryption (Neon/RDS). |
| Object storage | SSE-S3/SSE-KMS or provider default; block public ACLs. |
| Application “toxic” fields | **AES-256-GCM** envelopes with per-version data keys; key material from **KMS** (envelope encryption). Code: [`lib/security/field-crypto.ts`](../../lib/security/field-crypto.ts). |

## KMS key hierarchy (reference)

1. **CMK (KMS)**: customer-managed root; policy grants `hr-erp-app` role `Encrypt/Decrypt/GenerateDataKey` only from application network.
2. **Data keys**: one per major purpose (`pii_core`, `vendor_tokens`, `exports`); rotate with a new `keyVersion` column in ciphertext metadata.
3. **Audit**: CloudTrail / Key Vault logging for admin changes; no key material in application logs.

Provider mapping (choose one):

- **AWS:** KMS CMK → data keys → AES-GCM blobs in Postgres columns.
- **GCP:** Cloud KMS key ring → cryptoKeys → envelope similar to AWS.
- **Azure:** Key Vault keys / managed HSM for CMK; wrap local DEKs.

## Operational checklist

- [ ] TLS 1.3-only verification on production hostname.
- [ ] Database connection string uses TLS; IAM/db auth where supported.
- [ ] Backup snapshots inherit encryption; restore drill quarterly.
- [ ] Field encryption key versions tracked; old versions retained until ciphertext rotated.
