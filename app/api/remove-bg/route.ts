import { NextRequest, NextResponse } from "next/server";
import { birefnetBridge } from "@/lib/birefnet-bridge";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // base64 string
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (process.env.VERCEL) {
      // In Vercel serverless environment, background removal is executed via WebAssembly on the client
      return NextResponse.json({ 
        error: "Serverless environment detected. Please use client-side AI matting.",
        useClientMatting: true 
      }, { status: 503 });
    }

    console.log("[API /api/remove-bg] Processing image via BiRefNet bridge...");
    const startTime = Date.now();
    
    const resultImage = await birefnetBridge.removeBackground(image);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`[API /api/remove-bg] Processing completed in ${duration.toFixed(2)}s`);

    return NextResponse.json({ resultImage });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("[API /api/remove-bg] Server background removal unavailable:", errorMsg);
    return NextResponse.json({ 
      error: "Background removal engine unavailable on server", 
      details: errorMsg,
      useClientMatting: true
    }, { status: 503 });
  }
}
