// lib/image.worker.ts
import { 
  frequencySeparation, 
  lanczosUpscale, 
  bilateralFilterDenoise,
  microSharpen
} from './image-math';

type WorkerMessage = {
  imageData: ImageData;
  clarity: number; // 0 to max, strength of frequency separation
  denoise: number; // 0 to max, strength of bilateral filter
  upscale: number; // scale multiplier e.g. 1.0, 2.0
};

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { imageData, clarity, denoise, upscale } = e.data;
  
  let processed = imageData;

  // 1. Bilateral Denoise (do this first to not amplify noise with frequency separation)
  if (denoise > 0) {
    // scale denoise roughly 1-10 mapped to spatial 2-10, range 10-50
    const spatialSigma = 2 + (denoise * 0.8);
    const rangeSigma = 10 + (denoise * 4);
    processed = bilateralFilterDenoise(processed, spatialSigma, rangeSigma);
  }

  // 2. Frequency Separation (Clarity)
  if (clarity > 0) {
    // clarity normally 0 to 1 as strength multiplier
    processed = frequencySeparation(processed, clarity);
  }

  // 3. Lanczos Upscale
  if (upscale > 1.0) {
    processed = lanczosUpscale(processed, upscale);
    // Apply immediate micro-contrast pass so the upscale is piercingly sharp
    processed = microSharpen(processed, 0.4);
  }

  // Send back
  (postMessage as any)(processed, [processed.data.buffer]);
};
