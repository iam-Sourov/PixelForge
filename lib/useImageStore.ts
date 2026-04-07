import { create } from 'zustand';

interface ImageState {
  originalImageData: ImageData | null;
  processedImageData: ImageData | null;
  setOriginalImageData: (data: ImageData | null) => void;
  setProcessedImageData: (data: ImageData | null) => void;
  clearImages: () => void;
}

export const useImageStore = create<ImageState>((set) => ({
  originalImageData: null,
  processedImageData: null,
  setOriginalImageData: (data) => set({ originalImageData: data }),
  setProcessedImageData: (data) => set({ processedImageData: data }),
  clearImages: () => set({ originalImageData: null, processedImageData: null }),
}));
