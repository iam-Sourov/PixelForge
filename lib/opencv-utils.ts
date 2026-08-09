/**
 * Utility to interact with OpenCV.js in a typed way
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cv: any;
  }
}

export type EnhanceOptions = {
  claheClipLimit: number;
  claheTileSize: number;
  saturation: number;
  sharpness: number;
};

export type EnhanceResult = {
  imageData: ImageData;
  blurScore: number;
};

/**
 * Wait for OpenCV to be ready
 */
export async function waitForOpenCV(): Promise<void> {
  return new Promise((resolve) => {
    if (window.cv && window.cv.onRuntimeInitialized) {
      resolve();
      return;
    }
    
    // Check if it's already initialized but didn't trigger callback yet
    if (window.cv && window.cv.Mat) {
       resolve();
       return;
    }

    const check = setInterval(() => {
      if (window.cv && window.cv.Mat) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });
}

/**
 * Universal Image Enhancement using OpenCV.js
 */
export async function enhanceImageOpenCV(
  imageData: ImageData,
  options: EnhanceOptions
): Promise<EnhanceResult> {
  const cv = window.cv;
  if (!cv) throw new Error("OpenCV not loaded");

  // 1. Create Mat from ImageData
  const src = cv.matFromImageData(imageData);
  const dst = new cv.Mat();
  
  // 2. Color Space Conversion (RGB to Lab for luminance enhancement)
  // Note: OpenCV.js reads ImageData as RGBA
  const lab = new cv.Mat();
  cv.cvtColor(src, lab, cv.COLOR_RGBA2RGB); // Remove Alpha for Lab conversion
  cv.cvtColor(lab, lab, cv.COLOR_RGB2Lab);

  // 3. Split channels to access Luminance (L)
  const channels = new cv.MatVector();
  cv.split(lab, channels);
  const lChannel = channels.get(0);

  // 4. Apply CLAHE to L channel
  if (options.claheClipLimit > 0) {
    const clahe = new cv.CLAHE(options.claheClipLimit, new cv.Size(options.claheTileSize, options.claheTileSize));
    clahe.apply(lChannel, lChannel);
    clahe.delete();
  }

  // 5. Merge channels and convert back to RGB
  channels.set(0, lChannel);
  cv.merge(channels, lab);
  cv.cvtColor(lab, dst, cv.COLOR_Lab2RGB);

  // 6. Saturation adjustment (RGB to HSV, adjust S, back to RGB)
  if (options.saturation !== 1.0) {
    const hsv = new cv.Mat();
    cv.cvtColor(dst, hsv, cv.COLOR_RGB2HSV);
    const hsvChannels = new cv.MatVector();
    cv.split(hsv, hsvChannels);
    const sChannel = hsvChannels.get(1);
    
    // Adjust saturation
    sChannel.convertTo(sChannel, -1, options.saturation, 0);
    
    hsvChannels.set(1, sChannel);
    cv.merge(hsvChannels, hsv);
    cv.cvtColor(hsv, dst, cv.COLOR_HSV2RGB);
    
    hsv.delete();
    hsvChannels.delete();
    sChannel.delete();
  }

  // 7. Sharpness (Laplacian-based)
  if (options.sharpness > 0) {
    const laplacian = new cv.Mat();
    cv.Laplacian(dst, laplacian, cv.CV_8U, 1, 1, 0, cv.BORDER_DEFAULT);
    cv.addWeighted(dst, 1.0, laplacian, options.sharpness, 0, dst);
    laplacian.delete();
  }

  // 8. Blur Detection (Variance of Laplacian)
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  const lapMat = new cv.Mat();
  cv.Laplacian(gray, lapMat, cv.CV_64F);
  const mean = new cv.Mat(1, 4, cv.CV_64F);
  const stddev = new cv.Mat(1, 4, cv.CV_64F);
  cv.meanStdDev(lapMat, mean, stddev);
  const blurScore = stddev.data64F[0] * stddev.data64F[0]; // Variance

  // 9. Convert back to RGBA for ImageData compat
  const finalDst = new cv.Mat();
  cv.cvtColor(dst, finalDst, cv.COLOR_RGB2RGBA);

  // 10. Prepare output
  const outImageData = new ImageData(
    new Uint8ClampedArray(finalDst.data),
    finalDst.cols,
    finalDst.rows
  );

  // Cleanup
  src.delete();
  dst.delete();
  lab.delete();
  channels.delete();
  lChannel.delete();
  gray.delete();
  lapMat.delete();
  mean.delete();
  stddev.delete();
  finalDst.delete();

  return {
    imageData: outImageData,
    blurScore: Math.round(blurScore * 100) / 100
  };
}
