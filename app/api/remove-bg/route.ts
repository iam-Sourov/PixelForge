import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Direct frontend to use the client-side WebAssembly ONNX matting engine (@imgly/background-removal)
    return NextResponse.json({ 
      error: "Using client-side neural matting.",
      useClientMatting: true 
    }, { status: 503 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ 
      error: "Background removal engine unavailable on server", 
      details: errorMsg,
      useClientMatting: true
    }, { status: 503 });
  }
}
