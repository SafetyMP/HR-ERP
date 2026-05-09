# Bounded contexts — default map

Contexts are **ownership** boundaries, not necessarily one process per context in every environment. In **production** alignment with the greenfield plan, each context below should have its **own PostgreSQL** (or isolated cluster) and deployable service when scale, compliance, or blast radius warrant it.

| Context | Owns (examples) | Database (logical) | Writes by |
| --- | --- | --- | --- |
| **Core HR** | Party/Person, Employee, Job, Org, Position, worker lifecycle | `core_hr` | Core HR service only |
| **Payroll** | Pay calendar, pay runs, pay lines, deductions, tax artifacts | `payroll` | Payroll service only |
| **Time & Labor** | Timesheets, punches, approvals | `time_labor` | Time service only |
| **Benefits** | Enrollments, eligibility, plans | `benefits` | Benefits service only |

## Integration rules

1. **No cross-context FKs** across databases. Reference stable business IDs (e.g. `employee_id` UUID issued by Core HR).
2. **Cross-context mutations** go through the **owning** service: async command via Kafka and/or synchronous API on the owner—not direct SQL.
3. **Payroll** may **read** Core HR via published events (preferred for high-volume facts) or **read APIs** (gRPC/REST) for edge cases; **never** connect to `core_hr` Postgres for writes.

## Topic naming convention

`hr.<context>.<aggregate>.v<major>` — e.g. `hr.core.employee.v1`. Breaking schema changes require a new major version or topic.
