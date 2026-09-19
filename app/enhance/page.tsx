"use client";

import React, { useState, useEffect } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { BeforeAfterSlider } from "@/components/shared/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck,
  Zap,
  Layers,
  Camera,
  Cpu,
  UserCheck,
  Sun,
  Wand2,
  Bot,
  Check
} from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { cn } from "@/lib/utils";
import { processImageForClient } from "@/lib/image-client";
import { useTheme } from "next-themes";
import { useGeminiStore } from "@/lib/useGeminiStore";
import { motion, AnimatePresence } from "framer-motion";

type EnhanceMode = "portrait" | "super_res" | "low_light" | "custom";

export default function EnhancePage() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<EnhanceMode>("portrait");
  const [customPrompt, setCustomPrompt] = useState("");
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const { apiKey, selectedModel, setIsKeyModalOpen } = useGeminiStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleUpload = async (file: File) => {
    setErrorText(null);
    setEnhancedUrl(null);
    setAiInsights(null);
    try {
      const processed = await processImageForClient(file);
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      const url = URL.createObjectURL(processed);
      setOriginalUrl(url);
    } catch (e) {
      console.error(e);
      setErrorText("Failed to process image. Please try again.");
    }
  };

  const startEnhancement = async () => {
    if (!originalUrl) return;
    
    setIsProcessing(true);
    setProgress(0);
    setErrorText(null);
    setAiInsights(null);

    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + Math.random() * 12 : prev));
    }, 300);

    try {
      const response = await fetch(originalUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64: string = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: base64,
          apiKey,
          model: selectedModel,
          mode,
          customPrompt,
        }),
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setEnhancedUrl(data.enhancedImage);
      if (data.aiInsights) setAiInsights(data.aiInsights);
      setProgress(100);
    } catch (err: unknown) {
      console.error(err);
      setErrorText(err instanceof Error ? err.message : "Enhancement failed. Please try again.");
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!enhancedUrl) return;
    const a = document.createElement("a");
    a.href = enhancedUrl;
    a.download = `pixelforge-remastered-${Date.now()}.png`;
    a.click();
  };

  const clear = () => {
    setOriginalUrl(null);
    setEnhancedUrl(null);
    setErrorText(null);
    setAiInsights(null);
    setProgress(0);
  };

  const modes: Array<{ id: EnhanceMode; title: string; desc: string; gradient: string }> = [
    {
      id: "portrait",
      title: "Studio Portrait Remaster",
      desc: "Cleans skin texture, sharpens eyes, and balances natural studio lighting.",
      gradient: "from-violet-500 via-purple-500 to-fuchsia-600 shadow-purple-500/30",
    },
    {
      id: "super_res",
      title: "Ultra Super-Resolution",
      desc: "Sub-pixel neural upscaling and micro-sharpening for crisp details.",
      gradient: "from-blue-500 via-indigo-500 to-cyan-500 shadow-blue-500/30",
    },
    {
      id: "low_light",
      title: "Low-Light Recovery",
      desc: "Shadow recovery, dynamic range expansion, and noise-floor reduction.",
      gradient: "from-amber-400 via-orange-500 to-rose-500 shadow-amber-500/30",
    },
    {
      id: "custom",
      title: "Custom AI Prompt",
      desc: "Instruct Gemini AI on specific aesthetic transformations.",
      gradient: "from-emerald-400 via-teal-500 to-cyan-500 shadow-emerald-500/30",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden flex flex-col items-center justify-start p-4 md:p-8">
      {mounted && <Spotlight className="-top-40 left-0 md:left-20 md:-top-20" fill={resolvedTheme === "dark" ? "white" : "black"} />}
      
      <div className="z-10 w-full max-w-6xl flex flex-col items-center gap-8">
        
        {/* Header Section */}
        <AnimatePresence mode="wait">
          {!originalUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Cloud AI & Neural Super-Resolution
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                AI PHOTO.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary/60">
                  REMASTERED HD.
                </span>
              </h1>
              <p className="text-muted-foreground md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                Restore details, eliminate noise, and enhance portrait fidelity with Gemini Cloud AI and sub-pixel texture reconstruction.
              </p>

              {/* Model status bar */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsKeyModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-md text-xs hover:border-primary/40 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-sm" />
                  <span>Model: <strong className="text-foreground font-mono">{selectedModel}</strong></span>
                  {!apiKey && <span className="text-[10px] text-amber-500 font-bold ml-1">(Click to configure)</span>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full relative">
          {errorText && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm backdrop-blur-xl z-50 flex items-center justify-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" />
              {errorText}
            </div>
          )}

          {!originalUrl ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-border/60 bg-card/40 p-3 backdrop-blur-3xl shadow-2xl mx-auto max-w-3xl"
            >
              <UploadZone
                onFileSelect={handleUpload}
                className="min-h-[420px] border-dashed border-primary/20 bg-transparent hover:bg-primary/5 transition-all rounded-2xl group"
              />
            </motion.div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] w-full items-start">
              
              {/* Massive Comparison & Preview Box */}
              <div className="space-y-6">
                <div className="relative w-full rounded-3xl border border-border bg-card/40 backdrop-blur-2xl p-4 shadow-2xl overflow-hidden min-h-[460px] flex items-center justify-center">
                  
                  {enhancedUrl ? (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-3 px-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          Interactive Before / After
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Swipe slider to inspect
                        </span>
                      </div>
                      <BeforeAfterSlider
                        beforeImage={originalUrl}
                        afterImage={enhancedUrl}
                        beforeLabel="Original RAW"
                        afterLabel="Remastered HD"
                        className="h-[420px] md:h-[480px] rounded-2xl shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="relative h-[420px] md:h-[480px] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={originalUrl}
                        alt="Input"
                        className={cn(
                          "h-full w-full object-contain transition-all duration-700",
                          isProcessing && "scale-105 blur-[10px] grayscale opacity-50"
                        )}
                      />

                      {/* Progress Overlay */}
                      {isProcessing && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md p-6">
                          <div className="w-2/3 h-1.5 bg-muted rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                              className="h-full bg-primary"
                              initial={{ width: "0%" }}
                              animate={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="mt-4 font-mono text-xs tracking-[0.3em] text-primary uppercase animate-pulse">
                            Gemini AI Neural Pass in Progress...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Insights Card */}
                {aiInsights && (
                  <div className="p-5 rounded-3xl border border-primary/20 bg-primary/5 backdrop-blur-xl space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <Bot className="w-4 h-4" />
                      Gemini Vision Retoucher Notes ({selectedModel})
                    </div>
                    <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed font-light">
                      {aiInsights}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar Controls */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-6 p-6 md:p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-3xl shadow-2xl h-fit"
              >
                <div>
                  <h3 className="text-xl font-black tracking-tight">AI Enhancement Mode</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select target optimization profile:
                  </p>
                </div>

                {/* Modes Selector */}
                <div className="space-y-2">
                  {modes.map((m) => {
                    const isSelected = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        className={cn(
                          "w-full p-3 rounded-xl border text-left transition-all flex flex-col gap-0.5",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                            : "border-border/60 bg-background/40 hover:bg-muted/40 hover:border-border"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground flex items-center gap-2">
                            <span className={cn("w-4 h-4 rounded-md bg-gradient-to-br shadow-sm shrink-0 ring-1 ring-white/20", m.gradient)} />
                            {m.title}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground leading-relaxed pl-6">
                          {m.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom prompt input */}
                {mode === "custom" && (
                  <div className="space-y-1 animate-in fade-in">
                    <label className="text-[11px] font-semibold text-foreground">Custom Prompt:</label>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g. Enhance skin glow and soften harsh shadows"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  {!enhancedUrl && !isProcessing ? (
                    <Button 
                      size="lg" 
                      onClick={startEnhancement}
                      className="w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-bold text-sm shadow-xl transition-transform hover:scale-[1.02]"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Remaster with Cloud AI
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      onClick={handleDownload}
                      disabled={isProcessing}
                      className="w-full h-14 rounded-2xl font-bold text-sm shadow-xl hover:shadow-primary/20 transition-transform hover:scale-[1.02]"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Master PNG
                    </Button>
                  )}

                  <Button 
                    variant="ghost" 
                    onClick={clear} 
                    className="w-full h-10 rounded-xl text-muted-foreground hover:text-foreground text-xs font-semibold"
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" /> Start Over
                  </Button>
                </div>

                {/* Specs Info */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 text-[11px] space-y-1.5 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Engine:</span>
                    <span className="font-mono text-foreground">{apiKey ? "Gemini Cloud Vision" : "Local Python/Sharp"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precision:</span>
                    <span className="font-mono text-foreground">32-bit Float RAW</span>
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
