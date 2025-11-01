# Pull Request

## Summary
- Describe the change and why it’s needed.
- Link related issues/spec tasks (e.g., specs/001-baseline-spec/tasks.md IDs).

## Change Type
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor/Chore
- [ ] Docs/Test only

## Screenshots / Demos (optional)

## Checklist

### Quality gates
- [ ] Build PASS (npm run build)
- [ ] Lint PASS (npm run lint)
- [ ] Tests PASS (unit/e2e as applicable)

### Constitution gates (must be PASS)
- [ ] UX: Clear flows, accessible components, consistent styling
- [ ] Security: No secret leakage, safe error handling, least privilege
- [ ] AI Determinism: Versioned prompts, temperature=0, trace logs for AI runs
- [ ] Performance: Efficient DB queries, pagination, indexes used
- [ ] Extensibility: Types defined, minimal coupling, clear contracts

### Impacted areas
- [ ] API surface changed (update contracts/docs)
- [ ] Database/index changes (include migration notes)
- [ ] Environment variables (document in .env.example)

## Testing notes
- How did you verify? Include steps or link to tests.

## Rollback plan
- How to revert safely if needed.
