import { NextRequest, NextResponse } from "next/server";
import { removeBackground } from "@imgly/background-removal-node";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Convert file to Blob format required by imgly AI
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = new Blob([buffer], { type: file.type });

    // Execute the 100% completely FREE local AI model
    const transparentBlob = await removeBackground(blob);
    
    // Convert back to Base64 to return to the frontend
    const transparentBuffer = Buffer.from(await transparentBlob.arrayBuffer());
    const base64Image = `data:image/png;base64,${transparentBuffer.toString("base64")}`;

    // The output is a highly-transparent PNG wrapped in base64
    return NextResponse.json({ url: base64Image });
  } catch (error) {
    console.error("Remove-BG Error:", error);
    return NextResponse.json({ error: "Failed to extract background." }, { status: 500 });
  }
}
