import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Integration tests run only when a database is configured (TEST_DATABASE_URL or DATABASE_URL). */
export const testDbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

export function createTestClient(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: testDbUrl ?? "" }) });
}

export async function createTestUser(db: PrismaClient, balance = 0) {
  const tag = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return db.user.create({
    data: { email: `test-${tag}@integration.test`, creditBalance: balance },
  });
}
