"use client";

import React, { useState } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, AlertCircle, Download, FileText, Crop, Image as ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type StepStatus = "idle" | "active" | "completed";

export default function PassportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bgColor, setBgColor] = useState<"white" | "gray" | "blue">("white");
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null);
  
  // Mock validation results
  const [checks, setChecks] = useState({
    face: true,
    background: true,
    size: true,
    ratio: true
  });

  const handleUpload = (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setActiveStep(2);
    // Simulate auto-detect processing
    simulateProcessing();
  };

  const simulateProcessing = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsProcessing(false);
    setActiveStep(3);
  };

  const confirmBackground = async () => {
    if (!file) return;
    setActiveStep(4); // Compliance check loading phase
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("bg_color", bgColor);
      
      const res = await fetch("/api/passport", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to process passport photo");
      
      const blob = await res.blob();
      setResultBlobUrl(URL.createObjectURL(blob));
      
      setActiveStep(5);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Something went wrong.");
      setActiveStep(3);
    }
  };

  const downloadSingle = () => {
    if (!resultBlobUrl) return;
    const a = document.createElement("a");
    a.href = resultBlobUrl;
    a.download = `passport-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getStepStatus = (step: number): StepStatus => {
    if (activeStep > step) return "completed";
    if (activeStep === step) return "active";
    return "idle";
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:px-8 lg:py-12">
      <div className="mb-8 md:mb-12">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-5xl">Passport Photo Maker</h1>
        <p className="mt-2 text-muted-foreground font-light max-w-2xl">
          Instantly generate ICAO-compliant passport photos meeting Bangladesh standards. AI-powered cropping and background replacement.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        {/* Left Column: Flow & Action Area */}
        <div className="flex flex-col gap-6">
          
          {/* Step 1: Upload */}
          <div className={cn("rounded-[2rem] border border-border/50 bg-card/20 p-6 transition-all duration-300", getStepStatus(1) === "active" ? "ring-1 ring-primary/50 shadow-lg scale-[1.01]" : "opacity-70")}>
            <div className="mb-4 flex items-center gap-3">
              {getStepStatus(1) === "completed" ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Circle className={cn("h-6 w-6", getStepStatus(1) === "active" ? "text-primary" : "text-muted-foreground")} />}
              <h2 className="font-heading text-xl font-semibold">1. Upload Photo</h2>
            </div>
            
            {getStepStatus(1) === "active" && (
              <UploadZone onFileSelect={handleUpload} className="h-[300px]" />
            )}
            
            {getStepStatus(1) === "completed" && previewUrl && (
              <div className="flex items-center gap-4 rounded-xl bg-card border border-white/5 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} className="h-16 w-16 rounded-lg object-cover" alt="Thumb" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">{(file!.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setActiveStep(1); setFile(null); setPreviewUrl(null); }}>Change</Button>
              </div>
            )}
          </div>

          {/* Step 2: Auto-detect & Crop */}
          <div className={cn("rounded-[2rem] border border-border/50 bg-card/20 p-6 transition-all duration-300", getStepStatus(2) === "active" ? "ring-1 ring-primary/50 shadow-lg scale-[1.01]" : "opacity-50")}>
            <div className="mb-4 flex items-center gap-3">
              {getStepStatus(2) === "completed" ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Circle className={cn("h-6 w-6", getStepStatus(2) === "active" ? "text-primary" : "text-muted-foreground")} />}
              <h2 className="font-heading text-xl font-semibold">2. Auto-detect & Crop</h2>
            </div>
            
            {getStepStatus(2) === "active" && (
              <div className="relative flex flex-col items-center justify-center min-h-[300px] rounded-xl bg-card/50 overflow-hidden">
                {isProcessing ? (
                  <div className="text-center">
                    <Sparkles className="mx-auto mb-4 h-8 w-8 text-primary animate-pulse" />
                    <p className="font-medium tracking-tight">Detecting face & shoulders...</p>
                  </div>
                ) : (
                  <div className="w-full text-center p-8 text-muted-foreground text-sm">
                    {/* Placeholder for actual cropper UI */}
                    Face detected successfully. Crop bounds aligned to 45x35mm ratio.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Background */}
          <div className={cn("rounded-[2rem] border border-border/50 bg-card/20 p-6 transition-all duration-300", getStepStatus(3) === "active" ? "ring-1 ring-primary/50 shadow-lg scale-[1.01]" : "opacity-50")}>
            <div className="mb-4 flex items-center gap-3">
              {getStepStatus(3) === "completed" ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Circle className={cn("h-6 w-6", getStepStatus(3) === "active" ? "text-primary" : "text-muted-foreground")} />}
              <h2 className="font-heading text-xl font-semibold">3. Background Replacement</h2>
            </div>
            
            {getStepStatus(3) === "active" && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <button onClick={() => setBgColor("white")} className={cn("relative h-20 flex-1 rounded-xl border bg-white transition-all shadow-md", bgColor === "white" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-105")}>
                    <span className="absolute inset-x-0 bottom-2 text-xs font-semibold text-black/80">White (Official)</span>
                  </button>
                  <button onClick={() => setBgColor("gray")} className={cn("relative h-20 flex-1 rounded-xl border bg-[#e5e7eb] transition-all shadow-md", bgColor === "gray" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-105")}>
                    <span className="absolute inset-x-0 bottom-2 text-xs font-semibold text-black/80">Light Gray</span>
                  </button>
                  <button onClick={() => setBgColor("blue")} className={cn("relative h-20 flex-1 rounded-xl border bg-[#bae6fd] transition-all shadow-md", bgColor === "blue" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-105")}>
                    <span className="absolute inset-x-0 bottom-2 text-xs font-semibold text-black/80">Light Blue</span>
                  </button>
                </div>
                <Button onClick={confirmBackground} size="lg" className="w-full rounded-xl">Apply Background</Button>
              </div>
            )}
            {getStepStatus(3) === "completed" && (
               <div className="text-sm text-primary font-medium flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Selected: {bgColor.toUpperCase()}</div>
            )}
          </div>

          {/* Step 4: Compliance Check */}
          <div className={cn("rounded-2xl border border-border/50 bg-card/20 p-6", getStepStatus(4) === "active" ? "ring-1 ring-primary/50" : "opacity-50")}>
             <div className="mb-4 flex items-center gap-3">
              {getStepStatus(4) === "completed" ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Circle className={cn("h-6 w-6", getStepStatus(4) === "active" ? "text-primary" : "text-muted-foreground")} />}
              <h2 className="font-heading text-xl font-semibold">4. Compliance Check</h2>
            </div>
            
            {(getStepStatus(4) === "active" || getStepStatus(4) === "completed") && (
              <div className="space-y-3 pl-9">
                {getStepStatus(4) === "active" ? (
                   <p className="text-sm text-primary animate-pulse">Generating exact dimension crop using ML...</p>
                ) : (
                  <>
                <div className="flex items-center gap-3 text-sm font-medium text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" /> <span>Correct size (45×35mm @ 300 DPI)</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" /> <span>White background detected</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" /> <span>Face centered & correctly scaled</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" /> <span>ICAO ratio compliance</span>
                </div>
                </>
                )}
              </div>
            )}
          </div>

          {/* Step 5: Output */}
          <div className={cn("rounded-2xl border border-border/50 bg-primary/10 p-6", getStepStatus(5) === "active" ? "ring-1 ring-primary/50 bg-primary/20 shadow-xl" : "opacity-30")}>
            <div className="mb-4 flex items-center gap-3">
              <Circle className={cn("h-6 w-6", getStepStatus(5) === "active" ? "text-primary" : "text-muted-foreground")} />
              <h2 className="font-heading text-xl font-semibold">5. Download Prints</h2>
            </div>
            
            {getStepStatus(5) === "active" && (
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button size="lg" className="flex-1 rounded-xl shadow-lg" onClick={downloadSingle}>
                  <ImageIcon className="mr-2 w-5 h-5"/> Single Photo (PNG)
                </Button>
                <Button size="lg" variant="secondary" className="flex-1 rounded-xl shadow-lg bg-white text-black hover:bg-neutral-200">
                  <FileText className="mr-2 w-5 h-5"/> A4 Print Layout (PDF)
                </Button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Spec Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="sticky top-24 rounded-[2rem] border border-border/50 bg-card/40 p-6 backdrop-blur-xl">
            <h3 className="mb-4 border-b border-border/50 pb-4 font-heading text-lg font-bold">
              Bangladesh Passport Specs
            </h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="font-medium">Dimensions</span>
                <span className="text-foreground">45mm × 35mm</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="font-medium">Resolution</span>
                <span className="text-foreground">300 DPI</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="font-medium">Background</span>
                <span className="text-foreground">Solid White</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span className="font-medium">Face Height</span>
                <span className="text-foreground">32mm - 36mm</span>
              </li>
              <li className="flex gap-3 text-xs leading-relaxed mt-4 bg-muted/30 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
                <span>Ensure neutral expression, eyes visible, no glasses, and even lighting. The AI auto-adjusts orientation and cropping to strict guidelines.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
