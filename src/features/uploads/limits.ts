/** Shared between client and server so both enforce the same rules. */
export const UPLOAD_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  /** Client compresses files above this size before upload. */
  compressAboveBytes: 2 * 1024 * 1024,
  maxDimension: 2000,
  /** Below this the chart is almost certainly unreadable. */
  minDimension: 200,
  acceptedMimeTypes: ["image/png", "image/jpeg", "image/webp"] as const,
} as const;

export const ACCEPT_ATTR = UPLOAD_LIMITS.acceptedMimeTypes.join(",");
