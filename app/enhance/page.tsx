"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Download, Sparkles, Wand2, RefreshCw, Layers, ZoomIn } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useImageStore } from "@/lib/useImageStore";
import { CometCard } from "@/components/ui/comet-card";

export default function EnhancePage() {
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Core Store
  const { originalImageData, setOriginalImageData } = useImageStore();

  // Params
  const [clarity, setClarity] = useState<number>(0);
  const [denoise, setDenoise] = useState<number>(0);
  const [upscale, setUpscale] = useState<number>(1.0);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const isWorkerBusy = useRef(false);
  const pendingUpdate = useRef(false);

  useEffect(() => {
    setMounted(true);
    // Initialize standard Web Worker for pure math
    workerRef.current = new Worker(new URL('@/lib/image.worker', import.meta.url));

    workerRef.current.onmessage = (e) => {
      const parsedData = e.data as ImageData;
      if (canvasRef.current) {
        canvasRef.current.width = parsedData.width;
        canvasRef.current.height = parsedData.height;
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.putImageData(parsedData, 0, 0);
        }
      }
      isWorkerBusy.current = false;
      setIsProcessing(false);

      // Process any updates that happened while worker was busy
      if (pendingUpdate.current) {
        triggerWorker();
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const triggerWorker = useCallback(() => {
    if (!originalImageData || !workerRef.current) return;
    
    if (isWorkerBusy.current) {
      pendingUpdate.current = true;
      return;
    }

    pendingUpdate.current = false;
    isWorkerBusy.current = true;
    const c = clarity;
    const d = denoise;
    const u = upscale;

    setIsProcessing((c === 0 && d === 0 && u === 1.0) ? false : true);

    // Send to worker. Use requestAnimationFrame so UI updates first
    requestAnimationFrame(() => {
      setIsProcessing(true);
      workerRef.current?.postMessage({
        imageData: originalImageData, // Warning: copying ImageData takes time. A real app might transfer ImageBitmap or use SharedArrayBuffer
        clarity: c,
        denoise: d,
        upscale: u
      });
    });
  }, [originalImageData, clarity, denoise, upscale]);

  // Effect to automatically run processing when parameters change
  useEffect(() => {
    triggerWorker();
  }, [clarity, denoise, upscale, triggerWorker]);

  const handleUpload = (selectedFile: File) => {
    if (selectedFile.size < 1000) {
      setErrorText("Image is too small.");
      return;
    }
    
    if (originalFileUrl) URL.revokeObjectURL(originalFileUrl);
    const objectUrl = URL.createObjectURL(selectedFile);
    setOriginalFileUrl(objectUrl);
    setErrorText(null);
    setClarity(0);
    setDenoise(0);
    setUpscale(1.0);

    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      // Create a temporary canvas to extract ImageData safely
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height);
        setOriginalImageData(data);
        
        // Initial draw
        if (canvasRef.current) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          canvasRef.current.getContext("2d")?.putImageData(data, 0, 0);
        }
      }
    };
  };

  const processAndDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `enhanced-clarity-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clearImage = () => {
    if (originalFileUrl) URL.revokeObjectURL(originalFileUrl);
    setOriginalFileUrl(null);
    setOriginalImageData(null);
    setErrorText(null);
    setClarity(0);
    setDenoise(0);
    setUpscale(1.0);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden flex flex-col items-center justify-center p-4">
      {mounted && <Spotlight className="-top-40 left-0 md:left-20 md:-top-20" fill={resolvedTheme === "dark" ? "white" : "black"} />}
      
      <div className="z-10 w-full max-w-6xl flex flex-col items-center gap-8">
        
        {!originalFileUrl && (
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
              Grok-Level Clarity
            </h1>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto">
              Pure Digital Image Processing. Zero APIs. Unprecedented pixel extraction powered by Frequency Separation and Bilateral Edge-Preserving Denoising.
            </p>
          </div>
        )}

        <div className="w-full relative">
          {errorText && (
            <div className="absolute -top-16 left-0 right-0 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm backdrop-blur-md z-50">
              {errorText}
            </div>
          )}

          {!originalFileUrl ? (
            <div className="rounded-3xl border border-border bg-card/50 p-2 backdrop-blur-xl shadow-2xl mx-auto max-w-3xl transition-all hover:border-primary/50">
              <UploadZone onFileSelect={handleUpload} className="min-h-[400px] border-dashed border-border/50 bg-transparent hover:bg-muted/30 transition-colors rounded-[1.5rem]" />
            </div>
          ) : (
            <div className="grid gap-6 transition-all duration-700 lg:grid-cols-[1fr_350px]">
              
              {/* Core Render Pass (Canvas) */}
              <CometCard className="w-full">
                <div className="relative rounded-3xl border border-border bg-[url('https://transparenttextures.com/patterns/carbon-fibre.png')] bg-card/90 backdrop-blur-3xl p-4 flex flex-col items-center justify-center min-h-[600px] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden group">
                  
                  {/* Visual indicator of processing layer */}
                  <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex justify-between p-4">
                    <div className="text-xs font-mono text-primary/70">DIP_ENGINE_v2</div>
                    <div className="text-xs font-mono text-primary/70">{originalImageData?.width}x{originalImageData?.height}</div>
                  </div>

                  <div className="w-full h-full flex justify-center items-center overflow-hidden">
                    <canvas 
                      ref={canvasRef} 
                      className={cn(
                        "max-h-[650px] max-w-full object-contain rounded-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:scale-[1.01]",
                        isProcessing && "opacity-80 saturate-50 blur-[2px]"
                      )} 
                    />
                  </div>
                </div>
              </CometCard>

              {/* Advanced Core Settings Panel */}
              <div className="flex flex-col gap-6 p-6 rounded-3xl border border-border bg-card/80 backdrop-blur-2xl bg-gradient-to-b from-card/80 to-background shadow-2xl h-full sticky top-24">
                
                <div className="flex items-center gap-2 border-b border-border/50 pb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-bold tracking-tight">Core DSP Settings</h3>
                </div>

                <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  
                  {/* Clarity (Frequency Separation) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        Frequency Separation
                      </label>
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">{clarity.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[clarity]}
                      min={0}
                      max={2}
                      step={0.1}
                      onValueChange={(v) => setClarity(v[0])}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Extracts and boosts high-frequency data for extreme micro-contrast without halos.
                    </p>
                  </div>

                  {/* Denoise (Bilateral Filter) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <ZoomIn className="h-4 w-4 text-muted-foreground" />
                        Bilateral Denoise
                      </label>
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">{denoise} Lvl</span>
                    </div>
                    <Slider
                      value={[denoise]}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(v) => setDenoise(v[0])}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Edge-preserving smart blur. Smooths surfaces while maintaining razor-sharp borders.
                    </p>
                  </div>

                  {/* Upscale (Lanczos) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-muted-foreground" />
                        Lanczos-3 Upscale
                      </label>
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">{upscale.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[upscale]}
                      min={1}
                      max={4}
                      step={0.5}
                      onValueChange={(v) => setUpscale(v[0])}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Sinc-based high-order interpolation. Multiplies native resolution precisely.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-border/50">
                  <Button 
                    size="lg" 
                    onClick={processAndDownload} 
                    disabled={isProcessing} 
                    className="w-full h-14 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold shadow-[0_0_30px_rgba(var(--foreground),0.1)] transition-all hover:scale-[1.02]"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Save Lossless Output
                  </Button>
                  
                  <Button variant="ghost" onClick={clearImage} className="w-full text-muted-foreground hover:text-foreground">
                    <RefreshCw className="mr-2 h-4 w-4" /> Reset Workshop
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
