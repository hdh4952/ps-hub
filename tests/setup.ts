import { config } from "dotenv";

config({ path: ".env.local" });
config(); // fallback to .env

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL not set — required for integration tests. Add it to .env.local.");
}
