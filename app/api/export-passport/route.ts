import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { writePsd } from "ag-psd";
import { normalizeImageBuffer } from "@/lib/image-buffer";

export async function POST(req: NextRequest) {
  try {
    let buffer: Buffer;
    let crop: { x: number; y: number; width: number; height: number };
    let bgColor = "white";
    let format = "jpg"; // 'jpg', 'png', 'sheet_jpg', 'psd'
    let layout = "combo"; // 'combo', '4x2', '4x1', 'full'
    let sizeType = "bd_passport"; // 'bd_passport', 'bd_nid', 'bd_stamp', 'bd_epassport'

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await req.json();
      bgColor = json.bgColor || "white";
      format = json.format || "jpg";
      layout = json.layout || "combo";
      sizeType = json.sizeType || "bd_passport";

      if (!json.image) {
        return NextResponse.json({ error: "Missing image" }, { status: 400 });
      }

      let rawBase64 = json.image;
      if (rawBase64.startsWith("data:")) {
        rawBase64 = rawBase64.split(",")[1];
      }
      buffer = Buffer.from(rawBase64, "base64");
      const meta = await sharp(buffer).metadata();
      crop = json.crop || { x: 0, y: 0, width: meta.width || 400, height: meta.height || 500 };
    } else {
      const formData = await req.formData();
      const image = formData.get("image") as File;
      const cropStr = formData.get("crop") as string;
      bgColor = (formData.get("bgColor") as string) || "white";
      format = (formData.get("format") as string) || "jpg";
      layout = (formData.get("layout") as string) || "combo";
      sizeType = (formData.get("sizeType") as string) || "bd_passport";

      if (!image) {
        return NextResponse.json({ error: "Missing image parameter" }, { status: 400 });
      }

      buffer = Buffer.from(await image.arrayBuffer());
      if (cropStr) {
        crop = JSON.parse(cropStr);
      } else {
        const meta = await sharp(buffer).metadata();
        crop = { x: 0, y: 0, width: meta.width || 400, height: meta.height || 500 };
      }
    }

    // Normalize format strings
    if (format === "single_jpg") format = "jpg";
    if (format === "single_png") format = "png";

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
    // Standard BD Passport: 35mm x 45mm (413 x 531 px)
    let targetW = 413;
    let targetH = 531;
    let sizeLabel = "passport";

    if (sizeType === "bd_nid") {
      // Official BD Election Commission / Smart Card NID standard: 40mm x 50mm (472 x 590 px)
      targetW = 472;
      targetH = 590;
      sizeLabel = "nid";
    } else if (sizeType === "bd_stamp") {
      // BD Stamp Size: 20mm x 25mm (236 x 295 px)
      targetW = 236;
      targetH = 295;
      sizeLabel = "stamp";
    } else if (sizeType === "bd_epassport") {
      // BD e-Passport / Square Visa: 50mm x 50mm (590 x 590 px)
      targetW = 590;
      targetH = 590;
      sizeLabel = "epassport";
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
          "Content-Disposition": `attachment; filename="bangladesh-${sizeLabel}-photo.jpg"`,
        },
      });
    }

    if (format === "png") {
      return new NextResponse(singleBuff as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="bangladesh-${sizeLabel}-photo.png"`,
        },
      });
    }

    // 2) Generate 4x6 inch Print Sheet (1800 x 1200 px @ 300 DPI)
    const sheetW = 1800;
    const sheetH = 1200;

    // Create a bordered version for easy scissor cutting in photo studios
    const borderedSingleBuff = await sharp(singleBuff)
      .extend({
        top: 1,
        bottom: 1,
        left: 1,
        right: 1,
        background: { r: 209, g: 213, b: 219, alpha: 1 }, // subtle cutting outline #D1D5DB
      })
      .toBuffer();

    // Stamp size version for combo sheets (236 x 295)
    const stampW = 236;
    const stampH = 295;
    const rawStampBuff = await sharp(buffer)
      .extract({ left, top, width, height })
      .resize(stampW, stampH, { fit: "cover" })
      .flatten({ background: hexBg })
      .toFormat("jpeg", { quality: 100 })
      .toBuffer();

    const borderedStampBuff = await sharp(rawStampBuff)
      .extend({
        top: 1,
        bottom: 1,
        left: 1,
        right: 1,
        background: { r: 209, g: 213, b: 219, alpha: 1 },
      })
      .toBuffer();

    interface CompositeLayer {
      input: Buffer;
      top: number;
      left: number;
    }

    const compositeItems: CompositeLayer[] = [];
    const psdChildren: Array<Record<string, unknown>> = [];

    // Background layer for PSD
    const bgBuffer = Buffer.alloc(sheetW * sheetH * 4, 255);
    const bgImageData = { width: sheetW, height: sheetH, data: new Uint8ClampedArray(bgBuffer) };
    psdChildren.push({
      name: "Studio Background",
      imageData: bgImageData,
    });

    const borderedW = targetW + 2;
    const borderedH = targetH + 2;
    const borderedStampW = stampW + 2;
    const borderedStampH = stampH + 2;

    if (layout === "combo") {
      // Bangladeshi Studio Combo Layout: Main Photos on Top + Stamp Photos on Bottom
      if (sizeType === "bd_nid") {
        // Row 1: 3 NID Photos (474 x 592 bordered)
        const countRow1 = 3;
        const totalW1 = countRow1 * borderedW;
        const spacingX1 = Math.max(20, Math.floor((sheetW - totalW1) / (countRow1 + 1)));
        const startX1 = Math.floor((sheetW - (totalW1 + (countRow1 - 1) * spacingX1)) / 2);
        const topY1 = 40;

        for (let c = 0; c < countRow1; c++) {
          compositeItems.push({
            input: borderedSingleBuff,
            left: Math.max(0, startX1 + c * (borderedW + spacingX1)),
            top: topY1,
          });
        }

        // Row 2: 4 Stamp Size Photos (238 x 297 bordered)
        const countRow2 = 4;
        const totalW2 = countRow2 * borderedStampW;
        const spacingX2 = Math.max(20, Math.floor((sheetW - totalW2) / (countRow2 + 1)));
        const startX2 = Math.floor((sheetW - (totalW2 + (countRow2 - 1) * spacingX2)) / 2);
        const topY2 = topY1 + borderedH + Math.max(30, Math.floor((sheetH - (topY1 + borderedH + borderedStampH)) / 2));

        for (let c = 0; c < countRow2; c++) {
          compositeItems.push({
            input: borderedStampBuff,
            left: Math.max(0, startX2 + c * (borderedStampW + spacingX2)),
            top: topY2,
          });
        }
      } else if (sizeType === "bd_epassport") {
        // Row 1: 2 e-Passport Photos
        const countRow1 = 2;
        const totalW1 = countRow1 * borderedW;
        const spacingX1 = Math.max(30, Math.floor((sheetW - totalW1) / (countRow1 + 1)));
        const startX1 = Math.floor((sheetW - (totalW1 + (countRow1 - 1) * spacingX1)) / 2);
        const topY1 = 40;

        for (let c = 0; c < countRow1; c++) {
          compositeItems.push({
            input: borderedSingleBuff,
            left: Math.max(0, startX1 + c * (borderedW + spacingX1)),
            top: topY1,
          });
        }

        // Row 2: 4 Stamp Photos
        const countRow2 = 4;
        const totalW2 = countRow2 * borderedStampW;
        const spacingX2 = Math.max(20, Math.floor((sheetW - totalW2) / (countRow2 + 1)));
        const startX2 = Math.floor((sheetW - (totalW2 + (countRow2 - 1) * spacingX2)) / 2);
        const topY2 = topY1 + borderedH + Math.max(30, Math.floor((sheetH - (topY1 + borderedH + borderedStampH)) / 2));

        for (let c = 0; c < countRow2; c++) {
          compositeItems.push({
            input: borderedStampBuff,
            left: Math.max(0, startX2 + c * (borderedStampW + spacingX2)),
            top: topY2,
          });
        }
      } else if (sizeType === "bd_stamp") {
        // Full stamp sheet (18 stamp photos: 6 cols x 3 rows)
        const cols = 6;
        const rows = 3;
        const totalW = cols * borderedW;
        const totalH = rows * borderedH;
        const spacingX = Math.max(15, Math.floor((sheetW - totalW) / (cols + 1)));
        const spacingY = Math.max(20, Math.floor((sheetH - totalH) / (rows + 1)));
        const startX = Math.floor((sheetW - (totalW + (cols - 1) * spacingX)) / 2);
        const startY = Math.floor((sheetH - (totalH + (rows - 1) * spacingY)) / 2);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            compositeItems.push({
              input: borderedSingleBuff,
              left: Math.max(0, startX + c * (borderedW + spacingX)),
              top: Math.max(0, startY + r * (borderedH + spacingY)),
            });
          }
        }
      } else {
        // Default BD Passport Combo: 4 Passport Photos (413 x 531) + 4 Stamp Size Photos (236 x 295)
        const countRow1 = 4;
        const totalW1 = countRow1 * borderedW;
        const spacingX1 = 25;
        const startX1 = Math.max(0, Math.floor((sheetW - (totalW1 + (countRow1 - 1) * spacingX1)) / 2));
        const topY1 = 60;

        for (let c = 0; c < countRow1; c++) {
          compositeItems.push({
            input: borderedSingleBuff,
            left: startX1 + c * (borderedW + spacingX1),
            top: topY1,
          });
        }

        const countRow2 = 4;
        const totalW2 = countRow2 * borderedStampW;
        const spacingX2 = 40;
        const startX2 = Math.max(0, Math.floor((sheetW - (totalW2 + (countRow2 - 1) * spacingX2)) / 2));
        const topY2 = topY1 + borderedH + 80;

        for (let c = 0; c < countRow2; c++) {
          compositeItems.push({
            input: borderedStampBuff,
            left: startX2 + c * (borderedStampW + spacingX2),
            top: topY2,
          });
        }
      }
    } else {
      // Dynamic grid/row layout that safely fits without negative start coordinates
      let cols = 4;
      let rows = layout === "4x2" || layout === "full" ? 2 : 1;

      if (sizeType === "bd_nid") {
        cols = 3; // 3 * 474 = 1422px <= 1800px
        rows = layout === "4x2" || layout === "full" ? 2 : 1;
      } else if (sizeType === "bd_epassport") {
        cols = 3; // 3 * 592 = 1776px <= 1800px
        rows = layout === "4x2" || layout === "full" ? 2 : 1;
      } else if (sizeType === "bd_stamp") {
        cols = 6;
        rows = layout === "4x2" || layout === "full" ? 3 : 1;
      }

      const totalW = cols * borderedW;
      const totalH = rows * borderedH;

      const spacingX = Math.max(10, Math.floor((sheetW - totalW) / (cols + 1)));
      const spacingY = Math.max(10, Math.floor((sheetH - totalH) / (rows + 1)));

      const startX = Math.max(0, Math.floor((sheetW - (totalW + (cols - 1) * spacingX)) / 2));
      const startY = Math.max(0, Math.floor((sheetH - (totalH + (rows - 1) * spacingY)) / 2));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          compositeItems.push({
            input: borderedSingleBuff,
            left: startX + c * (borderedW + spacingX),
            top: startY + r * (borderedH + spacingY),
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
          "Content-Disposition": `attachment; filename="4x6-print-sheet-bangladesh-${sizeLabel}.jpg"`,
        },
      });
    }

    // 3) PSD Format with real layers
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
          "Content-Disposition": `attachment; filename="4x6-bangladesh-${sizeLabel}-sheet.psd"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid export format" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to export passport/NID photos." }, { status: 500 });
  }
}

