import { fixExifOrientation } from "./utils";

export function isHeicImage(file: File | Blob): boolean {
  const type = (file.type || "").toLowerCase();
  if (
    type === "image/heic" ||
    type === "image/heif" ||
    type === "image/heic-sequence" ||
    type === "image/heif-sequence"
  ) {
    return true;
  }
  if ("name" in file && typeof (file as File).name === "string") {
    return /\.(heic|heif)$/i.test((file as File).name);
  }
  return false;
}

export async function convertHeicToJpeg(file: File | Blob): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const resultBlob = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.95,
  });

  const blob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
  const originalName = ("name" in file && typeof (file as File).name === "string")
    ? (file as File).name
    : "photo.heic";
  const newName = originalName.replace(/\.(heic|heif)$/i, ".jpg");

  return new File([blob], newName, { type: "image/jpeg" });
}

/**
 * Ensures any uploaded image (including Apple HEIC/HEIF) is converted
 * into a browser-supported format (JPEG/PNG) with proper orientation.
 */
export async function processImageForClient(file: File): Promise<File> {
  let workingFile: File = file;

  if (isHeicImage(file)) {
    try {
      workingFile = await convertHeicToJpeg(file);
    } catch (err) {
      console.warn("HEIC conversion failed in browser, passing original file:", err);
    }
  }

  try {
    const orientedBlob = await fixExifOrientation(workingFile);
    if (orientedBlob && orientedBlob !== workingFile) {
      const ext = orientedBlob.type === "image/jpeg" ? ".jpg" : ".png";
      const outName = workingFile.name.replace(/\.[^.]+$/, ext);
      return new File([orientedBlob], outName, {
        type: orientedBlob.type || "image/png",
      });
    }
  } catch (err) {
    console.warn("EXIF orientation step skipped:", err);
  }

  return workingFile;
}
