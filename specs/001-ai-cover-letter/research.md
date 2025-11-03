# Phase 0 Research — AI Cover Letter Editor

Date: 2025-11-03
Branch: 001-ai-cover-letter
Spec: ./spec.md

## Decisions

### Rate limiting (generation/regeneration)
- Decision: 3 requests per minute per job per device
- Rationale: Prevents abuse, keeps costs predictable, and remains generous for iterative drafting.
- Alternatives considered: No limit (risk: abuse); 1/min (too restrictive); 5/min (higher cost risk).

### Observability signals
- Decision: Record generation latency (ms), token/output length (chars), and outcome (success/failure) with correlationId; exclude PII.
- Rationale: Enables performance and reliability analysis while respecting privacy.
- Alternatives considered: Full content logging (rejected due to PII risk); no metrics (insufficient for tuning).

### Autosave behavior
- Decision: Autosave on change with 1s debounce; save on blur and before unload.
- Rationale: Minimizes user-perceived loss and writes; aligns with success criterion (≤5s loss).
- Alternatives considered: Immediate save on every keystroke (too chatty); manual save only (risk of loss).

## Notes
- Anonymous storage: local-only drafts; no server persistence until sign-in exists.
- Template consistency: enforce single formal template across generation, editing preview, and PDF rendering.
