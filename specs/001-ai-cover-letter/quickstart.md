# Quickstart — AI Cover Letter Editor (Planning)

This document summarizes how to exercise the planned feature end‑to‑end once implemented. It is not executable yet; it guides acceptance and test writing.

## Flows

1) Generate draft (P1)
- Navigate to `/jobs/{id}`
- Click "Generate Letter"
- Observe draft rendered with formal template (includes job + personal details)

2) Edit with autosave (P2)
- Type changes in the editor
- Confirm autosave indicator updates and changes persist on navigation/refresh

3) Regenerate as alternate (P3)
- Click "Regenerate"
- A new alternate appears; current draft unchanged
- Up to 3 alternates retained; on 4th, the oldest is removed (warn if named)

4) Download PDF (P3)
- Click "Download PDF"
- Verify file opens and matches the formal template

## Acceptance checkpoints
- Draft delivery time ≤ 10s
- Autosave loss ≤ 5s under adverse conditions
- PDF opens and renders consistently
- A11y: keyboard navigation and ARIA labels present in editor controls

## Notes
- Anonymous drafts are device‑bound in this release; no server persistence until sign‑in exists.
