import sharp from "sharp";
import decodeHeic from "heic-decode";

export async function normalizeImageBuffer(buf: Buffer): Promise<Buffer> {
  // Check if buffer is HEIC/HEIF container (ftyp box at offset 4)
  const isHeifHeader =
    buf.length >= 12 &&
    buf.subarray(4, 8).toString("ascii") === "ftyp";

  if (isHeifHeader) {
    try {
      const { width, height, data } = await decodeHeic({ buffer: buf });
      const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
      return await sharp(Buffer.from(uint8), {
        raw: {
          width,
          height,
          channels: 4,
        },
      })
        .png()
        .toBuffer();
    } catch (err) {
      console.warn("Direct HEIC decoding attempt failed, trying sharp:", err);
    }
  }

  try {
    return await sharp(buf).rotate().png().toBuffer();
  } catch (err) {
    // Sharp failed, try decodeHeic fallback
    try {
      const { width, height, data } = await decodeHeic({ buffer: buf });
      const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
      return await sharp(Buffer.from(uint8), {
        raw: {
          width,
          height,
          channels: 4,
        },
      })
        .png()
        .toBuffer();
    } catch {
      throw err;
    }
  }
}
