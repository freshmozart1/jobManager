# API Requirements Quality Checklist (Author Self‑Check)

Purpose: Unit tests for requirements writing (API domain)
Created: 2025-11-01
Feature Branch: 001-baseline-spec
Depth: Balanced
Audience: Author (Self-check)

Notes: This version reflects clarified settings (API focus, author self‑check, balanced rigor). It complements, not replaces, `api.md`.

## Requirement Completeness
- [x] CHK001 Are all endpoints needed for US1–US3 explicitly enumerated with purpose and parameters? [Completeness, Spec §Endpoint Contracts (US1|US2|US3)]
- [ ] CHK002 Is the deterministic filter API described with inputs (prompt id, scope) and outputs (per-job decision array) including constraints? [Completeness, Spec §FR-002, §FR-009]
- [ ] CHK003 Are document generation and download requirements separated (initiate vs retrieve) with clear artifacts and formats? [Completeness, Spec §FR-003–FR-004]
- [x] CHK004 Are application lifecycle mutation endpoints (notes, interview, feedback, apply) fully listed with required fields? [Completeness, Spec §Endpoint Contracts (US2), §Endpoint Contracts (US1) – Apply]
- [x] CHK005 Is ingestion trigger defined with source selection/defaults and summary response shape? [Completeness, Spec §Endpoint Contracts (US3) – Ingest]

## Requirement Clarity
- [x] CHK006 Is the relevance segmentation definition ("relevant" vs "not relevant") explicitly tied to a boolean decision per job? [Clarity, Spec §FR-002, §FR-009]
- [x] CHK007 Are error response structures (status codes, status text, error fields) specified for all failure modes? [Clarity, Spec §API Conventions – Error Responses [ER]]
- [x] CHK008 Is the download requirement explicit about content types, filenames, and size limits for generated documents? [Clarity, Spec §API Conventions – Download Artifacts [DL]]
- [x] CHK009 Are idempotency expectations for mutation endpoints (apply, notes, interview, feedback) specified? [Clarity, Spec §API Conventions – Idempotency [ID]]
- [x] CHK010 Are pagination/sorting parameters for listing jobs clearly defined and bounded? [Clarity, Spec §API Conventions – Pagination & Sorting [PG]]
- [x] CHK011 Does each endpoint requirement include at least one example request/response to remove ambiguity? [Clarity, Spec §Endpoint Contracts (US1)]
- [x] CHK012 Are polymorphic or optional fields defined with discriminators/typing rules in the requirements? [Clarity, Spec §API Conventions – Polymorphic/Optional Field Rules [TY]]

## Requirement Consistency
- [x] CHK013 Do API requirements consistently enforce determinism for filtering across batch/single-job variants? [Consistency, Spec §API Conventions – Deterministic Filter [DF], §FR-009, §SC-005]
- [x] CHK014 Are traceability requirements (runId, prompt version, inputs/outputs) consistent across filter and generation endpoints? [Consistency, Spec §FR-010, §API Conventions – Deterministic Filter [DF]]
- [x] CHK015 Are data privacy constraints (no sensitive fields in logs/responses) consistently applied across all endpoints? [Consistency, Spec §FR-012, §API Conventions – Security & Privacy [SEC]]
- [x] CHK016 Do acceptance scenarios align with the specified API outputs for apply status, notes, interviews, feedback? [Consistency, Spec §User Story 1–2, §Endpoint Contracts (US1|US2)]

## Acceptance Criteria Quality
- [x] CHK017 Are success criteria measurable for API performance (batch filter latency, throughput) with explicit thresholds? [Acceptance Criteria, Spec §SC-002, §API Conventions – Non-Functional [NFR]]
- [x] CHK018 Can traceability completeness be objectively verified (100% runs recorded with required fields)? [Acceptance Criteria, Spec §SC-005, §FR-010]
- [x] CHK019 Are document generation success conditions measurable (artifact presence + metadata) rather than subjective content quality? [Acceptance Criteria, Spec §Endpoint Contracts (US1) – Generate/Download]

## Scenario Coverage
- [x] CHK020 Are primary flows covered for list, detail, filter, generate, download, and apply? [Coverage, Spec §Endpoint Contracts (US1)]
- [x] CHK021 Are alternate flows covered for partial ingestion, dedupe skips, and mixed filter outcomes? [Coverage, Spec §Endpoint Contracts (US3) Notes, §Edge Cases, §Endpoint Contracts (US1) + [DF]]
- [x] CHK022 Are exception flows defined for external dependency failures (AI, scraping) including retries/backoff and surfaced API errors? [Coverage, Spec §API Conventions – Non-Functional [NFR], Error Responses [ER]]
- [x] CHK023 Are recovery flows specified for retriable operations (re-run filter/generation) with constraints on frequency/idempotency? [Coverage, Spec §API Conventions – Idempotency [ID], Deterministic Filter [DF]]

## Edge Case Coverage
- [x] CHK024 Are zero-result behaviors specified (no jobs, no relevant jobs) including API response shapes? [Edge Case, Spec §Edge Cases, §Endpoint Contracts – GET /api/jobs]
- [x] CHK025 Is behavior defined when personal data is incomplete for generation (API error vs guidance structure)? [Edge Case, Spec §API Conventions – Dependencies & Fallbacks [DEP]]
- [x] CHK026 Are duplicate job identifiers behavior and responses defined (ingestion dedupe, conflict codes)? [Edge Case, Spec §Edge Cases, §FR-001]

## Non-Functional Requirements
- [x] CHK027 Are security requirements for API (auth, data protection, CORS policy, sensitive field handling) documented? [Non-Functional, Spec §FR-012, §API Conventions – Security & Privacy [SEC]]
- [x] CHK028 Are rate limits, timeouts, and retry/backoff policies documented with specific values per endpoint? [Non-Functional, Spec §API Conventions – Non-Functional [NFR]]
- [x] CHK029 Are scalability expectations and pagination limits defined for high-volume lists? [Non-Functional, Spec §API Conventions – Pagination & Sorting [PG]]

## Dependencies & Assumptions
- [x] CHK030 Are external dependencies (OpenAI, Apify, MongoDB) and their API contract expectations captured in requirements? [Dependency, Spec §Dependencies & Assumptions, §API Conventions – Non-Functional [NFR]]
- [x] CHK031 Are environment prerequisites (keys, tokens) captured as requirement constraints, not just implementation notes? [Dependency, Spec §API Conventions – Dependencies & Fallbacks [DEP]]
- [x] CHK032 Are fallback behaviors defined for misconfiguration (missing/invalid keys, unavailable services) at the requirement level? [Dependency, Spec §API Conventions – Dependencies & Fallbacks [DEP]]

## Ambiguities & Conflicts
- [x] CHK033 Is the distinction between synchronous document generation vs async job clearly required to avoid timeouts? [Ambiguity, Spec §Endpoint Contracts (US1) – Generate/Download]
- [x] CHK034 Are any conflicting definitions between acceptance scenarios and FRs resolved (e.g., segmentation display vs API outputs)? [Conflict, Spec §FR-002, §API Conventions – Deterministic Filter [DF]]

Author tips:
- Anchor checklist answers with explicit spec line/section references where possible.
- When marking [Gap]/[Ambiguity]/[Conflict], add a short TODO in the spec to resolve before coding.
