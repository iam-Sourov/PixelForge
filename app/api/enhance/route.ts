import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Completely removed Sharp to resolve Windows DLL native module crashing!
  return NextResponse.json({ 
    error: "API deprecated. Enhancement is now natively run in the browser client." 
  }, { status: 400 });
}
