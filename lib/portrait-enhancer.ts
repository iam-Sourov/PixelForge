/**
 * High-Performance Portrait Enhancer Utility using OpenCV.js
 * Implements: Skin Smoothing, Lab CLAHE, HSV Vibrance, and Unsharp Masking.
 */

declare global {
  interface Window {
    cv: any;
  }
}

export interface PortraitEnhanceOptions {
  smoothingStep?: number; // How many iterations of bilateral filter
  claheClipLimit?: number;
  claheTileSize?: number;
  vibrance?: number; // 1.0 to 1.3
  sharpness?: number; // 0 to 1.0
}

/**
 * PortraitEnhancement Service
 * Handles memory management and core OpenCV logic.
 */
export class PortraitEnhancer {
  private cv: any;

  constructor(cv: any) {
    this.cv = cv;
  }

  /**
   * Helper: Converts Canvas or Image to Mat
   */
  public static matFromSource(source: HTMLCanvasElement | HTMLImageElement): any {
    return window.cv.imread(source);
  }

  /**
   * Helper: Converts Mat to ImageData
   */
  public static matToImageData(mat: any): ImageData {
    const cv = window.cv;
    const dst = new cv.Mat();
    cv.cvtColor(mat, dst, cv.COLOR_RGBA2BGRA); // Force consistent format if needed, but imread/imshow usually handle it.
    // However, matFromImageData and cvtColor are safer for direct pixel access.
    const imgData = new ImageData(new Uint8ClampedArray(mat.data), mat.cols, mat.rows);
    dst.delete();
    return imgData;
  }

  /**
   * Core AI Portrait Enhancement Pipeline
   */
  public enhance(src: any, options: PortraitEnhanceOptions = {}): any {
    const cv = this.cv;
    const {
      smoothingStep = 1,
      claheClipLimit = 2.0,
      claheTileSize = 8,
      vibrance = 1.15,
      sharpness = 0.5
    } = options;

    let processing = new cv.Mat();
    cv.cvtColor(src, processing, cv.COLOR_RGBA2RGB);

    // 1. Iterative Bilateral Filtering (Skin Smoothing)
    // Preserves edges while smoothing "noise" (skin textures)
    let smooth = new cv.Mat();
    for (let i = 0; i < smoothingStep; i++) {
      cv.bilateralFilter(processing, smooth, 9, 75, 75, cv.BORDER_DEFAULT);
      smooth.copyTo(processing);
    }
    smooth.delete();

    // 2. L-Channel CLAHE (Local Contrast)
    let lab = new cv.Mat();
    cv.cvtColor(processing, lab, cv.COLOR_RGB2Lab);
    let labChannels = new cv.MatVector();
    cv.split(lab, labChannels);
    let lChannel = labChannels.get(0);

    const clahe = new cv.CLAHE(claheClipLimit, new cv.Size(claheTileSize, claheTileSize));
    clahe.apply(lChannel, lChannel);

    labChannels.set(0, lChannel);
    cv.merge(labChannels, lab);
    cv.cvtColor(lab, processing, cv.COLOR_Lab2RGB);

    // Cleanup Lab intermediates
    clahe.delete();
    lChannel.delete();
    labChannels.delete();
    lab.delete();

    // 3. Vibrance Boost (HSV Space)
    let hsv = new cv.Mat();
    cv.cvtColor(processing, hsv, cv.COLOR_RGB2HSV);
    let hsvChannels = new cv.MatVector();
    cv.split(hsv, hsvChannels);
    let sChannel = hsvChannels.get(1);

    // Adjust Saturation
    sChannel.convertTo(sChannel, -1, vibrance, 0);

    hsvChannels.set(1, sChannel);
    cv.merge(hsvChannels, hsv);
    cv.cvtColor(hsv, processing, cv.COLOR_HSV2RGB);

    // Cleanup HSV intermediates
    sChannel.delete();
    hsvChannels.delete();
    hsv.delete();

    // 4. Unsharp Masking (Micro-detail restoration)
    // Formula: Result = Original + (Original - Blurred) * Sharpness
    if (sharpness > 0) {
      let blurred = new cv.Mat();
      cv.GaussianBlur(processing, blurred, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);
      
      // We can use a 3x3 sharpening kernel directly for "micro-details"
      // Kernel: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] scaled by sharpness
      let kernel = cv.matFromArray(3, 3, cv.CV_32F, [
        0, -sharpness, 0,
        -sharpness, 1 + 4 * sharpness, -sharpness,
        0, -sharpness, 0
      ]);
      
      cv.filter2D(processing, processing, -1, kernel);
      
      kernel.delete();
      blurred.delete();
    }

    // 5. Back to RGBA
    let dst = new cv.Mat();
    cv.cvtColor(processing, dst, cv.COLOR_RGB2RGBA);

    processing.delete();
    return dst;
  }
}

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * React Hook for Managed Portrait Enhancement
 */
export function usePortraitEnhancer() {
  const [isReady, setIsReady] = useState(false);
  const enhancerRef = useRef<PortraitEnhancer | null>(null);

  useEffect(() => {
    const checkCV = setInterval(() => {
      if (window.cv && window.cv.Mat) {
        enhancerRef.current = new PortraitEnhancer(window.cv);
        setIsReady(true);
        clearInterval(checkCV);
      }
    }, 100);
    return () => clearInterval(checkCV);
  }, []);

  const processPortrait = useCallback(async (
    source: HTMLCanvasElement | ImageData,
    options: PortraitEnhanceOptions
  ): Promise<ImageData | null> => {
    if (!enhancerRef.current || !window.cv) return null;

    // Use requestAnimationFrame to ensure we don't block the UI immediately
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const cv = window.cv;
        let src;
        
        if (source instanceof ImageData) {
          src = cv.matFromImageData(source);
        } else {
          src = cv.imread(source);
        }

        try {
          const resultMat = enhancerRef.current!.enhance(src, options);
          const outData = new ImageData(
            new Uint8ClampedArray(resultMat.data),
            resultMat.cols,
            resultMat.rows
          );
          
          src.delete();
          resultMat.delete();
          resolve(outData);
        } catch (err) {
          console.error("OpenCV Processing Error:", err);
          src.delete();
          resolve(null);
        }
      });
    });
  }, []);

  return { isReady, processPortrait };
}
