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
