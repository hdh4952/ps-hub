import postgres from "postgres";
import { config } from "dotenv";

// Playwright doesn't auto-load .env.local — Next dev does, but our seed runs in
// Playwright's own process. Load it explicitly so DATABASE_URL is defined here.
config({ path: ".env.local" });
config(); // fallback to .env

/**
 * Seed the E2E user and a pre-warmed `cached_profiles` row for tourist/codeforces.
 *
 * Why pre-seed the cache row instead of intercepting the upstream call?
 * Playwright's `context.route()` only intercepts BROWSER fetches. ps-hub's
 * codeforces adapter runs server-side from the Next.js Node runtime
 * (POST /api/favorites → getProfile → adapter.fetch → Node fetch), which
 * never goes through the browser context. So we sidestep the live API by
 * seeding `cached_profiles` so `getProfile()` cache-hits inside the 10-minute
 * TTL and never invokes the adapter.
 *
 * Deterministic fixture matches what the plan-verbatim intercept would have
 * returned for handle "tourist": rating 3700, maxRating 3979, rank
 * "Legendary Grandmaster" → rankColor "#FF0000" (per src/lib/adapters/codeforces.ts).
 */
export async function seedE2EUser() {
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    // Cleanup-before-seed: makes the e2e re-runnable on a shared dev DB by
    // clearing per-user state that the test creates (groups + favorites).
    // FK order: favorite_groups → favorites → groups. Users/cached_profiles
    // are intentionally upserted (FK target / global-keyed cache row).
    await sql`DELETE FROM favorite_groups WHERE favorite_id IN (SELECT id FROM favorites WHERE user_id = 'e2e-user')`;
    await sql`DELETE FROM favorites WHERE user_id = 'e2e-user'`;
    await sql`DELETE FROM groups WHERE user_id = 'e2e-user'`;
    await sql`
      INSERT INTO users (id, email)
      VALUES ('e2e-user', 'e2e@example.test')
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
    `;
    await sql`
      INSERT INTO cached_profiles
        (platform, handle_lc, display_name, current_rating, max_rating,
         rank_label, rank_color, last_contests, fetched_at, fetch_status, fetch_error)
      VALUES
        ('codeforces', 'tourist', 'tourist', 3700, 3979,
         'Legendary Grandmaster', '#FF0000', ${sql.json([])}, NOW(), 'ok', NULL)
      ON CONFLICT (platform, handle_lc) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        current_rating = EXCLUDED.current_rating,
        max_rating = EXCLUDED.max_rating,
        rank_label = EXCLUDED.rank_label,
        rank_color = EXCLUDED.rank_color,
        last_contests = EXCLUDED.last_contests,
        fetched_at = EXCLUDED.fetched_at,
        fetch_status = EXCLUDED.fetch_status,
        fetch_error = EXCLUDED.fetch_error
    `;
  } finally {
    await sql.end();
  }
}
