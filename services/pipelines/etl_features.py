"""
Nightly-style ETL: build anonymized feature snapshots from OLTP tables.

Requires: `DATABASE_URL`, `psycopg[binary]`.

    pip install psycopg[binary]
    python etl_features.py
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import date, datetime, timedelta, timezone

import psycopg

FEATURE_VERSION = "etl_v1_py"

QUERY = """
SELECT e.id AS employee_id,
       e.tenant_id,
       e.hire_date,
       e.termination_date,
       pr.sentiment_score,
       comp.band_position,
       pb.balance_hours,
       (SELECT COUNT(*)::int FROM pto_requests p
         WHERE p.employee_id = e.id AND p.request_date >= %(since)s) AS pto_requests_90d
FROM employees e
LEFT JOIN LATERAL (
  SELECT sentiment_score FROM performance_reviews r
  WHERE r.employee_id = e.id
  ORDER BY r.period_end DESC NULLS LAST
  LIMIT 1
) pr ON true
LEFT JOIN LATERAL (
  SELECT band_position FROM compensation_records c
  WHERE c.employee_id = e.id
  ORDER BY c.effective_from DESC NULLS LAST
  LIMIT 1
) comp ON true
LEFT JOIN LATERAL (
  SELECT balance_hours FROM pto_balances b
  WHERE b.employee_id = e.id
  ORDER BY b.as_of_date DESC NULLS LAST
  LIMIT 1
) pb ON true
WHERE e.tenant_id = %(tenant_id)s AND e.status = 'ACTIVE';
"""


def main():
    dsn = os.environ["DATABASE_URL"]
    tenant_id = os.environ.get("ETL_TENANT_ID") or os.environ.get("DEMO_TENANT_ID")
    if not tenant_id:
        raise SystemExit("Set ETL_TENANT_ID or DEMO_TENANT_ID")
    since = date.today() - timedelta(days=90)

    with psycopg.connect(dsn, autocommit=True) as conn:
        conn.execute("SELECT set_config('app.tenant_id', %(t)s, true)", {"t": tenant_id})
        with conn.cursor() as cur:
            cur.execute(QUERY, {"tenant_id": tenant_id, "since": since})
            rows = cur.fetchall()
            snap = datetime.now(timezone.utc)
            for row in rows:
                emp_id = row[0]
                hire = row[2]
                sentiment = float(row[4]) if row[4] is not None else 0.0
                band = float(row[5]) if row[5] is not None else 0.55
                pto_h = float(row[6]) if row[6] is not None else 80.0
                pto_90 = int(row[7] or 0)
                tenure_m = 0
                if hire:
                    tenure_m = max(0, (date.today() - hire).days // 30)
                features = {
                    "tenure_months": tenure_m,
                    "pto_hours_remaining": pto_h,
                    "pto_requests_90d": pto_90,
                    "comp_band_position": band,
                    "review_sentiment": sentiment,
                    "market_comp_ratio": 0.95,
                }
                cur.execute(
                    """
                    INSERT INTO analytics_feature_snapshots
                      (id, tenant_id, employee_id, snapshot_date, features, etl_version, created_at)
                    VALUES
                      (%(id)s, %(tenant)s, %(emp)s, %(at)s, %(feat)s::jsonb, %(ver)s, NOW())
                    """,
                    {
                        "id": str(uuid.uuid4()),
                        "tenant": tenant_id,
                        "emp": emp_id,
                        "at": snap,
                        "feat": json.dumps(features),
                        "ver": FEATURE_VERSION,
                    },
                )
            print(f"analytics_feature_snapshots inserted for {len(rows)} employees")


if __name__ == "__main__":
    main()
