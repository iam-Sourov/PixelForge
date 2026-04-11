import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // base64 string
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Path to python script
    const scriptPath = path.join(process.cwd(), "lib", "enhancer.py");

    const pythonProcess = spawn("python", [scriptPath]);
    
    let result = "";
    let error = "";

    pythonProcess.stdin.write(image.split(",")[1] || image);
    pythonProcess.stdin.end();

    return new Promise((resolve) => {
      pythonProcess.stdout.on("data", (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        error += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error("Python error:", error);
          resolve(NextResponse.json({ error: "Processing failed", details: error }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ enhancedImage: `data:image/png;base64,${result}` }));
        }
      });
    });

  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
