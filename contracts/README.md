# Contract artifacts

Governance for synchronous APIs (REST + gRPC) aligned with [Architecture README](../docs/architecture/README.md).

## Layout

| Path | Purpose |
| --- | --- |
| [`openapi/`](./openapi/) | OpenAPI 3.1 specs (`*-v1.yaml`); version by filename + `/v1` server URL prefix |
| [`../proto/`](../proto/) | Protobuf sources for gRPC; Buf lint configuration |

## Linting

From repository root:

```bash
npm run contracts:buf
npm run contracts:openapi
```

These invoke **Buf** and **Spectral** via `npx` so installs stay reproducible without pinning heavyweight CLI trees in `node_modules`.

- Buf module root and lint rules: [`proto/buf.yaml`](../proto/buf.yaml).
- Spectral rules file: [`contracts/.spectral.yaml`](./.spectral.yaml) (`extends: spectral:oas`).

## Versioning & compatibility

1. **Non-breaking**: additive optional fields, new endpoints, new topics with same major version.
2. **Breaking**: new OpenAPI file major (`core-hr-v2.yaml`), new proto package major (`hr.core.v2`), or new Kafka topic major suffix — requires Orchestrator review + ADR.
3. Register schemas used by Kafka with Schema Registry for environments where enforcement is enabled (see [`docker-compose.yml`](../docker-compose.yml) profile `architecture`).
