import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const scale = parseInt(formData.get("scale") as string) || 4;
    const faceEnhance = formData.get("face_enhance") === "true";

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Checking if token exists to alert you explicitly if forgotten
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: "API Token missing in .env.local" }, { status: 500 });
    }

    // Convert file to Base64 format for Replicate
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Select optimal Model based on if the user wants to enhance a face
    const modelVersion = faceEnhance
      ? "sczhou/codeformer:7de2ea26c61f15beb5c10d7a4b140b0e27140f01b699ef7f2f1fc4ecbb2b45d5"
      : "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";

    // Replicate Run
    const output = await replicate.run(modelVersion as any, {
      input: {
        image: base64Image,
        scale: scale,
        face_upsample: faceEnhance,
        background_enhance: true,
      },
    });

    return NextResponse.json({ url: output });
  } catch (error) {
    console.error("Enhance API Error:", error);
    return NextResponse.json({ error: "Failed to process image." }, { status: 500 });
  }
}
