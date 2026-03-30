"use client";

import React, { useState } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { BeforeAfterSlider } from "@/components/shared/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ArrowRight, PaintBucket, Image as ImageIcon, Sparkles } from "lucide-react";

export default function RemoveBgPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [bgMode, setBgMode] = useState<"transparent" | "color" | "blur">("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");

  const handleUpload = async (file: File) => {
    setErrorText(null);
    setOriginalFile(file);
    const objectUrl = URL.createObjectURL(file);
    setOriginalUrl(objectUrl);
    setResultUrl(null); // Reset
    
    // Simulate API call to remove background
    setIsProcessing(true);
    
    try {
      // In a real app, send to /api/remove-bg
      // const formData = new FormData(); formData.append("image", file);
      // const res = await fetch("/api/remove-bg", { method: "POST", body: formData });
      // if (!res.ok) throw new Error("API failed");
      
      // MOCK result for now: we use a placeholder image for demo
      await new Promise((r) => setTimeout(r, 2000));
      setResultUrl(objectUrl); // In reality, this would be the removed background URL
      
    } catch (error) {
      setErrorText("Oops, our servers are overloaded. Please try a different image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setOriginalFile(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(null);
    setResultUrl(null);
    setErrorText(null);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 md:px-8">
      {/* Page Header */}
      {!resultUrl && !isProcessing && (
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-heading text-4xl font-bold tracking-tighter md:text-5xl">
            Remove any background. <span className="text-primary">Instantly.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground font-light">
            Drop an image below and perfectly extract subjects in less than 3 seconds.
          </p>
        </div>
      )}

      {/* Upload & Processing State */}
      {!resultUrl ? (
        <div className="relative mx-auto max-w-3xl">
          {errorText && (
            <div className="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive font-medium">
              {errorText}
            </div>
          )}
          
          <div className="group relative">
            <UploadZone 
              onFileSelect={handleUpload} 
              currentImage={originalUrl}
              onClear={clearImage}
              className="min-h-[400px]"
            />
            
            {isProcessing && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-md">
                <div className="mb-6 relative flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <h3 className="font-heading text-xl font-medium tracking-tight">Extracting subject...</h3>
                <p className="mt-2 text-sm text-muted-foreground">Identifying foreground boundaries</p>
                <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-muted/50">
                  <div className="h-full animate-[progress_2s_ease-in-out_infinite] w-1/3 rounded-full bg-primary" />
                </div>
              </div>
            )}
          </div>
          
          {!isProcessing && !originalUrl && (
            <div className="mt-8 flex items-center justify-center text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
              Need to process multiple? Try our API <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          )}
        </div>
      ) : (
        /* Result State */
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Visualizer */}
          <div className="md:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold tracking-tight">Result</h2>
              <Button variant="ghost" onClick={clearImage} size="sm" className="text-muted-foreground">
                Upload New
              </Button>
            </div>
            
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[url('https://transparenttextures.com/patterns/cubes.png')] shadow-2xl">
              {/* If we have a blurred background selected */}
              {bgMode === "blur" && originalUrl && (
                <div 
                  className="absolute inset-0 opacity-50 blur-xl scale-110 object-cover w-full h-full"
                  style={{ backgroundImage: `url(${originalUrl})`, backgroundSize: 'cover' }}
                />
              )}
              {/* If solid color selected */}
              {bgMode === "color" && (
                <div className="absolute inset-0" style={{ backgroundColor: bgColor }} />
              )}
              
              <BeforeAfterSlider 
                beforeImage={originalUrl!} 
                afterImage={resultUrl}
                beforeLabel="Original"
                afterLabel="Removed BG"
                className="h-[500px]"
              />
            </div>
          </div>
          
          {/* Controls Sidebar */}
          <div className="flex flex-col gap-6 md:mt-[3.5rem]">
            <div className="rounded-2xl border border-border/50 bg-card/20 p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-heading text-lg font-semibold tracking-tight">Background</h3>
              <div className="space-y-4">
                <Button 
                  variant={bgMode === "transparent" ? "default" : "outline"} 
                  className="w-full justify-start gap-3 rounded-xl border-dashed"
                  onClick={() => setBgMode("transparent")}
                >
                  <div className="h-4 w-4 rounded-sm bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-50" />
                  Transparent
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant={bgMode === "color" ? "default" : "outline"} 
                    className="flex-1 justify-start gap-2 rounded-xl"
                    onClick={() => setBgMode("color")}
                  >
                    <PaintBucket className="h-4 w-4" />
                    Color
                  </Button>
                  {bgMode === "color" && (
                    <input 
                      type="color" 
                      value={bgColor} 
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-xl border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-border"
                    />
                  )}
                </div>
                
                <Button 
                  variant={bgMode === "blur" ? "default" : "outline"} 
                  className="w-full justify-start gap-2 rounded-xl"
                  onClick={() => setBgMode("blur")}
                >
                  <ImageIcon className="h-4 w-4" />
                  Blurred Context
                </Button>
              </div>
            </div>
            
            <div className="rounded-2xl shadow-xl shadow-primary/10">
              <Button size="lg" className="h-14 w-full rounded-2xl text-base shadow-sm">
                <Download className="mr-2 h-5 w-5" />
                Download Full HD
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground font-medium">
                PNG format • {originalFile?.size ? (originalFile.size / (1024 * 1024)).toFixed(1) : "Unknown"} MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
