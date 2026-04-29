import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { loadEnv } from "@/env";
import * as schema from "./schema";

// Validates DATABASE_URL at module import — fail fast if env is misconfigured rather than at first query.
const env = loadEnv();
export const sql = postgres(env.DATABASE_URL, { max: 10 });
export const db = drizzle(sql, { schema });
export type DB = typeof db;
