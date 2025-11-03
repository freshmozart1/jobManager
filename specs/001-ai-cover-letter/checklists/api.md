# API Requirements Quality Checklist — AI Cover Letter Editor

Purpose: Unit tests for the quality of API-related requirements (not implementation)
Created: 2025-11-03

## Requirement Completeness

- [ ] CHK001 Are the API endpoints needed to support draft generation, regeneration, and PDF export explicitly listed with paths? [Completeness, Spec §FR-001, §FR-013, §FR-005]
- [ ] CHK002 Are request input fields for generation documented (jobId, personal profile linkage, prompt selection/version) with required/optional flags? [Completeness, Spec §FR-001, §FR-011]
- [ ] CHK003 Are response payload structures for generation/regeneration defined, including draftId, content, template metadata, and timestamps? [Completeness, Spec §FR-001, §FR-013]
- [ ] CHK004 Are error response formats (shape, fields, status codes) specified for AI failure, invalid job, missing data, and rate limit exceedance? [Completeness, Spec §Edge Cases; §FR-006, §FR-007]
- [ ] CHK005 Is PDF export request/response explicitly defined (input: draftId or content reference; output: application/pdf stream + filename rules)? [Completeness, Spec §FR-005, §FR-008]
- [ ] CHK006 Is the alternate draft retention behavior reflected in API capabilities (e.g., list alternates, create alternate on regenerate, select active)? [Completeness, Spec §FR-013, §FR-014]
- [ ] CHK007 Is rate limiting a stated requirement at the API level with concrete thresholds and scope (per device/job)? [Gap]
- [ ] CHK008 Are idempotency expectations defined for retried generation requests (e.g., client-provided idempotency key)? [Gap]

## Requirement Clarity

- [ ] CHK009 Are all request parameters and types unambiguous (e.g., jobId path vs body, content type, schema) and validated via shared zod schemas? [Clarity, Spec §FR-001; Plan §Constraints]
- [ ] CHK010 Are success status codes and any non-200 statuses mapped consistently to scenarios (202 for async vs 200 for sync generation, if applicable)? [Clarity, Spec §FR-001, §FR-007]
- [ ] CHK011 Is it clear how regeneration differs from initial generation in inputs/outputs (e.g., parentDraftId, origin metadata)? [Clarity, Spec §FR-013]
- [ ] CHK012 Is handling of missing personal information specified in the API contract (fields indicating placeholders and what’s missing)? [Clarity, Spec §FR-006]
- [ ] CHK013 Are PDF export options (locale, page size, margins, font embedding) either defined or explicitly out of scope for v1? [Clarity, Spec §FR-005, §FR-008]
- [ ] CHK014 Are timeouts defined for internal operations (DB 3000ms) and how they surface to API clients (status, error code)? [Clarity, Plan §Constraints; Spec §FR-011]

## Requirement Consistency

- [ ] CHK015 Do endpoint paths and naming conventions align (e.g., /api/jobs/{id}/generate, /regenerate, /letter/pdf) without conflicts? [Consistency, Plan §Structure]
- [ ] CHK016 Is the single-template requirement consistently enforced/represented across generation, editing metadata, and PDF export responses? [Consistency, Spec §FR-002, §FR-008]
- [ ] CHK017 Are anonymous/unauthenticated assumptions consistent across endpoints (no server draft persistence in v1)? [Consistency, Spec §FR-012]
- [ ] CHK018 Does the alternate retention policy align with any listing/selection semantics exposed by the API (no silent conflicts)? [Consistency, Spec §FR-014]

## Acceptance Criteria Quality

- [ ] CHK019 Are measurable API-level performance targets referenced (e.g., draft delivered < 10s for P95) and tied to endpoints? [Acceptance Criteria, Spec §SC-001]
- [ ] CHK020 Can PDF success criteria be measured objectively via API outputs (content-type, byte size > 0, template marker present)? [Acceptance Criteria, Spec §SC-003]
- [ ] CHK021 Are autosave preservation guarantees reflected in API requirements where applicable (if server ever receives content) or clearly out of scope for v1? [Acceptance Criteria, Spec §FR-004, §FR-012]

## Scenario Coverage

- [ ] CHK022 Are primary success flows defined for initial generation and regeneration (inputs, outputs, state effects)? [Coverage, Spec §FR-001, §FR-013]
- [ ] CHK023 Are exception flows specified: AI provider failure, invalid job, prompt lookup failure, and upstream timeouts? [Coverage, Spec §Edge Cases; §FR-007, §FR-011]
- [ ] CHK024 Are recovery/continuation behaviors defined after failures (retry guidance, backoff, retaining unsent edits)? [Coverage, Spec §Edge Cases; Gap]
- [ ] CHK025 Is the rate-limit exceed scenario covered with explicit status code, headers (limit/remaining/reset), and retry guidance? [Coverage, Gap]
- [ ] CHK026 Is the over-capacity alternates scenario (creating 4th) represented in API semantics (warning/confirm vs server auto-delete) or clearly stated as client-only behavior? [Coverage, Spec §FR-014]

## Edge Case Coverage

- [ ] CHK027 Are requirements defined for extremely long input descriptions and output size limits with truncation/continuation rules? [Edge Case, Gap]
- [ ] CHK028 Are concurrency and duplicate submissions addressed (double-click/regenerate twice quickly → single or multiple alternates)? [Edge Case, Gap]
- [ ] CHK029 Is behavior defined if the configured Prompt is missing/invalid in MongoDB (fallback, error, or blocked)? [Edge Case, Spec §FR-011]

## Non-Functional Requirements

- [ ] CHK030 Are logging/observability requirements specified (correlationId, latency, output-length, outcome without PII)? [Non-Functional, Gap]
- [ ] CHK031 Are CORS, content-type, and caching headers requirements documented for each endpoint? [Non-Functional, Gap]
- [ ] CHK032 Are DB timeouts (3000ms) and external call limits stated with expected error translation to clients? [Non-Functional, Plan §Constraints]
- [ ] CHK033 Is a versioning or compatibility strategy stated for the API (even as internal routes)? [Non-Functional, Gap]

## Dependencies & Assumptions

- [ ] CHK034 Is dependency on MongoDB-stored Prompt and its selection/versioning documented as a requirement? [Dependency, Spec §FR-011]
- [ ] CHK035 Are AI provider assumptions (model, tokens, latency) captured as requirements or explicitly left open with placeholders? [Assumption, Gap]

## Ambiguities & Conflicts

- [ ] CHK036 Is it unambiguous whether regeneration uses a distinct endpoint vs a mode of the generation endpoint? [Ambiguity, Spec §FR-013]
- [ ] CHK037 Is there any conflict between client-only draft storage (v1) and proposed API capabilities (e.g., listing/selecting alternates)? If server won’t store drafts, is this explicitly excluded at API level? [Conflict, Spec §FR-012]
