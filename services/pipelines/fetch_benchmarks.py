"""Insert mock external benchmark rows (replace with real provider client)."""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone

import psycopg


def main():
    dsn = os.environ["DATABASE_URL"]
    tenant_id = os.environ.get("BENCHMARK_TENANT_ID") or os.environ.get("DEMO_TENANT_ID")
    if not tenant_id:
        raise SystemExit("Set BENCHMARK_TENANT_ID or DEMO_TENANT_ID")
    job_role_id = os.environ.get("BENCHMARK_JOB_ROLE_ID")
    if not job_role_id:
        raise SystemExit("Set BENCHMARK_JOB_ROLE_ID to a job_roles.id")

    payload = {
        "title": os.environ.get("BENCHMARK_TITLE", "Senior Rust Engineer in Berlin"),
        "provider": "mock",
    }
    eff = datetime.now(timezone.utc)

    with psycopg.connect(dsn, autocommit=True) as conn:
        conn.execute("SELECT set_config('app.tenant_id', %(t)s, true)", {"t": tenant_id})
        conn.execute(
            """
            INSERT INTO market_benchmarks
              (id, tenant_id, job_role_id, geo_code, currency, provider,
               p50_annual, p75_annual, p90_annual, sample_size, effective_date, raw_payload, created_at)
            VALUES
              (%(id)s, %(tid)s, %(jid)s, %(geo)s, %(cur)s, %(prov)s,
               %(p50)s, %(p75)s, %(p90)s, %(n)s, %(eff)s, %(raw)s::jsonb, NOW())
            """,
            {
                "id": str(uuid.uuid4()),
                "tid": tenant_id,
                "jid": job_role_id,
                "geo": "DE-BE",
                "cur": "EUR",
                "prov": "mock_provider",
                "p50": 128_000,
                "p75": 145_000,
                "p90": 162_000,
                "n": 180,
                "eff": eff,
                "raw": json.dumps(payload),
            },
        )
        print("market_benchmarks row inserted")


if __name__ == "__main__":
    main()
