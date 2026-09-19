import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "Missing or invalid API key" }, { status: 400 });
    }

    const trimmedKey = apiKey.trim();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const message =
        errData?.error?.message ||
        `Google AI API returned status ${response.status} (${response.statusText})`;
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = await response.json();
    const rawModels: Array<{
      name: string;
      displayName?: string;
      description?: string;
      supportedGenerationMethods?: string[];
    }> = data.models || [];

    // Filter and enrich models suitable for text/vision/generation tasks
    const relevantModels = rawModels
      .filter((m) => {
        const id = m.name.replace(/^models\//, "");
        const genMethods = m.supportedGenerationMethods || [];
        const isContentGen = genMethods.includes("generateContent");
        const isExcluded = id.includes("embedding") || id.includes("aqa");
        return isContentGen && !isExcluded;
      })
      .map((m) => {
        const id = m.name.replace(/^models\//, "");
        const isPro = id.toLowerCase().includes("pro");
        const isFlash = id.toLowerCase().includes("flash");
        const isVision =
          id.includes("vision") ||
          id.includes("gemini-1.5") ||
          id.includes("gemini-2.0") ||
          id.includes("gemini-2.5") ||
          id.includes("gemini-pro");
        const isImageGen = id.toLowerCase().includes("imagen");

        return {
          id,
          name: m.name,
          displayName: m.displayName || id,
          description: m.description || "",
          supportedGenerationMethods: m.supportedGenerationMethods || [],
          isPro,
          isFlash,
          isVision,
          isImageGen,
        };
      });

    // Sort to prioritize latest Pro and Flash models at top
    relevantModels.sort((a, b) => {
      // Prioritize 2.5 > 2.0 > 1.5 > others
      const score = (id: string) => {
        let s = 0;
        if (id.includes("2.5")) s += 100;
        if (id.includes("2.0")) s += 80;
        if (id.includes("1.5")) s += 60;
        if (id.includes("pro")) s += 30;
        if (id.includes("flash")) s += 20;
        return s;
      };
      return score(b.id) - score(a.id);
    });

    return NextResponse.json({
      success: true,
      totalCount: relevantModels.length,
      models: relevantModels,
    });
  } catch (error: unknown) {
    console.error("Error verifying Gemini API key:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
