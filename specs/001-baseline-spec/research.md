# Research: Application Manager Baseline

Date: 2025-11-01  
Branch: 001-baseline-spec

## Unknowns Addressed

1. Testing stack (unit/integration/E2E)
2. Deployment target
3. Monitoring/logging approach

---

## Decision 1: Testing Stack

- Decision: Use Vitest + React Testing Library for unit/component tests; Playwright for end‑to‑end.
- Rationale: Fast TS-native unit tests with good React support; Playwright offers reliable cross-browser E2E and integrates well with web apps.
- Alternatives considered:
  - Jest + RTL: Mature but slower in TS-only repos; Vitest is lighter for Vite/TS projects. (Can swap later if repo tooling requires Jest.)
  - Cypress: Strong E2E UX but heavier runner and single-browser focus.

## Decision 2: Deployment Target

- Decision: Deploy to Vercel.
- Rationale: First-class Next.js hosting, environment management, preview deployments, and Edge support.
- Alternatives considered:
  - Render/Fly.io: Good general options; more manual Next.js tuning.
  - Custom server: More control but higher ops overhead.

## Decision 3: Monitoring/Logging

- Decision: Use Vercel Analytics for basic telemetry; structured JSON logs from API routes, with optional Log drain to Axiom/Logtail (deferred until scale grows).
- Rationale: Start simple with platform-native analytics; plan path to centralized logs for agent run traces.
- Alternatives considered:
  - Datadog/New Relic: Powerful but overkill initially.
  - Self-hosted ELK: Heavy operational burden.

---

## Constitution Gate Implications

- UX: No impact beyond ensuring progress indicators in UI and helpful error messages.
- Security: Maintain PII-free logs; secrets in env; HTTPS via Vercel. No change.
- AI Determinism: No change—document prompt versions and temp=0; persist run traces.
- Performance: No change—targets remain; Playwright enables E2E perf checks and journey validation.
- Extensibility: Choices do not constrain future agents or data sources.

---

## Next Steps

- Incorporate these decisions in plan.md Technical Context.
- Add minimal test scaffolding in later phases (out of scope for /speckit.plan).
