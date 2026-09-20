"use client";

import React, { useState } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Sparkles, 
  RefreshCw, 
  Check
} from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { processImageForClient } from "@/lib/image-client";
import { removeBackgroundClient } from "@/lib/bg-client";

type BgOption = "transparent" | "white" | "blue" | "gray" | "dark" | "gradient_purple" | "gradient_warm";

export default function RemoveBgPage() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Segmenting Subject & Matting Edges...");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [selectedBg, setSelectedBg] = useState<BgOption>("transparent");

  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const handleUpload = async (file: File) => {
    setErrorText(null);
    setIsProcessing(true);
    setResultUrl(null);
    setStatusMessage("Analyzing image & loading AI model...");
    
    try {
      const processed = await processImageForClient(file);
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);

      const originalObjectUrl = URL.createObjectURL(processed);
      setOriginalUrl(originalObjectUrl);

      const cutoutDataUrl = await removeBackgroundClient(processed, (msg) => {
        setStatusMessage(msg);
      });

      setResultUrl(cutoutDataUrl);
    } catch (e: unknown) {
      console.error("Background removal error:", e);
      setErrorText(e instanceof Error ? e.message : "Failed to extract background. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setOriginalUrl(null);
    setResultUrl(null);
    setErrorText(null);
    setSelectedBg("transparent");
  };

  const handleDownload = () => {
    if (!resultUrl) return;

    if (selectedBg === "transparent") {
      const link = document.createElement("a");
      link.href = resultUrl;
      link.download = `pixelforge-cutout-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Render with backdrop on canvas for export
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = resultUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 1000;
      canvas.height = img.naturalHeight || 1000;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill Background
      if (selectedBg === "white") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (selectedBg === "blue") {
        ctx.fillStyle = "#BAE6FD";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (selectedBg === "gray") {
        ctx.fillStyle = "#E5E7EB";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (selectedBg === "dark") {
        ctx.fillStyle = "#0F172A";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (selectedBg === "gradient_purple") {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#4f46e5");
        grad.addColorStop(1, "#7c3aed");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (selectedBg === "gradient_warm") {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#f97316");
        grad.addColorStop(1, "#ec4899");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `pixelforge-studio-bg-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
  };

  const bgStyles: Record<BgOption, string> = {
    transparent: "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]",
    white: "bg-white",
    blue: "bg-[#bae6fd]",
    gray: "bg-[#e5e7eb]",
    dark: "bg-[#0f172a]",
    gradient_purple: "bg-gradient-to-br from-indigo-600 to-purple-600",
    gradient_warm: "bg-gradient-to-br from-orange-500 to-pink-500",
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden flex flex-col items-center justify-start p-4 md:p-8">
      {mounted && <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill={resolvedTheme === "dark" ? "white" : "black"} />}
      
      <div className="z-10 w-full max-w-5xl flex flex-col items-center gap-8">
        
        {/* Header */}
        {!originalUrl && (
          <div className="text-center space-y-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Deep Learning Subject Extraction
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground">
              Perfect Background Remover
            </h1>
            <p className="text-muted-foreground md:text-lg max-w-xl mx-auto font-light">
              High-precision subject isolation with fine edge matting, passport white/blue backdrops, and transparent HD exports.
            </p>
          </div>
        )}

        <div className="w-full relative">
          {errorText && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm backdrop-blur-md">
              {errorText}
            </div>
          )}

          {!originalUrl ? (
            <div className="rounded-3xl border border-border bg-card/40 p-3 backdrop-blur-xl shadow-2xl transition-all hover:border-primary/50 max-w-2xl mx-auto">
              <UploadZone
                onFileSelect={handleUpload}
                className="min-h-[400px] border-dashed border-border/60 bg-transparent hover:bg-muted/30 transition-colors rounded-2xl"
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start justify-center max-w-5xl mx-auto">
              
              {/* Preview Canvas */}
              <div 
                className={cn(
                  "relative w-full overflow-hidden rounded-3xl border border-border p-8 flex flex-col items-center justify-center min-h-[480px] shadow-2xl transition-all duration-300",
                  bgStyles[selectedBg]
                )}
              >
                {isProcessing && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/70 backdrop-blur-md p-6 text-center">
                    <div className="relative flex h-20 w-20 items-center justify-center">
                      <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <p className="mt-4 text-xs font-mono tracking-wider uppercase text-primary font-bold max-w-xs animate-pulse">
                      {statusMessage}
                    </p>
                  </div>
                )}

                {resultUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resultUrl}
                    alt="Result"
                    className="max-h-[460px] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-500"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="max-h-[460px] object-contain opacity-40 blur-sm"
                  />
                )}
              </div>

              {/* Sidebar Backdrops & Actions */}
              <div className="flex flex-col gap-6 p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-2xl shadow-2xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-sm" />
                    Choose Backdrop
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "transparent", label: "Transparent", grad: "from-slate-300 via-slate-400 to-slate-300 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-700" },
                      { id: "white", label: "Passport White", grad: "from-slate-100 via-white to-slate-200" },
                      { id: "blue", label: "BD Studio Blue", grad: "from-sky-300 via-blue-300 to-cyan-200" },
                      { id: "gray", label: "Studio Gray", grad: "from-slate-200 via-gray-300 to-zinc-400" },
                      { id: "dark", label: "Dark Studio", grad: "from-slate-800 via-zinc-900 to-black" },
                      { id: "gradient_purple", label: "Royal Indigo", grad: "from-indigo-600 via-purple-600 to-pink-600" },
                      { id: "gradient_warm", label: "Sunset Glow", grad: "from-orange-500 via-amber-500 to-rose-500" },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBg(b.id as BgOption)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all",
                          selectedBg === b.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm"
                            : "border-border/60 bg-background/40 hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-4 h-4 rounded-full border border-black/10 shrink-0 bg-gradient-to-br shadow-sm ring-1 ring-white/20",
                              b.grad
                            )}
                          />
                          <span className="truncate text-[11px] text-foreground">{b.label}</span>
                        </div>
                        {selectedBg === b.id && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <Button
                    size="lg"
                    onClick={handleDownload}
                    disabled={!resultUrl || isProcessing}
                    className="w-full h-14 rounded-2xl font-bold text-sm shadow-xl hover:shadow-primary/20 transition-transform hover:scale-[1.02]"
                  >
                    <Download className="mr-2 h-5 w-5" /> Download HD Image
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearImage}
                    disabled={isProcessing}
                    className="w-full h-10 rounded-xl text-muted-foreground hover:text-foreground text-xs font-medium"
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" /> Start Over
                  </Button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
