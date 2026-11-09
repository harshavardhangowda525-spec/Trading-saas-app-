import { connection, NextResponse } from "next/server";
import { db } from "@/server/db";

const DB_TIMEOUT_MS = 5_000;

/**
 * Liveness + database check for the host's health checks (Render).
 * Deliberately reveals nothing beyond up/down.
 */
export async function GET(): Promise<NextResponse> {
  await connection(); // always run at request time, never prerender

  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("db timeout")), DB_TIMEOUT_MS)),
    ]);
    return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[health] database check failed", e);
    return NextResponse.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
