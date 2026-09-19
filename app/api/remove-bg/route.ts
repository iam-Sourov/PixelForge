import { NextRequest, NextResponse } from "next/server";
import { birefnetBridge } from "@/lib/birefnet-bridge";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // base64 string
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    console.log("[API /api/remove-bg] Processing image via BiRefNet bridge...");
    const startTime = Date.now();
    
    const resultImage = await birefnetBridge.removeBackground(image);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`[API /api/remove-bg] Processing completed in ${duration.toFixed(2)}s`);

    return NextResponse.json({ resultImage });
  } catch (err: any) {
    console.error("[API /api/remove-bg] Error processing image:", err);
    return NextResponse.json({ 
      error: "Background removal failed", 
      details: err.message || String(err) 
    }, { status: 500 });
  }
}
