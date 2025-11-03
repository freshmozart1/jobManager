<!--
Sync Impact Report
- Version: N/A → 1.0.0
- Modified: Core Principles (filled), Governance (concrete rules)
- Added sections: Security & Compliance; Performance & Observability
- Removed fields: Ratified (footer)
- Templates requiring updates:
	- .specify/templates/plan-template.md — ⚠ pending
	- .specify/templates/spec-template.md — ⚠ pending
	- .specify/templates/tasks-template.md — ⚠ pending
	- .specify/templates/commands/* — ⚠ create
- Follow-up TODOs:
	- Add CI workflow to enforce lint, typecheck, contract + E2E and upload Playwright artifacts — ⚠ pending
-->

# Job Manager Constitution

## Core Principles

### I. Test-First with Playwright (NON-NEGOTIABLE)
- MUST follow TDD: write/modify Playwright tests first, see them fail, then implement, then refactor.
- Contract tests in `tests/contract` MUST define and guard API behavior; E2E tests in `tests/e2e` MUST cover user flows.
- Every PR that changes behavior MUST include corresponding test changes (contract and/or E2E).
- CI MUST run contract tests before E2E tests; both MUST pass for merge.

### II. Clear Frontend–Backend Boundaries
- Client code MUST NOT access the database directly; all data flows through App Router API routes in `app/api/**/route.ts`.
- React Server Components are the default; add `'use client'` only when interaction or browser APIs require it.
- Reusable UI components MUST reside in `components/ui/*`; shared helpers used by multiple components MUST reside in `lib/*`.
- API routes MUST use `NextResponse`, include CORS via `lib/cors.ts`, validate inputs, and return proper HTTP status codes.

### III. Type-Safe, Linted, and Consistent
- TypeScript strictness MUST be preserved; avoid `any` (use `unknown` or precise types). Prefer `type` over `interface`.
- Types MUST live in `types.d.ts` or be colocated with modules/components.
- ESLint and Prettier MUST be clean before commit; do not disable rules without justification.
- Naming: Components PascalCase; functions/variables camelCase; constants SCREAMING_SNAKE_CASE; files camelCase; UI files in `components/ui` MUST use the `app*` prefix per repo convention.

### IV. Security and Responsible Data Handling
- Environment variables MUST be validated before use; secrets MUST NOT be logged.
- Inputs to API routes SHOULD be validated with zod schemas (see Security & Compliance section).
- Errors MUST use custom error classes from `lib/errors.ts` and be mapped to HTTP status codes consistently.
- MongoDB operations MUST set timeouts (e.g., `timeoutMS: 3000`) and use projections to exclude unnecessary fields (e.g., `_id` when appropriate).
- CORS MUST be enforced consistently via `lib/cors.ts`. Apply the principle of least privilege to all integrations (OpenAI, Apify, MongoDB).

### V. Accessible, Performant UI with Functional Patterns
- Use shadcn/ui (Radix) primitives and TailwindCSS utilities; ensure keyboard navigation, ARIA labeling, and contrast meet WCAG AA.
- Prefer functional patterns when practical; avoid shared mutable state; isolate side effects.
- Use `cn()` from `@/lib/utils` for conditional classes; follow mobile-first responsive design and Tailwind dark mode utilities.
- Avoid duplication: factor cross-cutting logic into `lib/*` and reuse.

## Security & Compliance
- MUST validate all `app/api/*` inputs with zod; share schemas under `lib/schemas/*`; respond with 400 and zod issue details on invalid input.
- MUST validate required environment variables at startup using custom errors in `lib/errors.ts` (e.g., `MONGODB_CONNECTION_STRING`, `DATABASE_NAME`, `OPENAI_API_KEY`, `ALLOWED_ORIGINS`, `NEXT_PUBLIC_BASE_URL`).
- MUST handle secrets from environment only; NEVER log secret values; redact sensitive fields in logs/responses; NEVER serialize secrets to clients.
- MUST apply least-privilege data access: narrow queries; use projections to limit fields; avoid broad updates/deletes.
- MUST maintain dependency hygiene: pin/minimize versions, review new deps, remove unused, remediate high-severity advisories before release.
- SHOULD minimize PII collection/retention; DO NOT log PII; errors use typed classes from `lib/errors.ts` with non-PII messages.
- MUST define incident response: log a structured error with a unique `correlationId`; return a generic user message; open a follow-up issue documenting scope and mitigation.
- MUST enforce CORS via `lib/cors.ts`: allowlist origins and support `OPTIONS` preflight.
- MUST set MongoDB per-operation timeouts (≈ `timeoutMS: 3000`/`maxTimeMS`) and abort long-running operations.
- MUST map domain errors to proper HTTP status codes consistently in API routes (e.g., 400/404/409/500).

## Performance & Observability
- MUST prefer React Server Components to minimize client JavaScript; add client boundaries and `'use client'` only when needed; lazy-load heavy client bundles.
- MUST create/maintain MongoDB indexes for frequent queries (see `app/api/jobs/createIndexes.mongodb.js`); avoid full collection scans.
- MUST avoid N+1 queries: batch reads/writes; use projections to limit payload size; never per-row fetch in tables.
- MUST apply operation timeouts (≈ 3000ms) and use `AbortController` for outgoing fetches where relevant.
- MUST emit structured JSON logs on errors: include route, error class, status code, and `correlationId`; exclude PII and secrets.
- SHOULD record basic timing metrics (e.g., query and generation durations) in logs for hotspot analysis.
- MUST retain Playwright artifacts in CI: traces on first retry, videos/screenshots on failure; persist artifacts for triage.
- Must use the writeLog function from '@/lib/utils' for all logging to ensure consistency and structure.

## Governance
- Precedence: This Constitution supersedes ad-hoc practices when conflicts occur.
- Amendments: Changes occur via PR modifying `.specify/memory/constitution.md` with rationale and migration notes; require repository owner or two maintainer approvals; label the PR “Constitution”.
- Versioning Policy (SemVer): Start at 1.0.0; MAJOR for breaking governance changes; MINOR for new non-breaking rules; PATCH for clarifications/typos. Update version and Last Amended with each change.
- Compliance: CI MUST enforce ESLint, TypeScript checks, and Playwright contract + E2E suites. (Adding/adjusting workflows is a follow-up task.)
- PR Checklist MUST include: TDD-first; API boundaries respected; zod schemas (shared under `lib/schemas/*`); domain errors mapped; no PII/secrets in logs; CORS allowlist considered; RSC-first and lazy-load verified; indexes considered/updated; tests added/updated; docs and `.github/copilot-instructions.md` synced.
- Guidance: `.github/copilot-instructions.md` is the canonical runtime/development guide and MUST be followed.

**Version**: 1.0.0 | **Last Amended**: 2025-11-03
