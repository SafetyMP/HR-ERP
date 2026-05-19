# Operations TCO worksheet — HR ERP vs vendor-hosted SaaS

**Purpose:** Compare **cost to operate** (not license negotiation) for HR ERP self-host vs mid-market SaaS. Use with the [validated inventory](./competitive-ops-inventory.md) and [competitive roadmap](../../specs/competitive-analysis-roadmap.md).

**Currency:** USD, illustrative **monthly** unless noted. Ranges reflect typical 2025–2026 public pricing and engineering market rates — adjust for your region and headcount.

---

## 1. Assumptions

| Parameter | Low | Base | High | Notes |
| --- | ---: | ---: | ---: | --- |
| Employee count | 100 | **500** | 2,000 | Mid-market anchor |
| Traffic | Low internal | Moderate ESS | High ESS + API | Affects Vercel |
| Workers in prod | Staging only | **Yes** (webhooks + integrations) | Yes + dedicated SRE |
| Statutory payroll | Partner (Gusto/ADP) | **Build + counsel** | Full in-house engine |
| ML in production | Off | **Off** (demo only) | Phase 1–3 met |

---

## 2. HR ERP — infrastructure cash opex (monthly)

| Line item | Low | Base | High | Driver / config |
| --- | ---: | ---: | ---: | --- |
| Vercel (Pro + usage) | $20 | $150 | $800 | Next.js 16, `iad1`; scales with SSR/API invocations |
| Postgres (Neon/RDS) | $25 | $120 | $600 | Single `DATABASE_URL`; storage + HA tier |
| Redis (Upstash/ElastiCache) | $0 | $40 | $200 | Required for BullMQ workers |
| Worker hosting (2 processes) | $0 | $80 | $400 | Fly/Railway/ECS — **not** on Vercel |
| Observability / logs | $0 | $50 | $300 | OTel, log drain |
| Secrets / IdP | $0 | $30 | $150 | OIDC vendor if used |
| **Infra subtotal** | **$45** | **$470** | **$2,450** | |

### Phase 2 topology — do not fund without ADR trigger

| If adopted early | Incremental monthly | Ops multiplier |
| --- | ---: | --- |
| Kafka + ZK + Schema Registry (managed or self) | $300–1,500+ | +always-on ops |
| Second + third Postgres | $100–400+ | +backup/migration |
| On-call for bus failures | — | **3–5×** engineering attention |

Source: [`deferred-platform-track.md`](./deferred-platform-track.md), Compose `architecture` profile in [`docker-compose.yml`](../../docker-compose.yml).

---

## 3. HR ERP — people opex (monthly, fully loaded)

| Role | FTE (low) | FTE (base) | FTE (high) | Monthly @ $15k/FTE loaded | Base $/mo |
| --- | ---: | ---: | ---: | --- | ---: |
| Platform / full-stack (app, RLS, APIs) | 0.25 | **0.5** | 1.0 | × $15,000 | $7,500 |
| Payroll / compliance engineer | 0 | **0.25** | 0.5 | × $15,000 | $3,750 |
| Security / identity (part-time) | 0.1 | **0.15** | 0.25 | × $15,000 | $2,250 |
| DevOps / on-call | 0.1 | **0.2** | 0.5 | × $15,000 | $3,000 |
| **People subtotal** | | | | | **$16,500** |

**Adjust loaded rate:** $12k (lean) → **$13,200** base people; $18k (US coastal) → **$19,800**.

### One-time / amortized (not in monthly above)

| Item | Estimate | Amortize (36 mo) |
| --- | ---: | ---: |
| Tier 1 product (014–017 UIs) | 3–6 eng-months | $1,500–3,000/mo |
| Tier 2 statutory (US v1 + counsel) | 2–4 eng-months + legal | $1,000–2,500/mo |
| SOC 2 Type II (if required) | $50k–150k audit | $1,400–4,200/mo |

---

## 4. HR ERP — CI / engineering tax (monthly)

| Line item | Estimate | Notes |
| --- | ---: | --- |
| GitHub Actions (PR + main) | $50–400 | 5 jobs × quality gate; 5 again on `main` deploy gate; 2 Vitest shards + integration + e2e + Python |
| Developer time waiting on CI | $200–2,000 | Qualitative; reduce via P2 (nightly ML smoke) |

**Per gate job inventory:** [`competitive-ops-inventory.md`](./competitive-ops-inventory.md) § CI/CD.

---

## 5. SaaS comparator — illustrative subscription (monthly)

Public/industry **indicative** PEPM — **quote required** for your contract.

| Vendor | Segment | Indicative formula | @ 500 EE (base) |
| --- | --- | --- | ---: |
| **Gusto** | SMB | $49–180 base + $6–12 PEPM | ~$3,050–6,180 |
| **BambooHR** | SMB–mid | $6–12 PEPM (+ payroll add-on ~$4.25) | ~$3,000–6,000 (+ payroll) |
| **Rippling** | Mid-market | Quote; often $8–14+ PEPM all-in | ~$4,000–7,000+ |
| **UKG / Paylocity** | Mid-market payroll-heavy | Quote | ~$5,000–10,000+ |
| **Workday** | Enterprise | Enterprise agreement | **$25,000+** typical |

**What SaaS ops includes (you do not staff):** tax table updates, filings (where sold), uptime, tenant patching, SOC reports, carrier integrations (tier-dependent), support desk.

---

## 6. Total cost comparison (500 employees, base case)

| Cost bucket | HR ERP (self-operate) | SaaS (Rippling-class mid) |
| --- | ---: | ---: |
| Infra | $470 | (included) |
| Subscription | $0 | ~$5,500 |
| People (platform + payroll + security + ops) | $16,500 | ~$1,500 (internal HR admin only) |
| CI / tooling | $150 | $0 |
| Risk reserve (statutory, incidents) | $2,000 | (vendor-absorbed) |
| **Approx. monthly TCO** | **~$19,120** | **~$7,000** |
| **Approx. per employee / month** | **~$38** | **~$14** |

### Breakeven intuition

HR ERP **infra savings** (~$5k/mo vs subscription) are **swamped** by **people opex** until:

- Employee count is **very large** and subscription scales linearly while platform team scales sub-linearly, **or**
- Strategic mandate avoids SaaS (data residency, deep vertical rules, embedded HR in another product), **or**
- You already employ the platform team for non-HR systems (marginal FTE near zero).

**Illustrative enterprise crossover:** At **5,000** employees, Rippling-class spend might reach **$40k–70k/mo** while a **stable** internal platform team might remain **$25k–35k/mo** loaded — crossover becomes plausible **after** multi-year build and statutory depth.

---

## 7. Segment summary table

| Segment | HR ERP operate TCO | SaaS operate TCO | Value winner | Ops cost winner |
| --- | --- | --- | --- | --- |
| **SMB (100 EE)** | High (min team + partner payroll) | Low | SaaS (features + filing) | **SaaS** |
| **Mid (500 EE)** | High unless staffed anyway | Moderate | Tie after Tier 1; SaaS today | **SaaS** |
| **Enterprise (5k EE)** | Very high build; lower at scale | High license, low buyer headcount | Enterprise SaaS features | **SaaS** unless build mandate |

---

## 8. Cost levers (ordered by ROI)

| Lever | Savings | Tradeoff |
| --- | --- | --- |
| Keep Phase 1 monolith | Avoid $500–2k/mo + on-call | No context isolation |
| Run workers only in prod paths that need webhooks | $40–200/mo | Manual integration gap in dev |
| Path-filter / nightly Python CI smoke | $20–150/mo Actions | Slower ML regression signal |
| Partner payroll (Gusto/ADP) | 0.25–0.5 FTE payroll eng | Less kernel differentiation |
| Ship 014–017 before Tier 3 platform | Faster revenue/credibility | — |

---

## 9. Related documents

- [Executive brief](./competitive-benchmark-executive-brief.md)
- [Competitive analysis & roadmap](../../specs/competitive-analysis-roadmap.md)
- [Codebase completion baseline](./codebase-completion-baseline.md)
