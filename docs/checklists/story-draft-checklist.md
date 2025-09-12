# Story Draft Checklist

Use this checklist to validate a user story draft before setting status to "In Progress" and delegating implementation. Mark each item as complete [x] once verified.

- [ ] **Story Structure**: File named correctly (e.g., {epic}.{story}.story.md), includes title, status (Draft), sections for AC, Dev Notes, Tasks, Dev Agent Record (placeholder).
- [ ] **Acceptance Criteria**: Clear, concise, user-focused bullets covering functional requirements (e.g., UI behaviors, integrations, edge cases); measurable (e.g., "users can X via Y"); covers happy path, errors, accessibility, responsiveness, performance.
- [ ] **Dev Notes**: References epic/PRD alignment; infers backend details (e.g., Prisma models, APIs) if no architecture docs; notes UI patterns from prior stories; lists constraints (frontend-only, no schema changes); includes testing guidance.
- [ ] **Tasks**: Comprehensive, sequential checklist of implementation steps (e.g., create components, update services/routes, add tests); uses [ ] for pending; covers all AC.
- [ ] **Alignment and Completeness**: Story is self-contained, low-risk brownfield enhancement; no dependencies on unfinished work; dev notes address gaps (e.g., "No specific guidance found"); ready for developer mode task.
- [ ] **BMad Compliance**: Follows template from prior stories (e.g., 2.1, 2.2); includes validation step for this checklist.

Once all items are [x], update story status to "In Progress", run story-dod-checklist.md post-implementation.