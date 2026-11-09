import { afterAll, describe, expect, it } from "vitest";
import { getChartImageForUser, uploadChartImage } from "@/features/uploads/server/upload.service";
import type { ObjectStorage } from "@/server/storage";
import { makeImage } from "../helpers/images";
import { createTestClient, createTestUser, testDbUrl } from "./db";

class FakeStorage implements ObjectStorage {
  objects = new Map<string, { body: Buffer; contentType: string }>();
  failPut = false;
  async put(key: string, body: Buffer, contentType: string) {
    if (this.failPut) throw new Error("boom");
    this.objects.set(key, { body, contentType });
  }
  async signedReadUrl(key: string, ttl: number) {
    return `https://storage.test/${key}?ttl=${ttl}`;
  }
  async delete(key: string) {
    this.objects.delete(key);
  }
}

describe.skipIf(!testDbUrl)("chart uploads (integration)", () => {
  const db = createTestClient();
  const deps = (storage: ObjectStorage) => ({ db, storage, signedUrlTtlSeconds: 300 });

  afterAll(async () => {
    await db.user.deleteMany({ where: { email: { endsWith: "@integration.test" } } });
    await db.$disconnect();
  });

  it("stores the processed image privately and returns a signed URL", async () => {
    const storage = new FakeStorage();
    const user = await createTestUser(db);
    const input = await makeImage(2600, 1300, "png", {});

    const view = await uploadChartImage(deps(storage), { userId: user.id, data: input });

    expect(view).toMatchObject({ width: 2000, height: 1000, mime: "image/png", reused: false });
    const row = await db.chartImage.findUniqueOrThrow({ where: { id: view.id } });
    expect(row.storageKey).toMatch(new RegExp(`^charts/${user.id}/[0-9a-f-]{36}\\.png$`));
    expect(row.originalBytes).toBe(input.byteLength);
    expect(storage.objects.get(row.storageKey)?.contentType).toBe("image/png");
    expect(view.url).toContain(row.storageKey);
  });

  it("reuses an identical upload from the same user within 10 minutes", async () => {
    const storage = new FakeStorage();
    const user = await createTestUser(db);
    const input = await makeImage(900, 600, "jpeg");

    const first = await uploadChartImage(deps(storage), { userId: user.id, data: input });
    const second = await uploadChartImage(deps(storage), { userId: user.id, data: input });

    expect(second.id).toBe(first.id);
    expect(second.reused).toBe(true);
    expect(storage.objects.size).toBe(1);
  });

  it("does not share images between users", async () => {
    const storage = new FakeStorage();
    const owner = await createTestUser(db);
    const other = await createTestUser(db);
    const input = await makeImage(900, 600, "png");

    const a = await uploadChartImage(deps(storage), { userId: owner.id, data: input });
    const b = await uploadChartImage(deps(storage), { userId: other.id, data: input });
    expect(b.id).not.toBe(a.id);

    await expect(
      getChartImageForUser(deps(storage), { userId: other.id, imageId: a.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      getChartImageForUser(deps(storage), { userId: owner.id, imageId: a.id }),
    ).resolves.toMatchObject({ id: a.id });
  });

  it("rejects oversized files before processing", async () => {
    const user = await createTestUser(db);
    await expect(
      uploadChartImage(deps(new FakeStorage()), {
        userId: user.id,
        data: Buffer.alloc(5 * 1024 * 1024 + 1),
      }),
    ).rejects.toMatchObject({ code: "IMAGE_TOO_LARGE" });
  });

  it("writes nothing to the database when storage fails", async () => {
    const storage = new FakeStorage();
    storage.failPut = true;
    const user = await createTestUser(db);
    await expect(
      uploadChartImage(deps(storage), { userId: user.id, data: await makeImage(900, 600, "png") }),
    ).rejects.toMatchObject({ code: "STORAGE_UNAVAILABLE" });
    expect(await db.chartImage.count({ where: { userId: user.id } })).toBe(0);
  });
});
