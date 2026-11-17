---
name: pre-pr
description: Run LearnFlow's mandatory quality gate, then commit with Conventional Commits and open a PR into dev. Use before any commit/PR, or when the user says "ready", "open PR", "ship it".
---

# Pre-PR checklist

Do these in order. Stop and report at the first failure; do not open a PR on a red gate.

## 1. Branch sanity
- `git branch --show-current` must not be `main` or `dev` (a hook also blocks commits there).
- `git fetch origin dev` and make sure the branch is based on recent `origin/dev`
  (`git log --oneline origin/dev..HEAD` shows only this task's commits).

## 2. Quality gate (all must pass)
Run from the repo root; prefix with `mise exec --` if `java`/`node` are not on PATH.
```
cd backend  && ./mvnw verify            # includes spotless:check, unit + integration + ArchUnit tests
cd frontend && npm run format:check && npm run lint && npm run build && npm run test
```
Integration tests need Docker running. If Docker is unavailable, say so explicitly — never claim the
gate passed.

## 3. Review
- Do **not** launch `code-reviewer` here. It runs only when the user explicitly asks for a code review.
- If the diff touches content files (Japanese words, kanji, grammar, readings), launch
  `content-reviewer` on them, fix every WRONG finding, and list the rest in the PR body.

## 4. Commit
- Conventional Commits, scope = module: `feat(curriculum): import N5 vocabulary from YAML`.
  Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `build`.
- One logical change per commit. English messages. Never `--no-verify`, never amend pushed commits.

## 5. Pull request into `dev`
- Ask the user before pushing and opening the PR.
- Title: `[R<n>] <what changed>`.
- Body:
  ```
  ## Phase / task
  plan/phase-r<n>-<slug>.md — tasks: <list of checklist items done>

  ## Changes
  - ...

  ## Verification
  - backend: ./mvnw verify — <result>
  - frontend: format:check / lint / build / test — <result>
  - not verified: <anything skipped and why>
  ```
- After the PR merges (not before): tick the matching `- [x]` boxes in the phase file in a follow-up.
