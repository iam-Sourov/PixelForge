import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { writePsd } from "ag-psd";
import { normalizeImageBuffer } from "@/lib/image-buffer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const cropStr = formData.get("crop") as string;
    const bgColor = (formData.get("bgColor") as string) || "white";
    const format = (formData.get("format") as string) || "jpg"; // 'jpg', 'png', 'sheet_jpg', 'psd'
    const layout = (formData.get("layout") as string) || "4x1"; // '4x1', '4x2', 'combo'
    const sizeType = (formData.get("sizeType") as string) || "bd_passport"; // 'bd_passport', 'bd_stamp', 'bd_epassport'

    if (!image || !cropStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const crop = JSON.parse(cropStr); // { x, y, width, height }
    let buffer: Buffer = Buffer.from(await image.arrayBuffer());
    try {
      buffer = await normalizeImageBuffer(buffer);
    } catch (e) {
      console.warn("Passport buffer normalize error:", e);
    }

    let hexBg = "#FFFFFF";
    if (bgColor === "gray") hexBg = "#E5E7EB";
    if (bgColor === "blue") hexBg = "#BAE6FD";
    if (bgColor === "offwhite") hexBg = "#F8FAFC";

    // Target dimensions at 300 DPI
    let targetW = 413; // 35mm
    let targetH = 531; // 45mm

    if (sizeType === "bd_stamp") {
      targetW = 236; // 20mm
      targetH = 295; // 25mm
    } else if (sizeType === "bd_epassport") {
      targetW = 590; // 50mm
      targetH = 590; // 50mm
    }

    // 1) Crop and Enhance using Sharp
    const meta = await sharp(buffer).metadata();
    const imgWidth = meta.width || 0;
    const imgHeight = meta.height || 0;

    const left = Math.max(0, Math.round(crop.x));
    const top = Math.max(0, Math.round(crop.y));
    let width = Math.round(crop.width);
    let height = Math.round(crop.height);

    if (imgWidth > 0 && left + width > imgWidth) {
      width = Math.max(1, imgWidth - left);
    }
    if (imgHeight > 0 && top + height > imgHeight) {
      height = Math.max(1, imgHeight - top);
    }

    const singleBuff = await sharp(buffer)
      .extract({
        left,
        top,
        width,
        height,
      })
      .resize(targetW, targetH, { fit: "cover" })
      .flatten({ background: hexBg })
      .toFormat(format === "png" ? "png" : "jpeg", { quality: 100 })
      .toBuffer();

    if (format === "jpg") {
      return new NextResponse(singleBuff as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": 'attachment; filename="bangladesh-passport.jpg"',
        },
      });
    }

    if (format === "png") {
      return new NextResponse(singleBuff as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": 'attachment; filename="bangladesh-passport.png"',
        },
      });
    }

    // 2) Generate 4x6 inch Print Sheet (1800 x 1200 px @ 300 DPI)
    const sheetW = 1800;
    const sheetH = 1200;

    // Create a Stamp size version if needed for combo sheet
    const stampBuff = await sharp(buffer)
      .extract({ left, top, width, height })
      .resize(236, 295, { fit: "cover" })
      .flatten({ background: hexBg })
      .toFormat("png")
      .toBuffer();

    interface CompositeLayer {
      input: Buffer;
      top: number;
      left: number;
    }

    const compositeItems: CompositeLayer[] = [];
    const psdChildren: Array<Record<string, unknown>> = [];

    // Background layer
    const bgBuffer = Buffer.alloc(sheetW * sheetH * 4, 255);
    const bgImageData = { width: sheetW, height: sheetH, data: new Uint8ClampedArray(bgBuffer) };
    psdChildren.push({
      name: "Studio Background",
      imageData: bgImageData,
    });

    if (layout === "combo") {
      // Bangladeshi Studio Combo Layout: 4 Passport Photos (top/main) + 2 Stamp Size Photos (bottom/side)
      // Row 1: 4 Passport Photos (413 x 531)
      const passportSpacingX = 25;
      const startX = Math.round((sheetW - (4 * targetW + 3 * passportSpacingX)) / 2);
      const topY = 60;

      for (let c = 0; c < 4; c++) {
        const posX = startX + c * (targetW + passportSpacingX);
        compositeItems.push({
          input: singleBuff,
          left: posX,
          top: topY,
        });
      }

      // Row 2: 2 Stamp Size Photos (236 x 295) + 2 Passport photos or Stamp photos
      const stampW = 236;
      const stampH = 295;
      const stampSpacingX = 40;
      const stampStartX = Math.round((sheetW - (4 * stampW + 3 * stampSpacingX)) / 2);
      const stampTopY = topY + targetH + 80;

      for (let c = 0; c < 4; c++) {
        const posX = stampStartX + c * (stampW + stampSpacingX);
        compositeItems.push({
          input: stampBuff,
          left: posX,
          top: stampTopY,
        });
      }
    } else {
      // Standard 4x1 or 4x2 layout
      const cols = 4;
      const rows = layout === "4x2" ? 2 : 1;
      const spacingX = 30;
      const spacingY = 50;
      const startX = Math.round((sheetW - (cols * targetW + (cols - 1) * spacingX)) / 2);
      const startY = Math.round((sheetH - (rows * targetH + (rows - 1) * spacingY)) / 2);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          compositeItems.push({
            input: singleBuff,
            left: startX + c * (targetW + spacingX),
            top: startY + r * (targetH + spacingY),
          });
        }
      }
    }

    if (format === "sheet_jpg") {
      const sheetBuffer = await sharp({
        create: {
          width: sheetW,
          height: sheetH,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite(compositeItems)
        .jpeg({ quality: 100 })
        .toBuffer();

      return new NextResponse(sheetBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": 'attachment; filename="4x6-print-sheet-bangladesh.jpg"',
        },
      });
    }

    // 3) PSD Format
    if (format === "psd") {
      for (let i = 0; i < compositeItems.length; i++) {
        const item = compositeItems[i];
        const { data, info } = await sharp(item.input)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        psdChildren.push({
          name: `Photo #${i + 1}`,
          left: item.left,
          top: item.top,
          imageData: {
            width: info.width,
            height: info.height,
            data: new Uint8ClampedArray(data),
          },
        });
      }

      const psdData = {
        width: sheetW,
        height: sheetH,
        children: psdChildren,
      };

      const psdBuffer = writePsd(psdData as import("ag-psd").Psd);
      return new NextResponse(Buffer.from(psdBuffer) as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="4x6-bangladesh-passport-sheet.psd"',
        },
      });
    }

    return NextResponse.json({ error: "Invalid export format" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to export passport photos." }, { status: 500 });
  }
}
