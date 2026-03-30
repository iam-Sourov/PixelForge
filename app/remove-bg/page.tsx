"use client";

import React, { useState, useEffect } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, RefreshCw } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { useTheme } from "next-themes";

export default function RemoveBgPage() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleUpload = async (file: File) => {
    setErrorText(null);
    setOriginalUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setIsProcessing(true);
    
    try {
      const formData = new FormData(); 
      formData.append("image", file);
      const res = await fetch("/api/remove-bg", { method: "POST", body: formData });
      
      if (!res.ok) throw new Error("Server error occurred");
      
      const data = await res.json();
      setResultUrl(data.url);
    } catch (error: any) {
      setErrorText("Failed to extract background. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setOriginalUrl(null);
    setResultUrl(null);
    setErrorText(null);
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `pixel-cut-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden flex flex-col items-center justify-center p-4">
      {mounted && <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill={resolvedTheme === "dark" ? "white" : "black"} />}
      
      <div className="z-10 w-full max-w-3xl flex flex-col items-center gap-8">
        
        {!originalUrl && (
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
              Magic Background Eraser
            </h1>
            <p className="text-muted-foreground md:text-lg max-w-xl mx-auto">
              Powered by deep learning. Completely local. No APIs, no data collection. Drop an image to extract the subject instantly.
            </p>
          </div>
        )}

        <div className="w-full relative">
          {errorText && (
            <div className="absolute -top-16 left-0 right-0 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm backdrop-blur-md">
              {errorText}
            </div>
          )}

          {!originalUrl ? (
            <div className="rounded-3xl border border-border bg-card/50 p-2 backdrop-blur-xl shadow-2xl transition-all hover:border-primary/50">
              <UploadZone onFileSelect={handleUpload} className="min-h-[400px] border-dashed border-border/50 bg-transparent hover:bg-muted/30 transition-colors rounded-[1.5rem]" />
            </div>
          ) : (
            <div className="group relative w-full overflow-hidden rounded-3xl border border-border bg-[url('https://transparenttextures.com/patterns/cubes.png')] bg-card/50 backdrop-blur-xl p-8 flex flex-col items-center justify-center min-h-[500px] shadow-2xl">
              
              {isProcessing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <p className="mt-4 text-sm font-medium tracking-widest uppercase text-primary/80">Segmenting Subject</p>
                </div>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              {resultUrl ? (
                <img src={resultUrl} alt="Result" className="max-h-[500px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-700 dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
              ) : (
                <img src={originalUrl} alt="Original" className="max-h-[500px] object-contain opacity-50 blur-sm brightness-50 dark:brightness-50" />
              )}
            </div>
          )}
        </div>

        {/* Minimal Action Bar */}
        {resultUrl && (
          <div className="flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <Button variant="ghost" size="lg" onClick={clearImage} className="rounded-full px-8 text-muted-foreground hover:text-foreground border border-border bg-card/50 backdrop-blur-md">
               <RefreshCw className="mr-2 h-4 w-4" /> Start Over
            </Button>
            <Button size="lg" onClick={handleDownload} className="rounded-full px-8 bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
               <Download className="mr-2 h-4 w-4" /> Download HD
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
