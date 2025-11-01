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

### Job Artifact
Generated artifact for a specific job (e.g., cover letter, CV).
- Fields: jobId, runId, type ("cover-letter" | "cv"), fileName, contentType, content, createdAt
- Relationships: belongs to Job; linked to an Agent Run via runId for traceability

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

---

## Canonical Type Definitions (source of truth: `types.d.ts`)

The following TypeScript definitions are the canonical data shapes used by the application. Keep this section in sync with `types.d.ts`.

```ts
import { ObjectId } from "mongodb";

export type ScrapedJob = {
  id: string;
  trackingId: string;
  refId: string;
  link: string;
  title: string;
  companyName: string;
  companyLinkedinUrl: string;
  companyLogo: string;
  companyEmployeesCount?: number | undefined;
  location: string;
  postedAt: Date;
  salaryInfo: string[];
  salary: string;
  benefits: string[];
  descriptionHtml: string;
  applicantsCount: number | string;
  applyUrl: string;
  descriptionText: string;
  seniorityLevel?: string | undefined;
  employmentType: string;
  jobFunction?: string | undefined;
  industries?: string | undefined;
  inputUrl: string;
  companyAddress?: PostalAddress | undefined;
  companyWebsite?: string | undefined;
  companySlogan?: string | null | undefined;
  companyDescription?: string | undefined;
};

export type JobArtifactType = 'cover-letter' | 'cv';

export type JobGenerationArtifact = {
  type: JobArtifactType;
  contentType: string;
  fileName: string;
  createdAt: Date;
};

export type JobGenerationMetadata = {
  runId: string;
  generatedAt: Date;
  types: JobArtifactType[];
  artifacts: JobGenerationArtifact[];
};

export type JobArtifactDocument = {
  jobId: string;
  runId: string;
  type: JobArtifactType;
  contentType: string;
  fileName: string;
  content: string;
  createdAt: Date;
};

export type Job = ScrapedJob & {
  filteredAt: Date;
  filterResult: boolean | { error: string };
  filteredBy: ObjectId;
  generation?: JobGenerationMetadata;
  appliedAt?: Date;
};

export type ScrapeUrlDocument = {
  url: string;
};

export type PersonalInformationContact = {
  name: string;
  email: string;
  phone: string;
  portfolio_urls: string[];
};

export type PersonalInformationEligibility = {
  work_authorization: {
    region: string;
    status: string;
  }[];
  security_clearance: string | null;
  relocation: {
    willing: boolean;
    regions: string[];
  };
  remote: {
    willing: boolean;
    time_zone: string;
  };
  availability: {
    notice_period_days: number;
  };
  work_schedule_constraints: {
    weekends: boolean;
    nights: boolean;
  };
};

export type PersonalInformationConstraints = {
  salary_min: {
    currency: string;
    amount: number;
  };
  locations_allowed: string[];
};

export type PersonalInformationPreferences = {
  roles: string[];
  seniority: string[];
  company_size: string[];
  work_mode: {
    mode: string;
  }[];
  industries: string[];
};

export type PersonalInformationSkill = {
  name: string;
  aliases: string[];
  category: string;
  level: string;
  years: number;
  last_used: string;
  primary: boolean;
};

export type PersonalInformationExperienceItem = {
  from: Date;
  to?: Date;
  role: string;
  company: string;
  summary: string;
  tags: string[];
};

export type PersonalInformationEducation = {
  degree: string;
  field: string;
  institution: string;
  graduation_year: number;
};

export type PersonalInformationCertification = {
  name: string;
  issued: string;
  expires: string | null;
};

export type PersonalInformationLanguageSpoken = {
  language: string;
  level: string;
};

export type PersonalInformationExclusions = {
  avoid_roles: string[];
  avoid_technologies: string[];
  avoid_industries: string[];
  avoid_companies: string[];
};

export type PersonalInformationMotivation = {
  topic: string;
  description: string;
  reason_lite: string;
};

export type PersonalInformationCareerGoal = PersonalInformationMotivation;

export type PersonalInformation = {
  contact: PersonalInformationContact,
  eligibility: PersonalInformationEligibility,
  constraints: PersonalInformationConstraints,
  preferences: PersonalInformationPreferences,
  skills: PersonalInformationSkill[],
  experience: PersonalInformationExperienceItem[],
  education: PersonalInformationEducation[],
  certifications: PersonalInformationCertification[],
  languages_spoken: PersonalInformationLanguageSpoken[],
  exclusions: PersonalInformationExclusions,
  motivations: PersonalInformationMotivation[],
  career_goals: PersonalInformationCareerGoal[];
};

export type PersonalInformationDocument = {
  _id: ObjectId;
  type: string;
  value: PersonalInformationContact | PersonalInformationEligibility | PersonalInformationConstraints | PersonalInformationPreferences | PersonalInformationSkill[] | PersonalInformationExperienceItem[] | PersonalInformationEducation[] | PersonalInformationCertification[] | PersonalInformationLanguageSpoken[] | PersonalInformationExclusions | PersonalInformationMotivation[] | PersonalInformationCareerGoal[];
};

export type AgentType = 'filter' | 'writer' | 'evaluator';

export type PromptDocument = {
  _id: ObjectId;
  agentType: AgentType;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  prompt: string;
};

export type AgentRunRetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  retryOn?: (info: {
    status: number | null;
    error: unknown;
    attempt: number;
  }) => boolean;
  onRetry?: (info: {
    attempt: number;
    delayMs: number;
    reason: string;
  }) => void;
  onRequestTooLarge?: () => Promise;
};

export type FilterAgentResult = {
  jobs: Job[];
  rejects: Job[];
  errors: Job[];
};

export type FilterAgentPromise = Promise<FilterAgentResult>;

export type JobWithNewFlag = Job & { new: boolean };
```
