import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Reads an image File, renders it to a Canvas (which modern browsers auto-orient
 * based on EXIF metadata), and exports it back as a clean Blob.
 * This bakes in the correct rotation and strips the EXIF tag, preventing
 * third-party libraries (like @imgly/background-removal) from cropping/rotating incorrectly.
 */
export function fixExifOrientation(file: File): Promise<Blob> {
  return new Promise<Blob>(async (resolve) => {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        resolve(file);
        return;
      }
      
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          resolve(file);
        }
      }, "image/png");
    } catch (e) {
      console.error("Error correcting EXIF orientation using ImageBitmap:", e);
      resolve(file); // fallback
    }
  });
}
