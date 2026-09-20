import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import sharp from "sharp";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { normalizeImageBuffer } from "@/lib/image-buffer";
import { bilateralFilterDenoise } from "@/lib/image-math";

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

const cleanBase64 = (b64: string): { data: string; mimeType: string } => {
  const match = b64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: "image/jpeg", data: b64 };
};

/**
 * Cloud AI Image Enhancement via Gemini Pro / Flash vision models
 */
async function runGeminiEnhancer(
  imageBuffer: Buffer,
  apiKey: string,
  modelId: string,
  mode: string,
  customPrompt?: string
): Promise<{ buffer: Buffer; insights: string }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const cleanModel = modelId.replace(/^models\//, "");
  const model = genAI.getGenerativeModel({ model: cleanModel });

  const promptGuides: Record<string, string> = {
    portrait:
      "You are a master portrait retoucher. Analyze this portrait for skin texture, noise floor, facial exposure, and lighting tone. Provide a concise studio enhancement analysis and output the correction JSON matrix: ```json\n{\"brightness\": 1.04, \"saturation\": 1.05, \"sharpness\": 1.2, \"denoise\": 0.8}\n```",
    super_res:
      "Analyze the high-frequency edge definition, noise artifacts, and resolution scaling of this image. Provide a technical super-resolution analysis and output the correction JSON matrix.",
    low_light:
      "Analyze shadow underexposure, chrominance noise, and dynamic range of this photo. Provide a low-light recovery analysis and output the correction JSON matrix: ```json\n{\"brightness\": 1.15, \"saturation\": 1.08, \"sharpness\": 1.1}\n```",
    custom: `Analyze this image according to custom instruction: "${customPrompt || "Enhance clarity and remaster"}". Output studio notes and correction JSON matrix.`,
  };

  let insights = "Cloud AI Neural Remastering Applied.";
  let multipliers = { brightness: 1.03, saturation: 1.05, sharpness: 1.2 };

  try {
    const result = await model.generateContent([
      promptGuides[mode] || promptGuides.portrait,
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      },
    ]);

    const text = result.response.text();
    insights = text.replace(/```json[\s\S]*?```/, "").trim();

    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      multipliers = {
        brightness: typeof parsed.brightness === "number" ? parsed.brightness : 1.03,
        saturation: typeof parsed.saturation === "number" ? parsed.saturation : 1.05,
        sharpness: typeof parsed.sharpness === "number" ? parsed.sharpness : 1.2,
      };
    }
  } catch (err) {
    console.warn("Gemini vision analysis note:", err);
  }

  // Apply high quality neural tone & texture remastering using Sharp
  const pipeline = sharp(imageBuffer)
    .modulate({
      brightness: Math.min(1.4, Math.max(0.8, multipliers.brightness)),
      saturation: Math.min(1.4, Math.max(0.8, multipliers.saturation)),
    })
    .sharpen({
      sigma: 1.2,
      m1: 1.5,
      m2: 0.7,
    });

  const outBuffer = await pipeline.png().toBuffer();
  return { buffer: outBuffer, insights };
}

/**
 * Executes the Python-based image enhancer script.
 */
function runPythonEnhancer(imageBuffer: Buffer, scriptPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    let proc: ReturnType<typeof spawn> | null = null;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (proc) {
          try {
            proc.kill("SIGKILL");
          } catch (e) {
            console.error("Failed to kill timed-out Python process:", e);
          }
        }
        reject(new Error("Python process timed out."));
      }
    }, 60000);

    const trySpawn = (cmd: string) => {
      let stdoutData = "";
      let stderrData = "";
      
      proc = spawn(cmd, [scriptPath]);

      proc.on("error", (err) => {
        if (resolved) return;
        if (cmd === "python3" && (err as NodeJS.ErrnoException).code === "ENOENT") {
          trySpawn("python");
        } else {
          clearTimeout(timer);
          resolved = true;
          reject(err);
        }
      });

      if (proc.stdout) {
        proc.stdout.on("data", (data) => {
          stdoutData += data.toString();
        });
      }

      if (proc.stderr) {
        proc.stderr.on("data", (data) => {
          stderrData += data.toString();
        });
      }

      proc.on("close", (code) => {
        if (resolved) return;
        clearTimeout(timer);
        resolved = true;
        
        if (code !== 0) {
          reject(new Error(stderrData || `Python process exited with code ${code}`));
        } else {
          resolve(stdoutData);
        }
      });

      try {
        if (proc.stdin) {
          proc.stdin.write(imageBuffer.toString("base64"));
          proc.stdin.end();
        } else {
          throw new Error("stdin stream is null");
        }
      } catch (err) {
        if (!resolved) {
          clearTimeout(timer);
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
 */
async function runNodeEnhancer(imageBuffer: Buffer): Promise<string> {
  let processedSharp = sharp(imageBuffer);
  processedSharp = processedSharp.modulate({ brightness: 1.02, saturation: 1.04 });
  
  const { data, info } = await processedSharp
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rawData = new Uint8ClampedArray(data);
  const imgData = new ImageData(rawData, info.width, info.height);

  const smoothed = bilateralFilterDenoise(imgData, 3.0, 15.0);
  for (let i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i] = smoothed.data[i];
    imgData.data[i + 1] = smoothed.data[i + 1];
    imgData.data[i + 2] = smoothed.data[i + 2];
  }

  const outBuffer = await sharp(Buffer.from(imgData.data), {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .sharpen()
  .png()
  .toBuffer();

  return outBuffer.toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const { image, apiKey, model, mode = "portrait", customPrompt } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const cleaned = cleanBase64(image);
    let imageBuffer: Buffer = Buffer.from(cleaned.data, "base64");

    try {
      imageBuffer = await normalizeImageBuffer(imageBuffer);
    } catch (err) {
      console.warn("Image normalization skipped or failed:", err);
    }

    let enhancedBase64 = "";
    let aiInsights = "";

    // 1. If user provided a Gemini API Key, use Cloud AI remastering
    if (apiKey && apiKey.trim() !== "") {
      try {
        console.log(`Enhancing image using Gemini Cloud AI (${model || "gemini-2.5-pro"})...`);
        const geminiResult = await runGeminiEnhancer(
          imageBuffer,
          apiKey.trim(),
          model || "gemini-2.5-pro",
          mode,
          customPrompt
        );
        enhancedBase64 = geminiResult.buffer.toString("base64");
        aiInsights = geminiResult.insights;
      } catch (geminiErr) {
        console.warn("Gemini Cloud enhancer failed, falling back to local pipeline:", geminiErr);
      }
    }

    // 2. If no cloud result, run local Python/Node enhancer
    if (!enhancedBase64) {
      if (process.env.VERCEL) {
        // Direct ultra-fast Sharp + Node enhancer in Vercel serverless environment
        enhancedBase64 = await runNodeEnhancer(imageBuffer);
      } else {
        const scriptPath = path.join(process.cwd(), "lib", "enhancer.py");
        try {
          enhancedBase64 = await runPythonEnhancer(imageBuffer, scriptPath);
        } catch {
          enhancedBase64 = await runNodeEnhancer(imageBuffer);
        }
      }
    }

    return NextResponse.json({ 
      enhancedImage: `data:image/png;base64,${enhancedBase64.trim()}`,
      aiInsights: aiInsights || undefined,
    });

  } catch (err: unknown) {
    console.error("API error:", err);
    return NextResponse.json({ 
      error: "Server error", 
      details: err instanceof Error ? err.message : String(err) 
    }, { status: 500 });
  }
}
