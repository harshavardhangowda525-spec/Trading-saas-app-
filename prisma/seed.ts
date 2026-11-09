/**
 * Dev seed: pre-creates ADMIN_EMAILS users with the ADMIN role so they are
 * admins from their first sign-in. Safe to run repeatedly.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main(): Promise<void> {
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  for (const email of emails) {
    await db.user.upsert({
      where: { email },
      create: { email, role: "ADMIN" },
      update: { role: "ADMIN" },
    });
    console.info(`[seed] admin: ${email}`);
  }
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => void db.$disconnect());
