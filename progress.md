# ps-hub — Progress Handoff

> Read this file in a fresh session to pick up exactly where work stopped.
> Last updated: 2026-05-01 (Phase 6 in progress — Tasks 6.1/6.2/6.3 shipped + reviewed; Task 6.4 /groups page next).

## TL;DR for the next session

- ✅ **Phases 0–5 complete.** Bootstrap, DB schema, NextAuth, Codeforces+AtCoder adapters, profile-cache (TTL+SWR+force), and all four API route tasks (profiles GET, groups CRUD, favorites CRUD, IDOR coverage).
- ⚙️ **Phase 6 in progress** — Tasks 6.1 (HandleCard), 6.2 (dashboard server component, cache-first SSR), and 6.3 (DashboardClient + React Query SWR refresh) all shipped, spec ✅, code ✅. 6.2/6.3 bundled into a single commit per plan-authorized deferral, then polished + reviewed (hydration safety + SWR error surface).
- ✅ **Postgres provisioned** on Neon (`ap-southeast-1`). Two databases (`neondb` for app, `pshub_test` for integration tests). Both reachable; URLs in `.env.local`.
- ✅ **`npm test` → 36/36 pass** (11 unit + 7 profile-cache integration + 6 profiles route + 5 groups + 6 favorites + 1 authz IDOR). `npx tsc --noEmit` **clean** (verified with `; echo $?` since `| tail` masks tsc's exit code — see feedback_tsc_exit_code.md memory). Push-after-each-task discipline maintained throughout.
- ⏭️ **Next**: Task 6.4 (`src/app/(app)/groups/page.tsx` — /groups CRUD UI, replaces Phase 2.3 stub; plan line ~2300). Then 6.5 /add, 6.6 handle detail page (replaces Task 6.1 stub).
- 🟡 **Open notes**: OAuth/`NEXTAUTH_SECRET` still placeholders (only blocks `npm run dev` in browser, not tests); Neon DB password should be rotated since it was shared in chat during setup; `isUniqueViolation` duplicated in 2 route files (extract on next caller); `as any` casts on `lastContests`/`fetchStatus` in `dashboard/page.tsx` deferred backlog.

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

### Phase 6 — UI ⚙️ IN PROGRESS

| Task | Commit | Status |
|---|---|---|
| 6.1 HandleCard pure presentational component (`src/app/(app)/_components/HandleCard.tsx`) + one-line typedRoutes stub at `src/app/(app)/handles/[platform]/[handle]/page.tsx` (Phase 2.3 precedent — Task 6.6 will replace) | `4c04c10` | ✅ |
| Phase 5 latent withAuth typing fix surfaced during Task 6.1 (`DefaultRouteCtx.params` was `?` optional but Next 15 generated route types require non-optional `Promise<any>`; collection routes GET/POST in `favorites/route.ts` and `groups/route.ts` failed `.next/types/...` typecheck once `next build` ran) | `b0bdc13` | ✅ |
| 6.1 review fix-up (gate name color on `fetchStatus === "ok"` — stale rankColor was leaking onto displayName text over red-50/amber-50 status backgrounds; computed `nameColor` once at component top, applied to both name and rating value) | `6e96db2` | ✅ |
| 6.2 + 6.3 bundled (cache-first SSR dashboard + React Query SWR refresh + `@tanstack/react-query` dep + `Providers` wrapper in root layout). Plan explicitly defers 6.2's commit until 6.3 implements DashboardClient. | `4cb5e37` | ✅ |
| 6.2/6.3 polish on top before review (typed select handlers + aria-labels; "added" sort actually sorts by `createdAt` desc — was no-op `return 0`; empty-cache row defaults `fetchStatus: "error"` so HandleCard renders amber "retrying…" instead of misleading "0 / max 0 · null"; `next-env.d.ts` doc-URL refresh) | `342f8a5` | ✅ |
| 6.2/6.3 review fix-ups (RefreshingCard defers `Date.now()` to `useEffect` to eliminate hydration mismatch when `fetchedAt` near TTL boundary; useQuery error path downgrades `fetchStatus` to `"error"` so card surfaces refresh failures instead of silently keeping stale "ok" badge; explicit `staleTime: TTL_MS` on per-card query so 10-min TTL intent is self-documenting; drop `as any` cast on `fetchStatus` prop) | `9655d07` | ✅ |
| 6.4 /groups page (replaces Phase 2.3 stub) | — | ⏳ NEXT |
| 6.5 /add favorite flow (replaces Phase 2.3 stub) | — | ⏳ |
| 6.6 Handle detail page (replaces Task 6.1 stub) | — | ⏳ |

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

### Phase 7 — E2E + CI ⏳ NOT STARTED
- 7.1 Playwright happy-path scenario (with adapter intercept)
- 7.2 GitHub Actions CI workflow

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
   git log --oneline -10       # head should be the most recent `docs: progress.md — …` commit; cross-check the SHA against the Phase status table above
   npx --no-install tsc --noEmit; echo "EXIT=$?"   # MUST be EXIT=0 — DO NOT pipe tsc through `tail` since that masks tsc's real exit code (see feedback_tsc_exit_code.md)
   npm test                    # 36 tests PASS (11 unit + 7 profile-cache integration + 6 profiles route + 5 groups route + 6 favorites route + 1 authz IDOR)
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
   then continue from **Task 6.4** in the plan (`src/app/(app)/groups/page.tsx` — /groups CRUD UI that replaces the Phase 2.3 stub; uses the existing `/api/groups` collection + member endpoints from Task 5.2; should support listing, create, rename, delete). Plan section starts at line ~2300 of `docs/superpowers/plans/2026-04-29-ps-hub-mvp.md`. Tasks 6.5 (/add favorite flow) and 6.6 (handle detail page, replaces Task 6.1 stub) follow.

4. **Pattern to repeat for every remaining task:** see "Workflow protocol" above. Do not skip the spec review or push step.

5. **When all 7 phases finish:** dispatch a final whole-tree code reviewer, then run the `superpowers:finishing-a-development-branch` skill.

## Key contracts to keep stable across sessions

- **Branch:** all work goes on `main`; push after every task.
- **Commit messages:** follow the plan's exact strings (e.g. `feat(auth): NextAuth Google OAuth + Drizzle adapter`). Cleanup commits use `refactor(...)` or `chore: address task X.X review`.
- **Type & test gates:** `npm run typecheck` and `npm test` must pass at the end of every task. (DB-dependent integration tests landing in Phase 4+ will need a live Postgres; document if blocked.)
- **TDD:** Phase 3+ tasks specify failing-test-first. Don't shortcut.
- **No agent self-approval:** spec reviewer and code-quality reviewer are separate dispatches.
- **Visual companion:** user accepted but server bind was denied earlier; for visual questions, propose terminal-only first or re-ask permission.
