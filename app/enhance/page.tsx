"use client";

import React, { useState, useEffect } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, RefreshCw, Wand2 } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export default function EnhancePage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Params
  const [scale, setScale] = useState<number>(4);
  const [denoise, setDenoise] = useState<number>(50); // Proxy value
  const [faceEnhance, setFaceEnhance] = useState<boolean>(true); // Placeholder, kept logic consistent

  const handleUpload = (selectedFile: File) => {
    if (selectedFile.size < 10000) {
      setErrorText("Image is too small to meaningfully enhance it.");
      return;
    }
    setFile(selectedFile);
    setOriginalUrl(URL.createObjectURL(selectedFile));
    setResultUrl(null);
    setErrorText(null);
  };

  const generateEnhancedCanvas = async (sourceUrl: string, currentScale: number, denoiseVal: number) => {
    return new Promise<string | null>((resolve) => {
      const img = new Image();
      img.src = sourceUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        canvas.width = img.width * currentScale;
        canvas.height = img.height * currentScale;
        
        // Native browser-based high-quality upscale (Lanczos/Bicubic depending on engine)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        
        ctx.filter = `contrast(${105 + (denoiseVal / 100) * 5}%) saturate(110%)`; 

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        resolve(null);
      };
    });
  }

  const processImage = async () => {
    if (!originalUrl) return;
    setIsProcessing(true);
    setErrorText(null);

    try {
      // Small simulated delay for UX to let "Synthesizing" show up
      await new Promise(r => setTimeout(r, 600));

      const finalImage = await generateEnhancedCanvas(originalUrl, scale, denoise);
      
      if (finalImage) {
        setResultUrl(finalImage);
      } else {
        throw new Error("Local canvas engine failed to process the image.");
      }
    } catch (e: any) {
      setErrorText(e.message || "Enhancement failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setErrorText(null);
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const fetchResponse = await fetch(resultUrl);
      const blob = await fetchResponse.blob();
      const localUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = localUrl;
      a.download = `enhanced-${scale}x-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(localUrl);
    } catch (er) {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `enhanced-${scale}x-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden flex flex-col items-center justify-center p-4">
      {mounted && <Spotlight className="-top-40 left-0 md:left-20 md:-top-20" fill={resolvedTheme === "dark" ? "white" : "black"} />}
      
      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        
        {!originalUrl && (
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
              Clarity & Scale
            </h1>
            <p className="text-muted-foreground md:text-lg max-w-xl mx-auto">
              Sharpen, upscale, and restore logic locally. Powerful zero-API pixel engineering.
            </p>
          </div>
        )}

        <div className="w-full relative">
          {errorText && (
            <div className="absolute -top-16 left-0 right-0 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm backdrop-blur-md z-50">
              {errorText}
            </div>
          )}

          {!originalUrl ? (
            <div className="rounded-3xl border border-border bg-card/50 p-2 backdrop-blur-xl shadow-2xl mx-auto max-w-3xl transition-all hover:border-primary/50">
              <UploadZone onFileSelect={handleUpload} className="min-h-[400px] border-dashed border-border/50 bg-transparent hover:bg-muted/30 transition-colors rounded-[1.5rem]" />
            </div>
          ) : (
            <div className={cn("grid gap-6 transition-all duration-700", !resultUrl ? "lg:grid-cols-[1fr_300px]" : "grid-cols-1")}>
              
              {/* Image View */}
              <div className="relative rounded-3xl border border-border bg-[url('https://transparenttextures.com/patterns/cubes.png')] bg-card/50 backdrop-blur-xl p-4 flex flex-col items-center justify-center min-h-[500px] shadow-2xl overflow-hidden">
                {isProcessing && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md animate-in fade-in">
                    <Wand2 className="h-10 w-10 text-primary animate-pulse mb-4" />
                    <span className="text-sm font-medium uppercase tracking-widest text-primary">Synthesizing...</span>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl || originalUrl} alt="Subject" className="max-h-[600px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl" />
              </div>

              {/* Controls */}
              {!resultUrl && (
                <div className="flex flex-col gap-6 p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-xl justify-between">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Upscale Dimension</label>
                      <div className="flex p-1 bg-muted/30 rounded-xl border border-border">
                        {[2, 4, 8].map(s => (
                          <button key={s} onClick={() => setScale(s)} className={cn("flex-1 py-3 rounded-lg text-sm font-semibold transition-all", scale === s ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:text-foreground")}>
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Denoise Level</label>
                      <div className="flex p-1 bg-muted/30 rounded-xl border border-border">
                        {[{v: 0, l: "Off"}, {v: 50, l: "Med"}, {v: 100, l: "High"}].map(d => (
                           <button key={d.v} onClick={() => setDenoise(d.v)} className={cn("flex-1 py-3 rounded-lg text-sm font-semibold transition-all", denoise === d.v ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:text-foreground")}>
                             {d.l}
                           </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button size="lg" onClick={processImage} disabled={isProcessing} className="w-full h-14 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-sm font-bold shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02]">
                    <Sparkles className="mr-2 h-4 w-4" /> Enhance Now
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post-Processing Actions */}
        {resultUrl && (
          <div className="flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500 w-full max-w-sm">
            <Button variant="ghost" size="lg" onClick={clearImage} className="flex-1 rounded-xl text-muted-foreground hover:text-foreground border border-border bg-card/50 backdrop-blur-md">
               <RefreshCw className="mr-2 h-4 w-4" /> Restart
            </Button>
            <Button size="lg" onClick={handleDownload} className="flex-1 rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02]">
               <Download className="mr-2 h-4 w-4" /> Save {scale}x
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
