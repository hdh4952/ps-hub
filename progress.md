# ps-hub — Progress Handoff

> Read this file in a fresh session to pick up exactly where work stopped.
> Last updated: 2026-05-01 (Phase 7 ✅ COMPLETE — Task 7.2 GitHub Actions CI shipped plan-verbatim with no review fix-ups needed. Next: final whole-tree code review + `superpowers:finishing-a-development-branch`).

## TL;DR for the next session

- ✅ **All 7 phases complete.** Bootstrap, DB schema, NextAuth, Codeforces+AtCoder adapters, profile-cache (TTL+SWR+force), four API route tasks, all six UI tasks, single-scenario Playwright happy-path e2e (`d4ae9ec`+`82d201b`), and now GitHub Actions CI (`2226e83`) — postgres:16 service container, dual-DB migrate (`pshub` + `pshub_test`), `drizzle-kit check` for schema-drift, typecheck, `npm test`, Playwright install + e2e, all gated on push-to-main and pull_request.
- 🎯 **Phase 6/7.1 pattern (established) DID NOT REPEAT for 7.2**: plan-verbatim ship at `2226e83` was approved by code-quality review with **zero Critical / zero Important** issues. The 4 reviewer observations (no failure-artifact upload, no `concurrency:` group, action `@v4` tag-pinning vs SHA, eventual `${{ secrets.* }}` migration when non-E2E jobs land) were explicitly deferred to a separate future "CI hardening" PR rather than retroactively folded — preserves the spec-compliance audit trail. **No 7.2 fix-up commit exists.**
- ✅ **Postgres provisioned** on Neon (`ap-southeast-1`). Two databases (`neondb` for app, `pshub_test` for integration tests). Both reachable; URLs in `.env.local`. CI uses its own `postgres:16` service container with `pshub` + `pshub_test`, fully decoupled from Neon. **Note**: local e2e currently writes to `neondb` (the `webServer` runs `npm run dev`, which uses `DATABASE_URL`); seed cleans `favorites`/`groups`/`favorite_groups` for `e2e-user` before each run so re-runs are idempotent.
- ✅ **`npm test` → 36/36 pass** (11 unit + 7 profile-cache integration + 6 profiles route + 5 groups + 6 favorites + 1 authz IDOR). **`npm run e2e` → 1/1 pass** (~15s). `npx tsc --noEmit` **clean** (verified with `; echo $?` since `| tail` masks tsc's exit code — see feedback_tsc_exit_code.md memory). Push-after-each-task discipline maintained throughout.
- ⏭️ **Next**: dispatch a final whole-tree code reviewer subagent (read full diff `<initial-commit>..main`, check for whole-tree consistency / dead code / stale comments / cross-task design drift), then run `superpowers:finishing-a-development-branch` to decide merge/PR strategy. Branch is currently `main`; this project ran linearly on `main` per `subagent-driven-development` consent rules, so "finishing" is mostly choosing whether to tag a release, open a retrospective PR for record, or just declare done.
- 🟡 **Open notes** (carry forward from earlier phases — none of these were introduced by Task 7.2): OAuth/`NEXTAUTH_SECRET` still `xxx` placeholders in `.env.local` (only blocks `npm run dev` in a real browser, not tests/CI); Neon DB password should be rotated since it was shared in chat during setup; `isUniqueViolation` duplicated in 2 route files (extract on next caller); `as any` casts on `lastContests`/`fetchStatus` in `dashboard/page.tsx` deferred backlog; `Parameters<typeof authMiddleware>[0]` narrower-cast attempt failed under NextAuth's `(req, event)` 2-arg signature so middleware retains a narrower-typed cast; e2e happy-path lacks AtCoder leg + filter/delete steps; **new (CI hardening backlog)**: failure-artifact upload + `concurrency:` group + action SHA-pinning + `${{ secrets.* }}` migration once non-E2E CI jobs land.

## This session's commits (2026-05-01) — Phase 6 close-out

12 commits landed on `main`, all pushed to `origin/main` per project's push-after-each-task discipline. Listed newest → oldest. HEAD is `30d87dd`.

| SHA | Message | Lane |
|---|---|---|
| `30d87dd` | docs: progress.md — Task 6.6 done + Phase 6 ✅ COMPLETE; Phase 7 (e2e + CI) next | docs |
| `0508522` | chore: address Task 6.6 review (gate name color + surface error fetchStatus) | 6.6 fix-up |
| `9043f31` | feat(ui): handle detail page | 6.6 |
| `18ef42b` | docs: progress.md — Task 6.5 done (with form network catch + PATCH failure surface fix-up); Task 6.6 next | docs |
| `79343cf` | chore: address Task 6.5 review (form network catch + PATCH failure surface) | 6.5 fix-up |
| `88e4206` | feat(ui): /add favorite flow | 6.5 |
| `bdb8149` | docs: progress.md — Task 6.4 done (with form/delete error-handling fix-up); Task 6.5 next | docs |
| `38a4131` | chore: address Task 6.4 review (form + delete error handling) | 6.4 fix-up |
| `ffef053` | feat(ui): /groups CRUD page | 6.4 |
| `0745e82` | docs: progress.md — Tasks 6.2/6.3 done (with polish + review fix-ups); Task 6.4 next | docs |
| `9655d07` | chore: address Task 6.2/6.3 review (hydration safety + SWR error surface) | 6.2/6.3 fix-up |
| `342f8a5` | chore(ui): dashboard polish (typed selects + active "added" sort + empty-cache fallback) | 6.2/6.3 polish |

**Verification at HEAD `30d87dd`:** `npx --no-install tsc --noEmit; echo $?` → `EXIT=0`. `npm test` → `36 passed (36)` in ~27s. `git status` clean (only `.omc/` and `docs/` untracked, both intentional). `git log` head-of-line matches the table.

**Phase 6 fix-up pattern (now established baseline):** every UI task shipped plan-verbatim first, then a focused fix-up commit addressed Important findings from the code-quality review. The recurring categories — silent failures (delete, PATCH, refresh), missing in-flight guards, network-error crashes, redirect-after-orphaned-state, rankColor leak onto degraded views, missing `error` fetchStatus UI surface — are the canonical gaps to look for in any future client-component touch.

## This session's continuation commits (2026-05-01) — Task 7.1

Two more commits landed on `main` after `2a2f9b8`. HEAD is `82d201b`.

| SHA | Message | Lane |
|---|---|---|
| `82d201b` | chore: address Task 7.1 review (E2E bypass prod guard + seed cleanup + middleware cast + selector tighten) | 7.1 fix-up |
| `d4ae9ec` | test(e2e): playwright happy-path with intercepted upstream | 7.1 |

**Verification at HEAD `82d201b`:** `tsc EXIT=0`, `npm test → 36 passed`, `npm run e2e → 1 passed (15.1s)`. `git status` clean (only `.omc/` and `docs/` untracked).

## This session's continuation commits (2026-05-01) — Task 7.2

One commit landed on `main` after `64dd474`. HEAD is `2226e83`.

| SHA | Message | Lane |
|---|---|---|
| `2226e83` | ci: typecheck + tests + e2e + drizzle check | 7.2 |

**Verification at HEAD `2226e83`:** `tsc EXIT=0`, `npm test → 36 passed`, `git status` clean (only `.omc/` and `docs/` untracked). The CI workflow itself can't be exercised locally — first real verification is the next push to `main` or PR open against `main`. Pre-merge confidence comes from (a) plan-verbatim file, (b) spec compliance review confirming byte-for-byte match with plan, (c) code-quality review confirming all watch-outs (NODE_ENV guardrail dormancy, integration tests mocking `requireSession`, `package-lock.json` presence, `psql` runner availability, fail-fast default, secret hygiene) are satisfied.

**No 7.2 fix-up commit.** First task in Phase 6 / Phase 7 to ship without one — both reviews approved on first pass with zero Critical or Important issues.

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

**Forward-looking nit flagged in 3.1+3.2 review** — RESOLVED before Phase 6: `src/lib/adapters/codeforces.ts` now title-cases `rankLabel` via a small `toTitleCase` helper. CF returns lowercase (`"legendary grandmaster"`); adapter normalizes to spec convention (`"Legendary Grandmaster"`). Locked in by `tests/unit/adapters/codeforces.test.ts` assertion.

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

### Phase 5 — API Routes ✅ COMPLETE

| Task | Commit | Status |
|---|---|---|
| Phase 5 entry bundle (middleware + `withAuth` + `json403`/`json429` + `ErrorCode` union + `session.ts` cleanup) | `034f30e` | ✅ |
| Phase 5 entry bundle review fix-ups (matcher anchored on `auth/`, middleware reuses `json401()`, `withAuth` default `TCtx`, `AuthContext` typed via `Session["user"]`) | `f64204b` | ✅ |
| 5.1 GET /api/profiles + force rate-limit | `c7a9ec6` | ✅ |
| 5.1 review fix-ups (error logging, `fetchStatus === "error"` no-payload → 500, `?force=true` accepted, +2 tests) | `2722a5b` | ✅ |
| Test isolation fix (`fileParallelism: false` — Neon `pshub_test` truncate-vs-write race between profile-cache + profiles test files) | `4a8fa72` | ✅ |
| 5.2 /api/groups CRUD (collection GET/POST + member PATCH/DELETE; +`invalid_body`/`name_exists` to `ErrorCode`; 3 integration tests) | `644f223` | ✅ |
| 5.2 review fix-ups (UUID zod validation on `[id]` params before DB; DELETE wrapped in try/catch with `console.error`; +2 tests) | `694755f` | ✅ |
| 5.3 /api/favorites CRUD (collection GET/POST with handle validation via `getProfile` + member PATCH alias/note/groupIds + DELETE; +`invalid_group_ids` to `ErrorCode`; 4 integration tests) | `5d509de` | ✅ |
| 5.3 review fix-ups (PATCH multi-step writes wrapped in `db.transaction` with `InvalidGroupIdsError` sentinel; per-user 5s rate limit on POST `/api/favorites` via `src/lib/rate-limit/favorite-add.ts`; profile-cache.test.ts `afterEach` → `beforeEach` truncate to fix latent state-leak between integration test files; +2 tests) | `56dbcb0` | ✅ |
| 5.4 IDOR auth test (`tests/integration/api/authz.test.ts` — user B POSTs a favorite, user A DELETEs it → must 404; guards `WHERE userId = session.userId` contract on DELETE handler) | `715b74a` | ✅ |

`npx tsc --noEmit` clean, `npm test` 36/36 pass after each commit.

**Notable deviations / decisions in Phase 5 so far:**
1. **`withAuth` adopted in Tasks 5.1/5.2/5.3.** The plan-verbatim tasks use `requireSession()` + `json401()` inline; we replaced with `withAuth<Ctx>(...)` since the entry bundle exists specifically to standardize this. Spec compliance reviews PASSED — `withAuth` calls `requireSession()` internally, and the test mock pattern (`vi.mock("@/lib/api/session", ...)`) still works.
2. **`?force=true` accepted (Task 5.1 review fix-up).** Plan accepted only `?force=1`. Front-end devs writing `?force=true` would silently get a non-force response. Now both `"1"` and `"true"` opt in; other values are ignored.
3. **`fetchStatus === "error"` with `displayName === null` → 500 (Task 5.1 review fix-up).** Plan would have returned 200 with all-null fields when the cache layer wrote a brand-new error row (transient upstream failure with no prior cache). Now surfaces as 500 with `error: "internal_error"` so the client doesn't render an empty card. Stale rows still flow through 200 (preserving spec's "stale > empty" rule).
4. **`fileParallelism: false` in `vitest.config.ts`.** Both `tests/integration/cache/profile-cache.test.ts` and `tests/integration/api/profiles.test.ts` share the Neon `pshub_test` DB and call `truncateAll`. With default file parallelism, they raced and one file's truncate wiped rows another file just inserted. Total integration runtime grows from ~7s to ~22s with all 5 integration files; correctness > speed.
5. **`isUniqueViolation` helper inlined in each route (Task 5.2).** The plan used `e: any` (type-unsafe) for unique-violation detection. Replaced with a typed `isUniqueViolation(err: unknown): boolean` helper using safe narrowing. Currently duplicated across `groups/route.ts` and `favorites/route.ts`; will extract to `src/lib/db/errors.ts` when a third caller appears.
6. **UUID zod validation on dynamic `[id]` params (Task 5.2 review fix-up).** Plan passed raw path segments to `eq(table.id, id)`, which raises Postgres `invalid input syntax for type uuid` on non-UUID input — surfacing as a misleading 500. All `[id]` route handlers now validate with `z.object({ id: z.string().uuid() })` first and return 400 `invalid_params` on failure.
7. **DELETE handlers wrapped in try/catch with `console.error` (Task 5.2 review fix-up).** Plan's DELETE handlers had no error handling, so DB errors propagated as unhandled rejections with no log line. All DELETE handlers now match the POST/PATCH error logging pattern.
8. **`allowFavoriteAdd` per-user rate limit on POST `/api/favorites` (Task 5.3 review fix-up).** Plan had no rate limit on the POST path that calls `getProfile()`; an authenticated attacker could amplify upstream traffic and pollute `cached_profiles` with arbitrary handles. Added a 5-second per-user debounce mirroring `force-refresh.ts`. The duplicate-handle test resets the limiter inline between its two POSTs so it still exercises the 409 case-insensitive duplicate path.
9. **PATCH `/api/favorites/[id]` wrapped in `db.transaction` (Task 5.3 review fix-up).** Plan ran UPDATE favorite + DELETE favoriteGroups + INSERT favoriteGroups as separate statements; partial failure left state half-applied. Now atomic. Uses an `InvalidGroupIdsError` sentinel to propagate the controlled 400 path out of the tx callback (sentinel throw triggers transaction rollback, which is desired — don't apply alias/note updates if groupIds are bad).
10. **profile-cache.test.ts switched from `afterEach` to `beforeEach` truncate (Task 5.3 review fix-up).** Latent bug surfaced when favorites tests started writing more cache rows: profile-cache.test.ts's first test inherited leftover state from the previous integration file. Now every integration test file uses `beforeEach` truncate, guaranteeing each test starts from a clean DB regardless of file order.
11. **Task 5.4 plan-verbatim glue augmented to match repo conventions.** Plan-verbatim test omitted (a) `vi.doMock("@/lib/db/client", () => ({ db: testDb.db, sql: testDb.sql }))` inside `beforeAll` — without this the route would query production `DATABASE_URL`; (b) `afterAll(() => testDb.sql.end())`; (c) `_resetForTest()` for the favorite-add rate limiter inside `beforeEach`; (d) `{} as never` second arg to POST to satisfy `withAuth`'s `(req, ctx)` signature. All four mirror the established `tests/integration/api/favorites.test.ts` pattern. Spec compliance review confirmed these are pre-authorized, code quality review APPROVED with no Critical/Important issues.

### Phase 6 — UI ✅ COMPLETE

| Task | Commit | Status |
|---|---|---|
| 6.1 HandleCard pure presentational component (`src/app/(app)/_components/HandleCard.tsx`) + one-line typedRoutes stub at `src/app/(app)/handles/[platform]/[handle]/page.tsx` (Phase 2.3 precedent — Task 6.6 will replace) | `4c04c10` | ✅ |
| Phase 5 latent withAuth typing fix surfaced during Task 6.1 (`DefaultRouteCtx.params` was `?` optional but Next 15 generated route types require non-optional `Promise<any>`; collection routes GET/POST in `favorites/route.ts` and `groups/route.ts` failed `.next/types/...` typecheck once `next build` ran) | `b0bdc13` | ✅ |
| 6.1 review fix-up (gate name color on `fetchStatus === "ok"` — stale rankColor was leaking onto displayName text over red-50/amber-50 status backgrounds; computed `nameColor` once at component top, applied to both name and rating value) | `6e96db2` | ✅ |
| 6.2 + 6.3 bundled (cache-first SSR dashboard + React Query SWR refresh + `@tanstack/react-query` dep + `Providers` wrapper in root layout). Plan explicitly defers 6.2's commit until 6.3 implements DashboardClient. | `4cb5e37` | ✅ |
| 6.2/6.3 polish on top before review (typed select handlers + aria-labels; "added" sort actually sorts by `createdAt` desc — was no-op `return 0`; empty-cache row defaults `fetchStatus: "error"` so HandleCard renders amber "retrying…" instead of misleading "0 / max 0 · null"; `next-env.d.ts` doc-URL refresh) | `342f8a5` | ✅ |
| 6.2/6.3 review fix-ups (RefreshingCard defers `Date.now()` to `useEffect` to eliminate hydration mismatch when `fetchedAt` near TTL boundary; useQuery error path downgrades `fetchStatus` to `"error"` so card surfaces refresh failures instead of silently keeping stale "ok" badge; explicit `staleTime: TTL_MS` on per-card query so 10-min TTL intent is self-documenting; drop `as any` cast on `fetchStatus` prop) | `9655d07` | ✅ |
| 6.4 /groups CRUD UI (`groups/page.tsx` server component, `GroupForm.tsx` POST + `GroupList.tsx` DELETE; replaces Phase 2.3 stub) | `ffef053` | ✅ |
| 6.4 review fix-ups (GroupForm: in-flight guard + `disabled={submitting}` to block double-submit `name_exists` race; try/catch around fetch + nested try/catch around `.json()` so network failures and non-JSON 5xx bodies surface as `network_error` instead of crashing the error boundary; explicit `Content-Type: application/json` header. GroupList: extract `DeleteButton` sub-component with own in-flight + per-row error state; check `res.ok` before `r.refresh()` so rejected deletes surface inline next to the row instead of silently leaving stale UI) | `38a4131` | ✅ |
| 6.5 /add favorite flow (`add/page.tsx` server component lists user's groups; `AddFavoriteForm.tsx` client component POSTs to `/api/favorites` with optional PATCH for `groupIds`; replaces Phase 2.3 stub) | `88e4206` | ✅ |
| 6.5 review fix-ups (AddFavoriteForm: outer try gains a catch so network failure on either fetch surfaces as `network_error` instead of leaving the form re-enabled with no signal — mirrors `38a4131`; PATCH `/api/favorites/[id]` now checks `res.ok` and on failure surfaces `"favorite added; group assignment failed: ..."` inline and keeps the user on /add — previous unconditional `router.push("/dashboard")` masked silently-orphaned favorites; drop `as any` cast on platform select per `342f8a5` convention; add `Content-Type: application/json` header to both fetches per `38a4131` consistency) | `79343cf` | ✅ |
| 6.6 Handle detail page (`handles/[platform]/[handle]/page.tsx` server component, calls `getProfile()` directly cache-first SSR, renders header + recent contests table; replaces Task 6.1 typedRoutes stub) | `9043f31` | ✅ |
| 6.6 review fix-ups (gate `nameColor` on `fetchStatus === "ok"` for both `<h1>` and `<strong>` rating to prevent stale `rankColor` leak from prior successful fetch onto degraded view — mirrors `6e96db2`; surface `error` fetchStatus with three-state branching: `error+stale-data` shows amber banner above header with last-cached timestamp + neutral colors, `error+no-data` returns standalone amber error block, `ok`/`not_found` unchanged — mirrors `9655d07` "stale > empty" rule) | `0508522` | ✅ |

**Notable deviations / decisions in Phase 6 so far:**
1. **Pre-authorized typedRoutes stub at `src/app/(app)/handles/[platform]/[handle]/page.tsx`.** HandleCard renders `<Link href={`/handles/${p.platform}/${p.handle}`}>`. With `experimental.typedRoutes: true`, Next requires the route segment to exist in the file system. Added a one-line `export default function HandleDetailPage() { return null; }` matching the Phase 2.3 pattern (`/groups`, `/add` stubs). Task 6.6 replaces it with the real handle detail page.
2. **Latent Phase 5 typecheck failure was masked by `tsc | tail` for several commits.** `npx --no-install tsc --noEmit 2>&1 | tail -10` reports tail's exit code, not tsc's. While `.next/types/` was empty (no prior `next build`), the include glob matched nothing and tsc passed vacuously. The implementer ran `next build` to satisfy typedRoutes during Task 6.1, populating `.next/types/app/api/{favorites,groups}/route.ts`, which exposed `withAuth`'s `DefaultRouteCtx.params?: Promise<...>` as incompatible with Next 15's generated `RouteContext` (`params: Promise<any>`, non-optional). Fixed by removing the `?` in `b0bdc13`. Going forward, verify tsc with `; echo "EXIT=$?"` or `${PIPESTATUS[0]}` — saved as `feedback_tsc_exit_code.md` memory.
3. **Task 6.1 reviewer's three Minor items deferred to backlog** (see Pending non-task items below): empty-string alias normalization at API layer; `key={c.date}` vs unique-suffix key; discriminated-union refactor of `HandleCardProps` to eliminate the `?? 0` fallback dead-defense.
4. **6.2 + 6.3 bundled as a single shipping commit (`4cb5e37`)** per plan-verbatim Step 2 of 6.2 ("Defer commit until 6.3 implements DashboardClient"). Spec review confirmed bundling is plan-authorized.
5. **`@tanstack/react-query` resolved at `^5.100.6`** (plan asked for `^5.59.16`; npm picked the latest in the major). Confirmed compatible by spec reviewer; queryKey + `enabled`/`staleTime` API unchanged across the range.
6. **Anticipated polish (`342f8a5`) shipped before formal review** — typed select handlers + aria-labels; "added" sort actually sorts by `createdAt` desc (plan-verbatim was `return 0` no-op); empty-cache row defaults `fetchStatus: "error"` so HandleCard renders amber "retrying…" instead of misleading "0 / max 0 · null" until SWR populates real data; `next-env.d.ts` doc-URL refresh from a stray `next dev`. All changes covered by the spec reviewer's "pre-authorized deviation" findings.
7. **Hydration-safe `RefreshingCard` (`9655d07` review fix-up)** — plan-verbatim computed `isStale` inline via `Date.now()` in render, which SSR runs server-side and the client re-runs on hydration. Near-TTL `fetchedAt` would flip `enabled` between server and client and cause a hydration mismatch on the `useQuery` subtree. Now: `useState<number | null>(null)` initial → `useEffect(() => setNow(Date.now()), [])` post-mount → `isStale` derived. SSR renders with query disabled; client mounts and re-evaluates. Picks up the previously-unused `useEffect` import the plan-verbatim text included.
8. **SWR error path now surfaces in UI (`9655d07`)** — plan-verbatim swallowed `q.isError`: `data` fell back to `item`, and `fetchStatus` kept the SSR row's "ok" badge. Now `q.isError → fetchStatus = "error"` so HandleCard renders the amber "retrying…" state. Pairs with the empty-cache fallback (deviation #6) to make every non-OK state user-visible.
9. **Explicit `staleTime: TTL_MS` on per-card `useQuery` (`9655d07`)** — global Provider `staleTime: 60_000` was already in place, but `RefreshingCard` independently gates by 10-minute TTL via `enabled: isStale`. Setting `staleTime` per-query makes the 10-min intent self-documenting and immune to provider drift. Also dropped the now-unnecessary `as any` cast on the `fetchStatus` prop (replaced with a single `as HandleCardProps["fetchStatus"]`).
10. **`DeleteButton` sub-component extraction in `GroupList.tsx` (`38a4131` review fix-up)** — plan-verbatim inlined the DELETE `onClick` directly on the row's button, with no `res.ok` check, no in-flight guard, and no error surface. Failed deletes (auth expiry, 404, network) silently left the row with no feedback, and rapid double-clicks fired duplicate requests. Now: `DeleteButton` is its own client sub-component (still in the same file, no separate export beyond `GroupList`) holding its own `submitting` and `err: string | null` state; renders inline error span next to the button on failure. Pattern will likely repeat in Tasks 6.5 (/add favorite) and 6.6 (handle detail).
11. **`GroupForm.tsx` defensive error handling (`38a4131` review fix-up)** — plan-verbatim had no in-flight guard (double-submit raced into a confusing `name_exists` after a successful create), no try/catch around fetch (network failures bubbled to React's error boundary), and a bare `(await res.json()).error` (non-JSON 5xx bodies threw on `.json()`). Now: `submitting` boolean state + `disabled={submitting}` on Add button + early return; outer try/catch surfaces network failures as `setErr("network_error")`; nested try/catch around `.json()` falls back to `res.statusText`; explicit `Content-Type: application/json` header folded in (was the spec/code reviewer's acknowledged Minor item).
12. **Task 6.5 PATCH-failure-after-POST-success orphan path (`79343cf` review fix-up)** — plan-verbatim's `AddFavoriteForm` did `await fetch(...PATCH...)` without checking `res.ok` and then unconditionally `router.push("/dashboard")`. If group assignment failed (4xx/5xx or network) the user landed on /dashboard with the favorite created but no groups attached and no signal anything failed — silently orphaning state in a way worse than 6.4's silent DELETE. Reviewer's product call (codified): the favorite is already created, so retry-PATCH is the right UX. Now: PATCH wrapped in its own nested try/catch + `res.ok` check, on failure surfaces `"favorite added; group assignment failed: <code>"` inline and **stays on /add** (no redirect). The two-step POST-then-PATCH structure also lets the outer POST `catch` set `"network_error"` without conflating it with PATCH-failure messaging. Single outer `finally { setBusy(false); }` covers all 6 exit paths.
13. **Task 6.5 outer-`catch` + `as any` cleanup (`79343cf` review fix-up)** — plan-verbatim had no `catch` on the outer try, so `await fetch` rejection (offline, DNS, abort) escaped to React's error boundary with the form left re-enabled and no UI feedback. Now mirrors 6.4's GroupForm `38a4131` pattern: outer `try { try {...POST...} catch { setError("network_error"); return; } if (groups...) try {...PATCH...} catch {...} } finally { setBusy(false); }`. Also dropped `as any` cast on platform select (replaced with `as "codeforces" | "atcoder"`) restoring the convention established in DashboardClient (`342f8a5`); added `Content-Type: application/json` header on both fetches per `38a4131` consistency.
14. **Task 6.6 nameColor gate + three-state error UI (`0508522` review fix-up)** — plan-verbatim only handled `fetchStatus === "not_found"` and applied `rankColor` unconditionally to the `<h1>` displayName + `<strong>` current rating. When `getProfile()` falls back to a stale `existing` cache row from a prior `ok` fetch on a transient upstream error, the page would render confidently-styled colored text on a degraded view — same bug class as Task 6.1's `6e96db2` HandleCard fix-up. Now: (a) `nameColor = fetchStatus === "ok" ? rankColor ?? undefined : undefined` computed once, applied to both `<h1>` and `<strong>`; (b) three-state `error` UI mirroring the `9655d07` "stale > empty" rule — `error+stale-data` (`displayName !== null || currentRating !== null`) renders an amber banner above the header (`"Couldn't refresh from {platform} — showing last cached data from {fetchedAt}"`) with neutral colors and the rest of the page intact; `error+no-data` (both null) returns a standalone amber error block before the table; `ok`/`not_found` paths unchanged.

### Phase 7 — E2E + CI ✅ COMPLETE (2/2 tasks complete)

| Task | Commit | Status |
|---|---|---|
| 7.1 Playwright happy-path (cache-pre-seed deviation: server-side adapter not reachable from `context.route()` so seed `cached_profiles` for tourist/codeforces instead). New `playwright.config.ts`, `tests/e2e/_seed.ts`, `tests/e2e/happy-path.spec.ts`. Modifies `src/lib/api/session.ts` + `src/middleware.ts` for `E2E_TEST=1` bypass; switches `(app)/layout.tsx` from `auth()` to `requireSession()`. | `d4ae9ec` | ✅ |
| 7.1 review fix-ups (extract `src/lib/api/e2e-bypass.ts` with prod-leak guardrail `throw if NODE_ENV==="production" && E2E_TEST==="1"`; cleanup-before-seed in `_seed.ts` so re-runs don't hit `groups_user_name_uniq`; async middleware wrapper drops `as unknown as` cast; tightened Playwright selectors `getByRole("link", { name: /tourist/i })` and `locator("li", { hasText: "legends" })`; bumped webServer timeout 120s→180s for cold-clone CI; synthetic email `e2e@x` → `e2e@example.test`) | `82d201b` | ✅ |
| 7.2 GitHub Actions CI workflow (`.github/workflows/ci.yml` plan-verbatim — postgres:16 service container with `pshub` + `pshub_test`, `npm ci`, `psql -c "CREATE DATABASE pshub_test"`, dual `npm run db:migrate`, `npm run db:check`, `npm run typecheck`, `npm test`, `npx playwright install chromium --with-deps`, `npm run e2e`. Job-level `E2E_TEST=1` env. Triggers: `push: [main]` + all PRs.) | `2226e83` | ✅ |

**Task 7.1 deviations / decisions:**
1. **Cache-pre-seed instead of plan-verbatim `context.route()` upstream intercept (`d4ae9ec`).** Pre-authorized in plan-handoff doc. The plan-verbatim test mocked `https://codeforces.com/api/user.info*` via `context.route()`, but Playwright only intercepts BROWSER fetches; ps-hub's adapters live server-side per spec §4 ("server-only externals") and call `fetch()` from Node inside the route handler. So `_seed.ts` UPSERTs a `cached_profiles` row at `('codeforces', 'tourist')` with `fetchStatus: "ok"`, recent `fetchedAt`, and the same fixture data the plan-verbatim intercept would have returned (`displayName: "tourist"`, `currentRating: 3700`, `maxRating: 3979`, `rankLabel: "Legendary Grandmaster"`, `rankColor: "#FF0000"` per `src/lib/adapters/codeforces.ts:32`). `getProfile()` cache-hits inside the 10-min TTL so the adapter is never invoked. The two `context.route(...)` calls were removed from the spec entirely; replaced with a 2-line deviation comment.
2. **`src/middleware.ts` E2E bypass added (`d4ae9ec`) — not in plan.** Plan only modifies `src/lib/api/session.ts`. But ps-hub has a NextAuth-wrapped middleware at `src/middleware.ts` matching `/api/((?!auth/).*)` that gates every API route with raw `auth()` checks INDEPENDENTLY of `requireSession()`. Without a middleware bypass, every `POST /api/groups`, `POST /api/favorites`, `PATCH /api/favorites/:id` returns 401 before the route handler's `requireSession()` even runs. Bypass is `if (process.env.E2E_TEST === "1") return NextResponse.next()` early-return.
3. **`getByRole("textbox").first()` selector instead of plan's `page.locator("input").first()` (`d4ae9ec`).** Next.js renders a hidden `<input type="hidden" name="$ACTION_ID_...">` before any client-rendered input on pages with server actions in scope; plan's selector lands on the hidden input and `.fill("tourist")` doesn't reach the visible Handle textbox. `getByRole("textbox")` excludes `type="hidden"` by ARIA semantics so `.first()` deterministically picks the Handle input. **Selector tightened further in `82d201b`** to `getByRole("link", { name: /tourist/i })` for the dashboard assertion (HandleCard wraps displayName in `<Link>`) — defense against future stray "tourist" matches elsewhere on the page.
4. **`tests/e2e/_seed.ts` loads `dotenv` (`d4ae9ec`).** Playwright's Node runtime is separate from Next dev's runtime, so `.env.local` isn't auto-loaded for the seed. Added `config({ path: ".env.local" })` + fallback `config()` for `.env`.
5. **Pre-seed table-cleanup block in `_seed.ts` (`82d201b`).** Plan-verbatim `_seed.ts` only inserts the `users` row and the `cached_profiles` row idempotently. But the test itself inserts into `groups`/`favorites`/`favorite_groups` on every run — second run hits `groups_user_name_uniq` for `(e2e-user, "legends")` and `favorites_user_platform_handle_uniq` for `(e2e-user, codeforces, tourist)`. Now `seedE2EUser()` first DELETEs from `favorite_groups` → `favorites` → `groups` (FK order) for `user_id = 'e2e-user'`, then inserts the `users` + `cached_profiles` rows. `users` and `cached_profiles` are intentionally preserved (the FK target + global-keyed cache). Makes the e2e re-runnable on a shared dev DB.
6. **Production guardrail for `E2E_TEST=1` (`82d201b`).** The bypass surface now spans `requireSession()`, the middleware, and transitively `(app)/layout.tsx`'s redirect. If `E2E_TEST=1` ever leaked into production (deploy-config typo, env-var bleed), the app would silently authenticate every request as `e2e-user` and skip authz middleware. New `src/lib/api/e2e-bypass.ts` is a single-source-of-truth module; its top-of-file side-effect throws `"E2E_TEST=1 is forbidden in production builds"` if `NODE_ENV === "production" && E2E_TEST === "1"`. Both `session.ts` and `middleware.ts` now import `isE2E()` and `E2E_USER` from this module.
7. **Middleware async wrapper to drop `as unknown as` cast (`82d201b`, partial).** Plan-verbatim cast was `(authMiddleware as unknown as (r: NextRequest) => Response | undefined)(req)` — opt-out of TypeScript's call-shape checking. Tried to replace with `Parameters<typeof authMiddleware>[0]` narrower cast, but NextAuth's wrapper expects a 2-arg `(req, event)` signature under current typings → `TS2554`. Compromise: kept the cast on the function but adapted to the async return type (`Response | Promise<Response | undefined>`) so the cast is narrower-and-correct rather than fully sync-typed-and-misleading. Outer `middleware` now `async`, awaits the wrapped call's promise.
8. **`webServer.timeout` bumped 120s → 180s (`82d201b`).** Plan-verbatim was `120_000`. Cold-clone CI runners may compile + connect Drizzle slowly enough to flake. 180s is the safer baseline; can be tightened later if CI consistently finishes in <60s.
9. **Synthetic email `e2e@x` → `e2e@example.test` (`82d201b`).** RFC-5321 compatibility hygiene — if any future signup/email-validation flow re-touches this user, `e2e@x` lacks a TLD and would fail. Both `_seed.ts` (UPSERT also self-heals via `ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`) and `src/lib/api/e2e-bypass.ts` updated.
10. **Test scenario name renamed from plan title** ("add handle, create group, assign, filter, delete" → "add handle, create group, assign, land on dashboard"). The plan-verbatim spec body never implements filter/delete steps — only goes as far as landing on `/dashboard` and asserting "tourist" is visible. The rename matches the actual body. Filter/delete coverage remains a Phase 7 backlog item.
11. **`.gitignore` adds `playwright/.cache/` and `.claude/` (`d4ae9ec`).** First entry is task-relevant (Playwright browser-binary cache). Second entry is a Claude Code runtime artifact — mild scope creep, flagged by both spec and code-quality reviews but kept since it's a single-line and the alternative is a churning chore commit.

**Verification at HEAD `82d201b`:** `tsc EXIT=0`, `npm test → 36 passed`, `npm run e2e → 1 passed (15.1s)`. `git status` clean. Pushed to `origin/main`.

**Task 7.2 outcome (`2226e83`):**

Plan-verbatim ship — first task in Phase 6 / Phase 7 to close on a single commit with no fix-up. Spec compliance review confirmed byte-for-byte match to plan (line 2702–2757 of `docs/superpowers/plans/2026-04-29-ps-hub-mvp.md`); code-quality review approved with **0 Critical / 0 Important / 4 Minor** observations, all explicitly recommended for a separate future "CI hardening" PR rather than retroactive fold-in.

Watch-outs verified clean during code-quality review:
- **NODE_ENV guardrail dormant**: `src/lib/api/e2e-bypass.ts` only throws if `NODE_ENV === "production" && E2E_TEST === "1"`. CI never sets `NODE_ENV=production` — Vitest forces `test`, Playwright `webServer` forces `development`, typecheck/migrations don't load the module. Job-level `E2E_TEST=1` is therefore safe.
- **All 4 integration test files mock `@/lib/api/session`** at module load, so `E2E_TEST=1` is a no-op for `npm test` invocations. The bypass is the intended behavior only at runtime via Playwright's `webServer`.
- **`package-lock.json` present**, so `actions/setup-node@v4` with `cache: npm` cache key resolves.
- **`psql` is preinstalled on `ubuntu-latest`** (postgresql-client) — the `Create test DB` step works without an explicit install.
- **Fail-fast default**: no `continue-on-error: true` anywhere; any non-zero step exit aborts the job.
- **Secret hygiene**: literal `test` placeholders for `GOOGLE_CLIENT_ID/SECRET/NEXTAUTH_SECRET` are safe because `E2E_TEST=1` short-circuits NextAuth before any signing occurs. Migrate to `${{ secrets.* }}` once a non-E2E job is added.
- **Dual-DB migration ordering**: `Create test DB` precedes both `db:migrate` invocations; `db:check` runs after both migrations so drizzle-kit drift detection sees the latest schema in both DBs.

**Task 7.2 deferred items (CI hardening backlog — pick up alongside the next workflow PR):**
- Add `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }` to avoid stacking CI runs on rapid pushes.
- Add `actions/upload-artifact@v4` step on `if: failure()` after `npm run e2e` to surface Playwright trace/screenshot/video artifacts (under `test-results/` and `playwright-report/`) in the GitHub Actions UI. Real gap once the e2e suite grows past ~3 specs.
- Action SHA-pinning (currently tag-pinned at `@v4`) — supply-chain hardening, not blocking until threat model expands to production deploys.
- Cache `~/.cache/ms-playwright` to skip the ~30s browser download on every CI run.
- Migrate `GOOGLE_CLIENT_ID/SECRET`, `NEXTAUTH_SECRET` from literal `env:` block to `${{ secrets.* }}` once any non-E2E CI job is added that exercises real NextAuth signing.

**Task 7.1 backlog (pick up alongside the next e2e touch):**
- **AtCoder leg missing**: happy-path only exercises Codeforces. Add an AtCoder favorite + dashboard assertion when cross-platform coverage matters.
- **Filter / delete steps from plan title never implemented** (plan body never had them either, but the title implied them). Backlog: extend the spec to add a `delete favorite` step and assert the card disappears from /dashboard.
- **`reuseExistingServer: !process.env.CI` local-dev gotcha**: locally-running `npm run dev` (without `E2E_TEST=1`) gets reused by Playwright, which silently breaks the test (everything 401s/redirects to /login). Already documented inline in `playwright.config.ts:9` after `82d201b`. If devs hit it repeatedly, switch to `reuseExistingServer: false` and accept the slower local feedback.
- **`Parameters<typeof authMiddleware>[0]` narrower-cast attempt** in `src/middleware.ts` failed because NextAuth's wrapper expects `(req, event)` 2-arg shape. Current cast is narrower than plan-verbatim but still uses `as unknown as` on the function. Revisit when next-auth typings stabilize or when `next-auth@5.x` final ships.
- **`.gitignore` `.claude/` add** is technically scope-creep from Task 7.1; if commit-history hygiene matters, split into a dedicated `chore: gitignore Claude runtime artifacts` commit later. Single-line, harmless.
- **e2e writes against `neondb`** (the production-pointing DB used by `npm run dev`). Each run inserts/upserts `users.e2e-user`, `cached_profiles[(codeforces, tourist)]`, `groups.legends`, a favorite row, and a `favorite_groups` link — the cleanup-before-seed in `_seed.ts` keeps it clean for re-runs but a true production deploy would inherit these rows. Backlog: route e2e at `pshub_test` instead, OR fence with an `if (process.env.E2E_TEST === "1") DATABASE_URL = TEST_DATABASE_URL` switch in `src/lib/db/client.ts` (would need spec/security review).

## Pending non-task items

1. **Phase 5 deferred nits** (flagged in code-quality reviews, not blocking):
   - `Cache-Control: private, no-store` header on `/api/profiles/...` responses (defense against cross-user CDN caching). One-line addition when first edge-cache concern surfaces.
   - Inject a clock into `src/lib/rate-limit/force-refresh.ts` and `favorite-add.ts` for symmetry with `profile-cache._setNowForTest` — so the "5s" rate-limit tests don't depend on real wall-clock latency between two synchronous calls.
   - Map in `force-refresh.ts` and `favorite-add.ts` grows unbounded with distinct authenticated `userId`s. Spec acknowledges this moves to Redis later; consider adding a `// TODO(phase-5+)` comment and a shared `windowed-rate-limit.ts` factory once a third caller appears.
   - `isUniqueViolation` helper duplicated across `groups/route.ts` and `favorites/route.ts`. Extract to `src/lib/db/errors.ts` (or similar) when a third caller appears.
   - `id` field in POST `/api/favorites` 201 response duplicates `favorite.id`. Drop `id` and rely on `favorite.id` next time the response shape is touched.
   - **Task 5.4 authz scaffold hardening** (pick up when adding PATCH-IDOR / groups-IDOR cases): assert `expect(c.status).toBe(201)` after the userB POST in `tests/integration/api/authz.test.ts` to localize failures; add `adapterMock.fetch.mockReset()` in `beforeEach` (matches `favorites.test.ts:23`) so future `mockResolvedValueOnce` queues don't leak between tests; consider a one-line comment about the mutable `currentUser` closure not being safe under `Promise.all` across user contexts.
   - **Task 6.1 HandleCard backlog** (pick up alongside Task 6.2 when real prop shape stabilizes): empty-string `alias` would render an empty name div since `??` doesn't coalesce `""` — confirm alias normalization at favorites API layer, then either tighten validation server-side or change the fallback to `(p.alias || null) ?? p.displayName ?? p.handle`; `key={c.date}` collision is unlikely given ms-precision adapters but switch to composite key only if a real collision surfaces; consider a discriminated-union refactor of `HandleCardProps` (`{ fetchStatus: "ok"; currentRating: number; ... } | { fetchStatus: "not_found" } | { fetchStatus: "error" }`) which would eliminate both the `?? 0` rating fallback and any future risk of color/state leak by construction.
   - **Task 6.2/6.3 dashboard backlog** (pick up alongside the next dashboard touch): drop the two `as any` casts in `dashboard/page.tsx` (`lastContests` and `fetchStatus`) — fold into the discriminated-union HandleCardProps refactor above, since both casts exist because the DB column types are wider than the prop union; consider extracting a `toItem(row)` helper in `page.tsx` so the JSX shrinks to `<DashboardClient initial={rows.map(toItem)} />`; consider a `PLATFORM_FILTERS = [...] as const` + derived type to dedupe the `"all" | "atcoder" | "codeforces"` and `"rating" | "name" | "added"` literal unions repeated four times each in `DashboardClient.tsx`; thread the API's structured error code (currently dropped via `throw new Error(String(r.status))` on line 53) through to the UI when finer error states matter; current sort tiebreaker for unrated AtCoder handles ranks them alongside rating-0 — UX nit, swap to `(b.currentRating ?? -Infinity) - (a.currentRating ?? -Infinity)` if it bites.
   - **Task 6.4 GroupForm/GroupList backlog** (pick up alongside the next groups touch): empty-string `g.name` would render an empty `<li>` row since `g.name` is rendered raw — confirm name normalization at `/api/groups` POST (currently zod-validated but worth re-checking minimum length); `<label>` siblings to `<select>`/`<input>` in `GroupForm` lack `htmlFor`/`id` (a11y, screen-reader association); error codes (`name_exists`, `invalid_body`, etc.) surface raw to user — backlog `errorCodeToMessage()` helper for humanization once a third form lands.
   - **Task 6.5 AddFavoriteForm backlog**: same `errorCodeToMessage()` helper applies; `<label>` siblings to platform select + handle input lack `htmlFor`/`id`; `body.error` from POST/PATCH `.json()` is typed `any` via implicit return — a tiny `{ error?: string }` annotation would tighten without ceremony; `getProfile()` upstream rate-limit (5s per user, see `src/lib/rate-limit/favorite-add.ts`) means rapid retries for legitimately-different handles are also throttled — backlog: switch to (handle, platform) keying if real users hit it.
   - **Task 6.6 handle detail page backlog**: `as Array<any>` and `(c: any)` casts on `lastContests`/contests row are inline duplicates of the dashboard `as any` casts — same discriminated-union refactor of `getProfile`'s return shape would resolve both; table missing `<caption>` and `scope="col"` on `<th>` (a11y); `new Date(c.date).toLocaleDateString()` is server-locale rendered (Next server component) so technically fine, but if the page is ever client-hydrated, locale skew appears; `rankLabel` rendered raw with no "rank" prefix word — for AtCoder values like "1200" reads ambiguously beside "Max 1500"; no SWR refresh since this is a single-card view (intentional vs dashboard's grid; but if a user lands here from a stale dashboard link, they may want a manual refresh button — backlog).
   - **Task 7.1 e2e backlog** (covered in Phase 7 deviations + Task 7.2 entry plan above): AtCoder leg + filter/delete steps + DB-target review (`neondb` vs `pshub_test`) + revisit middleware cast when next-auth typings stabilize.

2. **`.env.local` OAuth + auth secrets** — `DATABASE_URL` is real (Neon). `GOOGLE_CLIENT_ID/SECRET` and `NEXTAUTH_SECRET` are still `xxx` placeholders. Required before `npm run dev` succeeds in a browser; not blocking for unit tests or DB integration tests. Generate `NEXTAUTH_SECRET` via `openssl rand -base64 32`; OAuth creds via Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application, redirect `http://localhost:3000/api/auth/callback/google`).

3. **Neon credential rotation** — the `DATABASE_URL` was shared in chat during setup. Once any production data lands, rotate the DB password from Neon dashboard (Connection Details → Reset password) and update `.env.local`.

## Resuming in a fresh session — exact recipe

1. **Read context** in this order:
   - This `progress.md` (current state).
   - `docs/superpowers/specs/2026-04-29-ps-hub-design.md` (spec).
   - `docs/superpowers/plans/2026-04-29-ps-hub-mvp.md` (plan; jump to the next task).
   - Memory files at `C:\Users\User\.claude\projects\C--Users-User-Desktop-github-ps-hub\memory\` (push-after-each-task feedback, remote info).

2. **Verify state:**
   ```bash
   git status                  # should be clean (only `.omc/` and `docs/` untracked — both intentionally gitignored conceptually but not in .gitignore)
   git log --oneline -10       # head at `2226e83` (Task 7.2 ship — `ci: typecheck + tests + e2e + drizzle check`). Previous is `64dd474` (Task 7.1 docs commit). Cross-check against the Phase status table.
   npx --no-install tsc --noEmit; echo "EXIT=$?"   # MUST be EXIT=0 — DO NOT pipe tsc through `tail` since that masks tsc's real exit code (see feedback_tsc_exit_code.md)
   npm test                    # 36 tests PASS (11 unit + 7 profile-cache integration + 6 profiles route + 5 groups route + 6 favorites route + 1 authz IDOR)
   npm run e2e                 # 1 test PASS (~15s). Make sure no stale `npm run dev` is running on :3000 first — `reuseExistingServer: true` would reuse it WITHOUT `E2E_TEST=1` and silently fail. On Windows: `powershell "Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | %{ Stop-Process -Id \$_.OwningProcess -Force }"`.
   git remote -v               # origin = https://github.com/hdh4952/ps-hub.git
   # Both Postgres DBs reachable on Neon (URLs listed in `.env.local`, gitignored):
   node -e "require('dotenv').config({path:'.env.local'});const s=require('postgres')(process.env.DATABASE_URL,{max:1});s\`SELECT count(*) FROM information_schema.tables WHERE table_schema='public'\`.then(r=>{console.log('main tables:',r[0].count);return s.end();}).catch(e=>{console.error(e.message);process.exit(1);})"
   # → main tables: 8
   node -e "require('dotenv').config({path:'.env.local'});const s=require('postgres')(process.env.TEST_DATABASE_URL,{max:1});s\`SELECT count(*) FROM information_schema.tables WHERE table_schema='public'\`.then(r=>{console.log('test tables:',r[0].count);return s.end();}).catch(e=>{console.error(e.message);process.exit(1);})"
   # → test tables: 9 (8 schema + drizzle's _drizzle_migrations ledger)
   ```

3. **All 7 plan phases are now complete.** Two follow-on steps remain:
   - **a. Final whole-tree code review.** Dispatch a `oh-my-claudecode:code-reviewer` (or `general-purpose`) subagent with a brief covering the entire diff `<initial-commit>..main`. Focus areas: cross-task consistency (e.g. error-handling baseline applied uniformly across UI tasks 6.1–6.6), dead code from earlier deviations (the `Partial<>`/throw shape that 3.1 used and 3.3 dropped — confirm it's gone), stale comments / TODOs, type-safety gaps deferred earlier (`as any` casts in `dashboard/page.tsx` + `handles/[platform]/[handle]/page.tsx`, `as unknown as` middleware cast), and a sanity pass on the security-sensitive surfaces (`src/lib/api/e2e-bypass.ts` prod guardrail, the `WHERE userId = session.userId` IDOR contract on every member route).
   - **b. Run `superpowers:finishing-a-development-branch`.** This decides merge/PR strategy. Note: this project ran linearly on `main` per pre-authorized consent (`subagent-driven-development` workflow protocol), so "finishing" is mostly choosing whether to (i) tag a release, (ii) open a retrospective PR for record/CI-trigger purposes, or (iii) declare the branch shipped and move on. Open question to surface: did GitHub Actions run on `2226e83`'s push to main? Check `gh run list -L 5` if `gh` CLI is available, or browse `https://github.com/hdh4952/ps-hub/actions`.

4. **Pattern reminder if reopening any task:** see "Workflow protocol" above. Do not skip the spec review or push step. Do not let an implementer self-approve.

## Key contracts to keep stable across sessions

- **Branch:** all work goes on `main`; push after every task.
- **Commit messages:** follow the plan's exact strings (e.g. `feat(auth): NextAuth Google OAuth + Drizzle adapter`). Cleanup commits use `refactor(...)` or `chore: address task X.X review`.
- **Type & test gates:** `npm run typecheck` and `npm test` must pass at the end of every task. (DB-dependent integration tests landing in Phase 4+ will need a live Postgres; document if blocked.)
- **TDD:** Phase 3+ tasks specify failing-test-first. Don't shortcut.
- **No agent self-approval:** spec reviewer and code-quality reviewer are separate dispatches.
- **Visual companion:** user accepted but server bind was denied earlier; for visual questions, propose terminal-only first or re-ask permission.
