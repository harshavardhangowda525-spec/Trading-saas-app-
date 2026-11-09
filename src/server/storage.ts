import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";
import { AppError } from "./errors";

/** Minimal storage surface the app needs. Lets tests swap in a fake. */
export interface ObjectStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Short-lived GET URL. The bucket itself is never public. */
  signedReadUrl(key: string, ttlSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}

export class S3Storage implements ObjectStorage {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "private, max-age=0, no-store",
      }),
    );
  }

  async signedReadUrl(key: string, ttlSeconds: number): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: ttlSeconds,
    });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

let cached: ObjectStorage | null = null;

export function isStorageConfigured(): boolean {
  return Boolean(env.S3_BUCKET);
}

/** App-wide storage. Throws STORAGE_UNAVAILABLE when S3/R2 isn't configured. */
export function getStorage(): ObjectStorage {
  if (cached) return cached;
  if (
    !env.S3_ENDPOINT ||
    !env.S3_REGION ||
    !env.S3_BUCKET ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY
  ) {
    throw new AppError("STORAGE_UNAVAILABLE", "Image uploads are not available right now.");
  }
  const client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
  cached = new S3Storage(client, env.S3_BUCKET);
  return cached;
}
