import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import sharp from "sharp";
import { 
  bilateralFilterDenoise, 
  frequencySeparation, 
  microSharpen 
} from "@/lib/image-math";

// ImageData polyfill for Node.js backend environment
if (typeof globalThis.ImageData === "undefined") {
  globalThis.ImageData = class ImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = data;
    }
  } as unknown as typeof globalThis.ImageData;
}

/**
 * Executes the Python-based image enhancer script.
 * Safely handles python3/python detection and processes lifecycle.
 */
function runPythonEnhancer(imageBuffer: Buffer, scriptPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const trySpawn = (cmd: string) => {
      let stdoutData = "";
      let stderrData = "";
      
      const proc = spawn(cmd, [scriptPath]);

      proc.on("error", (err) => {
        if (resolved) return;
        
        // If python3 is not found, try python
        if (cmd === "python3" && (err as NodeJS.ErrnoException).code === "ENOENT") {
          console.warn("python3 not found, trying python...");
          trySpawn("python");
        } else {
          resolved = true;
          reject(err);
        }
      });

      proc.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });

      proc.stderr.on("data", (data) => {
        stderrData += data.toString();
      });

      proc.on("close", (code) => {
        if (resolved) return;
        resolved = true;
        
        if (code !== 0) {
          reject(new Error(stderrData || `Python process exited with code ${code}`));
        } else {
          resolve(stdoutData);
        }
      });

      // Write base64 image data to process stdin
      try {
        proc.stdin.write(imageBuffer.toString("base64"));
        proc.stdin.end();
      } catch (err) {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      }
    };

    trySpawn("python3");
  });
}

/**
 * Pure Node.js fallback image enhancer pipeline.
 * Replicates the Python script behavior using sharp and lib/image-math filters.
 */
async function runNodeEnhancer(imageBuffer: Buffer): Promise<string> {
  // 1. Load image and conditionally apply CLAHE based on resolution
  let processedSharp = sharp(imageBuffer);
  try {
    const meta = await processedSharp.metadata();
    if (meta.width && meta.width >= 8 && meta.height && meta.height >= 8) {
      processedSharp = processedSharp.clahe({ width: 8, height: 8, maxSlope: 1 });
    }
  } catch (e) {
    console.warn("Skipping CLAHE due to metadata read failure:", e);
  }
  
  processedSharp = processedSharp.modulate({ brightness: 1.02, saturation: 1.1 });
  
  const { data, info } = await processedSharp
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 2. Prepare ImageData for JS filters
  const rawData = new Uint8ClampedArray(data);
  let imgData = new ImageData(rawData, info.width, info.height);

  // Detect if image is grayscale/B&W by analyzing channel variance
  let isGrayscale = true;
  for (let i = 0; i < rawData.length; i += 4) {
    const r = rawData[i];
    const g = rawData[i + 1];
    const b = rawData[i + 2];
    if (Math.abs(r - g) > 8 || Math.abs(r - b) > 8 || Math.abs(g - b) > 8) {
      isGrayscale = false;
      break;
    }
  }

  // 3. Apply Calibrated Denoising & Smoothing (Bilateral Filter blended 30% with 70% original)
  // Calibrated with spatialSigma = 3.0 and rangeSigma = 15.0 to wash out color grain while retaining skin texture
  const smoothed = bilateralFilterDenoise(imgData, 3.0, 15.0);
  for (let i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i] = Math.min(255, Math.max(0, Math.round(imgData.data[i] * 0.7 + smoothed.data[i] * 0.3)));
    imgData.data[i + 1] = Math.min(255, Math.max(0, Math.round(imgData.data[i + 1] * 0.7 + smoothed.data[i + 1] * 0.3)));
    imgData.data[i + 2] = Math.min(255, Math.max(0, Math.round(imgData.data[i + 2] * 0.7 + smoothed.data[i + 2] * 0.3)));
  }

  // 4. Apply Frequency Separation (Detail / Clarity boost) - Softened
  imgData = frequencySeparation(imgData, 0.08);

  // 5. Apply micro-sharpening - Thresholded at 15 to bypass noise/grain
  imgData = microSharpen(imgData, 0.15, 15);

  // 6. Cool temperature adjustment: slightly boost blue channel (channel index 2 in RGBA)
  // Bypassed for grayscale images to maintain neutral black & white tones
  if (!isGrayscale) {
    const outData = imgData.data;
    for (let i = 0; i < outData.length; i += 4) {
      outData[i + 2] = Math.min(255, outData[i + 2] + 2);
    }
  }

  // 7. Re-encode raw pixels back to PNG base64 using sharp
  const outBuffer = await sharp(Buffer.from(imgData.data), {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .png()
  .toBuffer();

  return outBuffer.toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // base64 string
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Strip out base64 URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    const scriptPath = path.join(process.cwd(), "lib", "enhancer.py");

    let enhancedBase64 = "";
    try {
      console.log("Attempting image enhancement via Python script...");
      enhancedBase64 = await runPythonEnhancer(imageBuffer, scriptPath);
      console.log("Python image enhancement succeeded.");
    } catch (pythonError: unknown) {
      const errorMsg = pythonError instanceof Error ? pythonError.message : String(pythonError);
      console.warn("Python enhancer failed or not available. Falling back to native Node.js pipeline.", errorMsg);
      try {
        enhancedBase64 = await runNodeEnhancer(imageBuffer);
        console.log("Node.js image enhancement fallback succeeded.");
      } catch (nodeError: unknown) {
        console.error("Node.js enhancement fallback failed:", nodeError);
        return NextResponse.json({ 
          error: "Processing failed", 
          details: nodeError instanceof Error ? nodeError.message : String(nodeError) 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      enhancedImage: `data:image/png;base64,${enhancedBase64.trim()}` 
    });

  } catch (err: unknown) {
    console.error("API error:", err);
    return NextResponse.json({ 
      error: "Server error", 
      details: err instanceof Error ? err.message : String(err) 
    }, { status: 500 });
  }
}

