"use client";

import React, { useState, useEffect, useRef } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Sparkles, Check, Move, ZoomIn, Grid3X3, SlidersHorizontal } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { writePsd } from "ag-psd";

export default function PassportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [transparentUrl, setTransparentUrl] = useState<string | null>(null);
  
  const [bgColor, setBgColor] = useState<"white" | "gray" | "blue">("white");
  const [errorText, setErrorText] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Editor states
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [showAdjustments, setShowAdjustments] = useState(false);

  // Final outputs
  const [resultSingleUrl, setResultSingleUrl] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const handleUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessingBg(true);
    setErrorText(null);
    setResultSingleUrl(null);
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      const res = await fetch("/api/passport", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to remove background cleanly.");
      
      const blob = await res.blob();
      const tUrl = URL.createObjectURL(blob);
      setTransparentUrl(tUrl);

      // Auto-scan bounds and immediately trigger real-time generation
      await scanAndCenterObject(tUrl);

    } catch (e: any) {
      setErrorText(e.message || "Failed to process image.");
    } finally {
      setIsProcessingBg(false);
    }
  };

  const scanAndCenterObject = async (imgUrl: string) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imgUrl;
      img.onload = () => {
        const checkCanvas = document.createElement("canvas");
        const ctx = checkCanvas.getContext("2d");
        checkCanvas.width = img.width;
        checkCanvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
        const data = ctx?.getImageData(0, 0, img.width, img.height).data;
        if (data) {
          for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
              if (data[(y * img.width + x) * 4 + 3] > 10) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
        }
        
        const contentW = Math.max(maxX - minX, 1);
        const contentH = Math.max(maxY - minY, 1);
        
        const targetW = 413;
        const targetH = 531;
        
        const idealScale = Math.min((targetW * 0.8) / contentW, (targetH * 0.8) / contentH);
        
        const contentCenterX = minX + contentW / 2;
        const contentCenterY = minY + contentH / 2;
        
        const defaultOffsetX = (targetW / 2) - (contentCenterX * idealScale);
        const defaultOffsetY = (targetH / 2) - (contentCenterY * idealScale) + (targetH * 0.1);

        setScale(idealScale);
        setOffsetX(defaultOffsetX);
        setOffsetY(defaultOffsetY);
        resolve(null);
      };
    });
  };

  // Real-time canvas generation whenever parameters change
  useEffect(() => {
    if (!transparentUrl) return;
    
    const generateFinal = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 413;
      canvas.height = 531;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const hex = bgColor === "white" ? "#FFFFFF" : bgColor === "gray" ? "#E5E7EB" : "#BAE6FD";
      ctx.fillStyle = hex;
      ctx.fillRect(0, 0, 413, 531);

      const img = new Image();
      img.src = transparentUrl;
      img.onload = () => {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);

        setResultSingleUrl(canvas.toDataURL("image/jpeg", 1.0));
      };
    };

    generateFinal();
  }, [transparentUrl, scale, offsetX, offsetY, bgColor, showAdjustments]);

  const downloadPrintSheet = async () => {
    if (!resultSingleUrl) return;
    const sheetW = 1200; 
    const sheetH = 1800;
    
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = sheetW;
    bgCanvas.height = sheetH;
    const bgCtx = bgCanvas.getContext("2d");
    if (!bgCtx) return;
    
    bgCtx.fillStyle = "#FFFFFF";
    bgCtx.fillRect(0, 0, sheetW, sheetH);

    await new Promise((resolve) => {
      const passportImg = new Image();
      passportImg.src = resultSingleUrl; 
      passportImg.onload = () => {
        const spacingX = 100;
        const spacingY = 100;
        const startX = (sheetW - (413 * 2 + spacingX)) / 2;
        const startY = 150;

        const createPhotoCanvas = () => {
          const c = document.createElement("canvas");
          c.width = 413;
          c.height = 531;
          const ctx = c.getContext("2d");
          ctx?.drawImage(passportImg, 0, 0, 413, 531);
          return c;
        };

        const psdData = {
          width: sheetW,
          height: sheetH,
          children: [
            {
              name: "Background",
              canvas: bgCanvas,
            },
            {
              name: "Photo 1",
              canvas: createPhotoCanvas(),
              left: startX,
              top: startY,
            },
            {
              name: "Photo 2",
              canvas: createPhotoCanvas(),
              left: startX + 413 + spacingX,
              top: startY,
            },
            {
              name: "Photo 3",
              canvas: createPhotoCanvas(),
              left: startX,
              top: startY + 531 + spacingY,
            },
            {
              name: "Photo 4",
              canvas: createPhotoCanvas(),
              left: startX + 413 + spacingX,
              top: startY + 531 + spacingY,
            }
          ]
        };

        try {
          const buffer = writePsd(psdData as any);
          const blob = new Blob([buffer], { type: "application/octet-stream" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `4x6-print-sheet-${Date.now()}.psd`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (error) {
          console.error("Failed to generate PSD", error);
        }

        resolve(null);
      };
    });
  };

  const reset = () => {
    setFile(null);
    setTransparentUrl(null);
    setResultSingleUrl(null);
    setErrorText(null);
    setShowAdjustments(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden flex flex-col items-center justify-center p-4">
      {mounted && <Spotlight className="-top-40 right-0 md:right-60 md:-top-20" fill={resolvedTheme === "dark" ? "white" : "black"} />}
      
      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        
        {!transparentUrl && !isProcessingBg && (
          <div className="text-center space-y-4 mb-8">
             <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
               Instant Passport
             </h1>
             <p className="text-muted-foreground md:text-lg max-w-xl mx-auto">
               Drop a photo. Subject auto-detection and perfect 45x35mm cropping done instantly.
             </p>
          </div>
        )}

        <div className="w-full relative">
          {errorText && (
            <div className="absolute -top-16 left-0 right-0 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm backdrop-blur-md z-50">
              {errorText}
            </div>
          )}

          {!transparentUrl && !isProcessingBg && (
            <div className="rounded-3xl border border-border bg-card/50 p-2 backdrop-blur-xl shadow-2xl transition-all hover:border-primary/50 max-w-2xl mx-auto">
              <UploadZone onFileSelect={handleUpload} className="min-h-[350px] border-dashed border-border/50 bg-transparent hover:bg-muted/30 transition-colors rounded-[1.5rem]" />
            </div>
          )}

          {isProcessingBg && (
            <div className="rounded-3xl border border-border bg-card/50 p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center min-h-[400px] max-w-2xl mx-auto">
               <Sparkles className="h-10 w-10 text-primary animate-pulse mb-6" />
               <h3 className="text-xl font-bold text-foreground">Auto-Aligning Subject</h3>
               <p className="text-muted-foreground mt-2">Running background removal and scanning facial bounds...</p>
            </div>
          )}

          {transparentUrl && resultSingleUrl && (
            <div className="flex flex-col items-center text-center space-y-8 py-8 animate-in zoom-in-95 duration-500 w-full">
              
              <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-16 items-start justify-center max-w-3xl border border-border bg-card/30 p-8 rounded-3xl backdrop-blur-xl w-full">
                
                {/* Result Image */}
                <div className="relative mx-auto shrink-0 transition-transform duration-300 w-[275px] h-[354px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultSingleUrl} alt="Result" className="absolute inset-0 h-full w-full object-cover rounded-xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border transition-all" />
                  
                  {showAdjustments && (
                    <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
                       <div className="absolute top-[15%] left-0 w-full border-t-2 border-dashed border-red-500/80" />
                       <div className="absolute top-[85%] left-0 w-full border-t-2 border-dashed border-red-500/80" />
                    </div>
                  )}

                  <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-xl border border-emerald-400 rotate-6 z-10">Auto-Aligned 45x35mm</div>
                </div>

                {/* Right Side Controls */}
                <div className="flex flex-col gap-6 text-left w-full h-full justify-center">
                  
                  {/* Background Toggle */}
                  <div>
                    <h3 className="text-xs font-bold text-foreground mb-3 tracking-widest uppercase">Select Background</h3>
                    <div className="flex gap-2">
                      {(["white", "gray", "blue"] as const).map((c) => (
                         <button 
                           key={c}
                           onClick={() => setBgColor(c)}
                           className={cn(
                             "relative flex-1 h-12 rounded-lg flex items-center justify-center transition-all",
                             c === "white" ? "bg-white text-black ring-1 ring-border" : c === "gray" ? "bg-[#e5e7eb] text-black ring-1 ring-border" : "bg-[#bae6fd] text-black ring-1 ring-border",
                             bgColor === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" : "hover:scale-105"
                           )}
                         >
                            {bgColor === c && <Check className="absolute top-1 right-1 w-3 h-3 opacity-50" />}
                            <span className="text-xs font-bold capitalize">{c}</span>
                         </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Adjustment Toggle */}
                  <div className="pt-2 border-t border-border/50">
                    <Button variant="outline" onClick={() => setShowAdjustments(!showAdjustments)} className="w-full justify-between rounded-xl h-12">
                      <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4"/> Fine-Tune Alignment</span>
                      <span className="text-xs text-muted-foreground">{showAdjustments ? "Hide" : "Show"}</span>
                    </Button>

                    {showAdjustments && (
                      <div className="space-y-4 mt-6 animate-in slide-in-from-top-2 fade-in">
                         <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground tracking-wide font-medium"><span>Zoom</span></div>
                            <input type="range" min="0.1" max="3" step="0.05" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                         </div>
                         <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground tracking-wide font-medium"><span>Move Left / Right</span></div>
                            <input type="range" min="-300" max="300" step="2" value={offsetX} onChange={e => setOffsetX(parseFloat(e.target.value))} className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                         </div>
                         <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground tracking-wide font-medium"><span>Move Up / Down</span></div>
                            <input type="range" min="-300" max="300" step="2" value={offsetY} onChange={e => setOffsetY(parseFloat(e.target.value))} className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Main Actions */}
                  <div className="flex flex-col gap-3 mt-auto">
                    <div className="flex gap-3">
                       <Button size="lg" onClick={() => {
                              const a = document.createElement("a");
                              a.href = resultSingleUrl;
                              a.download = `passport-single-${Date.now()}.jpg`;
                              a.click();
                           }} className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-14 shadow-md transition-transform hover:scale-[1.02]">
                          <Download className="mr-2 h-4 w-4" /> Save Standard JPG
                       </Button>

                       <Button size="lg" onClick={downloadPrintSheet} className="flex-1 rounded-xl bg-[#26a8ed] text-white hover:bg-[#1f93d1] font-bold h-14 shadow-lg transition-transform hover:scale-[1.02]">
                          <Grid3X3 className="mr-2 h-4 w-4" /> Save PSD File (Editable)
                       </Button>
                    </div>
                    
                    <Button variant="ghost" size="sm" onClick={reset} className="w-full rounded-xl text-muted-foreground hover:text-foreground mt-2">
                       <RefreshCw className="mr-2 h-3 w-3" /> Process New Photo
                    </Button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
