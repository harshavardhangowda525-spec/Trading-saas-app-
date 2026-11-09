import { UPLOAD_LIMITS } from "../limits";

/** Hard cap on what we accept from the picker before client-side compression. */
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

/** Crop rectangle in percent of the (EXIF-oriented) image, as produced by the crop UI. */
export type PercentRect = { x: number; y: number; width: number; height: number };

export function validateSourceFile(file: Blob): string | null {
  if (!(UPLOAD_LIMITS.acceptedMimeTypes as readonly string[]).includes(file.type)) {
    return "Please choose a PNG, JPG or WEBP image.";
  }
  if (file.size > MAX_SOURCE_BYTES)
    return "That file is too large. Please use a screenshot under 20 MB.";
  return null;
}

/**
 * Applies an optional crop and shrinks large images in the browser so phone
 * uploads are fast. Returns the original file untouched when no work is needed.
 * The server re-validates and re-processes everything regardless.
 */
export async function prepareForUpload(file: Blob, crop?: PercentRect): Promise<Blob> {
  const needsCompression = file.size > UPLOAD_LIMITS.compressAboveBytes;
  if (!crop && !needsCompression) return file;

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const src = crop
      ? {
          x: (crop.x / 100) * bitmap.width,
          y: (crop.y / 100) * bitmap.height,
          width: (crop.width / 100) * bitmap.width,
          height: (crop.height / 100) * bitmap.height,
        }
      : { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
    const scale = Math.min(1, UPLOAD_LIMITS.maxDimension / Math.max(src.width, src.height));
    const width = Math.max(1, Math.round(src.width * scale));
    const height = Math.max(1, Math.round(src.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, src.x, src.y, src.width, src.height, 0, 0, width, height);

    // PNG keeps chart text crisp; fall back to JPEG if it's still too big.
    const preferred = file.type === "image/png" ? "image/png" : "image/jpeg";
    let blob = await toBlob(canvas, preferred, 0.92);
    if (blob.size > UPLOAD_LIMITS.maxBytes) blob = await toBlob(canvas, "image/jpeg", 0.85);
    return blob;
  } finally {
    bitmap.close();
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not process the image."))),
      type,
      quality,
    ),
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
