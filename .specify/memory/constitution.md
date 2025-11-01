<!--
Sync Impact Report
- Version change: n/a → 1.0.0
- Modified principles: n/a (initial adoption)
- Added sections: Core Principles, Project Ethos, Development Guidelines, Governance
- Removed sections: none
- Templates requiring updates:
	- ✅ .specify/templates/plan-template.md (Constitution Check gates aligned)
	- ✅ .specify/templates/spec-template.md (no constitution coupling found)
	- ✅ .specify/templates/tasks-template.md (no constitution coupling found)
	- ✅ .specify/templates/agent-file-template.md (generic; no changes needed)
- Follow-up TODOs:
	- None
-->

# Application Manager Web App Constitution

## Core Principles

### I. Performance over Complexity
Code MUST favor efficient execution and simple designs over premature abstraction.
- Prefer straightforward solutions with minimal layers; avoid needless indirection.
- Establish and track performance acceptance targets per feature (document in plan/spec).
- Complexity requires an explicit justification and measurable benefit.

Rationale: Simple, fast code reduces defects, improves maintainability, and keeps the
application responsive for users.

### II. UX as a Driver
Every shipped feature MUST demonstrate a clear, tangible user benefit.
- Include a “User Benefit” note in specs/plans; do not ship without it.
- Prefer fewer, higher-quality flows over many partially complete features.
- UX feedback informs iterations; regressions require remediation before adding scope.

Rationale: The product exists to save time, keep users organized, and improve application
quality; UX outcomes drive prioritization and acceptance.

### III. Data Security
Personal data MUST be protected in transit and at rest.
- Enforce TLS for all network traffic; do not transmit PII over unencrypted channels.
- Store secrets in environment variables; never commit secrets.
- Do not log PII; apply data minimization and access controls.
- Encrypt sensitive data at rest where supported; document any justified exceptions.

Rationale: Trust is foundational. Security failures undermine user value and compliance.

### IV. Deterministic AI Logic
Filter and Application Agents MUST produce reproducible, traceable results.
- Use versioned, fixed prompt templates (non-editable prefix/postfix) and temperature 0.
- Persist inputs, outputs, and prompt versions with run IDs and timestamps for audit.
- Changes to prompts or parameters require a version bump and migration notes.

Rationale: Determinism enables debugging, fair comparisons, and reliable automations.

### V. Extensibility
Architecture MUST remain open to future databases, data sources, and additional agents.
- Keep boundaries clean (UI, server functions, data layer, agents) to avoid coupling.
- Favor modular schemas and adapters to onboard new sources without rewrites.
- Avoid provider lock-in; wrap external services behind stable interfaces.

Rationale: Requirements evolve; extensibility preserves velocity and reduces rework.

## Project Ethos

Purpose: A web app that automates and centralizes job applications. It collects, filters,
and manages job postings and generates AI-assisted application documents from a personal
profile.

Guiding Principle: Users should save time, stay organized, and produce high-quality
applications.

## Development Guidelines

- Code Style: Follow the repository’s established conventions (TypeScript strict mode,
	Next.js App Router, Tailwind, shadcn/ui). Derive specifics from existing code.
- Technical Focus: Clear separation between UI (React/Next.js) and server logic using
	Next.js App Router API routes (`app/api/*/route.ts`).
- Data Storage: MongoDB with modular schemas; avoid tight coupling to a single DB.
- Agent Logic:
	- Filter Agent uses a fixed prompt template with non-editable prefix/postfix.
	- Application Agent composes documents from stored personal and job data.
- Determinism & Traceability: Record agent run IDs, prompt version, inputs/outputs, and
	timestamps. Actions (e.g., “applied”, feedback) MUST be stored with timestamps.
- Security: No unencrypted transmission; avoid PII in logs; secrets via environment
	variables; document any encryption-at-rest constraints and mitigations.

## Governance

- Supremacy: This constitution supersedes conflicting process documents.
- Amendments: Changes occur via PR with:
	- Rationale and impact assessment
	- Version bump per Semantic Versioning (see below)
	- Migration plan for any breaking governance changes
- Compliance Review: Every PR includes a “Constitution Check” covering:
	- UX benefit stated (Principle II)
	- Security considerations (Principle III)
	- AI determinism and traceability (Principle IV)
	- Performance acceptance/constraints (Principle I)
	- Extensibility impact (Principle V)
- Versioning Policy (CONSTITUTION_VERSION):
	- MAJOR: Backward-incompatible governance or redefinitions/removals
	- MINOR: New sections/principles or materially expanded guidance
	- PATCH: Clarifications and non-semantic refinements
- Reviews & Audits: Quarterly audits verify adherence to security and AI traceability
	requirements; findings tracked and remediated.

**Version**: 1.0.0 | **Ratified**: 2025-11-01 | **Last Amended**: 2025-11-01
