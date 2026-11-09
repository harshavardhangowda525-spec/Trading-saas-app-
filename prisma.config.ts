import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrations use a direct (non-pooled) connection when available (Neon).
// `prisma generate` does not need a database, so a missing URL is tolerated here;
// the app itself fails fast at startup via src/server/env.ts.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url },
});
