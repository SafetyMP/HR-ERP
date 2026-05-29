# HR backend compliance — regulatory & edge-case reference

Use this when scoping **new** capabilities beyond `pay-premiums-and-allocations-v1`. Keep **authoritative** numbers in `docs/compliance/` matrices, not here.

## Domains to consider (non-exhaustive)

| Domain | Examples | Backend touchpoints |
|--------|----------|---------------------|
| US wage & hour | FLSA; state OT/meal/rest; local fair workweek | Premiums, rounding, show-up pay |
| US leave / accommodation | FMLA; state PFML; ADA; USERRA | Eligibility, coordination, intermittent |
| US tax & reporting | IRC; multi-state withholding; W-2/W-4/1099 | Situs, reciprocity, classification |
| Anti-discrimination | Title VII, ADEA, EPA, GINA | Screening, pay equity analytics |
| Benefits / health | ERISA; HIPAA (PHI); COBRA | Eligibility, SPD, PHI minimization |
| Immigration | I-9; E-Verify | Retention, reverification |
| EU/UK privacy | GDPR / UK GDPR; DPA 2018 | Lawful basis, DSRs, transfers, retention |
| US state privacy | CCPA/CPRA, state “CPA” laws | Sensitive data, opt-out, retention |
| Global | PIPL, LGPD, PDPA, etc. | Localization, consent |
| SOC 2 | Trust criteria | Access, logging, change mgmt, vendors |

## Edge-case dimensions (always effective-dated)

1. **Tenure / seniority** — cliffs, rehire breaks, successor employer.
2. **Age** — minors, permits, hazardous work flags.
3. **Location** — home vs worksite, multi-state period, locality, visa situs, EU posting.
4. **Contract / classification** — W-2 vs 1099, exempt/non-exempt, CBA, seasonal/part-time.

## Artifact types (deliver for each feature)

Jurisdiction matrix; invariants; state machines; validations; deterministic calc DAG with overrides; audit/explainability; versioned effective dating.
