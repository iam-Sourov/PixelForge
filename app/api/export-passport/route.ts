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
    const layout = formData.get("layout") as string; // '4x1' or '4x2'

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
      return new NextResponse(singleBuff as unknown as BodyInit, {
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

      const sheetW = 1800; // 6 inches at 300dpi (Landscape)
      const sheetH = 1200; // 4 inches at 300dpi
      
      const bgBuffer = Buffer.alloc(sheetW * sheetH * 4, 255);
      const bgImageData = { width: sheetW, height: sheetH, data: new Uint8ClampedArray(bgBuffer) };

      const photoW = 413;
      const photoH = 531;
      const cols = 4; // 4 images in a row
      const rows = layout === "4x2" ? 2 : 1; 

      const spacingX = 30;
      const spacingY = 50;
      const startX = Math.round((sheetW - (cols * photoW + (cols - 1) * spacingX)) / 2);
      const startY = Math.round((sheetH - (rows * photoH + (rows - 1) * spacingY)) / 2);

      const children: Array<Record<string, unknown>> = [
        {
          name: "Background",
          imageData: bgImageData,
        }
      ];

      // Generate the images layout based on rows x cols
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          children.push({
            name: `Passport Photo ${r + 1}-${c + 1}`,
            left: startX + c * (photoW + spacingX),
            top: startY + r * (photoH + spacingY),
            imageData: photoImageData,
          });
        }
      }

      const psdData = {
        width: sheetW,
        height: sheetH,
        children: children
      };

      const psdBuffer = writePsd(psdData as import('ag-psd').Psd);
      return new NextResponse(Buffer.from(psdBuffer) as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="4x6-print-sheet.psd"',
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to process image." }, { status: 500 });
  }
}
