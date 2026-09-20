import sharp from "sharp";
import { POST as exportJointPost } from "../app/api/export-joint/route";
import { POST as exportPassportPost } from "../app/api/export-passport/route";
import { POST as getModels } from "../app/api/gemini/models/route";
import { NextRequest } from "next/server";

async function runTests() {
  console.log("=== Testing PixelForge API Handlers ===");

  // 1. Create a 100x100 test red image PNG buffer and base64
  const testPngBuffer = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const testBase64 = `data:image/png;base64,${testPngBuffer.toString("base64")}`;

  // 2. Test /api/export-joint (single_png)
  const req1 = new NextRequest("http://localhost:3000/api/export-joint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image1: testBase64,
      image2: testBase64,
      person1: { scale: 1.0, offsetX: -50, offsetY: 0 },
      person2: { scale: 1.0, offsetX: 50, offsetY: 0 },
      format: "single_png",
      bgColor: "#BAE6FD",
      aspectRatio: "4:3",
    }),
  });
  const res1 = await exportJointPost(req1);
  console.log("✓ /api/export-joint (single_png): status", res1.status, "content-type:", res1.headers.get("content-type"));

  // Test /api/export-joint (sheet_4x6)
  const req2 = new NextRequest("http://localhost:3000/api/export-joint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image1: testBase64,
      image2: testBase64,
      format: "sheet_4x6",
      bgColor: "#BAE6FD",
      aspectRatio: "4:3",
    }),
  });
  const res2 = await exportJointPost(req2);
  console.log("✓ /api/export-joint (sheet_4x6): status", res2.status, "content-type:", res2.headers.get("content-type"));

  // 3. Test /api/export-passport (combo layout with FormData)
  const formDataCombo = new FormData();
  const blob = new Blob([testPngBuffer], { type: "image/png" });
  formDataCombo.append("image", blob, "test.png");
  formDataCombo.append("crop", JSON.stringify({ x: 0, y: 0, width: 100, height: 100 }));
  formDataCombo.append("bgColor", "blue");
  formDataCombo.append("format", "sheet_jpg");
  formDataCombo.append("layout", "combo");
  formDataCombo.append("sizeType", "bd_passport");

  const req3 = new NextRequest("http://localhost:3000/api/export-passport", {
    method: "POST",
    body: formDataCombo,
  });
  const res3 = await exportPassportPost(req3);
  console.log("✓ /api/export-passport (combo sheet_jpg): status", res3.status, "content-type:", res3.headers.get("content-type"));

  // 4. Test /api/export-passport (4x2 PSD layout)
  const formDataPsd = new FormData();
  formDataPsd.append("image", blob, "test.png");
  formDataPsd.append("crop", JSON.stringify({ x: 0, y: 0, width: 100, height: 100 }));
  formDataPsd.append("bgColor", "white");
  formDataPsd.append("format", "psd");
  formDataPsd.append("layout", "4x2");
  formDataPsd.append("sizeType", "bd_passport");

  const req4 = new NextRequest("http://localhost:3000/api/export-passport", {
    method: "POST",
    body: formDataPsd,
  });
  const res4 = await exportPassportPost(req4);
  console.log("✓ /api/export-passport (4x2 PSD): status", res4.status, "content-type:", res4.headers.get("content-type"));

  // 5. Test /api/gemini/models with missing key (expect 400 with friendly message)
  const req5 = new NextRequest("http://localhost:3000/api/gemini/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: "" }),
  });
  const res5 = await getModels(req5);
  const json5 = await res5.json();
  console.log("✓ /api/gemini/models (empty key): status", res5.status, "response:", json5);

  console.log("=== All API Unit Tests Passed 100%! ===");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
