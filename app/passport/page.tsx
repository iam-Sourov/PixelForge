"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  RefreshCw, 
  Sparkles, 
  Check, 
  Grid3X3, 
  Layers, 
  ScanFace,
  FileImage,
  Eye,
  Sliders
} from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { cn, fixExifOrientation } from "@/lib/utils";
import { processImageForClient } from "@/lib/image-client";
import { useTheme } from "next-themes";
import Cropper, { Area } from "react-easy-crop";

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

type PresetType = "bd_passport" | "bd_stamp" | "bd_epassport";

export default function PassportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [transparentUrl, setTransparentUrl] = useState<string | null>(null);
  const [transparentBlob, setTransparentBlob] = useState<Blob | null>(null);

  const [preset, setPreset] = useState<PresetType>("bd_passport");
  const [bgColor, setBgColor] = useState<"white" | "blue" | "gray">("white");
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Editor states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => setMounted(true), []);

  // Compute aspect ratio based on preset
  const getAspectRatio = () => {
    switch (preset) {
      case "bd_passport":
        return 35 / 45; // 45mm x 35mm
      case "bd_stamp":
        return 20 / 25; // 25mm x 20mm
      case "bd_epassport":
        return 1 / 1; // 50mm x 50mm (2x2 inch)
      default:
        return 35 / 45;
    }
  };

  const handleUpload = async (selectedFile: File) => {
    setIsProcessingBg(true);
    setErrorText(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    if (transparentUrl) {
      URL.revokeObjectURL(transparentUrl);
      setTransparentUrl(null);
    }

    try {
      const processed = await processImageForClient(selectedFile);
      setFile(processed);
      const base64data = await blobToBase64(processed);

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64data }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process image.");
      }

      const data = await res.json();
      const base64Response = await fetch(data.resultImage);
      const blob = await base64Response.blob();

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

  const handleExport = async (format: "jpg" | "png" | "sheet_jpg" | "psd", layout = "4x1") => {
    if (!transparentBlob || !croppedAreaPixels) return;
    setIsExporting(true);
    try {
      const formData = new FormData();
      formData.append("image", transparentBlob, file?.name || "image.png");
      formData.append("crop", JSON.stringify(croppedAreaPixels));
      formData.append("bgColor", bgColor);
      formData.append("format", format);
      formData.append("layout", layout);
      formData.append("sizeType", preset);

      const res = await fetch("/api/export-passport", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to export.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      let filename = `bangladesh-${preset}-${Date.now()}.${format === "sheet_jpg" ? "jpg" : format}`;
      if (format === "psd") filename = `bangladesh-studio-sheet-${layout}-${Date.now()}.psd`;

      a.download = filename;
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
    if (transparentUrl) URL.revokeObjectURL(transparentUrl);
    setFile(null);
    setTransparentUrl(null);
    setTransparentBlob(null);
    setErrorText(null);
  };

  const presets = [
    {
      id: "bd_passport" as const,
      name: "BD Passport / MRP",
      size: "45mm × 35mm",
      sub: "Official ICAO Standard",
      aspect: 35 / 45,
      gradient: "from-emerald-400 via-teal-500 to-green-600 shadow-emerald-500/25",
    },
    {
      id: "bd_stamp" as const,
      name: "BD Stamp Size",
      size: "25mm × 20mm",
      sub: "Job, College & Form Use",
      aspect: 20 / 25,
      gradient: "from-blue-400 via-indigo-500 to-cyan-500 shadow-blue-500/25",
    },
    {
      id: "bd_epassport" as const,
      name: "BD e-Passport / Visa",
      size: "50mm × 50mm (2×2\")",
      sub: "Square e-Passport Spec",
      aspect: 1,
      gradient: "from-purple-400 via-pink-500 to-rose-500 shadow-purple-500/25",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden flex flex-col items-center justify-start p-4 md:p-8">
      {mounted && <Spotlight className="-top-40 right-0 md:right-60 md:-top-20" fill={resolvedTheme === "dark" ? "white" : "black"} />}

      <div className="z-10 w-full max-w-5xl flex flex-col items-center gap-8">

        {/* Header */}
        {!transparentUrl && !isProcessingBg && (
          <div className="text-center space-y-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-sm animate-pulse" />
              Official Bangladesh Passport & Studio Specs
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground">
              Bangladeshi Passport Studio
            </h1>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto font-light">
              Automatic background isolation, official ICAO standard face centering, and print-ready 4×6&quot; sheet creation.
            </p>
          </div>
        )}

        {errorText && (
          <div className="w-full max-w-3xl p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {errorText}
          </div>
        )}

        {/* Upload Container */}
        {!file && (
          <div className="w-full max-w-2xl mx-auto rounded-3xl border border-border bg-card/40 p-3 backdrop-blur-xl shadow-2xl">
            <UploadZone
              onFileSelect={handleUpload}
              className="min-h-[360px] border-dashed border-border/60 bg-transparent"
            />
          </div>
        )}

        {/* Processing Spinner */}
        {isProcessingBg && (
          <div className="flex flex-col items-center justify-center p-16 space-y-4">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md animate-pulse" />
            </div>
            <p className="font-mono text-xs tracking-widest uppercase text-emerald-400 font-bold">
              Extracting Foreground Subject with AI...
            </p>
          </div>
        )}

        {/* Workspace */}
        {transparentUrl && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500 w-full">
              
              {/* Preset Format Selector Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
                {presets.map((p) => {
                  const isSelected = preset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPreset(p.id)}
                      className={cn(
                        "p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary"
                          : "border-border/60 bg-card/30 hover:bg-muted/40 hover:border-border"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-3 h-3 rounded-full bg-gradient-to-tr shadow-sm ring-1 ring-white/20 shrink-0", p.gradient)} />
                          <span className="font-bold text-xs text-foreground">{p.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <span className="font-mono text-xs font-semibold text-primary">{p.size}</span>
                      <span className="text-[10px] text-muted-foreground">{p.sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cropper & Controls Grid */}
              <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start justify-center max-w-4xl mx-auto border border-border/80 bg-card/40 p-6 md:p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
                
                {/* Result Image cropping container */}
                <div className="flex flex-col items-center gap-4">
                  <div 
                    className="relative shrink-0 transition-transform duration-300 rounded-2xl overflow-hidden border-2 border-border shadow-2xl"
                    style={{
                      width: preset === "bd_epassport" ? "300px" : preset === "bd_stamp" ? "240px" : "280px",
                      height: preset === "bd_epassport" ? "300px" : preset === "bd_stamp" ? "300px" : "360px",
                    }}
                  >
                    <Cropper
                      image={transparentUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={getAspectRatio()}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      cropShape="rect"
                      showGrid={false}
                      style={{
                        containerStyle: {
                          backgroundColor: bgColor === "white" ? "#FFFFFF" : bgColor === "blue" ? "#BAE6FD" : "#E5E7EB",
                        },
                      }}
                    />

                    {/* Official BD Passport ICAO Framing Guidelines Overlay */}
                    {showGuidelines && (
                      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 border-2 border-dashed border-emerald-500/50">
                        <div className="flex justify-between items-center text-[9px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm self-center">
                          Crown / Hair Top (70-80% Face)
                        </div>
                        <div className="w-full border-t border-dashed border-emerald-400/40" />
                        <div className="w-full border-t border-dashed border-emerald-400/40" />
                        <div className="flex justify-between items-center text-[9px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm self-center">
                          Chin Line Guide
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Zoom Slider */}
                  <div className="w-full max-w-[280px] flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 text-[11px] font-mono">Zoom</span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <span className="shrink-0 text-[11px] font-mono">{zoom.toFixed(1)}x</span>
                  </div>
                </div>

                {/* Right Side Studio Controls */}
                <div className="flex flex-col gap-6 text-left w-full h-full justify-between">
                  
                  {/* Background Color Preset */}
                  <div>
                    <h3 className="text-xs font-bold text-foreground mb-3 tracking-widest uppercase flex items-center justify-between">
                      <span>Studio Background</span>
                      <button
                        onClick={() => setShowGuidelines(!showGuidelines)}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 font-normal lowercase tracking-normal"
                      >
                        <Eye className="w-3 h-3" /> {showGuidelines ? "Hide Guidelines" : "Show Guidelines"}
                      </button>
                    </h3>

                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: "white", label: "Pure White", gradient: "from-slate-100 via-white to-slate-200 border-slate-300/60" },
                        { id: "blue", label: "Sky Blue", gradient: "from-sky-300 via-blue-300 to-cyan-200 border-sky-300/60 shadow-sky-400/25" },
                        { id: "gray", label: "Light Gray", gradient: "from-gray-200 via-slate-300 to-zinc-400 border-slate-300/60 shadow-gray-400/25" },
                      ].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setBgColor(c.id as "white" | "blue" | "gray")}
                          className={cn(
                            "relative h-14 rounded-xl flex flex-col items-center justify-center p-1 transition-all border",
                            bgColor === c.id
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 border-primary shadow-md"
                              : "hover:scale-102 border-border/70 bg-card/60"
                          )}
                        >
                          <span
                            className={cn("w-5 h-5 rounded-full border mb-1 bg-gradient-to-br shadow-sm ring-1 ring-white/20", c.gradient)}
                          />
                          <span className="text-[11px] font-bold text-foreground">{c.label}</span>
                          {bgColor === c.id && <Check className="absolute top-1.5 right-1.5 w-3 h-3 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Print Sheet & Export Actions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-foreground tracking-widest uppercase">
                      Studio Export & Print Sheet
                    </h3>

                    {/* Single Photo Downloads */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="lg"
                        onClick={() => handleExport("jpg")}
                        disabled={isExporting}
                        className="rounded-xl h-12 text-xs font-bold shadow-md"
                      >
                        <Download className="mr-2 h-4 w-4" /> Single JPG (300 DPI)
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        onClick={() => handleExport("png")}
                        disabled={isExporting}
                        className="rounded-xl h-12 text-xs font-bold border border-border"
                      >
                        <FileImage className="mr-2 h-4 w-4" /> Single PNG
                      </Button>
                    </div>

                    {/* Bangladeshi Studio Print Sheet Layouts */}
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                        <span>4×6&quot; Print Layouts:</span>
                        <span className="font-mono text-[10px] text-emerald-400">Ready for Lab & Studio</span>
                      </div>

                      {/* Studio Combo Sheet (4 Passport + 4 Stamp) */}
                      <Button
                        size="lg"
                        onClick={() => handleExport("sheet_jpg", "combo")}
                        disabled={isExporting}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold h-12 text-xs shadow-lg transition-transform hover:scale-[1.01]"
                      >
                        <Grid3X3 className="mr-2 h-4 w-4" /> 🇧🇩 BD Studio Combo (4 Passport + 4 Stamp Sheet)
                      </Button>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport("psd", "4x1")}
                          disabled={isExporting}
                          className="rounded-xl border-border bg-card/60 h-10 text-xs font-medium"
                        >
                          <Layers className="mr-1.5 h-3.5 w-3.5 text-blue-400" /> PSD (4×1 Row)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport("psd", "4x2")}
                          disabled={isExporting}
                          className="rounded-xl border-border bg-card/60 h-10 text-xs font-medium"
                        >
                          <Layers className="mr-1.5 h-3.5 w-3.5 text-indigo-400" /> PSD (8 Photos 4×2)
                        </Button>
                      </div>
                    </div>

                    {/* Start Over */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={reset}
                      disabled={isExporting}
                      className="w-full rounded-xl text-muted-foreground hover:text-foreground mt-1 text-xs"
                    >
                      <RefreshCw className="mr-2 h-3.5 w-3.5" /> Process New Photo
                    </Button>
                  </div>

                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
