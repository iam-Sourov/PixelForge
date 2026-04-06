import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { writePsd } from "ag-psd";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const cropStr = formData.get("crop") as string;
    const bgColor = formData.get("bgColor") as string;
    const format = formData.get("format") as string; // 'jpg' or 'psd'

    if (!image || !cropStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const crop = JSON.parse(cropStr); // { x, y, width, height }
    const buffer = Buffer.from(await image.arrayBuffer());

    let hexBg = "#FFFFFF";
    if (bgColor === "gray") hexBg = "#E5E7EB";
    if (bgColor === "blue") hexBg = "#BAE6FD";

    // 1) Crop and Enhance using Sharp
    const singleBuff = await sharp(buffer)
      .extract({ 
        left: Math.max(0, Math.round(crop.x)), 
        top: Math.max(0, Math.round(crop.y)), 
        width: Math.round(crop.width), 
        height: Math.round(crop.height) 
      })
      .resize(413, 531, { fit: "cover" }) // 35x45 mm at 300dpi
      .flatten({ background: hexBg })
      .toFormat("jpeg", { quality: 100 })
      .toBuffer();

    if (format === "jpg") {
      return new NextResponse(singleBuff as any, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": 'attachment; filename="passport.jpg"',
        },
      });
    }

    // 2) PSD format - Composite into 4x6 print layout
    if (format === "psd") {
      const { data, info } = await sharp(singleBuff)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const layerData = new Uint8ClampedArray(data);
      const photoImageData = { width: info.width, height: info.height, data: layerData };

      const sheetW = 1200;
      const sheetH = 1800;
      
      const bgBuffer = Buffer.alloc(sheetW * sheetH * 4, 255);
      const bgImageData = { width: sheetW, height: sheetH, data: new Uint8ClampedArray(bgBuffer) };

      const spacingX = 100;
      const spacingY = 100;
      const startX = Math.round((sheetW - (413 * 2 + spacingX)) / 2);
      const startY = 150;

      const psdData = {
        width: sheetW,
        height: sheetH,
        children: [
          {
            name: "Background",
            imageData: bgImageData,
          },
          {
            name: "Photo 1",
            left: startX,
            top: startY,
            imageData: photoImageData,
          },
          {
            name: "Photo 2",
            left: startX + 413 + spacingX,
            top: startY,
            imageData: photoImageData,
          },
          {
            name: "Photo 3",
            left: startX,
            top: startY + 531 + spacingY,
            imageData: photoImageData,
          },
          {
            name: "Photo 4",
            left: startX + 413 + spacingX,
            top: startY + 531 + spacingY,
            imageData: photoImageData,
          }
        ]
      };

      const psdBuffer = writePsd(psdData as any);
      return new NextResponse(Buffer.from(psdBuffer) as any, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="4x6-print-sheet.psd"',
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error: any) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to process image." }, { status: 500 });
  }
}
