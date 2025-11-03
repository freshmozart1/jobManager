# Tasks — AI Cover Letter Editor

Feature Branch: 001-ai-cover-letter
Plan: ./plan.md | Spec: ./spec.md | Contracts: ./contracts/openapi.yaml

Note: Tasks are organized by phases and user stories, follow tests-first where applicable, and use strict checklist formatting.

## Phase 1 — Setup

- [ ] T001 Ensure Node/Next runtime for API routes is Node (not Edge) in `next.config.ts` (PDF/gen require Node APIs)
- [ ] T002 Create schemas folder `lib/schemas/letters.ts` for zod request/response shapes (generate, regenerate, pdf)
- [ ] T003 Add rate limit utility `lib/rateLimit.ts` (3/min per job + `x-device-id` header; require/validate `x-device-id` (UUID v4 recommended); return 400 if missing/invalid; return 429 with headers on exceed)
- [ ] T004 Add observability logger `lib/obs.ts` (structured, non-PII; correlationId, jobId, promptId, metrics)
- [ ] T005 Add constants for template/prompt IDs `lib/constants.ts` (e.g., FORMAL_TEMPLATE_ID)
- [ ] T006 Update OpenAPI doc comments pointing to contracts `specs/001-ai-cover-letter/contracts/openapi.yaml`

## Phase 2 — Foundational

- [ ] T007 Implement zod schemas in `lib/schemas/letters.ts` (GenerateBody, RegenerateBody, PdfBody; shared types)
- [ ] T008 [P] Implement `lib/rateLimit.ts` with storage key `jobId` + value of `x-device-id` header and headers X-RateLimit-* and Retry-After
- [ ] T009 [P] Implement `lib/obs.ts` emit function: logGeneration(event), with fields per plan (no PII)
- [ ] T010 Create prompt service `lib/prompt.ts` to fetch prompt by ID/version from MongoDB (3000ms timeout)
- [ ] T011 Create template helper `lib/template.ts` to enforce single formal template, normalize html before PDF
- [ ] T012 Add correlationId propagation helper `lib/correlation.ts` (read from headers or generate)
- [ ] T038 Implement OpenAI client wrapper `lib/openaiClient.ts` using AbortController with timeout; expose `generateLetter({ prompt, job, profile, signal, timeoutMs })`
- [ ] T047 Implement `lib/obs.ts` as a thin wrapper over the exported `log` from `@/lib/utils`; refactor API routes to use it consistently (no PII). All logging MUST go through `log` from `@/lib/utils` (directly or via `lib/obs.ts`).
- [ ] T048 Adopt error classes from `lib/errors.ts` in API routes; map `ValidationError` (400), `RateLimitError` (429), `ExternalServiceTimeoutError` (408), `ExternalServiceError` (500)
- [ ] T053 Add `x-correlation-id` response header in generate/regenerate/pdf routes and document it in `contracts/openapi.yaml`; ensure handlers echo or set correlationId

## Phase 3 — User Story 1 (P1): Generate draft

Goal: User obtains a formal draft using job + personal details via a consistent template.
Independent test: Draft returned for a given job without editing features.

- [ ] T013 [US1] Contract test: add (or extend existing) `tests/contract/jobs.id.generate.post.test.ts` for 200, 400, 429 (headers), 500
- [ ] T014 [P] [US1] Contract test asserts 429 headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After
- [ ] T015 [US1] Implement `app/api/jobs/[id]/generate/route.ts` handler: zod validate, rate limit, fetch prompt, call AI, obs log
- [ ] T016 [P] [US1] Wire Mongo prompt fetch in handler via `lib/prompt.ts`; enforce 3000ms timeout; map errors → 500/400
- [ ] T017 [P] [US1] Map success payload `{ html, promptId, templateId, missingFields?, placeholders? }` and set CORS/JSON headers via `lib/cors.ts`
- [ ] T018 [US1] E2E: add `tests/e2e/us1-flow.spec.ts` step to trigger generate and assert draft presence and timing ≤10s
- [ ] T039 [US1] Contract test: simulate timeout from OpenAI client and assert API maps to 500 or 408 with non-PII error
- [ ] T040 [US1] Integrate `lib/openaiClient.ts` in `app/api/jobs/[id]/generate/route.ts` with AbortController; pass timeout and map abort/timeout errors
- [ ] T041 [US1] Contract test: missing personalProfile fields → assert `missingFields` includes expected keys and `placeholders` contains markers present in `html`
- [ ] T042 [US1] Contract/E2E: send `x-correlation-id` header and validate propagation via test harness (no PII in responses)
- [ ] T050 [US1] Extend generate contract test to assert `promptId` presence and valid format

## Phase 4 — User Story 2 (P2): Edit + autosave

Goal: Visual editing with autosave that preserves recent edits across navigation.
Independent test: Edits persist after navigate away/return; autosave indicator shown.

- [ ] T019 [US2] Create editor component `components/ui/appLetterEditor.tsx` ('use client') with toolbar (basic bold/italic)
- [ ] T020 [P] [US2] Implement autosave hook `hooks/useAutosave.ts` (1s debounce, blur, beforeunload; last-write-wins)
- [ ] T021 [P] [US2] Implement local storage adapter `lib/localDraft.ts` with key by `jobId` and version timestamp
- [ ] T022 [US2] Integrate editor on `app/jobs/[id]/page.tsx` with autosave and last-saved indicator (a11y labels)
- [ ] T023 [P] [US2] Zero-state messaging for anonymous, device-bound storage limitations (ARIA-alert)
- [ ] T024 [US2] E2E: extend `tests/e2e/us2-flow.spec.ts` to edit, navigate away, return, and verify persistence
- [ ] T043 [US2] E2E: simulate generation failure path → show friendly retry message; user retries and succeeds; ensure no PII in UI
- [ ] T044 [US2] UI: show guidance when placeholders present (from generate response) and link to missing fields section
- [ ] T049 [US2] E2E: offline/online autosave — toggle offline, type, restore online; verify last-saved content and indicator
- [ ] T052 [US2] Ensure editor preview uses the formal template wrapper/marker for parity with PDF; add UI assertion or explicitly mark out-of-scope

## Phase 5 — User Story 3 (P3): Regenerate alternates + PDF download

Goal: Create alternates without overwriting, retain up to 3; download PDF with consistent template.
Independent test: Alternate appears without changing current; PDF opens and matches template.

- [ ] T025 [US3] Contract test: add `tests/contract/jobs.id.regenerate.post.test.ts` for 200, 400, 429 (headers), 500
- [ ] T026 [P] [US3] Implement `app/api/jobs/[id]/regenerate/route.ts` using same validation/rate-limit/obs as generate
- [ ] T027 [P] [US3] UI: add "Regenerate" action in `app/jobs/[id]/page.tsx` → creates local alternate; maintain active selection
- [ ] T028 [US3] Enforce alternate retention max 3 in `lib/localDraft.ts` (warn if deleting named oldest)
- [ ] T029 [US3] Contract test: add `tests/contract/jobs.id.letter.pdf.post.test.ts` for 200 (PDF) and 400/500
- [ ] T030 [P] [US3] Implement `app/api/jobs/[id]/letter/pdf/route.ts` (validate input, render HTML to PDF, return bytes)
- [ ] T031 [P] [US3] Implement PDF rendering with Puppeteer `printToPDF` in `app/api/jobs/[id]/letter/pdf/route.ts`; pin dependency; document Template margins/fonts/header/footer, Node runtime, in-memory render, and no PII logging
- [ ] T032 [US3] E2E: extend `tests/e2e/us3-flow.spec.ts` to regenerate (active unchanged) and download PDF; verify content-type
- [ ] T045 [US3] Contract/E2E: template consistency — assert `templateId` from generate matches PDF template marker/metadata
	- Update: Use `x-template-id` response header on PDF (200) for verification; must equal the `templateId` used during generate
- [ ] T046 [US3] E2E: create 4 alternates; verify oldest is removed; if oldest was named, UI warns and confirms before deletion
- [ ] T051 [US3] Extend regenerate contract test to assert `promptId` presence and valid format

## Final Phase — Polish & Cross-Cutting

- [ ] T033 Add a11y checks to editor controls (keyboard focus order, ARIA labels) in `components/ui/appLetterEditor.tsx`
- [ ] T034 Add rate-limit header docs to `contracts/openapi.yaml` examples (optional) and README usage notes
- [ ] T035 Add structured logging examples and correlationId note to `README.md` or `specs/.../quickstart.md`
- [ ] T036 Lint/typecheck sweep; ensure zod types inferred properly and no any's introduced
- [ ] T037 Performance: verify draft delivery ≤10s and autosave loss ≤5s on typical hardware during E2E
- [ ] T054 Startup env validation: verify `OPENAI_API_KEY` and `DATABASE_NAME` at boot and surface actionable error if missing (guards in `lib/openaiClient.ts` and `lib/mongodb.ts`)

## Dependencies (Story Order)

1) US1 Generate → 2) US2 Edit+Autosave → 3) US3 Regenerate+PDF
- Foundational (Phase 2) must precede US1
- US3 depends on US1 (shared validation, obs, rate limit) and partially on US2 (UI integration for alternates)

## Parallel Execution Examples

- In Phase 2: T008 (rate limit), T009 (obs), T010 (prompt service) can run in parallel
- In US1: T016 and T017 can proceed once T015 scaffolds the route
- In US3: T026 (route) and T027 (UI button) can progress in parallel; T029 (contract test for PDF) in parallel with T030 implementation scaffold

## Independent Test Criteria per Story

- US1: Contract tests pass for 200/400/429/500; E2E draft appears within ≤10s
- US2: E2E edits persist after navigation; last-saved time visible; keyboard navigation works
- US3: Contract tests for regenerate and pdf; E2E shows alternate retained and active draft unchanged; PDF content-type and opens

## MVP Suggestion

- Deliver US1 alone as the MVP: generate draft via API, display in UI; includes contract tests and basic E2E
