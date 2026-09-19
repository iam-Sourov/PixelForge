import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { normalizeImageBuffer } from "@/lib/image-buffer";

interface PersonTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const cleanBase64 = (b64: string): { data: string; mimeType: string } => {
  const match = b64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: "image/png", data: b64 };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      image1, // base64 transparent Person 1
      image2, // base64 transparent Person 2
      person1 = { scale: 1.0, offsetX: -120, offsetY: 0 },
      person2 = { scale: 1.0, offsetX: 120, offsetY: 0 },
      layerOrder = "1_over_2", // '1_over_2' or '2_over_1'
      bgColor = "#BAE6FD", // default BD Studio Sky Blue
      format = "single_jpg", // 'single_jpg', 'single_png', 'sheet_4x6'
      aspectRatio = "4:3", // '4:3', '4:5', '1:1'
    } = body;

    if (!image1 || !image2) {
      return NextResponse.json({ error: "Both images are required for joint photo export." }, { status: 400 });
    }

    const clean1 = cleanBase64(image1);
    const clean2 = cleanBase64(image2);

    const rawBuf1 = Buffer.from(clean1.data, "base64");
    const rawBuf2 = Buffer.from(clean2.data, "base64");

    const buf1 = await normalizeImageBuffer(rawBuf1);
    const buf2 = await normalizeImageBuffer(rawBuf2);

    // Canvas target dimensions
    let canvasW = 1600;
    let canvasH = 1200; // 4:3 default landscape joint photo

    if (aspectRatio === "4:5") {
      canvasW = 1280;
      canvasH = 1600;
    } else if (aspectRatio === "1:1") {
      canvasW = 1400;
      canvasH = 1400;
    }

    // Determine background color
    let hexBg = "#BAE6FD"; // BD Studio Blue
    if (bgColor.startsWith("#")) {
      hexBg = bgColor;
    } else if (bgColor === "white") {
      hexBg = "#FFFFFF";
    } else if (bgColor === "gray") {
      hexBg = "#E5E7EB";
    } else if (bgColor === "dark") {
      hexBg = "#0F172A";
    }

    // Parse person transforms
    const p1: PersonTransform = person1;
    const p2: PersonTransform = person2;

    // Resize persons according to target canvas and scales
    const targetSubjectH = Math.round(canvasH * 0.9);

    const meta1 = await sharp(buf1).metadata();
    const meta2 = await sharp(buf2).metadata();

    const w1 = meta1.width || 800;
    const h1 = meta1.height || 1000;
    const w2 = meta2.width || 800;
    const h2 = meta2.height || 1000;

    const scaledH1 = Math.round(targetSubjectH * (p1.scale || 1.0));
    const scaledW1 = Math.round((w1 / h1) * scaledH1);

    const scaledH2 = Math.round(targetSubjectH * (p2.scale || 1.0));
    const scaledW2 = Math.round((w2 / h2) * scaledH2);

    const resized1 = await sharp(buf1)
      .resize(scaledW1, scaledH1, { fit: "contain" })
      .png()
      .toBuffer();

    const resized2 = await sharp(buf2)
      .resize(scaledW2, scaledH2, { fit: "contain" })
      .png()
      .toBuffer();

    // Calculate left/top coordinates
    // Center point of canvas is (canvasW / 2, canvasH / 2)
    // Person 1 center: canvasW / 2 + offsetX, bottom aligned at canvasH + offsetY
    const posX1 = Math.round(canvasW / 2 - scaledW1 / 2 + (p1.offsetX * (canvasW / 800)));
    const posY1 = Math.round(canvasH - scaledH1 + (p1.offsetY * (canvasH / 600)));

    const posX2 = Math.round(canvasW / 2 - scaledW2 / 2 + (p2.offsetX * (canvasW / 800)));
    const posY2 = Math.round(canvasH - scaledH2 + (p2.offsetY * (canvasH / 600)));

    const layers = [];
    if (layerOrder === "2_over_1") {
      // Person 1 first (behind), then Person 2 on top
      layers.push({ input: resized1, left: posX1, top: posY1 });
      layers.push({ input: resized2, left: posX2, top: posY2 });
    } else {
      // Person 2 first (behind), then Person 1 on top
      layers.push({ input: resized2, left: posX2, top: posY2 });
      layers.push({ input: resized1, left: posX1, top: posY1 });
    }

    // Compose onto studio background
    const bgRgb = hexToRgb(hexBg);
    const isTransparent = bgColor === "transparent";

    const composedBuffer = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: isTransparent
          ? { r: 0, g: 0, b: 0, alpha: 0 }
          : { r: bgRgb.r, g: bgRgb.g, b: bgRgb.b, alpha: 1 },
      },
    })
      .composite(layers)
      .png()
      .toBuffer();

    if (format === "single_png") {
      return new NextResponse(composedBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": 'attachment; filename="pixelforge-joint-portrait.png"',
        },
      });
    }

    if (format === "single_jpg") {
      const jpgBuffer = await sharp(composedBuffer)
        .flatten({ background: hexBg })
        .jpeg({ quality: 98 })
        .toBuffer();

      return new NextResponse(jpgBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": 'attachment; filename="pixelforge-joint-portrait.jpg"',
        },
      });
    }

    if (format === "sheet_4x6") {
      // 4x6" Studio Print Sheet (1800 x 1200 px @ 300 DPI)
      // Arrange 2 large joint photos (or 4 mini joint photos) on 4x6" print sheet
      const sheetW = 1800;
      const sheetH = 1200;

      const miniW = 840;
      const miniH = 540;

      const miniBuff = await sharp(composedBuffer)
        .resize(miniW, miniH, { fit: "contain", background: hexBg })
        .flatten({ background: hexBg })
        .jpeg({ quality: 98 })
        .toBuffer();

      const printItems = [
        { input: miniBuff, left: 40, top: 40 },
        { input: miniBuff, left: 920, top: 40 },
        { input: miniBuff, left: 40, top: 620 },
        { input: miniBuff, left: 920, top: 620 },
      ];

      const sheetBuffer = await sharp({
        create: {
          width: sheetW,
          height: sheetH,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite(printItems)
        .jpeg({ quality: 100 })
        .toBuffer();

      return new NextResponse(sheetBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": 'attachment; filename="pixelforge-joint-4x6-print-sheet.jpg"',
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Export Joint Error:", error);
    return NextResponse.json({ error: "Failed to export joint photo." }, { status: 500 });
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace(/^#/, "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}
