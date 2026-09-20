"use client";

import React, { useState, useEffect } from "react";
import { useGeminiStore, GeminiModelInfo } from "@/lib/useGeminiStore";
import { 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Cpu, 
  ShieldCheck, 
  X, 
  Zap,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import confetti from "canvas-confetti";

export function GeminiKeyModal() {
  const {
    apiKey,
    selectedModel,
    availableModels,
    isValidating,
    isKeyModalOpen,
    hasPromptedInitial,
    setApiKey,
    setSelectedModel,
    setIsKeyModalOpen,
    setHasPromptedInitial,
    validateAndFetchModels,
    clearKey,
  } = useGeminiStore();

  const [inputKey, setInputKey] = useState(apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localModels, setLocalModels] = useState<GeminiModelInfo[]>(availableModels);
  const mounted = useMounted();

  // Initial onboarding trigger
  useEffect(() => {
    if (mounted && !hasPromptedInitial && !apiKey) {
      const timer = setTimeout(() => {
        setIsKeyModalOpen(true);
        setHasPromptedInitial(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [mounted, hasPromptedInitial, apiKey, setIsKeyModalOpen, setHasPromptedInitial]);

  if (!mounted || !isKeyModalOpen) return null;

  const displayModels = localModels.length > 0 ? localModels : availableModels;

  const handleValidate = async () => {
    if (!inputKey.trim()) {
      setErrorMessage("Please enter your Gemini API key.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await validateAndFetchModels(inputKey.trim());
    if (result.success && result.models) {
      setLocalModels(result.models);
      setSuccessMessage(`Successfully connected! Discovered ${result.models.length} AI models.`);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } else {
      setErrorMessage(result.error || "Failed to validate key. Please check your Google AI Studio key.");
    }
  };

  const handleSaveAndClose = () => {
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
    }
    setIsKeyModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-border bg-card/95 shadow-2xl p-4 sm:p-6 md:p-8 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setIsKeyModalOpen(false)}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors touch-manipulation"
          title="Close dialog"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6 pr-8 sm:pr-0">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-fuchsia-600 shadow-lg shadow-purple-500/25 ring-1 ring-white/20 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground flex items-center flex-wrap gap-2">
              Gemini Cloud AI Setup
              <span className="text-[9px] sm:text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-primary border border-primary/20">
                Pro & Flash
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Connect your Google AI Studio API key to unlock cloud AI enhancement, 2-picture adjustments, and high-fidelity vision intelligence.
            </p>
          </div>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-wrap gap-1">
              <label htmlFor="gemini-key">Gemini API Key</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 font-normal lowercase tracking-normal"
              >
                Get API key from Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative flex items-center">
              <KeyRound className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="gemini-key"
                type={showKey ? "text" : "password"}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleValidate();
                }}
                placeholder="AIzaSy..."
                className="w-full pl-10 pr-24 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Button
                  size="sm"
                  onClick={handleValidate}
                  disabled={isValidating || !inputKey.trim()}
                  className="rounded-lg h-8 px-3 font-semibold text-xs"
                >
                  {isValidating ? (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    "Analyze Key"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Discovered Models List & Selection */}
          {displayModels.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-primary" />
                  Select Active Gemini Model ({displayModels.length} available)
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Using: <strong className="text-foreground font-mono">{selectedModel}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {displayModels.map((m) => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className={cn(
                        "text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-1",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                          : "border-border/60 bg-background/40 hover:bg-muted/40 hover:border-border"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-xs font-bold truncate text-foreground">
                          {m.displayName || m.id}
                        </span>
                        {m.isPro && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
                            PRO
                          </span>
                        )}
                        {m.isFlash && !m.isPro && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                            FLASH
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {m.description || m.id}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 bg-muted/20 p-3 rounded-xl border border-border/40">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>
              Your API key is securely stored in your browser session & localStorage. It communicates directly with Google Generative AI endpoints.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-2">
            {apiKey ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearKey();
                  setInputKey("");
                  setLocalModels([]);
                  setSuccessMessage(null);
                  setErrorMessage(null);
                }}
                className="text-xs text-muted-foreground hover:text-destructive touch-manipulation h-10 sm:h-9"
              >
                Disconnect Key
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsKeyModalOpen(false)}
                className="text-xs text-muted-foreground touch-manipulation h-10 sm:h-9"
              >
                Skip / Continue Offline
              </Button>
            )}

            <Button
              onClick={handleSaveAndClose}
              className="rounded-xl px-6 h-11 font-semibold text-sm shadow-lg hover:shadow-primary/20 touch-manipulation"
            >
              Save & Launch Studio <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
