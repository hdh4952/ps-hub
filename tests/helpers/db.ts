import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "@/lib/db/schema";

export async function createTestDb(url = process.env.TEST_DATABASE_URL!) {
  const sql = postgres(url, { max: 5 });
  const db = drizzle(sql, { schema });
  await migrate(db, { migrationsFolder: "./src/lib/db/migrations" });
  return { db, sql };
}

export async function truncateAll(sql: postgres.Sql) {
  await sql`TRUNCATE cached_profiles, favorite_groups, favorites, groups, accounts, sessions, users RESTART IDENTITY CASCADE`;
}
