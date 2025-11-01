# Implementation Plan: Application Manager Baseline

**Branch**: `001-baseline-spec` | **Date**: 2025-11-01 | **Spec**: ./spec.md
**Input**: Feature specification from `/specs/001-baseline-spec/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver the baseline product slice enabling users to:
- Ingest job postings (deduped),
- Run deterministic relevance filtering with traceability,
- Generate application documents from stored personal data, and
- Track application lifecycle (applied timestamp, notes, interviews, feedback).

Technical approach (high-level):
- Web app using existing Next.js App Router project and MongoDB.
- Agents operate with versioned prompts (temp=0), all runs logged with inputs/
  outputs and timestamps.
- Long-running operations are async with progress feedback.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5; React 19; Next.js 15 (App Router)  
**Primary Dependencies**: TailwindCSS 4, shadcn/ui (Radix), MongoDB driver, OpenAI SDK  
**Storage**: MongoDB (connection via `lib/mongodb.ts`)  
**Testing**: Vitest + React Testing Library; Playwright for E2E  
**Target Platform**: Web app; serverless/edge-capable  
**Project Type**: Single web app (monorepo root)  
**Performance Goals**: From spec: batch filter ~3 minutes/100 jobs; P1 flow <10 minutes  
**Constraints**: Deterministic AI (temp=0); PII never logged; TLS in transit  
**Scale/Scope**: Single-user to small-team initially; future agents extensible  
**Deployment**: Vercel  
**Monitoring/Logging**: Vercel Analytics; structured JSON logs with optional drains later

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The following gates derive from the Constitution and MUST be addressed in this plan:

- UX Benefit (Principle II): State the tangible user benefit for this feature.
- Security (Principle III): Confirm no PII in logs, TLS in transit, and secrets in env.
- AI Determinism (Principle IV): Document prompt version, parameters (e.g., temp=0),
  and traceability (run IDs, inputs/outputs persisted).
- Performance (Principle I): Define acceptance targets/constraints relevant to this work.
- Extensibility (Principle V): Note impacts on modularity and ability to add future agents/data.

Gate Evaluation (Pre-Design):
- UX Benefit: PASS — Time savings and organization for applications as primary outcome.
- Security: PASS — PII not logged; secrets in env; HTTPS/TLS enforced externally; DB access via singleton.
- AI Determinism: PASS — Versioned prompt templates with fixed prefix/postfix; temp=0; run logs.
- Performance: PASS — Targets captured in Success Criteria; async/background ops planned.
- Extensibility: PASS — Clear boundaries and adapter-friendly data and agent layers per constitution.

Gate Evaluation (Post-Design/Research):
- UX Benefit: PASS — Flows and success criteria emphasize time saved and clarity.
- Security: PASS — No PII in logs; secrets in env; quickstart documents env setup.
- AI Determinism: PASS — Contracts and data model include run traceability; prompts versioned.
- Performance: PASS — Targets stated; async handling in plan and quickstart; E2E planned.
- Extensibility: PASS — Entities and API contracts support future evaluator/agents.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
  api/
    jobs/
      route.ts
      [id]/route.ts
    filter/route.ts
    prompts/route.ts
  jobs/[id]/page.tsx
  search/page.tsx
components/ui/
lib/
specs/001-baseline-spec/
```

**Structure Decision**: Single Next.js App Router project. API endpoints reside in
`app/api/*/route.ts`; UI under `app/*`. Feature docs live in `specs/001-baseline-spec/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

Currently no violations expected; if background processing necessitates a queue,
we will justify and record here.
