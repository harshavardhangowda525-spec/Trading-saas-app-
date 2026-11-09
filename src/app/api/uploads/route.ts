import { NextResponse } from "next/server";
import { requireApiOnboardedUser } from "@/features/auth/server/current-user";
import { UPLOAD_LIMITS } from "@/features/uploads/limits";
import { uploadChartImage } from "@/features/uploads/server/upload.service";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { AppError } from "@/server/errors";
import { route } from "@/server/http";
import { consumeRateLimit } from "@/server/rate-limit";
import { clientIp, hashIp } from "@/server/request-meta";
import { getStorage } from "@/server/storage";

const HOUR = 60 * 60 * 1000;
// Per user per brief. Per IP is looser because many Indian mobile users share
// one public IP behind carrier-grade NAT (Jio/Airtel).
const USER_LIMIT_PER_HOUR = 30;
const IP_LIMIT_PER_HOUR = 120;
// Multipart overhead allowance on top of the 5 MB file limit.
const MAX_REQUEST_BYTES = UPLOAD_LIMITS.maxBytes + 256 * 1024;

export const POST = route(async (req) => {
  const user = await requireApiOnboardedUser();

  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_REQUEST_BYTES) {
    throw new AppError("IMAGE_TOO_LARGE", "Images must be 5 MB or smaller.");
  }

  const ip = clientIp(req.headers);
  const [byUser, byIp] = await Promise.all([
    consumeRateLimit(db, `upload:user:${user.id}`, USER_LIMIT_PER_HOUR, HOUR),
    ip
      ? consumeRateLimit(db, `upload:ip:${hashIp(ip, env.IP_HASH_SALT)}`, IP_LIMIT_PER_HOUR, HOUR)
      : null,
  ]);
  if (!byUser.allowed || (byIp && !byIp.allowed)) {
    throw new AppError("RATE_LIMITED", "Too many uploads. Please wait a while and try again.");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Upload must be sent as a form with an image file.");
  }
  const file = form.get("image");
  if (!(file instanceof File)) {
    throw new AppError("VALIDATION_ERROR", "No image was attached.");
  }

  const image = await uploadChartImage(
    { db, storage: getStorage(), signedUrlTtlSeconds: env.SIGNED_URL_TTL_SECONDS },
    { userId: user.id, data: Buffer.from(await file.arrayBuffer()) },
  );
  return NextResponse.json(image, { status: image.reused ? 200 : 201 });
});
