import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/features/auth/server/current-user";
import { acceptTerms } from "@/features/onboarding/server/terms.service";
import { appConfig } from "@/server/config";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { readJson, route } from "@/server/http";
import { clientIp, hashIp } from "@/server/request-meta";

const bodySchema = z.object({
  version: z.string().min(1).max(32),
  accepted: z.literal(true, { error: "You must tick the box to continue." }),
});

export const POST = route(async (req) => {
  const user = await requireApiUser();
  const body = bodySchema.parse(await readJson(req));
  const ip = clientIp(req.headers);

  const result = await acceptTerms(
    db,
    {
      userId: user.id,
      version: body.version,
      ipHash: ip ? hashIp(ip, env.IP_HASH_SALT) : null,
      userAgent: req.headers.get("user-agent"),
    },
    { signupCredits: appConfig.freeSignupCredits },
  );

  return NextResponse.json(result);
});
