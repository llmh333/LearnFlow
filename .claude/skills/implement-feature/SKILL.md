---
name: implement-feature
description: Implement a LearnFlow feature (backend and/or frontend) in the project's fixed 10-step order with tests at each layer. Use when starting any feature, endpoint, page or module change from a phase checklist.
---

# Implement a feature the LearnFlow way

Follow AGENTS.md exactly. This skill is the step-by-step version of AGENTS.md §1.7.

## 0. Before writing code
- Find the task in the current phase file `plan/phase-r<n>-<slug>.md`. If it is not there, stop and ask
  whether to add it.
- Be on a branch cut from `dev` named `phase/r<n>-<slug>` or `phase/r<n>-<slug>/<task-slug>`.
- Read the existing module you are touching (Controller, Service, Repository, domain, dto, tests) so the
  new code matches its patterns.
- Decide which steps below apply. Skip a step only when the feature truly has no such layer, and say so.

## Backend (steps 1–5)
1. **Migration** — `backend/src/main/resources/db/migration/V{next}__{snake_case}.sql`.
   Next number = highest existing V + 1. Never edit a merged migration (a hook blocks it).
   `snake_case` singular names, `TIMESTAMPTZ` for time, `BIGSERIAL` keys, `user_id` on every per-user table
   with an index that matches the hot query.
2. **Entity** — `domain/<Entity>.java`. Map time to `Instant`. `ddl-auto=validate` must pass.
3. **Repository** — `extends JpaRepository<Entity, Long>`. Every per-user lookup is scoped:
   `findByIdAndUser_Id(...)`, never a bare `findById` for user data.
4. **Service + unit test** — all business logic here, `@Transactional`.
   - Inject `Clock`; never `Instant.now()` / `LocalDate.now()` without it.
   - Pure algorithms (SRS, planning, generators) go in an `engine/` class with no Spring/DB, and get
     exhaustive unit tests.
   - Call other modules only through their public Service, never their Repository.
   - Never hold a DB transaction open while waiting on an AI call.
   - Unit test: `XxxTest.java`, JUnit 5 + Mockito, `Clock.fixed(...)`.
5. **Controller + integration test** — maps HTTP ↔ DTO only. DTOs are `record`s named
   `XxxRequest`/`XxxResponse` with jakarta validation. Errors through the `common/error` exceptions
   (ProblemDetail). Paging returns `PageResponse<T>`.
   Integration test: `XxxIntegrationTest.java extends AbstractIntegrationTest`; cover auth (401),
   ownership (other user's id → 404) and validation (400 with `errors`). Mock `AIProvider`.

## Frontend (steps 6–10)
6. **Types** — mirror the DTOs by hand in `frontend/src/types/domain.ts`.
7. **API** — pure functions in `frontend/src/api/<domain>.ts` using `client.ts`; verbs `fetch*`, `create*`,
   `update*`, `delete*`.
8. **Hooks** — `frontend/src/hooks/use<Domain>.ts` wraps react-query and exports `<domain>Keys`.
   Server state only in react-query; zustand only for auth + UI state.
9. **Components / pages** — `components/ui` for shared primitives, `components/<domain>/` for domain
   pieces, `pages/<Name>Page.tsx`. Mobile-first layout. File name = component name.
10. **Frontend test** — `Xxx.test.tsx` next to the file, Vitest + React Testing Library.

## After the code
- Run the narrowest tests for what you touched while iterating, then the full gate via `/pre-pr`.
- Tick nothing in the phase file yet: boxes are ticked only after the PR merges.
- Report what was built, which tests ran and their result, and anything not verified.
