import { NextRequest, NextResponse } from "next/server";
import { removeBackground } from "@imgly/background-removal-node";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // 1️⃣ Remove background using the free local Machine Learning model
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const blob = new Blob([fileBuffer], { type: file.type });
    
    console.log("Starting background removal chunk...");
    const bgRemovedBlob = await removeBackground(blob);
    console.log("Background removed successfully!");

    // Send transparent Blob directly back to client. 
    // We will bypass Sharp and do the compositing purely in the browser!
    const transparentBuffer = Buffer.from(await bgRemovedBlob.arrayBuffer());

    return new NextResponse(transparentBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "attachment; filename=passport_transparent.png",
      },
    });
  } catch (error) {
    console.error("Passport API Error:", error);
    return NextResponse.json({ error: "Failed to cleanly remove background." }, { status: 500 });
  }
}
