import "server-only";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { AppError } from "@/server/errors";
import type { ObjectStorage } from "@/server/storage";
import { UPLOAD_LIMITS } from "../limits";
import { processChartImage } from "./image-processing";

/** Same image from the same user within this window is reused (Section 6.1). */
export const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

export type ChartImageView = {
  id: string;
  url: string;
  urlExpiresAt: string;
  mime: string;
  width: number;
  height: number;
  bytes: number;
  reused: boolean;
};

type Deps = { db: PrismaClient; storage: ObjectStorage; signedUrlTtlSeconds: number };

export async function uploadChartImage(
  deps: Deps,
  input: { userId: string; data: Buffer },
): Promise<ChartImageView> {
  if (input.data.byteLength > UPLOAD_LIMITS.maxBytes) {
    throw new AppError("IMAGE_TOO_LARGE", "Images must be 5 MB or smaller.");
  }
  if (input.data.byteLength === 0) {
    throw new AppError("VALIDATION_ERROR", "The file is empty.");
  }

  const processed = await processChartImage(input.data);

  const recent = await deps.db.chartImage.findFirst({
    where: {
      userId: input.userId,
      sha256: processed.sha256,
      purgedAt: null,
      createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recent) return toView(deps, recent, true);

  const storageKey = `charts/${input.userId}/${randomUUID()}.${processed.format === "jpeg" ? "jpg" : processed.format}`;
  try {
    await deps.storage.put(storageKey, processed.buffer, processed.mime);
  } catch (e) {
    console.error("[uploads] storage put failed", e);
    throw new AppError("STORAGE_UNAVAILABLE", "We couldn't save your image. Please try again.");
  }

  try {
    const image = await deps.db.chartImage.create({
      data: {
        userId: input.userId,
        storageKey,
        sha256: processed.sha256,
        mime: processed.mime,
        bytes: processed.buffer.byteLength,
        width: processed.width,
        height: processed.height,
        originalBytes: input.data.byteLength,
      },
    });
    return toView(deps, image, false);
  } catch (e) {
    // Don't leave an orphaned object behind if the DB write fails.
    await deps.storage.delete(storageKey).catch(() => undefined);
    throw e;
  }
}

/** Owner-only. Other users get NOT_FOUND so ids can't be probed. */
export async function getChartImageForUser(
  deps: Deps,
  input: { userId: string; imageId: string },
): Promise<ChartImageView> {
  const image = await deps.db.chartImage.findFirst({
    where: { id: input.imageId, userId: input.userId, purgedAt: null },
  });
  if (!image) throw new AppError("NOT_FOUND", "Image not found.");
  return toView(deps, image, false);
}

async function toView(
  deps: Deps,
  image: {
    id: string;
    storageKey: string;
    mime: string;
    width: number;
    height: number;
    bytes: number;
  },
  reused: boolean,
): Promise<ChartImageView> {
  const url = await deps.storage.signedReadUrl(image.storageKey, deps.signedUrlTtlSeconds);
  return {
    id: image.id,
    url,
    urlExpiresAt: new Date(Date.now() + deps.signedUrlTtlSeconds * 1000).toISOString(),
    mime: image.mime,
    width: image.width,
    height: image.height,
    bytes: image.bytes,
    reused,
  };
}
