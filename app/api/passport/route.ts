import { NextRequest, NextResponse } from "next/server";
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const bgColor = formData.get("bg_color") as string || "white"; // white, gray, blue

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // 1️⃣ Remove background using the 100% free local Machine Learning model
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const blob = new Blob([fileBuffer], { type: file.type });
    const bgRemovedBlob = await removeBackground(blob);
    
    // Convert back into a buffer for Sharp to read
    const transparentBuffer = Buffer.from(await bgRemovedBlob.arrayBuffer());

    // 2️⃣ Determine exact background hex code
    const backgroundHex = bgColor === "white" 
      ? "#FFFFFF" 
      : bgColor === "gray" 
      ? "#E5E7EB" 
      : bgColor === "blue" 
      ? "#BAE6FD" 
      : "#FFFFFF";

    // 3️⃣ Sharp Composite & Crop
    // Standard international passport ratio: 35mm(W) x 45mm(H) => at 300 DPI this is 413x531 px
    const processedImageBuffer = await sharp(transparentBuffer)
      .resize(413, 531, {
        fit: 'cover',
        position: 'top', // Anchors to the top because passport photos are head-focused
      })
      .flatten({ background: backgroundHex }) // Replace transparent alpha channel with solid color
      .toFormat("png")
      .toBuffer();

    // 4️⃣ Send Image blob directly to client as a downloadable file
    return new NextResponse(processedImageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "attachment; filename=passport_profile.png",
      },
    });
  } catch (error) {
    console.error("Passport Maker Error:", error);
    return NextResponse.json({ error: "Failed to process passport photo." }, { status: 500 });
  }
}
