"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Sparkles, Check, Grid3X3 } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import Cropper, { Area } from "react-easy-crop";

export default function PassportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [transparentUrl, setTransparentUrl] = useState<string | null>(null);
  const [transparentBlob, setTransparentBlob] = useState<Blob | null>(null);

  const [bgColor, setBgColor] = useState<"white" | "gray" | "blue">("white");
  const [errorText, setErrorText] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Editor states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessingBg(true);
    setErrorText(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(selectedFile);

      setTransparentBlob(blob);
      const tUrl = URL.createObjectURL(blob);
      setTransparentUrl(tUrl);
    } catch (e: unknown) {
      setErrorText(e instanceof Error ? e.message : "Failed to process image.");
    } finally {
      setIsProcessingBg(false);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleExport = async (format: "jpg" | "psd") => {
    if (!transparentBlob || !croppedAreaPixels) return;
    setIsExporting(true);
    try {
      const formData = new FormData();
      formData.append("image", transparentBlob, file?.name || "image.png");
      formData.append("crop", JSON.stringify(croppedAreaPixels));
      formData.append("bgColor", bgColor);
      formData.append("format", format);

      const res = await fetch("/api/export-passport", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to export.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "jpg" ? `passport-single-${Date.now()}.jpg` : `4x6-print-sheet-${Date.now()}.psd`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      setErrorText("Failed to generate export file.");
    } finally {
      setIsExporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setTransparentUrl(null);
    setTransparentBlob(null);
    setErrorText(null);
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

          {transparentUrl && (
            <div className="flex flex-col items-center text-center space-y-8 py-8 animate-in zoom-in-95 duration-500 w-full">

              <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-16 items-start justify-center max-w-3xl border border-border bg-card/30 p-8 rounded-3xl backdrop-blur-xl w-full">

                {/* Result Image cropping area */}
                <div className="relative mx-auto shrink-0 transition-transform duration-300 w-[275px] h-[354px] rounded-xl overflow-hidden border border-border bg-[#e5e7eb]">
                  <Cropper
                    image={transparentUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={35 / 45}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    cropShape="rect"
                    showGrid={false}
                    style={{
                      containerStyle: {
                        backgroundColor: bgColor === "white" ? "#FFFFFF" : bgColor === "gray" ? "#E5E7EB" : "#BAE6FD"
                      }
                    }}
                  />
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

                  {/* Main Actions */}
                  <div className="flex flex-col gap-3 mt-auto">
                    <div className="flex gap-3">
                      <Button size="lg" onClick={() => handleExport("jpg")} disabled={isExporting} className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-14 shadow-md transition-transform hover:scale-[1.02]">
                        <Download className="mr-2 h-4 w-4" /> {isExporting ? "Processing..." : "Save Standard JPG"}
                      </Button>

                      <Button size="lg" onClick={() => handleExport("psd")} disabled={isExporting} className="flex-1 rounded-xl bg-[#26a8ed] text-white hover:bg-[#1f93d1] font-bold h-14 shadow-lg transition-transform hover:scale-[1.02]">
                        <Grid3X3 className="mr-2 h-4 w-4" /> {isExporting ? "Processing..." : "Save PSD Sheet"}
                      </Button>
                    </div>

                    <Button variant="ghost" size="sm" onClick={reset} disabled={isExporting} className="w-full rounded-xl text-muted-foreground hover:text-foreground mt-2">
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
