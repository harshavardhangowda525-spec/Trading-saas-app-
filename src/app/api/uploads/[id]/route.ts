import { NextResponse } from "next/server";
import { requireApiOnboardedUser } from "@/features/auth/server/current-user";
import { getChartImageForUser } from "@/features/uploads/server/upload.service";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { route } from "@/server/http";
import { getStorage } from "@/server/storage";

/** Returns a fresh short-lived signed URL for one of the caller's images. */
export const GET = route<RouteContext<"/api/uploads/[id]">>(async (_req, ctx) => {
  const user = await requireApiOnboardedUser();
  const { id } = await ctx.params;
  const image = await getChartImageForUser(
    { db, storage: getStorage(), signedUrlTtlSeconds: env.SIGNED_URL_TTL_SECONDS },
    { userId: user.id, imageId: id },
  );
  return NextResponse.json(image, { headers: { "Cache-Control": "private, no-store" } });
});
