# Feature Specification: Application Manager Baseline

**Feature Branch**: `001-baseline-spec`  
**Created**: 2025-11-01  
**Status**: Draft  
**Input**: Baseline product specification to define core capabilities: scrape job
postings, classify relevance via deterministic AI, generate application documents
from stored personal data, and manage application lifecycle (notes, timestamps,
interviews, feedback).

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Review & Act on Relevant Jobs (Priority: P1)

A user reviews newly scraped jobs, filters them for relevance, opens job details,
generates application materials, and records the application as submitted.

**Why this priority**: Delivers the core time-saving outcome—finding relevant jobs
and producing high-quality applications quickly.

**Independent Test**: With an existing set of scraped jobs, run filtering, open a
job, generate documents, and mark as applied—without relying on other stories.

**Acceptance Scenarios**:

1. Given a batch of scraped jobs exists, When the user runs the relevance filter,
   Then the system presents a list segmented into “relevant” and “not relevant”.
2. Given a relevant job is selected, When the user requests application materials,
   Then a cover letter and CV are generated using stored personal data and job
   details and are available to download.
3. Given documents were generated, When the user marks the job as applied,
   Then the system records an “applied” timestamp and shows applied status.

---

### User Story 2 - Track Application Lifecycle (Priority: P2)

A user tracks application progress with notes, interview dates, and feedback.

**Why this priority**: Organization and transparency keep users on top of
deadlines and outcomes.

**Independent Test**: For any job (applied or not), add a note, schedule an
interview, and record feedback; verify timestamps and retrieval.

**Acceptance Scenarios**:

1. Given a job exists, When the user adds a note, Then the note is saved with a
  timestamp and visible in the job detail view.
2. Given a job exists, When the user schedules an interview date/time,
  Then the schedule is stored and displayed.
3. Given a job exists, When the user records company feedback,
  Then the feedback and timestamp are stored and visible.

---

### User Story 3 - Ingest New Jobs (Priority: P3)

An operator or scheduled process ingests job postings from configured sources.

**Why this priority**: A steady flow of new jobs sustains the product’s value.

**Independent Test**: Trigger a scrape/import from a configured source and verify
jobs appear with required fields and deduplicated identifiers.

**Acceptance Scenarios**:

1. Given a configured source, When ingestion is triggered,
   Then new jobs are stored with required fields and without duplicates.
2. Given previous runs exist, When ingestion completes,
   Then the system provides a summary (count added, skipped, failed) for review.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- No new jobs available: filtering yields zero results—UI shows an informative
  empty state.
- Rate limits or source changes during ingestion: ingestion reports partial
  success and queues retries without blocking the UI.
- AI generation fails or times out: user sees a non-blocking error with a retry
  option; no partial documents are presented as final outputs.
- Personal data incomplete: generation prompts user to complete missing profile
  fields before proceeding.
- Duplicate jobs: detected via stable keys; duplicates are ignored and reported.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST ingest job postings from configured sources and
  persist them without duplicates.
- **FR-002**: The system MUST allow users to run a relevance filter over newly
  ingested jobs and view results as relevant/not relevant.
- **FR-003**: The system MUST generate application documents (e.g., cover letter
  and CV) for a selected job using stored personal data and job details.
- **FR-004**: The system MUST allow users to download generated documents.
- **FR-005**: The system MUST allow users to mark a job as applied and record the
  timestamp.
- **FR-006**: The system MUST allow users to add notes to a job and store each
  note with a timestamp.
- **FR-007**: The system MUST allow users to schedule interview dates/times and
  store them.
- **FR-008**: The system MUST allow users to record company feedback with
  timestamps.
- **FR-009**: The relevance filter MUST be deterministic and reproducible with a
  fixed, versioned prompt template and parameters.
- **FR-010**: Each agent run (filtering/generation) MUST log inputs, outputs,
  prompt version, run identifier, and timestamps for traceability.
- **FR-011**: Long-running operations MUST be non-blocking and provide progress
  indication.
- **FR-012**: The system MUST protect personal data—no unencrypted transmission
  and no logging of sensitive fields.

### API Conventions (US1 scope; expandable)

These conventions standardize API behavior and make requirements measurable.

1) Error Responses [ER]
- Format: JSON object `{ "error": { "code": string, "message": string, "details"?: object } }`
- Status Codes: 400 (bad request), 401 (unauthorized, if/when auth is added), 404 (not found), 409 (conflict/precondition), 422 (schema mismatch), 429 (rate limit), 5xx (dependency/unknown)
- Status Text: SHOULD be set with short machine-readable token matching `error.code` when applicable
- Sensitive data MUST NOT appear in `message` or `details` (see FR-012)
- Dependency backoff: When possible, include `retryAfterMs` in `details`

2) Pagination & Sorting [PG]
- Endpoints: `GET /api/jobs`
- Params: `page` (>=1, default 1), `limit` (1..100, default 20), `sort` in {`postedAt`,`filteredAt`}, `order` in {`asc`,`desc`}
- Filtering: `filterResult` in {`true`,`false`,`error`,`undefined`} and alias `filter=relevant` ≡ `filterResult=true`
- Response includes `X-Total-Count` header OPTIONAL (future scope) — baseline returns array only

3) Idempotency [ID]
- `POST /api/jobs/{id}/apply`: Idempotent; multiple calls do not duplicate; returns existing `appliedAt` when already applied
- `POST /api/jobs/{id}/notes`: Non-idempotent append; OPTIONAL `clientId` allows dedupe per (jobId, clientId)
- `POST /api/jobs/{id}/interview`: Idempotent per (jobId, scheduledAt)
- `POST /api/jobs/{id}/feedback`: Append; OPTIONAL `clientId` for dedupe
- `POST /api/filter`: Safe to re-run; determinism guarantees identical outputs for identical inputs (prompt/version/profile)

4) Download Artifacts [DL]
- Types: `application/pdf` (preferred) for cover letter and CV; MAY support `text/plain` fallback for debug
- Filenames: `job-{id}-cover-letter.pdf`, `job-{id}-cv.pdf`
- Size limits: each file ≤ 5 MB; combined ≤ 10 MB (enforced)

5) Deterministic Filter [DF]
- Prompt is versioned; deterministic parameters (temperature=0)
- Output schema: array<boolean> with length == input length; mismatch → 422 [ER]
- Traceability: Each run records runId, prompt version (updatedAt), inputs, outputs, timestamps (see FR-010)

6) Non-Functional (API) [NFR]
- Performance targets: batch filter of 100 jobs within ~3 minutes (see SC-002)
- Timeouts: network calls per dependency ≤ 30s; overall filter operation budget ≤ 180s
- Retry/Backoff: 429 and 5xx with exponential backoff (600ms..8000ms) honoring Retry-After when present
- Rate limiting (baseline, per-IP suggested): write endpoints ≤ 30 req/min; filter ≤ 6 runs/min

7) Security & Privacy [SEC]
- CORS: allow-list via configuration; disallow wildcard `*`
- Logs/responses MUST NOT include PII (emails, phone, portfolio URLs) unless explicitly required and masked
- Authentication/authorization: out-of-scope for baseline; note as future requirement

8) Dependencies & Fallbacks [DEP]
- Required environment: `OPENAI_API_KEY`, `APIFY_TOKEN`, `DATABASE_NAME`; missing → 500 [ER] with `code`=MissingEnv
- Personal data incomplete for generation → 409 [ER] with `details.missingFields: string[]`
- External dependency rate limits → include `details.retryAfterMs` when derivable

9) Polymorphic/Optional Field Rules [TY]
- `filterResult`: boolean OR `{ error: string }` — discriminator is presence of `error` key when non-boolean
- Optional fields MUST declare nullability and defaults in requirements; ambiguous fields SHOULD include examples

### Endpoint Contracts (US1)

1) GET /api/jobs [LIST]
- Purpose: list jobs with optional filtering/pagination/sorting (see [PG])
- Query: `page?`, `limit?`, `sort?`, `order?`, `filterResult?`, alias `filter=relevant`
- Response: `200 OK` → `Job[]` (array), where `Job.filterResult` follows [TY]
- Errors: `400` (invalid param), `500` (db)
- Example request: `/api/jobs?filter=relevant&sort=filteredAt&order=desc&limit=20&page=1`
- Example response (200): `[ { "id": "123", "title": "...", "filterResult": true, ... } ]`

2) GET /api/jobs/{id} [DETAIL]
- Purpose: fetch one job by id
- Response: `200 OK` → `Job` or array of 1 (implementation detail) — requirement: a single job object SHOULD be returned
- Errors: `404` (missing), `500` (db)
- Example: `/api/jobs/123`

3) POST /api/filter [FILTER]
- Purpose: run deterministic relevance filter for a batch
- Body: `{ "promptId": string, "actorName": string }`
- Response: `200 OK` → `{ jobs: Job[], rejects: Job[], errors: Job[] }`
- Errors: `400` (bad body), `404` (prompt not found), `409` (personal profile incomplete), `429/5xx` (dependency) with [ER], `500` (env/db)
- Notes: Observes [DF], [NFR], and traces per FR-010
- Example request: `{ "promptId": "...", "actorName": "myScraper" }`

4) POST /api/jobs/{id}/generate [GENERATE]
- Purpose: generate cover letter and CV for job id
- Body: `{ "types": ("cover-letter"|"cv")[] }` (default both)
- Response: `202 Accepted` → `{ runId: string, artifacts: [ { type: string, url: string } ] }` (async-friendly)
- Errors: `404` (job not found), `409` (profile incomplete), `422` (invalid types), `429/5xx` (dependency) with [ER]
- Notes: generation may run async; artifacts become available at download endpoint
- Example response: `{ "runId": "r-123", "artifacts": [{"type":"cover-letter","url":"/api/jobs/123/download?type=cover-letter"}] }`

5) GET /api/jobs/{id}/download [DOWNLOAD]
- Purpose: download generated artifact
- Query: `type=cover-letter|cv` (required)
- Response: `200 OK` → PDF stream with filename (see [DL])
- Errors: `404` (artifact missing), `409` (not generated yet), `422` (invalid type)

6) POST /api/jobs/{id}/apply [APPLY]
- Purpose: mark job as applied
- Body: `{ "appliedAt"?: string }` (ISO, defaults to server time)
- Response: `200 OK` → `{ appliedAt: string }`
- Idempotency: see [ID]
- Errors: `404` (job not found), `409` (already applied with conflicting timestamp)

### Endpoint Contracts (US2)

1) POST /api/jobs/{id}/notes [NOTES]
- Purpose: add a timestamped note to a job
- Body: `{ "text": string, "clientId"?: string }`
- Response: `201 Created` → `{ id: string, text: string, createdAt: string }`
- Idempotency: if `clientId` is provided, the server MUST dedupe by `(jobId, clientId)` and return `200 OK` with the existing note
- Errors: `404` (job not found), `422` (invalid body), `500` (db)

2) POST /api/jobs/{id}/interview [INTERVIEW]
- Purpose: schedule an interview for a job
- Body: `{ "scheduledAt": string /* ISO */, "timezone"?: string, "medium"?: "phone"|"video"|"onsite" }`
- Response: `200 OK` → `{ scheduledAt: string, timezone?: string, medium?: string }`
- Idempotency: per `(jobId, scheduledAt)` the server SHOULD be idempotent and return the existing schedule
- Errors: `404` (job not found), `422` (invalid body), `500` (db)

3) POST /api/jobs/{id}/feedback [FEEDBACK]
- Purpose: record feedback/outcome from company
- Body: `{ "rating"?: "positive"|"neutral"|"negative", "notes"?: string, "receivedAt"?: string /* ISO */ }`
- Response: `201 Created` → `{ id: string, rating?: string, notes?: string, receivedAt: string }`
- Errors: `404` (job not found), `422` (invalid body), `500` (db)

Notes (US2 alternates):
- Reposting the same note with the same `clientId` SHOULD not duplicate [ID]
- Rescheduling interview to the same timestamp SHOULD return the same record; different timestamp creates a new schedule
- Empty feedback body SHOULD be rejected with `422`

### Endpoint Contracts (US3)

1) POST /api/jobs [INGEST]
- Purpose: ingest jobs from configured source(s) with deduplication
- Body: `{ "source"?: string, "limit"?: number }` (both optional; defaults come from server configuration)
- Response: `200 OK` → `{ added: number, skipped: number, failed: number, errors?: { id?: string, message: string }[] }`
- Deduplication: duplicates (by `(trackingId, refId)`) MUST count as `skipped`
- Errors: `400` (invalid body), `429/5xx` (source/dependency), `500` (env/misconfig)

Notes (US3 alternates):
- Partial ingestion failures MUST be reflected in `failed` and `errors[]` while still returning `200 OK`
- Mixed results (added + skipped + failed) SHOULD be expected and summarized
- If the source rate-limits, the response SHOULD include `errors[].message` with hints and server MAY include `retryAfterMs` in [ER]
### Scope Boundaries

- Out of scope for this spec: third‑party integrations for company insights or
  news, multi-tenant access controls, and external deployment targets.

### Dependencies & Assumptions

- Assumption: A persistent data store is available for jobs, profiles, and agent
  runs.
- Assumption: Users have stored personal data sufficient for document generation.
- Dependency: Access to at least one job source with stable identifiers.

### Key Entities *(include if feature involves data)*

- **Job**: Represents a job posting with core fields (title, company, location,
  description, identifiers, metadata such as salary and benefits).
- **Application Document**: Generated artifact (e.g., cover letter, CV) linked to
  a job and a generation run; includes metadata (type, created time).
- **Personal Profile**: Structured personal data used for generation (contact,
  preferences, skills, experience, education, etc.).
- **Agent Run**: A trace record for filtering/generation containing prompt
  version, parameters, inputs, outputs, timestamps, and result status.
- **Prompt Template**: Versioned template for agents with a fixed prefix/postfix
  and binary classification requirement for the filter.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the P1 flow (filter → generate documents → mark
  applied) in under 10 minutes end-to-end for a single job.
- **SC-002**: A batch relevance filter for 100 new jobs completes within ~3
  minutes in typical conditions, with progress feedback visible.
- **SC-003**: 90% of users report that generated documents are usable without
  major edits for at least one relevant job in a batch.
- **SC-004**: 95% of long-running operations provide non-blocking UI and clear
  status updates.
- **SC-005**: 100% of agent runs are traceable by run ID with recorded inputs,
  outputs, and prompt version.
