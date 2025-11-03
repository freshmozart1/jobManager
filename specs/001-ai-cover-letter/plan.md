# Implementation Plan: AI Cover Letter Editor

**Branch**: `001-ai-cover-letter` | **Date**: 2025-11-03 | **Spec**: ../spec.md
**Input**: Feature specification from `/specs/001-ai-cover-letter/spec.md`

**Note**: Filled by `/speckit.plan`. See `.specify/templates/commands/plan.md` for workflow.

## Summary

Generate an AI-drafted, formal job application letter on `/jobs/[id]`, allow WYSIWYG editing with autosave-on-change, and enable PDF download using a single consistent template. Drafts are anonymous and device-bound for this release; regeneration creates alternates (retain up to 3). The system prompt for generation is sourced from the database.

## Technical Context

**Language/Version**: TypeScript 5.x (no deviation)  
**Primary Dependencies**: Next.js App Router, React, Tailwind, MongoDB, OpenAI Agents SDK, Puppeteer  
**Storage**: MongoDB for prompts; no server draft persistence in this release (anonymous local drafts)  
**Testing**: Playwright (contract + E2E)  
**Target Platform**: Web app (browser + Node server)  
**Project Type**: Full‑stack web (Next.js App Router)  
**Performance Goals**: Draft delivered ≤ 10s; autosave loss ≤ 5s; PDF download success ≥ 95%  
**Constraints**: 3000ms DB operation timeouts; a11y keyboard/ARIA; API-only frontend/backend communication; single formal template  
**Scale/Scope**: Single‑user, device‑bound drafts (anonymous) for now; future account attachment when sign‑in lands

**Decisions**
- Rate Limiting: 3 requests per minute per job per device (device = required `x-device-id` request header; UUID v4 recommended). Missing/invalid `x-device-id` → 400 Bad Request. On exceed, respond 429 Too Many Requests and include headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After`. Applies to generate/regenerate/pdf routes.
- Observability (non-PII): Capture `generation_latency_ms`, `input_chars`, `output_chars`, `model`, `outcome` (success|failure), `error_code` (when applicable), `correlationId`, `jobId`, `promptId`.
- Autosave Strategy: 1s debounce on change + save on blur + save on `beforeunload`; local-only storage; last‑write‑wins with timestamped version metadata.
- PDF Rendering: Puppeteer `page.pdf()`/`printToPDF` (Node runtime only); render in-memory, no PII in logs; apply Template margins/fonts/header/footer for layout fidelity.
 - Correlation ID: Clients may send optional `x-correlation-id` request header on generate/regenerate/pdf; handlers must echo or set a correlationId and include it in responses via `x-correlation-id`.
 - Template Verification: PDF responses include `x-template-id` header that must match the `templateId` associated with the draft/template used by generate/regenerate, enabling contract/E2E verification without parsing PDF bytes.


## Constitution Check

Gate criteria derived from `.specify/memory/constitution.md`:
- TDD with Playwright (contract before E2E) — PLAN: Include tests-first tasks and gates. PASS
- API boundaries (no direct DB from client) — PLAN: All actions via `/api/*`. PASS
- Validation & security (zod, timeouts, least privilege, no secrets/PII in logs) — PLAN: Contracts define validated inputs; 3000ms timeouts; structured non‑PII logs. PASS
- Accessibility (WCAG AA, keyboard/ARIA) — PLAN: WYSIWYG flows and PDF download interactions covered in E2E. PASS
- Dependency hygiene — PLAN: No new deps unless justified in planning. PASS

Re-check after Phase 1 design: REQUIRED

## Non-Functional: Observability

- Signals captured (non-PII): `generation_latency_ms`, `input_chars`, `output_chars`, `model`, `outcome` (success|failure), `error_code` (when applicable), `correlationId`, `jobId`, `promptId`.
- Logging policy: Structured logs only; exclude PII/content. Correlate requests via `correlationId` propagated from client.
- Test gates:
  - Contract tests assert 429 responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers.
  - E2E validates correlationId propagation via request headers and verifies no PII is surfaced in client-visible logs/errors.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)

### Source Code (this repository)

```text
app/
└── api/jobs/[id]/
  ├── generate/route.ts
  ├── regenerate/route.ts
  └── letter/pdf/route.ts

components/
└── ui/

lib/
├── schemas/letters.ts
├── rateLimit.ts
├── obs.ts
├── prompt.ts
├── template.ts
├── correlation.ts
└── openaiClient.ts

tests/
├── contract/
└── unit/
└── e2e/
```

**Structure Decision**: Single Next.js repository. Feature touches:
- UI: `app/jobs/[id]/page.tsx` (invocation + editor UI), `components/ui/*` (any reusable editor toolbar parts)
- API: `app/api/jobs/[id]/generate/route.ts` (draft), `app/api/jobs/[id]/regenerate/route.ts` (regenerate alternates), `app/api/jobs/[id]/letter/pdf/route.ts` (PDF)
- Shared: `lib/schemas/*` (zod), `lib/*` helpers (templating, pdf options)
- Tests: `tests/contract/*`, `tests/e2e/*`

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
