// lib/image-math.ts

export const KERNELS = {
  sharpen: [
     0, -1,  0,
    -1,  5, -1,
     0, -1,  0
  ],
  boxBlur: [
    1/9, 1/9, 1/9,
    1/9, 1/9, 1/9,
    1/9, 1/9, 1/9
  ],
  gaussianBlur: [
    1/16, 2/16, 1/16,
    2/16, 4/16, 2/16,
    1/16, 2/16, 1/16
  ],
  edgeDetect: [
    -1, -1, -1,
    -1,  8, -1,
    -1, -1, -1
  ]
};

export function applyBrightnessContrast(imageData: ImageData, brightness: number, contrast: number): ImageData {
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < src.length; i += 4) {
    out[i] = factor * (src[i] - 128) + 128 + brightness;
    out[i + 1] = factor * (src[i + 1] - 128) + 128 + brightness;
    out[i + 2] = factor * (src[i + 2] - 128) + 128 + brightness;
    out[i + 3] = src[i + 3]; // keep alpha
  }
  return new ImageData(out, imageData.width, imageData.height);
}

function rgbToLuma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function lumaToRgb(r: number, g: number, b: number, lumaTarget: number) {
  const lumaCurrent = rgbToLuma(r, g, b);
  const diff = lumaTarget - lumaCurrent;
  return [r + diff, g + diff, b + diff];
}

// Industry-standard Fast Box Blur (Separable, Moving Window) O(N)
function fastBoxBlur1D(src: Uint8ClampedArray, out: Uint8ClampedArray, w: number, h: number, radius: number, isHorizontal: boolean) {
  const diameter = radius * 2 + 1;
  for (let i = 0; i < (isHorizontal ? h : w); i++) {
    let r = 0, g = 0, b = 0;
    
    // Initial window calculation
    for (let k = -radius; k <= radius; k++) {
      let calcIdx;
      if (isHorizontal) {
        calcIdx = (i * w + Math.min(Math.max(k, 0), w - 1)) * 4;
      } else {
        calcIdx = (Math.min(Math.max(k, 0), h - 1) * w + i) * 4;
      }
      r += src[calcIdx];
      g += src[calcIdx + 1];
      b += src[calcIdx + 2];
    }
    
    for (let j = 0; j < (isHorizontal ? w : h); j++) {
      let outIdx = isHorizontal ? (i * w + j) * 4 : (j * w + i) * 4;
      out[outIdx] = r / diameter;
      out[outIdx + 1] = g / diameter;
      out[outIdx + 2] = b / diameter;
      out[outIdx + 3] = src[outIdx + 3];
      
      let nextIdx, prevIdx;
      if (isHorizontal) {
        nextIdx = (i * w + Math.min(j + radius + 1, w - 1)) * 4;
        prevIdx = (i * w + Math.max(j - radius, 0)) * 4;
      } else {
        nextIdx = (Math.min(j + radius + 1, h - 1) * w + i) * 4;
        prevIdx = (Math.max(j - radius, 0) * w + i) * 4;
      }
      
      r += src[nextIdx] - src[prevIdx];
      g += src[nextIdx + 1] - src[prevIdx + 1];
      b += src[nextIdx + 2] - src[prevIdx + 2];
    }
  }
}

export function fastGaussianBlur(imageData: ImageData, radius: number): ImageData {
  let src = imageData.data;
  let w = imageData.width;
  let h = imageData.height;
  let out1 = new Uint8ClampedArray(src.length);
  let out2 = new Uint8ClampedArray(src.length);
  
  // 3 passes of box blur approximate Gaussian perfectly
  // Using reduced radius to match true sigma
  let boxRadius = Math.floor(Math.sqrt((radius * radius * 12) / 3 + 1));
  if (boxRadius < 1) boxRadius = 1;

  for (let pass = 0; pass < 3; pass++) {
    fastBoxBlur1D(pass === 0 ? src : out2, out1, w, h, boxRadius, true); // Horizontal
    fastBoxBlur1D(out1, out2, w, h, boxRadius, false); // Vertical
  }
  
  return new ImageData(out2, w, h);
}


function clamp(val: number): number {
  return Math.min(Math.max(val, 0), 255);
}

// 1. Pro Frequency Separation (Clarity via High Pass Blend)
export function frequencySeparation(original: ImageData, strength: number, blurRadius: number = 4): ImageData {
  const blurred = fastGaussianBlur(original, blurRadius);

  const src = original.data;
  const blur = blurred.data;
  const out = new Uint8ClampedArray(src.length);

  for (let i = 0; i < src.length; i += 4) {
    // Standard robust Unsharp/Clarity: O + (O - B) * S
    // This perfectly extracts the detail layer and boosts it, avoiding Luma conversion color clipping.
    out[i] = clamp(src[i] + (src[i] - blur[i]) * strength);
    out[i+1] = clamp(src[i+1] + (src[i+1] - blur[i+1]) * strength);
    out[i+2] = clamp(src[i+2] + (src[i+2] - blur[i+2]) * strength);
    out[i+3] = src[i+3];
  }
  return new ImageData(out, original.width, original.height);
}

// 2. Lanczos-3 Resampling (Robust, Precise Upscaling)
function sinc(x: number) {
  if (x === 0) return 1;
  const piX = Math.PI * x;
  return Math.sin(piX) / piX;
}

function lanczosKernel(x: number, a: number = 3) {
  if (x === 0) return 1;
  if (Math.abs(x) >= a) return 0;
  return sinc(x) * sinc(x / a);
}

export function lanczosUpscale(imageData: ImageData, scale: number): ImageData {
  if (scale === 1) return imageData;
  const a = 3;
  const src = imageData.data;
  const sw = imageData.width;
  const sh = imageData.height;
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  const out = new Uint8ClampedArray(dw * dh * 4);

  for (let dy = 0; dy < dh; dy++) {
    for (let dx = 0; dx < dw; dx++) {
      const dstOff = (dy * dw + dx) * 4;
      
      const sx = dx / scale;
      const sy = dy / scale;
      
      const ix = Math.floor(sx);
      const iy = Math.floor(sy);
      
      let r = 0, g = 0, b = 0, weightSum = 0;
      
      for (let cy = iy - a + 1; cy <= iy + a; cy++) {
        for (let cx = ix - a + 1; cx <= ix + a; cx++) {
          if (cx >= 0 && cx < sw && cy >= 0 && cy < sh) {
            const wx = lanczosKernel(sx - cx, a);
            const wy = lanczosKernel(sy - cy, a);
            const w = wx * wy;
            
            const srcOff = (cy * sw + cx) * 4;
            r += src[srcOff] * w;
            g += src[srcOff + 1] * w;
            b += src[srcOff + 2] * w;
            weightSum += w;
          }
        }
      }
      
      if (weightSum > 0.0001) {
        out[dstOff] = clamp(r / weightSum);
        out[dstOff + 1] = clamp(g / weightSum);
        out[dstOff + 2] = clamp(b / weightSum);
      }
      out[dstOff + 3] = 255;
    }
  }
  return new ImageData(out, dw, dh);
}

// 3. Bilateral Filtering (ULTRA-FAST 1D Separable Approximation)
// Separates the Non-Linear filter into Horizontal and Vertical passes for O(N) instant compute
function bilateralPass1D(src: Uint8ClampedArray, out: Uint8ClampedArray, w: number, h: number, radius: number, spatialTable: Float32Array, rangeTable: Float32Array, isHorizontal: boolean) {
  for (let i = 0; i < (isHorizontal ? h : w); i++) {
    for (let j = 0; j < (isHorizontal ? w : h); j++) {
      const idx = isHorizontal ? (i * w + j) * 4 : (j * w + i) * 4;
      let r = 0, g = 0, b = 0, weightSum = 0;
      
      const cr = src[idx];
      const cg = src[idx + 1];
      const cb = src[idx + 2];

      for (let k = -radius; k <= radius; k++) {
        let neighborIdx;
        if (isHorizontal) {
          neighborIdx = (i * w + Math.min(Math.max(j + k, 0), w - 1)) * 4;
        } else {
          neighborIdx = (Math.min(Math.max(j + k, 0), h - 1) * w + i) * 4;
        }

        const nr = src[neighborIdx];
        const ng = src[neighborIdx + 1];
        const nb = src[neighborIdx + 2];

        // fast intensity diff
        const dr = nr - cr;
        const dg = ng - cg;
        const db = nb - cb;
        const intensityDistSq = dr*dr + dg*dg + db*db;

        const spatialWeight = spatialTable[Math.abs(k)];
        const rangeWeight = rangeTable[intensityDistSq];
        const weight = spatialWeight * rangeWeight;

        r += nr * weight;
        g += ng * weight;
        b += nb * weight;
        weightSum += weight;
      }
      
      if (weightSum > 0.0001) {
        out[idx] = clamp(r / weightSum);
        out[idx + 1] = clamp(g / weightSum);
        out[idx + 2] = clamp(b / weightSum);
      } else {
        out[idx] = cr;
        out[idx + 1] = cg;
        out[idx + 2] = cb;
      }
      out[idx + 3] = src[idx + 3];
    }
  }
}

export function bilateralFilterDenoise(imageData: ImageData, spatialSigma: number, rangeSigma: number): ImageData {
  const src = imageData.data;
  const sw = imageData.width;
  const sh = imageData.height;
  const out1 = new Uint8ClampedArray(src.length);
  const out2 = new Uint8ClampedArray(src.length);
  
  const kernelRadius = Math.ceil(spatialSigma * 2.5);
  const spatialSigmaSq2 = 2 * spatialSigma * spatialSigma;
  const rangeSigmaSq2 = 2 * rangeSigma * rangeSigma;

  // 1D Spatial Table
  const spatialTable = new Float32Array(kernelRadius + 1);
  for (let k = 0; k <= kernelRadius; k++) {
    spatialTable[k] = Math.exp(-(k * k) / spatialSigmaSq2);
  }

  // 1D Range Table (MAX = 255^2 * 3 = 195075)
  const MAX_INTENSITY_SQ = 195075;
  const rangeTable = new Float32Array(MAX_INTENSITY_SQ + 1);
  for (let i = 0; i <= MAX_INTENSITY_SQ; i++) {
    rangeTable[i] = Math.exp(-i / rangeSigmaSq2);
  }

  // Horizontal Pass
  bilateralPass1D(src, out1, sw, sh, kernelRadius, spatialTable, rangeTable, true);
  // Vertical Pass
  bilateralPass1D(out1, out2, sw, sh, kernelRadius, spatialTable, rangeTable, false);

  return new ImageData(out2, sw, sh);
}

// 4. Micro-Contrast Sharpener (Applied after upscaling for immediate clarity)
export function microSharpen(imageData: ImageData, strength: number = 0.5): ImageData {
  if (strength <= 0) return imageData;
  const src = imageData.data;
  const sw = imageData.width;
  const sh = imageData.height;
  const out = new Uint8ClampedArray(src.length);
  
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      
      // Get neighbors (cross)
      const top = (Math.max(y - 1, 0) * sw + x) * 4;
      const bottom = (Math.min(y + 1, sh - 1) * sw + x) * 4;
      const left = (y * sw + Math.max(x - 1, 0)) * 4;
      const right = (y * sw + Math.min(x + 1, sw - 1)) * 4;

      for (let c = 0; c < 3; c++) {
        // Laplace Edge extraction (5x center - sides) -> 4x center - sides = High Pass
        const edge = 4 * src[i + c] - src[top + c] - src[bottom + c] - src[left + c] - src[right + c];
        out[i + c] = clamp(src[i + c] + edge * strength);
      }
      out[i + 3] = src[i + 3];
    }
  }
  return new ImageData(out, sw, sh);
}
