---
description: "Plan to amend and finalize Job Manager constitution v1.0.0: replace placeholders with concrete, testable rules; include Security & Compliance and Performance & Observability; remove Ratified; standardize Playwright artifacts; share zod schemas under lib; enforce 3000ms DB timeouts; and record sync impacts and follow-ups."
---

# Job Manager Constitution v1.0.0 — amendment plan

## Goal
Finalize the constitution by replacing the template in `.specify/memory/constitution.md` with concrete, testable project rules; include both “Security & Compliance” and “Performance & Observability”; remove the Ratified field; set Version = 1.0.0 and Last Amended = 2025-11-03; embed a Sync Impact Report; and note dependent follow-ups.

## Actions to perform (in this amendment)
- Replace placeholders with project specifics and MUST/SHOULD rules.
- Add both sections: Security & Compliance; Performance & Observability.
- Write Governance (precedence, PR amendments, SemVer policy, CI compliance, PR checklist, guidance reference).
- Footer: remove Ratified entirely; set `Version: 1.0.0 | Last Amended: 2025-11-03`.
- Add an HTML comment Sync Impact Report at the top of the constitution.

## Core principles to encode
- I. Test-First with Playwright (NON-NEGOTIABLE)
  - MUST follow TDD: write failing tests first, then implement, then refactor.
  - Contract tests in `tests/contract` guard API behavior; E2E tests in `tests/e2e` cover user flows.
  - Every behavior change MUST include test updates; CI gates run contract before E2E.
- II. Clear Frontend–Backend Boundaries
  - Client MUST NOT access DB directly; all data flows via App Router API `app/api/**/route.ts`.
  - Prefer React Server Components; add `'use client'` only when required.
  - Reusable UI in `components/ui/*`; shared helpers used by multiple components in `lib/*`.
  - API routes MUST use `NextResponse`, add CORS via `lib/cors.ts`, validate inputs, and return proper HTTP codes.
- III. Type-Safe, Linted, Consistent
  - TypeScript strict; avoid `any`; prefer `type` over `interface`.
  - Types in `types.d.ts` or colocated modules.
  - ESLint + Prettier clean; naming: PascalCase (components), camelCase (vars/functions), SCREAMING_SNAKE_CASE (constants); file names camelCase; UI files must use `app*` prefix under `components/ui` per repo convention.
- IV. Security & Responsible Data Handling
  - Validate env vars before use; no secrets in logs; sanitize inputs; custom errors in `lib/errors.ts`.
  - Mongo operations set timeouts (~3000ms) and use projections to exclude unnecessary fields (e.g., `_id` when appropriate).
  - Enforce least privilege for all integrations (OpenAI, Apify, MongoDB).
- V. Accessible, Performant UI with Functional Patterns
  - shadcn/ui (Radix) + Tailwind; keyboard navigation, ARIA labels, and contrast meet WCAG AA.
  - Prefer functional patterns; isolate side effects; use `cn()` from `@/lib/utils`; DRY via `lib/*`.

## Section: Security & Compliance
- Inputs to all API routes MUST be validated with zod; share schemas under `lib/schemas/*`; 400 with zod issues on invalid input.
- Required env vars MUST be validated at startup (e.g., `MONGODB_CONNECTION_STRING`, `DATABASE_NAME`, `OPENAI_API_KEY`, `ALLOWED_ORIGINS`, `NEXT_PUBLIC_BASE_URL`).
- Secrets MUST come from env only; never logged; redact sensitive fields in logs and responses; never sent to clients.
- Database access MUST follow least privilege: narrow queries; use projections to limit fields; avoid broad updates/deletes.
- Dependency hygiene MUST be maintained: pin versions, remove unused packages, remediate high-severity advisories before release.
- PII SHOULD be minimized; PII MUST NOT be logged; errors use typed classes from `lib/errors.ts` with non-PII messages.
- Incident response MUST: log structured error with correlationId, respond with generic message, and open a follow-up issue.
- CORS MUST be enforced via `lib/cors.ts` with an allowlist and proper `OPTIONS` preflight handling.
- Standard DB timeouts: 3000ms per operation (`timeoutMS`/`maxTimeMS`); abort long-running operations.
- Domain errors MUST map to proper HTTP status codes consistently in API routes (400/404/409/500).

## Section: Performance & Observability
- Rendering MUST be RSC-first; mark client components sparingly; lazy-load heavy client bundles.
- Data access MUST avoid N+1 queries; ensure indexes for frequent queries (see `app/api/jobs/createIndexes.mongodb.js`); use projections to reduce payloads.
- Timeouts: apply 3000ms per operation for DB calls and use AbortController for outgoing fetches where relevant.
- Logging MUST be structured JSON for errors: include route, error class, status code, correlationId; exclude PII and secrets.
- Playwright artifacts in CI: traces on first retry; videos/screenshots on failure; persist artifacts for triage.

## Governance updates
- Precedence: This Constitution supersedes ad-hoc practices when conflicts occur.
- Amendments: via PR updating `.specify/memory/constitution.md` with rationale and migration notes; require owner or two maintainer approvals; label “Constitution”.
- Versioning (SemVer): Start at 1.0.0; MAJOR for breaking governance; MINOR for additions; PATCH for clarifications. Update version and Last Amended with each change.
- CI compliance: lint, typecheck, Playwright contract and E2E suites MUST pass. (Adding/adjusting workflows is a follow-up PR.)
- PR checklist MUST cover: TDD-first; API boundaries; zod schemas (shared under `lib/schemas/*`); type-safety; security (no PII/secrets in logs); accessibility; performance (RSC-first, lazy-load, indexes); docs synced.
- Guidance: `.github/copilot-instructions.md` is the canonical runtime/dev guide and MUST be followed.

## Footer format
- Remove the Ratified field entirely.
- Footer MUST read: `Version: 1.0.0 | Last Amended: 2025-11-03`.

## Sync Impact Report (to embed as HTML comment at top of constitution)
- Version: N/A → 1.0.0.
- Removed: Ratified field.
- Added: Security & Compliance; Performance & Observability.
- Mandated: zod validation (schemas in `lib/schemas/*`), Playwright artifacts policy, 3000ms DB timeouts.
- Templates requiring updates: plan-template.md ⚠, spec-template.md ⚠, tasks-template.md ⚠, commands/* (create) ⚠.
- Follow-up: CI workflow to enforce lint/typecheck/contract/E2E and upload Playwright artifacts.

## Dependent artifacts to align (follow-up PRs)
- `.github/copilot-instructions.md` — Add non-negotiables (TDD/Playwright, API boundaries, zod in `lib/schemas/*`, a11y, 3000ms timeouts/logging, artifacts policy).
- `README.md` — Summarize rules; link to constitution; add testing matrix (contract vs E2E) and artifacts behavior.
- `.specify/templates/plan-template.md` — Add Constitution Compliance checklist: tests-first, API boundary, a11y, helpers in `lib`, UI in `components/ui`, zod under `lib/schemas/*`.
- `.specify/templates/spec-template.md` — Require sections: Contract Tests and E2E Scenarios; add Accessibility Acceptance.
- `.specify/templates/tasks-template.md` — Add checkboxes: tests-first, lint/typecheck clean, contract/E2E passing, docs updated.
- `.specify/templates/commands/*` — Create concise runbooks: lint, format, test:contract, test:e2e.
- `playwright.config.ts` — Verify artifacts settings (trace on-first-retry; video/screenshot on failure) and artifact output path.
- `.github/workflows/ci.yml` — Follow-up: enforce lint, typecheck, contract+E2E; upload Playwright artifacts.

## Suggested commit message
- docs: amend constitution to v1.0.0 (add Security & Compliance + Performance & Observability; remove Ratified; TDD/a11y/security updates)