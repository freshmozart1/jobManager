## Skills Editor Integration Plan

TL;DR: Introduce `components/ui/appSkillsEditor.tsx` replacing the JSON skills block in `app/personal/page.tsx`, featuring table UI with search/filter, pagination, one-time primary-first sort, endpoint-excluding shift range selection (inner rows only), tooltips on key cells, Sheet-based add/edit, inline undo banner beneath pagination that auto-hides after 5s (hover pauses timer; once gone, undo unavailable), and optimistic persistence with validation.

### Steps
1. Add `components/ui/appSkillsEditor.tsx` (props: `skills`, `onChange`, `onPersist`) applying initial primary-first sort once, then stable ordering.
2. Implement table using `Table*` wrappers; single click sets anchor; shift-click selects inner rows only; visually outline excluded endpoints with `ring-1 ring-primary`.
3. Add search (name/category/level/aliases) + category filter + clear; paginate (size 10) post-filter; clamp page index after deletions.
4. Build Sheet form (add/edit) validating: unique name, decimal years ≥0, `last_used` YYYY-MM, aliases ≤5 and each ≤10 chars, primary toggle; disable save until valid.
5. Attach hover/focus/tap tooltips: name (full & sentence), primary (generic purpose sentence), last_used (format + example), aliases (limits sentence); reuse tooltip for error states.
6. Implement delete (single/multi) on selected inner rows; show inline banner under pagination with truncated names + Undo; hover pauses 5s auto-hide; once hidden, action final.
7. Replace JSON skills card block in `app/personal/page.tsx` with `<AppSkillsEditor>` wired to local state (`onChange`) and `handleSave('skills', updatedSkills)` (`onPersist`).

### Clarifications Locked In
- Banner hover pauses auto-hide countdown; leaving hover resumes; total lifetime max 8s (5s base + up to 3s pause grace if re-hovered before expiry) — optional grace if implemented.
- Endpoint rows (anchor + shift target) are never deleted in a range; only inner rows removed.
- Once banner disappears, undo is permanently unavailable (no history panel).
- Primary toggle tooltip stays generic: “Marks skill as primary; primary skills appear first on initial load.”
- Outlined endpoints use `ring-1 ring-primary` without fill.

### Validation Rules
- Name: required, unique (case-insensitive) across all skills; trimmed length > 0.
- Years: number ≥ 0, allows decimals; reject NaN.
- last_used: regex `^\d{4}-\d{2}$`; also ensure month 01–12.
- Aliases: array length ≤ 5; each alias length 1–10 chars; enforce uniqueness per skill (case-insensitive) excluding the main name.
- Primary: boolean; multiple primary allowed (ordering only applied once at mount).

### Search & Filter
- Free-text search across name, category, level, aliases; debounced 150ms.
- Category filter from existing categories present in current skills list, plus “All”.
- Clear button resets both search text and category and resets to page 1.

### Pagination
- Page size 10; applies after filtering; page index clamped if last page shrinks.
- Deletion causing empty last page moves user to previous page.

### Selection Model
- First plain click sets anchor (endpoint A).
- Shift-click another row sets endpoint B and selects only rows strictly between A and B.
- If fewer than 2 rows between endpoints, selection yields empty set (no banner, no delete range action).
- Selected (inner) rows get `data-[state=selected]` styling; endpoints get outline ring only.
- Subsequent non-shift click resets selection to new anchor and clears previous range.

### Undo Banner Behavior
- Appears directly beneath pagination controls when deletion occurs.
- Displays: count + truncated names (12 chars + ellipsis) separated by commas.
- If multiple rapid deletions (<500ms apart) before previous banner resolved, merge groups: label “Merged N groups” and union of names (deduplicated) in alphabetical order.
- Hover pauses auto-hide timer; leaving hover resumes. After 5s (or extended grace) banner disappears and cannot be undone.
- Undo restores previous skills array snapshot and dismisses banner immediately.

### Optimistic Persistence
- Local state updates immediately on add/edit/delete.
- On `onPersist` call, if server fails, revert to snapshot and show tooltip-based error on affected rows (or a small inline error under table header if global failure) with brief message: “Save failed. Reverted.”
- Edits within Sheet saved only when user clicks Save; closing Sheet without saving discards changes.

### Error Display
- Invalid fields outlined with `ring-1 ring-destructive` and tooltip clarifies reason.
- Global save failure (PUT not ok) triggers inline banner variant (different background) above table header (distinct from undo banner which sits below pagination).

### Tooltips Content (Brief Sentences)
- Name: “Full name: React” (example) plus if truncated: “Truncated for display.”
- Primary: “Marks skill as primary; primary skills appear first on initial load.”
- last_used: “Use YYYY-MM (e.g. 2024-09).”
- Aliases: “Up to 5 aliases, each ≤10 chars.”
- Error variant adds: “Fix to enable save.” appended.

### Component API
```ts
type AppSkillsEditorProps = {
  skills: PersonalInformationSkill[];
  onChange: (skills: PersonalInformationSkill[]) => void; // optimistic local update
  onPersist: (skills: PersonalInformationSkill[]) => Promise<void>; // triggers handleSave
};
```

### Internal State Snapshotting
- Keep `previousSkillsRef` for last committed state.
- On delete/edit/add: push change, show undo banner (delete only). For edit/add, no undo banner; rely on Sheet cancel.

### Performance Notes
- Virtualization deferred until >50 rows; placeholder hook `useShouldVirtualize(length)` returns boolean; if true, switch to windowed rendering strategy later.

### Styling Conventions
- Use `Table*` wrappers for structure.
- Row classes: base hover, selected variant background, endpoints ring only.
- Banner: flex, small font, subtle background (`bg-muted`), border, rounded, includes Undo button (`variant=outline size=sm`).

### Future Enhancements (Deferred)
- Keyboard shortcuts for selection and deletion.
- Batch editing primary flag.
- Virtualized list when >50 rows.
- Persistent deletion history panel.

### Risks & Edge Cases
- Rapid consecutive deletions merging groups – ensure snapshot aggregation correct.
- Server failure after banner expiry (undo unavailable) – rely on server as source of truth; may necessitate reload notice.
- Date regex passes invalid month (e.g. 2024-19) – add explicit month check.
- Case-insensitive uniqueness may conflict with existing identical names differing only in case at initial load; treat as already unique until user edits.

### Completion Criteria
- JSON skills block removed from `app/personal/page.tsx`.
- New component renders with functional search, filter, pagination, selection, tooltips, Sheet editing, delete + undo banner.
- Validation prevents invalid save; optimistic updates revert on failure.
