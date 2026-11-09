import sharp from "sharp";

/** Synthetic "chart-like" image: stripes so it compresses realistically. */
export async function makeImage(
  width: number,
  height: number,
  format: "png" | "jpeg" | "webp",
  options: { exif?: boolean; orientation?: number } = {},
): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#111"/>
    <polyline points="0,${height * 0.8} ${width * 0.5},${height * 0.4} ${width},${height * 0.2}" stroke="#4f46e5" stroke-width="4" fill="none"/>
    <text x="10" y="40" font-size="28" fill="#fff">24,150</text>
  </svg>`;
  let img = sharp(Buffer.from(svg));
  if (options.exif || options.orientation) {
    img = img.withMetadata({
      orientation: options.orientation,
      exif: options.exif
        ? {
            IFD0: { Make: "TestPhone", Copyright: "secret-owner" },
            IFD3: { GPSLatitudeRef: "N", GPSLatitude: "12/1 58/1 0/1" },
          }
        : undefined,
    });
  }
  return img.toFormat(format, format === "jpeg" ? { quality: 95 } : {}).toBuffer();
}
