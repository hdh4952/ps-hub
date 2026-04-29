# ps-hub — Progress Handoff

> Read this file in a fresh session to pick up exactly where work stopped.
> Last updated: 2026-04-29 (Phase 4 complete; Phase 5 next).

## TL;DR for the next session

- ✅ **Phases 0–4 complete.** Bootstrap, DB schema, NextAuth, Codeforces+AtCoder adapters, profile-cache (TTL+SWR+force).
- ✅ **Postgres provisioned** on Neon (`ap-southeast-1`). Two databases (`neondb` for app, `pshub_test` for integration tests). Both reachable; URLs in `.env.local`.
- ✅ **`npm test` → 18/18 pass** (11 unit + 7 profile-cache integration). `npx tsc --noEmit` clean. Push-after-each-task discipline maintained throughout.
- ⚙️ **Next**: Phase 5 entry bundle (Pending #1 below — middleware, `withAuth`, `json403/429`, `ErrorCode` literal union, `session.ts` cleanup — 1 commit, ~30 LOC), then Task 5.1 (`GET /api/profiles/[platform]/[handle]` + force rate-limit).
- 🟡 **Open notes**: `rankLabel` casing nit deferred to Phase 6.1; OAuth/`NEXTAUTH_SECRET` still placeholders (only blocks `npm run dev` in browser, not tests); Neon DB password should be rotated since it was shared in chat during setup.

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
- **Postgres:** **Neon** (`ap-southeast-1`). Two databases:
  - `neondb` — main app DB. `DATABASE_URL` in `.env.local`. 8 tables migrated.
  - `pshub_test` — integration test DB. `TEST_DATABASE_URL` in `.env.local`. `tests/helpers/db.ts:createTestDb` runs `migrate()` idempotently on first use.
  - Migration: `0000_melted_mesmero.sql` (post-fix-up). All 8 tables: `accounts`, `sessions`, `users`, `verificationToken`, `groups`, `favorites`, `favorite_groups`, `cached_profiles`.
  - No native `psql`. Verify state via `node -e "require('postgres')(...)..."` one-liners. Drizzle config (`drizzle.config.ts`) loads `.env.local` first, falls back to `.env`. Vitest setup (`tests/setup.ts`) does the same and asserts `TEST_DATABASE_URL` is set.
  - OAuth secrets (`GOOGLE_CLIENT_ID/SECRET`, `NEXTAUTH_SECRET`) still `xxx` placeholders — required before `npm run dev` works in a browser.
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

### Phase 1 — DB & Schema ✅ COMPLETE (Tasks 1.1+1.2+1.3 combined, 1 commit + 2 follow-ups)

| Task | Commit | Status |
|---|---|---|
| 1.1 Drizzle client + drizzle-kit config | `2831eb6` | ✅ |
| 1.2 NextAuth schema (`auth.ts`) | `2831eb6` | ✅ |
| 1.3 Domain schema + first migration | `2831eb6` | ✅ |
| Phase 1 review fix-ups (drop redundant `favorites_user_idx`, fail-fast comment, regen migration → `0000_melted_mesmero.sql`) | `fe1e0d0` | ✅ |
| `drizzle.config.ts` loads `.env.local` like Next.js | `a0bc070` | ✅ |
| Migration applied to Neon (8 tables verified) | n/a — env action | ✅ |

Files: `drizzle.config.ts`, `src/lib/db/{client,schema/auth,schema/domain,schema/index}.ts`, `src/lib/db/migrations/0000_melted_mesmero.sql` (post-cleanup, 8 tables) + meta.

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

### Phase 3 — Adapters ✅ COMPLETE (2 commits)

| Task | Commit | Status |
|---|---|---|
| 3.1 Adapter types + getAdapter | `0731e43` (folded in) | ✅ |
| 3.2 Codeforces adapter (TDD, 4 tests, real fixtures) | `0731e43` | ✅ |
| 3.3 AtCoder adapter (TDD, 4 tests, real fixture) + `index.ts` finalized | `1530fce` | ✅ |

`npm run typecheck` clean, `npm test` 11/11 pass after each commit (3 prior + 4 codeforces + 4 atcoder).

**Notable deviation in 3.1:** plan-verbatim `index.ts` registers both adapters, but `atcoder.ts` doesn't exist until 3.3 — would have left the tree with broken imports. Workaround: 3.1+3.2's `index.ts` shipped as `Partial<Record<Platform, PlatformAdapter>>` registering only codeforces, with `getAdapter` throwing `adapter not implemented: <platform>` for atcoder. 3.3 then dropped the `Partial<>`/throw and adopted the plan-final `Record<...>` shape. Each commit's typecheck stays clean.

**Fixtures captured live** (no need to re-run): tourist's CF userinfo + 302-entry rating history, AtCoder's 140-entry contest history. All under `src/lib/adapters/__fixtures__/`.

**Forward-looking nit flagged in 3.1+3.2 review** (deferred to UI phase — see Pending below):
- `src/lib/adapters/codeforces.ts` `rankLabel` returns raw CF casing (e.g. `"legendary grandmaster"`) but the fallback string is title-case `"Newbie"`. Inconsistent. Either lowercase the fallback or title-case in the UI render layer (Phase 6 — `HandleCard`).

### Phase 4 — Cache ✅ COMPLETE (1 task, 2 commits)

| Task | Commit | Status |
|---|---|---|
| 4.1 `profile-cache.ts` (TTL 10min, SWR, force, 6-test integration suite vs Neon `pshub_test`) | `2dba150` | ✅ |
| 4.1 review fix-ups (mock placement → `beforeAll`, `ERROR_TTL_MS = 30s`, `verificationToken` truncate, `_resetNowForTest`, drop `as unknown as object` cast, +1 test) | `a2b5f60` | ✅ |

`npm test` 18/18 pass (11 unit + 7 profile-cache integration). `npx tsc --noEmit` clean. Integration runtime ~5s on Neon (`ap-southeast-1`).

**Notable deviations from plan-verbatim** (all driven by the Neon/Next.js delta — none compromise spec intent):
1. `vitest.config.ts` uses `setupFiles: ["./tests/setup.ts"]` instead of `["dotenv/config"]`. The custom setup file loads `.env.local` first (Next.js convention) and asserts `TEST_DATABASE_URL` is present.
2. Test DB on Neon: `pshub_test` database created via `CREATE DATABASE` issued from postgres-js (no Docker available). `TEST_DATABASE_URL` shares the same Neon endpoint as `DATABASE_URL`, only the path differs (`/neondb` vs `/pshub_test`).
3. Test assertions use camelCase property names (`r.fetchStatus`, `r.currentRating`) — plan had snake_case which would have been a runtime bug since Drizzle's `.returning()` keys by TS field name, not column name.
4. Added `afterAll(() => testDb.sql.end())` (plan omitted; prevents hung connections).
5. **Fix-up commit additions**: `ERROR_TTL_MS = 30s` distinct from happy-path `TTL_MS = 10min` — error rows expire fast so transient upstream failures don't block a handle for 10 minutes. Covered by a new 7th test.

### Phase 5 — API Routes ⚙️ NEXT
- (Pending bundle below — middleware + `withAuth` + `json403`/`json429` + `ErrorCode` literal union — lands as 1 commit at start of Phase 5.)
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

1. **Phase 5 entry bundle** (one commit, ~30 LOC, surfaced by Phase 2 holistic review):
   - `middleware.ts` matching `/api/:path*` (excluding `/api/auth/*`) that runs `auth()` and rejects unauthenticated requests at the edge — belt to `requireSession()`'s suspenders, prevents accidental missing `requireSession` call in a future route handler.
   - `withAuth(handler)` wrapper around `requireSession()` so route handlers become `export const GET = withAuth(async (req, { userId }) => { ... })` — eliminates the repeated `if (!session) return json401()` preamble. Also a single place to add request logging / rate-limit hooks.
   - Add `json403` and `json429` helpers to `src/lib/api/errors.ts`.
   - Tighten `Body.error` from `string` to a string-literal union (`type ErrorCode = "unauthorized" | "not_found" | "validation_failed" | ...`) to prevent error-string drift.
   - Drop the redundant defensive cast at `src/lib/api/session.ts:5`. Module augmentation in `src/types/next-auth.d.ts` already types `session.user.id`. Simplify to `if (!session?.user?.id) return null;` and `userId: session.user.id`.
   - Land all of the above as one commit at the start of Phase 5, before Task 5.1 implementation.

2. **`rankLabel` casing consistency** (Phase 3 review nit) — Codeforces adapter returns raw CF casing for `rankLabel` (lowercase, e.g. `"legendary grandmaster"`) but the fallback string is title-case (`"Newbie"`). Decide on one casing convention when implementing `HandleCard` in Task 6.1; either normalize in the adapter or title-case at render time. Single-line change either way.

3. **`.env.local` OAuth + auth secrets** — `DATABASE_URL` is real (Neon). `GOOGLE_CLIENT_ID/SECRET` and `NEXTAUTH_SECRET` are still `xxx` placeholders. Required before `npm run dev` succeeds in a browser; not blocking for unit tests or DB integration tests. Generate `NEXTAUTH_SECRET` via `openssl rand -base64 32`; OAuth creds via Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application, redirect `http://localhost:3000/api/auth/callback/google`).

4. **Neon credential rotation** — the `DATABASE_URL` was shared in chat during setup. Once any production data lands, rotate the DB password from Neon dashboard (Connection Details → Reset password) and update `.env.local`.

## Resuming in a fresh session — exact recipe

1. **Read context** in this order:
   - This `progress.md` (current state).
   - `docs/superpowers/specs/2026-04-29-ps-hub-design.md` (spec).
   - `docs/superpowers/plans/2026-04-29-ps-hub-mvp.md` (plan; jump to the next task).
   - Memory files at `C:\Users\User\.claude\projects\C--Users-User-Desktop-github-ps-hub\memory\` (push-after-each-task feedback, remote info).

2. **Verify state:**
   ```bash
   git status                  # should be clean (only `.omc/`, `docs/`, modified `next-env.d.ts` are untracked/uncommitted noise)
   git log --oneline -10       # head should be the most recent `docs: progress.md — …` commit; cross-check the SHA against the Phase status table above
   npm run typecheck           # PASS
   npm test                    # 18 tests PASS (11 unit + 7 profile-cache integration)
   git remote -v               # origin = https://github.com/hdh4952/ps-hub.git
   # Both Postgres DBs reachable on Neon (URLs listed in `.env.local`, gitignored):
   node -e "require('dotenv').config({path:'.env.local'});const s=require('postgres')(process.env.DATABASE_URL,{max:1});s\`SELECT count(*) FROM information_schema.tables WHERE table_schema='public'\`.then(r=>{console.log('main tables:',r[0].count);return s.end();}).catch(e=>{console.error(e.message);process.exit(1);})"
   # → main tables: 8
   node -e "require('dotenv').config({path:'.env.local'});const s=require('postgres')(process.env.TEST_DATABASE_URL,{max:1});s\`SELECT count(*) FROM information_schema.tables WHERE table_schema='public'\`.then(r=>{console.log('test tables:',r[0].count);return s.end();}).catch(e=>{console.error(e.message);process.exit(1);})"
   # → test tables: 9 (8 schema + drizzle's _drizzle_migrations ledger)
   ```

3. **Re-invoke the workflow skill:**
   ```
   /superpowers:subagent-driven-development
   ```
   then continue from the **Phase 5 entry bundle** (Pending #1 below — one commit, ~30 LOC: middleware, `withAuth`, `json403`/`json429`, `ErrorCode` literal union, `session.ts` cast cleanup), then Task 5.1 (`GET /api/profiles/[platform]/[handle]` with force + rate-limit).

4. **Pattern to repeat for every remaining task:** see "Workflow protocol" above. Do not skip the spec review or push step.

5. **When all 7 phases finish:** dispatch a final whole-tree code reviewer, then run the `superpowers:finishing-a-development-branch` skill.

## Key contracts to keep stable across sessions

- **Branch:** all work goes on `main`; push after every task.
- **Commit messages:** follow the plan's exact strings (e.g. `feat(auth): NextAuth Google OAuth + Drizzle adapter`). Cleanup commits use `refactor(...)` or `chore: address task X.X review`.
- **Type & test gates:** `npm run typecheck` and `npm test` must pass at the end of every task. (DB-dependent integration tests landing in Phase 4+ will need a live Postgres; document if blocked.)
- **TDD:** Phase 3+ tasks specify failing-test-first. Don't shortcut.
- **No agent self-approval:** spec reviewer and code-quality reviewer are separate dispatches.
- **Visual companion:** user accepted but server bind was denied earlier; for visual questions, propose terminal-only first or re-ask permission.
