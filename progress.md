# ps-hub — Progress Handoff

> Read this file in a fresh session to pick up exactly where work stopped.
> Last updated: 2026-04-29 (Phase 2 complete; Phase 3 next).

## What this project is

**ps-hub**: a multi-user web app where each user signs in with Google, registers their AtCoder/Codeforces handles, bookmarks other people's handles, organizes them into groups, and views a unified rating dashboard.

**Stack**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v3 + Drizzle ORM + Postgres (Neon planned) + NextAuth v5 + zod + vitest + Playwright.

## Authoritative documents (read these first)

1. **Design spec** — `docs/superpowers/specs/2026-04-29-ps-hub-design.md`
   Approved by user. Defines goals, data model, architecture rules, error handling, testing strategy.

2. **Implementation plan** — `docs/superpowers/plans/2026-04-29-ps-hub-mvp.md`
   ~2,800 lines, 7 phases, ~27 numbered tasks. Each task has bite-sized TDD steps with full code/commands.

If anything in this `progress.md` conflicts with those, **the spec/plan win**.

## Working environment

- **Repo:** `C:\Users\User\Desktop\github\ps-hub`
- **Remote:** `origin = https://github.com/hdh4952/ps-hub.git`. `main` tracks `origin/main`.
- **Local Postgres:** NOT available in this environment (no Docker daemon, no native `psql`). Drizzle migrations are *generated* but not applied. The `.env.local` placeholder values are `xxx` for OAuth secrets — real values needed before `npm run dev` works.
- **OS:** Windows 11. Shell: bash (Unix-style paths inside bash; native paths from PowerShell).

## Workflow protocol — IMPORTANT, DO NOT DEVIATE

This project is being executed under **superpowers:subagent-driven-development** (`C:\Users\User\.claude\plugins\cache\claude-plugins-official\superpowers\5.0.7\skills\subagent-driven-development`). Every task follows this pattern:

1. **Mark task `in_progress`** in the task list.
2. **Dispatch implementer subagent** (`oh-my-claudecode:executor` for mechanical tasks; raise to `general-purpose`/Opus for design judgment). Provide *full task text verbatim* — do not let the subagent read the plan file. Include project state, constraints, post-commit push instruction.
3. **Implementer commits + pushes to `origin/main`.** This push-after-each-task is a hard requirement (see memory: `feedback_push_after_each_task.md`).
4. **Spec compliance review** via `general-purpose` subagent. Verify the implementation matches spec verbatim by *reading code*, not trusting the implementer's report.
5. **Code quality review** via `oh-my-claudecode:code-reviewer` subagent. Only after spec ✅. Look for important issues — calibrate severity to task surface area.
6. **Apply review fix-ups** if Important/Critical issues are flagged. Dispatch a small fix-up subagent that commits *and pushes* a follow-up commit. Re-review only if a Critical issue was fixed.
7. **Mark task `completed`**. Move on.

**Red flags (skill rules):**
- Never start implementation without explicit user consent on `main`/`master` (we have consent).
- Never skip a review.
- Never run two implementer subagents in parallel.
- Never let an implementer self-approve.
- Spec review **always** runs before code quality review.

## Phase status

### Phase 0 — Bootstrap ✅ COMPLETE (4 tasks, 6 commits)

| Task | Commit | Status |
|---|---|---|
| 0.1 git init + Next.js scaffold | `678b39c` | ✅ |
| 0.1 review fixups (next-env.d.ts, engines, gitignore) | `3a5db95` | ✅ |
| 0.2 Tailwind v3 + globals.css | `c9810e7` | ✅ |
| 0.3 vitest + sanity test | `8301cda` | ✅ |
| 0.4 zod env loader (TDD: 2 tests) | `971169e` | ✅ |
| 0.4 review fixups (richer error message) | `fa8206c` | ✅ |

`npm run typecheck` and `npm test` (3 tests) both pass.

### Phase 1 — DB & Schema ✅ COMPLETE (Tasks 1.1+1.2+1.3 combined, 1 commit)

| Task | Commit | Status |
|---|---|---|
| 1.1 Drizzle client + drizzle-kit config | `2831eb6` | ✅ |
| 1.2 NextAuth schema (`auth.ts`) | `2831eb6` | ✅ |
| 1.3 Domain schema + first migration | `2831eb6` | ✅ |

Files: `drizzle.config.ts`, `src/lib/db/{client,schema/auth,schema/domain,schema/index}.ts`, `src/lib/db/migrations/0000_thick_absorbing_man.sql` (119 lines, 8 tables) + meta. Generation worked; **migration not yet applied** (no live Postgres in this env).

**Forward-looking cleanups flagged in review** (deferred — see Pending below):
- Drop redundant `favorites_user_idx` (covered by leftmost prefix of `favorites_user_platform_handle_uniq`).
- Add comment to `src/lib/db/client.ts:6` documenting `loadEnv()` fail-fast intent at module import.

### Phase 2 — Auth ✅ COMPLETE (4 tasks, 5 commits)

| Task | Commit | Status |
|---|---|---|
| 2.1 NextAuth + Drizzle adapter | `c2975c3` | ✅ |
| 2.1 review fix-ups (wire `NEXTAUTH_SECRET`, drop `as any` via module augmentation in `src/types/next-auth.d.ts`) | `b672945` | ✅ |
| 2.2 /login page + (auth) layout | `0e94393` | ✅ |
| 2.3 (app) layout session-guarded + nav | `e0a059a` | ✅ |
| 2.4 requireSession + json4xx/5xx helpers | `570ce03` | ✅ |

`npm run typecheck` and `npm test` (3 tests) pass after each commit. Manual browser sign-in verification (Tasks 2.2 / 2.3) deferred — no live Google OAuth creds in this sandbox; covered by Phase 7 Playwright e2e.

**Notable deviation in 2.3:** added one-line stubs at `src/app/(app)/groups/page.tsx` and `src/app/(app)/add/page.tsx` to satisfy `experimental.typedRoutes: true` (the spec'd nav uses `<Link href="/groups">` / `<Link href="/add">`). Both stubs will be replaced by Tasks 6.4 and 6.5.

### Phase 3 — Adapters ⚙️ NEXT
- 3.1 Adapter types + getAdapter
- 3.2 Codeforces adapter (TDD with mocked fetch)
- 3.3 AtCoder adapter (TDD)

### Phase 4 — Cache ⏳ NOT STARTED
- 4.1 `profile-cache.ts` (TTL 10min, SWR, force, integration tests vs real Postgres)

### Phase 5 — API Routes ⏳ NOT STARTED
- 5.1 GET /api/profiles + force rate-limit
- 5.2 /api/groups CRUD
- 5.3 /api/favorites CRUD
- 5.4 IDOR auth tests

### Phase 6 — UI ⏳ NOT STARTED
- 6.1 HandleCard pure component
- 6.2 Dashboard server component
- 6.3 DashboardClient + React Query refresh
- 6.4 /groups page
- 6.5 /add favorite flow
- 6.6 Handle detail page

### Phase 7 — E2E + CI ⏳ NOT STARTED
- 7.1 Playwright happy-path scenario (with adapter intercept)
- 7.2 GitHub Actions CI workflow

## Pending non-task items

1. **Forward-looking cleanup** (Task 1.1–1.3 review):
   - Delete `favorites_user_idx` from `src/lib/db/schema/domain.ts:34`. Re-run `npm run db:generate`. (Since no DB has been migrated yet, regenerating `0000_*.sql` is preferred over a `0001` add-migration.)
   - Add a one-line comment in `src/lib/db/client.ts:6` documenting that `loadEnv()` is intentionally fail-fast at module load.
   - Pick this up before any production data is loaded; a single small commit is enough.

2. **Phase 5 entry bundle** (one commit, ~30 LOC, surfaced by Phase 2 holistic review):
   - `middleware.ts` matching `/api/:path*` (excluding `/api/auth/*`) that runs `auth()` and rejects unauthenticated requests at the edge — belt to `requireSession()`'s suspenders, prevents accidental missing `requireSession` call in a future route handler.
   - `withAuth(handler)` wrapper around `requireSession()` so route handlers become `export const GET = withAuth(async (req, { userId }) => { ... })` — eliminates the repeated `if (!session) return json401()` preamble. Also a single place to add request logging / rate-limit hooks.
   - Add `json403` and `json429` helpers to `src/lib/api/errors.ts`.
   - Tighten `Body.error` from `string` to a string-literal union (`type ErrorCode = "unauthorized" | "not_found" | "validation_failed" | ...`) to prevent error-string drift.
   - Drop the redundant defensive cast at `src/lib/api/session.ts:5`. Module augmentation in `src/types/next-auth.d.ts` already types `session.user.id`. Simplify to `if (!session?.user?.id) return null;` and `userId: session.user.id`.
   - Land all of the above as one commit at the start of Phase 5, before Task 5.1 implementation.

3. **`.env.local`** has placeholder credentials. To actually run `npm run dev` you need real `GOOGLE_CLIENT_ID`/`SECRET` (Google Cloud Console → OAuth credentials), `NEXTAUTH_SECRET` (`openssl rand -base64 32`), and a working Postgres on `DATABASE_URL`.

## Resuming in a fresh session — exact recipe

1. **Read context** in this order:
   - This `progress.md` (current state).
   - `docs/superpowers/specs/2026-04-29-ps-hub-design.md` (spec).
   - `docs/superpowers/plans/2026-04-29-ps-hub-mvp.md` (plan; jump to the next task).
   - Memory files at `C:\Users\User\.claude\projects\C--Users-User-Desktop-github-ps-hub\memory\` (push-after-each-task feedback, remote info).

2. **Verify state:**
   ```bash
   git status                  # should be clean (only `.omc/`, `docs/`, modified `next-env.d.ts` are untracked/uncommitted noise)
   git log --oneline -10       # confirm last commit is 570ce03 (`feat(api): session + error helpers`)
   npm run typecheck           # PASS
   npm test                    # 3 tests PASS
   git remote -v               # origin = https://github.com/hdh4952/ps-hub.git
   ```

3. **Re-invoke the workflow skill:**
   ```
   /superpowers:subagent-driven-development
   ```
   then continue from Task 3.1 (Phase 3 — Adapters: types + getAdapter, then Codeforces TDD, then AtCoder TDD).

4. **Pattern to repeat for every remaining task:** see "Workflow protocol" above. Do not skip the spec review or push step.

5. **When all 7 phases finish:** dispatch a final whole-tree code reviewer, then run the `superpowers:finishing-a-development-branch` skill.

## Key contracts to keep stable across sessions

- **Branch:** all work goes on `main`; push after every task.
- **Commit messages:** follow the plan's exact strings (e.g. `feat(auth): NextAuth Google OAuth + Drizzle adapter`). Cleanup commits use `refactor(...)` or `chore: address task X.X review`.
- **Type & test gates:** `npm run typecheck` and `npm test` must pass at the end of every task. (DB-dependent integration tests landing in Phase 4+ will need a live Postgres; document if blocked.)
- **TDD:** Phase 3+ tasks specify failing-test-first. Don't shortcut.
- **No agent self-approval:** spec reviewer and code-quality reviewer are separate dispatches.
- **Visual companion:** user accepted but server bind was denied earlier; for visual questions, propose terminal-only first or re-ask permission.
