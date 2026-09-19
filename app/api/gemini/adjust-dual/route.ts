import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import { normalizeImageBuffer } from "@/lib/image-buffer";
import { birefnetBridge } from "@/lib/birefnet-bridge";

interface DualJoinRequest {
  image1: string; // Base64 of Person 1 (Raw or Clean)
  image2: string; // Base64 of Person 2 (Raw or Clean)
  apiKey?: string;
  model?: string;
}

const cleanBase64 = (b64: string): { data: string; mimeType: string } => {
  const match = b64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: "image/png", data: b64 };
};

export async function POST(req: NextRequest) {
  try {
    const body: DualJoinRequest = await req.json();
    const { image1, image2, apiKey, model = "gemini-2.5-pro" } = body;

    if (!image1 || !image2) {
      return NextResponse.json(
        { error: "Both Person 1 and Person 2 photos are required to create a joint photo." },
        { status: 400 }
      );
    }

    const img1Clean = cleanBase64(image1);
    const img2Clean = cleanBase64(image2);

    const rawBuf1 = Buffer.from(img1Clean.data, "base64");
    const rawBuf2 = Buffer.from(img2Clean.data, "base64");

    const normBuf1 = await normalizeImageBuffer(rawBuf1);
    const normBuf2 = await normalizeImageBuffer(rawBuf2);

    const normB64_1 = `data:image/png;base64,${normBuf1.toString("base64")}`;
    const normB64_2 = `data:image/png;base64,${normBuf2.toString("base64")}`;

    console.log("[Joint Photo] Extracting backgrounds for Person 1 and Person 2 in parallel...");

    // 1. Extract backgrounds for both persons concurrently using BiRefNet
    const [person1Transparent, person2Transparent] = await Promise.all([
      birefnetBridge.removeBackground(normB64_1),
      birefnetBridge.removeBackground(normB64_2),
    ]);

    let aiAnalysis = "Studio subject isolation completed. Adjust positioning, head scales, and backdrop in the studio editor.";

    // 2. If Gemini API key is provided, compute studio color & lighting balance
    if (apiKey && apiKey.trim() !== "") {
      try {
        const genAI = new GoogleGenerativeAI(apiKey.trim());
        const cleanModelId = model.replace(/^models\//, "");
        const geminiModel = genAI.getGenerativeModel({ model: cleanModelId });

        const prompt =
          "You are an expert portrait retoucher specializing in Bangladeshi studio joint/duo photographs. Analyze Person 1 (left) and Person 2 (right). Explain how both portraits should be balanced in terms of color temperature, exposure level, and eye-level alignment so they look natural side-by-side as a couple/duo studio shot. Provide a concise 2-3 bullet point summary.";

        const result = await geminiModel.generateContent([
          prompt,
          {
            inlineData: {
              data: normBuf1.toString("base64"),
              mimeType: "image/png",
            },
          },
          {
            inlineData: {
              data: normBuf2.toString("base64"),
              mimeType: "image/png",
            },
          },
        ]);

        aiAnalysis = result.response.text();
      } catch (geminiError) {
        console.warn("[Joint Photo] Gemini analysis warning:", geminiError);
      }
    }

    return NextResponse.json({
      success: true,
      person1Transparent,
      person2Transparent,
      aiAnalysis: aiAnalysis.trim(),
    });
  } catch (err: unknown) {
    console.error("Dual adjust / joint photo error:", err);
    const msg = err instanceof Error ? err.message : "Failed to process 2-picture joint adjustment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
