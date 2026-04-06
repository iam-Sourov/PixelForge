"use client";

import React, { useState, useEffect } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, RefreshCw, Wand2 } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";


export default function EnhancePage() {

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Params
  const [denoise, setDenoise] = useState<number>(100);

  const handleUpload = (selectedFile: File) => {
    if (selectedFile.size < 10000) {
      setErrorText("Image is too small to meaningfully enhance it.");
      return;
    }
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl && resultUrl.startsWith("blob:")) URL.revokeObjectURL(resultUrl);


    setOriginalUrl(URL.createObjectURL(selectedFile));
    setResultUrl(null);
    setErrorText(null);
  };

  const generateEnhancedCanvas = async (sourceUrl: string, denoiseVal: number) => {
    try {
      const currentHtmlImage = new Image();
      currentHtmlImage.src = sourceUrl;
      await new Promise((resolve, reject) => { 
        currentHtmlImage.onload = resolve; 
        currentHtmlImage.onerror = reject;
      });

      const targetWidth = currentHtmlImage.width;
      const targetHeight = currentHtmlImage.height;

      const outCanvas = document.createElement("canvas");
      outCanvas.width = targetWidth;
      outCanvas.height = targetHeight;
      const outCtx = outCanvas.getContext("2d");

      if (outCtx) {
        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = "high";
        
        // Apply heavy sharpening matrix mapping for clarity focus!
        let filterStr = denoiseVal > 50 ? "url(#sharpen-high) " : "url(#sharpen-med) ";

        // Color Grading / Clarity - Toned down to prevent artifact clipping
        if (denoiseVal > 0) {
           filterStr += `contrast(${100 + (denoiseVal / 100) * 5}%) saturate(${100 + (denoiseVal / 100) * 10}%) brightness(101%)`; 
        }

        outCtx.filter = filterStr.trim();
        outCtx.drawImage(currentHtmlImage, 0, 0, targetWidth, targetHeight);
        
        return new Promise<string | null>((resolve) => {
          outCanvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              resolve(null);
            }
          }, "image/png", 1.0);
        });
      }

      return null;
    } catch (err) {
      console.error("Canvas manipulation failed:", err);
      return null;
    }
  }

  const processAndDownload = async () => {
    if (!originalUrl) return;
    setIsProcessing(true);
    setErrorText(null);

    try {
      await new Promise(r => setTimeout(r, 600));

      const finalImage = await generateEnhancedCanvas(originalUrl, denoise);
      
      if (finalImage) {
        setResultUrl(finalImage);
        
        // Automatically trigger the download immediately!
        const a = document.createElement("a");
        a.href = finalImage;
        a.download = `enhanced-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error("Local canvas engine failed to process the image.");
      }
    } catch (e: unknown) {
      setErrorText(e instanceof Error ? e.message : "Enhancement failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl && resultUrl.startsWith("blob:")) URL.revokeObjectURL(resultUrl);

    setOriginalUrl(null);
    setResultUrl(null);
    setErrorText(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden flex flex-col items-center justify-center p-4">
      {mounted && <Spotlight className="-top-40 left-0 md:left-20 md:-top-20" fill={resolvedTheme === "dark" ? "white" : "black"} />}
      
      {/* Hardware Accelerated SVG Filters for native GPU Sharpening */}
      <svg width="0" height="0" className="opacity-0 fixed pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="sharpen-high">
            <feConvolveMatrix order="3 3" preserveAlpha="true" kernelMatrix="0 -0.5 0 -0.5 3 -0.5 0 -0.5 0" />
          </filter>
          <filter id="sharpen-med">
            <feConvolveMatrix order="3 3" preserveAlpha="true" kernelMatrix="0 -0.2 0 -0.2 1.8 -0.2 0 -0.2 0" />
          </filter>
        </defs>
      </svg>

      
      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        
        {!originalUrl && (
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
              Clarity & Enhance
            </h1>
            <p className="text-muted-foreground md:text-lg max-w-xl mx-auto">
              Sharpen and restore photo details precisely. Powerful zero-API pixel engineering.
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

              {/* Controls Panel */}
              {!resultUrl ? (
                <div className="flex flex-col gap-6 p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-xl justify-between min-w-[300px]">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quality Mode</label>
                      <div className="flex p-1 bg-muted/30 rounded-xl border border-border flex-col gap-2">
                        {[{v: 50, l: "Balanced Quality"}, {v: 100, l: "High Quality"}].map(d => (
                           <button key={d.v} onClick={() => setDenoise(d.v)} className={cn("w-full py-4 rounded-lg text-sm font-semibold transition-all", denoise === d.v ? "bg-foreground text-background shadow-md transform scale-[1.02]" : "text-muted-foreground hover:text-foreground bg-transparent border border-transparent hover:border-border")}>
                             {d.l}
                           </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button size="lg" onClick={processAndDownload} disabled={isProcessing} className="w-full h-14 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-sm font-bold shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02]">
                    {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isProcessing ? "Enhancing..." : "Download Enhanced"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-6 p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-xl justify-center items-center text-center min-w-[300px]">
                   <div className="space-y-2">
                     <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex flex-col items-center justify-center mb-6 border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                       <Sparkles className="h-8 w-8 text-primary" />
                     </div>
                     <h3 className="font-bold text-xl">Enhancement Complete!</h3>
                     <p className="text-sm text-muted-foreground">Your crisp photo has been downloaded.</p>
                   </div>
                   
                   <Button variant="outline" size="lg" onClick={clearImage} className="w-full h-14 rounded-xl mt-4 border-foreground/20 hover:bg-muted">
                     <RefreshCw className="mr-2 h-4 w-4" /> Enhance Another
                   </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
