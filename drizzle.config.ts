import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Match Next.js convention: prefer .env.local, fall back to .env.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
});
