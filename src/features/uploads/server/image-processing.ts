import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { AppError } from "@/server/errors";
import { UPLOAD_LIMITS } from "../limits";

export type ImageFormat = "png" | "jpeg" | "webp";

const MIME: Record<ImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/** Refuse decompression bombs: a 5MB file can declare an enormous canvas. */
const MAX_INPUT_PIXELS = 40_000_000;

/** Identifies the real format from magic bytes. The extension and declared type are ignored. */
export function detectImageFormat(buf: Uint8Array): ImageFormat | null {
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (
    buf.length >= 12 &&
    String.fromCharCode(buf[0]!, buf[1]!, buf[2]!, buf[3]!) === "RIFF" &&
    String.fromCharCode(buf[8]!, buf[9]!, buf[10]!, buf[11]!) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export type ProcessedImage = {
  buffer: Buffer;
  format: ImageFormat;
  mime: string;
  width: number;
  height: number;
  sha256: string;
};

/**
 * Normalises an uploaded chart:
 * - validates the real format by magic bytes
 * - applies EXIF orientation, then strips ALL metadata (EXIF, GPS, ICC, XMP)
 *   by re-encoding (sharp drops metadata unless asked to keep it)
 * - resizes so the longest side is <= 2000px (never upscales)
 * - re-encodes in the same format at high quality so price labels stay legible
 */
export async function processChartImage(input: Buffer): Promise<ProcessedImage> {
  const format = detectImageFormat(input);
  if (!format) {
    throw new AppError("UNSUPPORTED_IMAGE", "Please upload a PNG, JPG or WEBP image.");
  }

  try {
    const pipeline = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
      .rotate()
      .resize({
        width: UPLOAD_LIMITS.maxDimension,
        height: UPLOAD_LIMITS.maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      });

    const encoded =
      format === "png"
        ? pipeline.png({ compressionLevel: 9, adaptiveFiltering: true })
        : format === "jpeg"
          ? pipeline.jpeg({ quality: 90, mozjpeg: true })
          : pipeline.webp({ quality: 90 });

    const { data, info } = await encoded.toBuffer({ resolveWithObject: true });

    if (info.width < UPLOAD_LIMITS.minDimension || info.height < UPLOAD_LIMITS.minDimension) {
      throw new AppError(
        "UNREADABLE_IMAGE",
        "This image is too small to read. Take a full-screen screenshot of the chart.",
      );
    }

    return {
      buffer: data,
      format,
      mime: MIME[format],
      width: info.width,
      height: info.height,
      sha256: createHash("sha256").update(data).digest("hex"),
    };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(
      "UNREADABLE_IMAGE",
      "We couldn't open this image. It may be damaged — try taking the screenshot again.",
    );
  }
}
