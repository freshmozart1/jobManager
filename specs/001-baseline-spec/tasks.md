---

description: "Task list for baseline feature implementation"
---

# Tasks: Application Manager Baseline

**Input**: Design documents from `/specs/001-baseline-spec/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included per request — contract/API tests and E2E journey tests are listed for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create `.env.example` documenting required env vars in `/Users/ole/VS Code Workspace/jobManager/.env.example`
- [x] T002 Add constitution gates to PR checklist in `/Users/ole/VS Code Workspace/jobManager/.github/PULL_REQUEST_TEMPLATE.md`
- [x] T003 [P] Add placeholder log utility for structured logs in `/Users/ole/VS Code Workspace/jobManager/lib/utils.ts`
- [x] T004 [P] Add agent run trace helper in `/Users/ole/VS Code Workspace/jobManager/lib/utils.ts` (record runId, promptVersion, inputs/outputs, timestamps)

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T005 Ensure MongoDB indexes defined (jobs filteredAt, filterResult) in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/createIndexes.mongodb.js`
- [x] T006 [P] Add unique index for dedupe keys (trackingId, refId) in same file as above
- [x] T007 [P] Define prompt template storage convention (fixed prefix/postfix) in `/Users/ole/VS Code Workspace/jobManager/app/api/prompts/route.ts` (docs/comments)
- [x] T008 Define agent parameters (temperature=0) and validation in `/Users/ole/VS Code Workspace/jobManager/app/api/filter/route.ts` (docs/comments)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Review & Act on Relevant Jobs (Priority: P1) 🎯 MVP

**Goal**: Filter jobs deterministically, generate application documents, mark applied.

**Independent Test**: With existing jobs, run filter → open detail → generate → download → mark applied.

### Tests for User Story 1 ⚠️

- [ ] T009 [P] [US1] Contract test: POST /api/filter in `/Users/ole/VS Code Workspace/jobManager/tests/contract/filter.post.test.ts`
- [ ] T010 [P] [US1] Contract test: GET /api/jobs?filter=relevant in `/Users/ole/VS Code Workspace/jobManager/tests/contract/jobs.get.relevant.test.ts`
- [ ] T011 [P] [US1] Contract test: GET /api/jobs/{id} in `/Users/ole/VS Code Workspace/jobManager/tests/contract/jobs.id.get.test.ts`
- [ ] T012 [P] [US1] Contract test: POST /api/jobs/{id}/generate in `/Users/ole/VS Code Workspace/jobManager/tests/contract/jobs.id.generate.post.test.ts`
- [ ] T013 [P] [US1] Contract test: GET /api/jobs/{id}/download in `/Users/ole/VS Code Workspace/jobManager/tests/contract/jobs.id.download.get.test.ts`
- [ ] T014 [P] [US1] Contract test: POST /api/jobs/{id}/apply in `/Users/ole/VS Code Workspace/jobManager/tests/contract/jobs.id.apply.post.test.ts`
- [ ] T015 [US1] E2E test: filter → generate → download → apply in `/Users/ole/VS Code Workspace/jobManager/tests/e2e/us1-flow.spec.ts`

### Implementation for User Story 1

- [ ] T016 [US1] Implement list filtering param `?filter=relevant` in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/route.ts`
- [ ] T017 [US1] Implement `/api/filter` POST in `/Users/ole/VS Code Workspace/jobManager/app/api/filter/route.ts` (deterministic runs + trace logging)
- [ ] T018 [US1] Implement `/api/jobs/[id]` GET in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/[id]/route.ts`
- [ ] T019 [US1] Implement `/api/jobs/[id]/generate` POST in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/[id]/route.ts` (sub-route or branch)
- [ ] T020 [US1] Implement `/api/jobs/[id]/download` GET in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/[id]/route.ts`
- [ ] T021 [US1] Implement `/api/jobs/[id]/apply` POST in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/[id]/route.ts`
- [ ] T022 [US1] Add filter action in list UI at `/Users/ole/VS Code Workspace/jobManager/components/ui/appJobsTable.tsx` (button + status)
- [ ] T023 [US1] Segment list into relevant / not relevant in `/Users/ole/VS Code Workspace/jobManager/app/search/page.tsx`
- [ ] T024 [US1] Add generate + download controls in job detail `/Users/ole/VS Code Workspace/jobManager/app/jobs/[id]/page.tsx`
- [ ] T025 [US1] Add mark-as-applied control in job detail `/Users/ole/VS Code Workspace/jobManager/app/jobs/[id]/page.tsx`
- [x] T016 [US1] Implement list filtering param `?filter=relevant` in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/route.ts`
- [x] T026 [P] [US1] Wire agent run trace helper usage in `/Users/ole/VS Code Workspace/jobManager/app/api/filter/route.ts`

**Checkpoint**: User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 - Track Application Lifecycle (Priority: P2)

**Goal**: Add notes, interview schedules, and feedback with timestamps.

**Independent Test**: Add note → schedule interview → record feedback; verify persistence and display.

### Tests for User Story 2 ⚠️

- [ ] T027 [P] [US2] Contract test: POST /api/jobs/{id}/notes in `/Users/ole/VS Code Workspace/jobManager/tests/contract/jobs.id.notes.post.test.ts`
- [ ] T028 [P] [US2] Contract test: POST /api/jobs/{id}/interview in `/Users/ole/VS Code Workspace/jobManager/tests/contract/jobs.id.interview.post.test.ts`
- [ ] T029 [P] [US2] Contract test: POST /api/jobs/{id}/feedback in `/Users/ole/VS Code Workspace/jobManager/tests/contract/jobs.id.feedback.post.test.ts`
- [ ] T030 [US2] E2E test: notes → interview → feedback flow in `/Users/ole/VS Code Workspace/jobManager/tests/e2e/us2-flow.spec.ts`

### Implementation for User Story 2

- [ ] T031 [US2] Implement `/api/jobs/[id]/notes` POST in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/[id]/route.ts`
- [ ] T032 [US2] Implement `/api/jobs/[id]/interview` POST in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/[id]/route.ts`
- [ ] T033 [US2] Implement `/api/jobs/[id]/feedback` POST in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/[id]/route.ts`
- [ ] T034 [US2] Add notes UI to job detail `/Users/ole/VS Code Workspace/jobManager/app/jobs/[id]/page.tsx`
- [ ] T035 [US2] Add interview scheduler UI to job detail `/Users/ole/VS Code Workspace/jobManager/app/jobs/[id]/page.tsx`
- [ ] T036 [US2] Add feedback UI to job detail `/Users/ole/VS Code Workspace/jobManager/app/jobs/[id]/page.tsx`

**Checkpoint**: User Story 2 independently functional and testable

---

## Phase 5: User Story 3 - Ingest New Jobs (Priority: P3)

**Goal**: Ingest jobs from configured sources with deduplication and summaries.

**Independent Test**: Trigger ingest; verify added/skipped/failed counts and dedup.

### Tests for User Story 3 ⚠️

- [ ] T037 [P] [US3] Contract test: POST /api/jobs (ingest) in `/Users/ole/VS Code Workspace/jobManager/tests/contract/jobs.post.ingest.test.ts`
- [ ] T038 [US3] E2E test: admin ingestion trigger + summary in `/Users/ole/VS Code Workspace/jobManager/tests/e2e/us3-flow.spec.ts`

### Implementation for User Story 3

- [ ] T039 [US3] Add POST ingestion handler to `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/route.ts` (body: source config or default)
- [ ] T040 [US3] Implement deduplication using (trackingId, refId) in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/route.ts`
- [ ] T041 [US3] Return summary (added/skipped/failed) from ingestion in `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/route.ts`
- [ ] T042 [US3] Add ingestion trigger UI (admin) in `/Users/ole/VS Code Workspace/jobManager/app/playground/page.tsx` (button + result panel)

**Checkpoint**: User Story 3 independently functional and testable

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T043 [P] Add progress indicators for filter/generation in `/Users/ole/VS Code Workspace/jobManager/app/jobs/[id]/page.tsx`
- [ ] T044 [P] Improve list responsiveness and empty states in `/Users/ole/VS Code Workspace/jobManager/app/search/page.tsx`
- [ ] T045 Harden error handling and retries for agent ops in `/Users/ole/VS Code Workspace/jobManager/app/api/filter/route.ts` and `/Users/ole/VS Code Workspace/jobManager/app/api/jobs/[id]/route.ts`
- [ ] T046 [P] Update docs: quickstart and README with new routes in `/Users/ole/VS Code Workspace/jobManager/specs/001-baseline-spec/quickstart.md` and `/Users/ole/VS Code Workspace/jobManager/README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies - can start immediately
- Foundational (Phase 2): Depends on Setup completion - BLOCKS all user stories
- User Stories (Phase 3+): All depend on Foundational phase completion
- Polish (Final Phase): Depends on desired user stories being complete

### User Story Dependencies

- User Story 1 (P1): Can start after Foundational – independent.
- User Story 2 (P2): Can start after Foundational – independent of US1 but benefits from applied status.
- User Story 3 (P3): Can start after Foundational – independent.

### Parallel Opportunities

- [P] tasks: T003, T004, T006, T009, T010, T011, T012, T013, T014, T027, T028, T029, T037, T026, T043, T044, T046
- Within US1: UI tasks (T022–T025) can proceed in parallel once APIs are stubbed
- Within US2: UI tasks (T034–T036) can proceed in parallel once POST handlers exist
- Within US3: Ingestion UI (T042) can proceed in parallel once POST handler exists

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup + Foundational
2. Implement US1 (T009–T019)
3. Stop and validate: user can filter, generate, download, and mark applied

### Incremental Delivery

1. Add US2 (notes/interviews/feedback)
2. Add US3 (ingestion + summary)
3. Polish and cross-cutting

---
