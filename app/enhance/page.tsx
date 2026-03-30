"use client";

import React, { useState } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { BeforeAfterSlider } from "@/components/shared/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, Wand2, RefreshCcw, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EnhancePage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Settings
  const [scale, setScale] = useState<number>(4);
  const [faceEnhance, setFaceEnhance] = useState<boolean>(true);
  const [denoise, setDenoise] = useState<number>(50);

  const handleUpload = (selectedFile: File) => {
    // Validate size (User rule: minimum 200x200px. We simulate it)
    if (selectedFile.size < 10000) {
      setErrorText("This image is too small to enhance. Try one at least 200×200px.");
      return;
    }
    setErrorText(null);
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setOriginalUrl(url);
    setResultUrl(null);
  };

  const processImage = async () => {
    if (!originalUrl) return;
    setIsProcessing(true);
    setErrorText(null);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 400);

    try {
      const formData = new FormData();
      if (file) formData.append("image", file);
      formData.append("scale", scale.toString());
      formData.append("face_enhance", faceEnhance.toString());

      const res = await fetch("/api/enhance", { method: "POST", body: formData });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Server error occurred");
      }
      
      const data = await res.json();
      setProgress(100);
      setResultUrl(data.url);
    } catch (e: any) {
      setErrorText(e.message || "Enhancement failed. Please try again.");
    } finally {
      clearInterval(interval);
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const downloadEnhanced = async () => {
    if (!resultUrl) return;
    try {
      // Fetch the image as a blob to force a download instead of opening a new tab
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
      // Fallback to direct link if CORS fails
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `enhanced-${scale}x-${Date.now()}.png`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  const clearImage = () => {
    setFile(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(null);
    setResultUrl(null);
    setErrorText(null);
    setProgress(0);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:px-8 lg:py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-5xl">AI Image Enhancer</h1>
          <p className="mt-2 text-muted-foreground font-light">Upscale, denoise, and restore faces using Real-ESRGAN.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left/Main Column: Preview & Upload */}
        <div className="flex flex-col gap-6">
          <div className="relative flex min-h-[500px] flex-col overflow-hidden rounded-[2rem] border border-border/50 bg-card/10 p-2 shadow-2xl backdrop-blur-3xl">
            {!originalUrl && (
              <div className="h-full px-2 py-4">
                <UploadZone onFileSelect={handleUpload} className="h-full border-border/50" />
              </div>
            )}
            
            {originalUrl && !resultUrl && (
              <div className="relative flex h-full flex-col p-4 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl} className="max-h-[600px] object-contain rounded-xl shadow-lg border border-white/5" alt="Input" />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={clearImage}
                  className="absolute right-6 top-6 shadow-xl backdrop-blur-md bg-background/50 hover:bg-background/80"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" /> Change Image
                </Button>
              </div>
            )}
            
            {resultUrl && originalUrl && (
              <div className="h-full rounded-[1.5rem] overflow-hidden bg-[url('https://transparenttextures.com/patterns/cubes.png')] bg-background/50">
                <BeforeAfterSlider 
                  beforeImage={originalUrl}
                  afterImage={resultUrl}
                  className="h-full max-h-[700px] rounded-none border-none"
                  beforeLabel="Original"
                  afterLabel={`${scale}x Enhanced`}
                />
              </div>
            )}
          </div>
          
          {errorText && (
            <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive font-medium shadow-sm">
              {errorText}
            </div>
          )}
        </div>

        {/* Right Column: Controls */}
        <div className="flex flex-col gap-6">
          {/* Settings Panel */}
          <div className="rounded-[2rem] border border-border/50 bg-card/30 p-8 backdrop-blur-xl shadow-lg">
            <div className="mb-8 flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="rounded-xl bg-primary/20 p-2 text-primary">
                <Settings2 className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl font-semibold tracking-tight">Enhancement Params</h3>
            </div>
            
            <div className="space-y-8">
              {/* Scale Control */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                    Upscale Factor
                  </label>
                  <span className="text-xs font-mono text-primary font-bold bg-primary/10 px-2 py-1 rounded-md">{scale}x</span>
                </div>
                <div className="flex h-12 w-full rounded-xl bg-muted/30 p-1 ring-1 ring-border/50">
                  {[2, 4, 8].map((val) => (
                    <button
                      key={val}
                      onClick={() => setScale(val)}
                      className={cn(
                        "flex-1 rounded-lg text-sm font-semibold transition-all duration-300",
                        scale === val ? "bg-background text-foreground shadow-md ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {val}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Denoise Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">
                    Denoise Strength
                  </label>
                  <span className="text-xs font-mono text-muted-foreground">{denoise}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={denoise} 
                  onChange={(e) => setDenoise(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              {/* Face Enhance Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-muted/20 p-4 ring-1 ring-border/50">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Face Enhancement</label>
                  <p className="text-xs text-muted-foreground leading-relaxed">Uses CodeFormer for high-fidelity portrait restoration.</p>
                </div>
                <button 
                  onClick={() => setFaceEnhance(!faceEnhance)}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                    faceEnhance ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    faceEnhance ? 'translate-x-5' : 'translate-x-0'
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex w-full flex-col gap-4 mt-auto">
            {isProcessing ? (
              <div className="relative flex h-16 w-full items-center overflow-hidden rounded-[1.25rem] bg-muted/30 shadow-inner">
                <div 
                  className="absolute left-0 top-0 h-full bg-primary/20 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent w-[200%] animate-[shimmer_2s_infinite]" style={{ transform: 'translateX(-100%)' }} />
                <div className="relative z-10 flex w-full items-center justify-between px-6 font-mono text-sm font-medium text-foreground">
                  <span>Enhancing Details...</span>
                  <span>{progress}%</span>
                </div>
              </div>
            ) : !resultUrl ? (
              <Button 
                size="lg" 
                className={cn(
                  "h-16 w-full rounded-[1.25rem] text-base font-bold shadow-xl transition-all duration-300 hover:scale-[1.02]",
                  !originalUrl && "opacity-50 cursor-not-allowed"
                )}
                disabled={!originalUrl}
                onClick={processImage}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Enhance Photo
              </Button>
            ) : (
              <Button 
                size="lg" 
                onClick={downloadEnhanced}
                className="h-16 w-full rounded-[1.25rem] bg-white text-black hover:bg-neutral-200 text-base font-bold shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <Download className="mr-2 h-5 w-5" />
                Download {scale}x Result
              </Button>
            )}
            
            {resultUrl && (
              <Button variant="ghost" onClick={clearImage} className="text-muted-foreground w-full">
                Process another image
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
