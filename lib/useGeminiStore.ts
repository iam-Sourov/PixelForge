import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GeminiModelInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  supportedGenerationMethods: string[];
  isPro: boolean;
  isFlash?: boolean;
  isVision: boolean;
  isImageGen: boolean;
}

interface GeminiState {
  apiKey: string;
  selectedModel: string;
  availableModels: GeminiModelInfo[];
  isValidating: boolean;
  isKeyModalOpen: boolean;
  hasPromptedInitial: boolean;
  lastValidatedKey: string;
  
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setAvailableModels: (models: GeminiModelInfo[]) => void;
  setIsValidating: (val: boolean) => void;
  setIsKeyModalOpen: (open: boolean) => void;
  setHasPromptedInitial: (val: boolean) => void;
  validateAndFetchModels: (key: string) => Promise<{ success: boolean; models?: GeminiModelInfo[]; error?: string }>;
  clearKey: () => void;
}

export const useGeminiStore = create<GeminiState>()(
  persist(
    (set, get) => ({
      apiKey: "",
      selectedModel: "gemini-2.5-pro",
      availableModels: [],
      isValidating: false,
      isKeyModalOpen: false,
      hasPromptedInitial: false,
      lastValidatedKey: "",

      setApiKey: (key: string) => set({ apiKey: key }),
      setSelectedModel: (model: string) => set({ selectedModel: model }),
      setAvailableModels: (models: GeminiModelInfo[]) => set({ availableModels: models }),
      setIsValidating: (val: boolean) => set({ isValidating: val }),
      setIsKeyModalOpen: (open: boolean) => set({ isKeyModalOpen: open }),
      setHasPromptedInitial: (val: boolean) => set({ hasPromptedInitial: val }),

      validateAndFetchModels: async (key: string) => {
        if (!key || key.trim() === "") {
          return { success: false, error: "API key cannot be empty" };
        }

        set({ isValidating: true });
        try {
          const res = await fetch("/api/gemini/models", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: key.trim() }),
          });

          const data = await res.json();
          if (!res.ok || data.error) {
            set({ isValidating: false });
            return { success: false, error: data.error || "Failed to validate API key with Google AI" };
          }

          const models: GeminiModelInfo[] = data.models || [];
          let defaultModel = get().selectedModel;

          // If current selected model isn't available, pick a high-capability default
          const hasSelected = models.some((m) => m.id === defaultModel);
          if (!hasSelected && models.length > 0) {
            const proModel = models.find((m) => m.id.includes("pro") || m.isPro);
            const flashModel = models.find((m) => m.id.includes("flash"));
            defaultModel = proModel?.id || flashModel?.id || models[0].id;
          }

          set({
            apiKey: key.trim(),
            availableModels: models,
            selectedModel: defaultModel,
            isValidating: false,
            lastValidatedKey: key.trim(),
          });

          return { success: true, models };
        } catch (err: unknown) {
          set({ isValidating: false });
          const errorMsg = err instanceof Error ? err.message : "Network error validating key";
          return { success: false, error: errorMsg };
        }
      },

      clearKey: () =>
        set({
          apiKey: "",
          selectedModel: "gemini-2.5-pro",
          availableModels: [],
          lastValidatedKey: "",
        }),
    }),
    {
      name: "pixelforge-gemini-storage",
      partialize: (state) => ({
        apiKey: state.apiKey,
        selectedModel: state.selectedModel,
        availableModels: state.availableModels,
        hasPromptedInitial: state.hasPromptedInitial,
        lastValidatedKey: state.lastValidatedKey,
      }),
    }
  )
);
