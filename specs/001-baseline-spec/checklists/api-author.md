# API Requirements Quality Checklist (Author Self‑Check)

Purpose: Unit tests for requirements writing (API domain)
Created: 2025-11-01
Feature Branch: 001-baseline-spec
Depth: Balanced
Audience: Author (Self-check)

Notes: This version reflects clarified settings (API focus, author self‑check, balanced rigor). It complements, not replaces, `api.md`.

## Requirement Completeness
- [ ] CHK001 Are all endpoints needed for US1–US3 explicitly enumerated with purpose and parameters? [Completeness, Spec §FR-001–FR-008]
- [ ] CHK002 Is the deterministic filter API described with inputs (prompt id, scope) and outputs (per-job decision array) including constraints? [Completeness, Spec §FR-002, §FR-009]
- [ ] CHK003 Are document generation and download requirements separated (initiate vs retrieve) with clear artifacts and formats? [Completeness, Spec §FR-003–FR-004]
- [ ] CHK004 Are application lifecycle mutation endpoints (notes, interview, feedback, apply) fully listed with required fields? [Completeness, Spec §FR-005–FR-008]
- [ ] CHK005 Is ingestion trigger defined with source selection/defaults and summary response shape? [Completeness, Spec §FR-001]

## Requirement Clarity
- [x] CHK006 Is the relevance segmentation definition ("relevant" vs "not relevant") explicitly tied to a boolean decision per job? [Clarity, Spec §FR-002, §FR-009]
- [ ] CHK007 Are error response structures (status codes, status text, error fields) specified for all failure modes? [Clarity, Gap]
- [ ] CHK008 Is the download requirement explicit about content types, filenames, and size limits for generated documents? [Clarity, Spec §FR-004, Gap]
- [ ] CHK009 Are idempotency expectations for mutation endpoints (apply, notes, interview, feedback) specified? [Clarity, Gap]
- [ ] CHK010 Are pagination/sorting parameters for listing jobs clearly defined and bounded? [Clarity, Gap]
- [ ] CHK011 Does each endpoint requirement include at least one example request/response to remove ambiguity? [Clarity, Gap]
- [ ] CHK012 Are polymorphic or optional fields defined with discriminators/typing rules in the requirements? [Clarity, Gap]

## Requirement Consistency
- [ ] CHK013 Do API requirements consistently enforce determinism for filtering across batch/single-job variants? [Consistency, Spec §FR-002, §FR-009, §SC-005]
- [ ] CHK014 Are traceability requirements (runId, prompt version, inputs/outputs) consistent across filter and generation endpoints? [Consistency, Spec §FR-010]
- [ ] CHK015 Are data privacy constraints (no sensitive fields in logs/responses) consistently applied across all endpoints? [Consistency, Spec §FR-012]
- [ ] CHK016 Do acceptance scenarios align with the specified API outputs for apply status, notes, interviews, feedback? [Consistency, Spec §User Story 1–2]

## Acceptance Criteria Quality
- [ ] CHK017 Are success criteria measurable for API performance (batch filter latency, throughput) with explicit thresholds? [Acceptance Criteria, Spec §SC-002]
- [ ] CHK018 Can traceability completeness be objectively verified (100% runs recorded with required fields)? [Acceptance Criteria, Spec §SC-005]
- [ ] CHK019 Are document generation success conditions measurable (artifact presence + metadata) rather than subjective content quality? [Acceptance Criteria, Spec §FR-003, Gap]

## Scenario Coverage
- [ ] CHK020 Are primary flows covered for list, detail, filter, generate, download, and apply? [Coverage, Spec §FR-002–FR-005]
- [ ] CHK021 Are alternate flows covered for partial ingestion, dedupe skips, and mixed filter outcomes? [Coverage, Spec §Edge Cases, §FR-001, §FR-002]
- [ ] CHK022 Are exception flows defined for external dependency failures (AI, scraping) including retries/backoff and surfaced API errors? [Coverage, Spec §Edge Cases, Gap]
- [ ] CHK023 Are recovery flows specified for retriable operations (re-run filter/generation) with constraints on frequency/idempotency? [Coverage, Gap]

## Edge Case Coverage
- [ ] CHK024 Are zero-result behaviors specified (no jobs, no relevant jobs) including API response shapes? [Edge Case, Spec §Edge Cases]
- [ ] CHK025 Is behavior defined when personal data is incomplete for generation (API error vs guidance structure)? [Edge Case, Spec §Edge Cases]
- [ ] CHK026 Are duplicate job identifiers behavior and responses defined (ingestion dedupe, conflict codes)? [Edge Case, Spec §Edge Cases, §FR-001]

## Non-Functional Requirements
- [ ] CHK027 Are security requirements for API (auth, data protection, CORS policy, sensitive field handling) documented? [Non-Functional, Spec §FR-012, Gap]
- [ ] CHK028 Are rate limits, timeouts, and retry/backoff policies documented with specific values per endpoint? [Non-Functional, Gap]
- [ ] CHK029 Are scalability expectations and pagination limits defined for high-volume lists? [Non-Functional, Gap]

## Dependencies & Assumptions
- [ ] CHK030 Are external dependencies (OpenAI, Apify, MongoDB) and their API contract expectations captured in requirements? [Dependency, Spec §Dependencies & Assumptions]
- [ ] CHK031 Are environment prerequisites (keys, tokens) captured as requirement constraints, not just implementation notes? [Dependency, Gap]
- [ ] CHK032 Are fallback behaviors defined for misconfiguration (missing/invalid keys, unavailable services) at the requirement level? [Dependency, Gap]

## Ambiguities & Conflicts
- [ ] CHK033 Is the distinction between synchronous document generation vs async job clearly required to avoid timeouts? [Ambiguity, Gap]
- [ ] CHK034 Are any conflicting definitions between acceptance scenarios and FRs resolved (e.g., segmentation display vs API outputs)? [Conflict, Spec §User Story 1, §FR-002]

Author tips:
- Anchor checklist answers with explicit spec line/section references where possible.
- When marking [Gap]/[Ambiguity]/[Conflict], add a short TODO in the spec to resolve before coding.
