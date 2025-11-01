# Data Model: Application Manager Baseline

Date: 2025-11-01  
Branch: 001-baseline-spec

## Entities

### Job
Represents a scraped job posting and its derived metadata.
- Key fields: id, trackingId, refId, link, title, companyName, location, postedAt,
  salaryInfo[], benefits[], descriptionText/Html, employmentType, industries,
  companyWebsite, companyDescription, applicantsCount, applyUrl
- Derived fields: filteredAt, filterResult (boolean or error), filteredBy (ObjectId)
- Constraints: id, trackingId, and refId are deduplication keys; postedAt is a Date

### Application Document
Generated document for a specific job.
- Fields: id, jobId, type (cover-letter | cv | attachment), createdAt, content/meta
- Relationships: belongs to Job; linked to Agent Run for traceability

### Personal Profile
Structured personal data used for filtering and generation.
- Fields (from types.d.ts): contact, eligibility, constraints, preferences, skills[],
  experience, education[], certifications[], languages_spoken[], exclusions,
  motivations[], career_goals[]
- Constraints: Validate email/phone formats; ensure required contact fields

### Agent Run
Trace record for a single agent execution.
- Fields: id, agentType (filter | writer | evaluator), promptVersion, parameters
  (e.g., temperature), inputs, outputs, runId, startedAt, finishedAt, status, error
- Relationships: may reference Job and/or Application Document

### Prompt Template
Versioned template for agents with fixed components.
- Fields: id, agentType, name, version, prefix, postfix, createdAt, updatedAt
- Constraints: Filter Agent postfix enforces strict binary response (true|false)

### Actions & Notes
User-initiated updates to a Job’s lifecycle.
- Applied: appliedAt timestamp
- Note: text, createdAt
- Interview: datetime, notes
- Feedback: text, createdAt, sentiment (optional)

## Indexing Strategy

- Jobs: compound unique index on (trackingId, refId) to prevent duplicates
- Jobs: index on filteredAt, filterResult for filtering views
- Actions: index on jobId, createdAt for quick timeline retrieval
- Agent Runs: index on runId, createdAt for traceability queries

## Validation Rules

- No PII in logs; redact sensitive fields in traces
- Ensure deterministic agent params (temperature=0) captured per run
- Required fields for generated documents (type, jobId, createdAt) must be present
