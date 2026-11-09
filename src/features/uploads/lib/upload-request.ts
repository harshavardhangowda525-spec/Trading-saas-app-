import type { ApiErrorBody } from "@/server/errors";
import type { ChartImageView } from "../server/upload.service";

export class UploadError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

/** XHR (not fetch) so we can report real upload progress on slow mobile networks. */
export function uploadImage(
  blob: Blob,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<ChartImageView> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.responseType = "json";
    xhr.timeout = 60_000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as ChartImageView);
        return;
      }
      const body = xhr.response as ApiErrorBody | null;
      reject(
        new UploadError(
          body?.error.message ?? "Upload failed. Please try again.",
          body?.error.code ?? "INTERNAL",
        ),
      );
    };
    xhr.onerror = () =>
      reject(new UploadError("Network error. Check your connection and try again.", "NETWORK"));
    xhr.ontimeout = () =>
      reject(
        new UploadError(
          "The upload took too long. Check your connection and try again.",
          "TIMEOUT",
        ),
      );
    signal?.addEventListener("abort", () => xhr.abort());

    const form = new FormData();
    const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    form.append("image", blob, `chart.${ext}`);
    xhr.send(form);
  });
}
