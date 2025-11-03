# Data Model — AI Cover Letter Editor

Date: 2025-11-03
Branch: 001-ai-cover-letter

## Entities

### Job
- id: string
- title: string
- companyName: string
- descriptionHtml: string
- metadata: object (location, employmentType, etc.)

### PersonalProfile (Type: `PersonalInformation` from `types.d.ts`)
- Source of truth: TypeScript type `PersonalInformation` defined in `types.d.ts`
- Top-level keys (mirror the type): `contact`, `eligibility`, `constraints`, `preferences`, `skills`, `experience`, `education`, `certifications`, `languages_spoken`, `exclusions`, `motivations`, `career_goals`
- Notes:
	- Field paths (e.g., `contact.phone`) are used for validation, `missingFields`, and placeholder markers in generated HTML
	- Keep this document aligned with the code type; do not introduce divergent schemas here

### Template
- id: string ("formal-default")
- version: string
- name: string
- constraints: margins, fonts, header/footer rules

### Prompt
- id: string
- version: string
- text: string (system guidance)
- audience/tone: optional metadata

### ApplicationLetter
- jobId: string
- templateId: string
- promptId: string
- html: string (current active draft)
- alternates: Array<{ id: string, createdAt: ISO8601, html: string, name?: string }>
- updatedAt: ISO8601

## Relationships
- ApplicationLetter references Job (jobId)
- ApplicationLetter references Template (templateId)
- ApplicationLetter references Prompt (promptId)

## Validation Rules
- ApplicationLetter.html must conform to template constraints (no disallowed styles)
- Alternates length ≤ 3 (per retention policy)
- Prompt must exist in DB when generating a new draft
- PDF export must succeed for provided html (non-empty, valid DOM)

## State Transitions
- Generated → Edited (autosave cycles) → Downloaded (PDF)
- Edited → Regenerated → Alternate added (active draft unchanged unless user selects)
- Alternates cull: on 4th create, delete oldest; warn if oldest named
