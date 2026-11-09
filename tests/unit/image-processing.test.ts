import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { detectImageFormat, processChartImage } from "@/features/uploads/server/image-processing";
import { makeImage } from "../helpers/images";

describe("detectImageFormat (magic bytes)", () => {
  it("detects PNG, JPEG and WEBP", async () => {
    expect(detectImageFormat(await makeImage(300, 300, "png"))).toBe("png");
    expect(detectImageFormat(await makeImage(300, 300, "jpeg"))).toBe("jpeg");
    expect(detectImageFormat(await makeImage(300, 300, "webp"))).toBe("webp");
  });

  it("rejects non-images regardless of what they claim to be", () => {
    expect(detectImageFormat(Buffer.from("<html><script>alert(1)</script></html>"))).toBeNull();
    expect(detectImageFormat(Buffer.from("GIF89a......"))).toBeNull();
    expect(detectImageFormat(Buffer.from("%PDF-1.7"))).toBeNull();
    expect(detectImageFormat(Buffer.alloc(0))).toBeNull();
  });
});

describe("processChartImage", () => {
  it("resizes so the longest side is at most 2000px, keeping aspect ratio", async () => {
    const out = await processChartImage(await makeImage(3000, 1500, "png"));
    expect(out).toMatchObject({ width: 2000, height: 1000, format: "png", mime: "image/png" });
  });

  it("never upscales small images", async () => {
    const out = await processChartImage(await makeImage(800, 600, "jpeg"));
    expect(out).toMatchObject({ width: 800, height: 600, format: "jpeg" });
  });

  it("strips EXIF/GPS metadata", async () => {
    const input = await makeImage(800, 600, "jpeg", { exif: true });
    expect((await sharp(input).metadata()).exif).toBeDefined();

    const out = await processChartImage(input);
    const meta = await sharp(out.buffer).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.xmp).toBeUndefined();
    expect(out.buffer.includes(Buffer.from("secret-owner"))).toBe(false);
  });

  it("applies EXIF orientation before stripping it", async () => {
    // Orientation 6 = rotate 90° clockwise: an 800x600 stored image displays as 600x800.
    const out = await processChartImage(await makeImage(800, 600, "jpeg", { orientation: 6 }));
    expect(out).toMatchObject({ width: 600, height: 800 });
    expect((await sharp(out.buffer).metadata()).orientation).toBeUndefined();
  });

  it("produces a stable hash for identical input", async () => {
    const img = await makeImage(500, 400, "webp");
    const [a, b] = await Promise.all([processChartImage(img), processChartImage(img)]);
    expect(a.sha256).toBe(b.sha256);
    expect(a.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects files that are not images", async () => {
    await expect(processChartImage(Buffer.from("not an image at all"))).rejects.toMatchObject({
      code: "UNSUPPORTED_IMAGE",
    });
  });

  it("rejects corrupt images with a valid header", async () => {
    const real = await makeImage(500, 400, "png");
    const corrupt = Buffer.concat([real.subarray(0, 40), Buffer.alloc(200, 7)]);
    await expect(processChartImage(corrupt)).rejects.toMatchObject({ code: "UNREADABLE_IMAGE" });
  });

  it("rejects images too small to read", async () => {
    await expect(processChartImage(await makeImage(150, 100, "png"))).rejects.toMatchObject({
      code: "UNREADABLE_IMAGE",
    });
  });

  it("rejects decompression bombs", async () => {
    // 8000x8000 = 64MP of a flat colour compresses to a tiny PNG.
    const bomb = await sharp({
      create: { width: 8000, height: 8000, channels: 3, background: "#000" },
    })
      .png()
      .toBuffer();
    expect(bomb.byteLength).toBeLessThan(5 * 1024 * 1024);
    await expect(processChartImage(bomb)).rejects.toMatchObject({ code: "UNREADABLE_IMAGE" });
  });
});
