---
name: hr-product-owner
description: >-
  Gates HR ERP product work through human-centered process mapping, pain-based
  prioritization, strict UAC with standard HR terminology, and friction checks
  (e.g. employee pay tasks under ~10 seconds). Use when designing or scoping
  features, drafting Feature briefs, reviewing UX for HR/payroll flows, writing
  QA acceptance criteria, prioritizing backlog, or before engineering starts a
  new capability. Apply when the user mentions UAC, onboarding, offboarding,
  FMLA, PIP, headcount, paystub, earnings statement, HR Director persona, or
  Product Owner workflow.
---

# HR Product Owner (repo skill)

## Workspace grounding

Before citing paths, scripts, APIs, or dependencies for **this repo**, apply [workspace grounding](../README.md) against the active checkout—use Read/Grep (or search), not training-data defaults.

## Who must use this

**Orchestrator, Architecture, QA, Legal/compliance, Integrations, Security, Engineering, and Frontend agents** (including Cursor **Task** subagents) load this skill as part of **repo orchestration**, not as an optional extra. The always-on Orchestrator ([`.cursor/rules/orchestrator.mdc`](../../rules/orchestrator.mdc)) **step 1** requires applying `hr-product-owner`, then emitting a **PO orchestration checkpoint** before Architecture. Every delegated Task in the Architecture→QA pipeline **must** include this skill + the active brief/ADR path unless step 1 is documented chore **N/A**.

For ad-hoc work outside that pipeline, still load this skill whenever **Feature briefs**, **UAC**, **scope**, or **employee/manager-facing** flows are in play.

## How to invoke (Cursor + other workspaces)

| Context | Action |
|--------|--------|
| This repo | Type **`@hr-product-owner`** or open [SKILL.md](SKILL.md) (this file). |
| Cursor **Task** / delegated agent | Paste **SKILL.md** path into the Task prompt: `.cursor/skills/hr-product-owner/SKILL.md`, plus the active **Feature brief** under `docs/product/feature-briefs/` or **spike ADR** path from step 1. |
| **Orchestrator step 1** | After loading this skill, emit the **PO orchestration checkpoint** (≤6 lines) before Architecture—see [orchestrator.mdc](../../rules/orchestrator.mdc). |
| Another workspace / IDE | Copy or symlink **`hr-product-owner/`** to **`~/.cursor/skills/hr-product-owner/`** on the machine (same pattern as `AGENTS.md` for `hr-erp-mlops`). |

**Skill identifier:** `name` in frontmatter is `hr-product-owner` (for `@` mentions when Cursor indexes project skills).

## First actions

1. Open [docs/product/hr-product-owner-operating-model.md](../../../docs/product/hr-product-owner-operating-model.md) for the full gate and agent handoff rules.
2. For new work, copy [docs/product/feature-brief-template.md](../../../docs/product/feature-brief-template.md) into [docs/product/feature-briefs/](../../../docs/product/feature-briefs/) and fill every section before implementation.

## Non-negotiables

- **No code until the PO gate is explicit:** user/persona, job-to-be-done, pain today, outcome, scope boundary (what is out of scope).
- **Empathy before fields:** Describe the real workflow (stress, compliance, who does what)—not database operations.
- **Prioritize pain relief:** Favor fewer clicks, no duplicate entry, automation of boring work; cut “cool” tech with no HR pain.
- **UAC for QA:** Numbered, observable checks; use **standard HR / payroll terms** (headcount reconciliation, FMLA, PIP, earnings statement, etc.), not CRUD jargon.
- **Friction police:** Primary flows must not require a manual; meet task-time and empty/error behavior in the brief (e.g. view current paystub in **under ~10 seconds** for a first-time user where the brief says so).

## Agent roles (handoff)

| Agent        | Rule                                                                 |
| ------------ | -------------------------------------------------------------------- |
| Engineering  | Builds only from an approved Feature brief with UAC attached.      |
| QA           | Tests verbatim against published UAC; gaps = PO defect.              |
| Frontend     | Reject designs that need training; simplify IA, labels, defaults.    |

## Quick reference

- Active briefs: [docs/product/feature-briefs/](../../../docs/product/feature-briefs/)
- Example approved brief: [docs/product/feature-briefs/001-employee-paystub-self-service.md](../../../docs/product/feature-briefs/001-employee-paystub-self-service.md)
