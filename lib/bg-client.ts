import { isHeicImage, convertHeicToJpeg, processImageForClient } from "./image-client";

export type BgProgressCallback = (message: string, progress?: number) => void;

/**
 * Universal client-side background removal using @imgly/background-removal (WebAssembly/ONNX).
 * Runs completely in-browser with zero backend python or serverless dependencies.
 * Falls back gracefully to /api/remove-bg if available.
 */
export async function removeBackgroundClient(
  imageSource: File | Blob | string,
  onProgress?: BgProgressCallback
): Promise<string> {
  // If running in browser, use @imgly/background-removal
  if (typeof window !== "undefined") {
    try {
      if (onProgress) onProgress("Initializing AI matting engine...", 10);

      let inputBlob: Blob;
      if (typeof imageSource === "string") {
        if (imageSource.startsWith("data:") || imageSource.startsWith("blob:") || imageSource.startsWith("http")) {
          const res = await fetch(imageSource);
          inputBlob = await res.blob();
        } else {
          // raw base64 without prefix
          const byteCharacters = atob(imageSource);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          inputBlob = new Blob([new Uint8Array(byteNumbers)], { type: "image/png" });
        }
      } else if (imageSource instanceof File) {
        inputBlob = await processImageForClient(imageSource);
      } else {
        inputBlob = imageSource;
      }

      const imgly = await import("@imgly/background-removal");
      const removeBgFn = imgly.removeBackground || (imgly as unknown as { default: typeof imgly.removeBackground }).default;

      if (onProgress) onProgress("Extracting subject and isolating edges...", 40);

      const resultBlob = await removeBgFn(inputBlob, {
        progress: (key: string, current: number, total: number) => {
          if (onProgress && total > 0) {
            const percent = Math.min(95, Math.round((current / total) * 100));
            onProgress(`Loading AI model (${key}): ${percent}%`, percent);
          }
        },
      });

      if (onProgress) onProgress("Finalizing HD transparent cutout...", 95);

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            if (onProgress) onProgress("Done!", 100);
            resolve(reader.result);
          } else {
            reject(new Error("Failed to convert cutout to Data URL"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(resultBlob);
      });
    } catch (clientErr) {
      console.warn("[removeBackgroundClient] Client-side WASM removal notice:", clientErr);
      if (onProgress) onProgress("Trying cloud/server extraction...", 60);
    }
  }

  // Fallback to /api/remove-bg if server has Python or if WASM failed
  try {
    let base64String = "";
    if (typeof imageSource === "string") {
      base64String = imageSource;
    } else {
      base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageSource);
      });
    }

    const res = await fetch("/api/remove-bg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64String }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.resultImage) {
        return data.resultImage;
      }
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Background removal service unavailable");
  } catch (err: unknown) {
    console.error("[removeBackgroundClient] Failed all methods:", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to isolate subject background."
    );
  }
}
