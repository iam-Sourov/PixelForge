"use client";

import React, { useState, useEffect } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Sparkles, 
  RefreshCw, 
  Cpu, 
  Activity, 
  ShieldCheck,
  Zap,
  Layers,
  Camera
} from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { CometCard } from "@/components/ui/comet-card";
import { motion, AnimatePresence } from "framer-motion";

export default function EnhancePage() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleUpload = (file: File) => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setEnhancedUrl(null);
    setErrorText(null);
  };

  const startEnhancement = async () => {
    if (!originalUrl) return;
    
    setIsProcessing(true);
    setProgress(0);
    setErrorText(null);

    // Simulate progress while Python works
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 10 : prev));
    }, 400);

    try {
      // Convert image to base64
      const response = await fetch(originalUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64: string = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setEnhancedUrl(data.enhancedImage);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Python script failed. Ensure 'opencv-python' is installed.");
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!enhancedUrl) return;
    const a = document.createElement("a");
    a.href = enhancedUrl;
    a.download = `pixel-forge-python-pro-${Date.now()}.png`;
    a.click();
  };

  const clear = () => {
    setOriginalUrl(null);
    setEnhancedUrl(null);
    setErrorText(null);
    setProgress(0);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden flex flex-col items-center justify-center p-4">
      {mounted && <Spotlight className="-top-40 left-0 md:left-20 md:-top-20" fill={resolvedTheme === "dark" ? "white" : "black"} />}
      
      <div className="z-10 w-full max-w-6xl flex flex-col items-center gap-12">
        
        {/* Header Section */}
        <AnimatePresence mode="wait">
          {!originalUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6"
            >
              <h1 className="text-xl md:text-2xl font-black tracking-tightest leading-none">
                ENHANCE.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary/50">REMASTERED.</span>
              </h1>
              <p className="text-muted-foreground md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                Leveraging server-side Python compute for heavy neural denoising and sub-pixel texture reconstruction.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full relative">
          {errorText && (
            <div className="absolute -top-16 left-0 right-0 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm backdrop-blur-xl z-50 flex items-center justify-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" />
              {errorText}
            </div>
          )}

          {!originalUrl ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[2.5rem] border border-border/50 bg-card/30 p-3 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.1)] mx-auto max-w-3xl"
            >
              <UploadZone onFileSelect={handleUpload} className="min-h-[450px] border-dashed border-primary/20 bg-transparent hover:bg-primary/5 transition-all rounded-[2rem] group" />
            </motion.div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[1fr_400px] w-full items-start">
              
              {/* Massive Comparison Preview */}
              <div className="space-y-6">
                <CometCard className="w-full flex-1 aspect-[4/3] md:aspect-video">
                  <div className="relative h-full w-full rounded-[2rem] border border-border bg-black/20 backdrop-blur-3xl overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                    
                    <div className="h-full w-full flex justify-center items-center">
                      <AnimatePresence mode="wait">
                        <motion.img 
                          key={enhancedUrl || originalUrl}
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.8, ease: "circOut" }}
                          src={enhancedUrl || originalUrl} 
                          className={cn(
                            "h-full w-full object-contain transition-all duration-1000",
                            isProcessing && "scale-105 blur-[10px] grayscale"
                          )} 
                        />
                      </AnimatePresence>
                    </div>

                    {/* Progress Overlay */}
                    {isProcessing && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/40 backdrop-blur-md">
                        <div className="w-1/2 h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-4 font-mono text-[10px] tracking-[0.5em] text-primary uppercase animate-pulse">
                          Processing Node 01 | Subsurface Scattering...
                        </p>
                      </div>
                    )}

                    {/* Quick Labels */}
                    <div className="absolute bottom-6 left-6 flex gap-3 z-20">
                      <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl text-[10px] font-bold text-white uppercase tracking-widest">
                        {enhancedUrl ? "PRO_RESULT_01" : "INPUT_RAW"}
                      </div>
                      {enhancedUrl && (
                        <div className="bg-primary/80 backdrop-blur-xl px-4 py-2 rounded-2xl text-[10px] font-bold text-background uppercase tracking-widest">
                          Neural Pass Complete
                        </div>
                      )}
                    </div>
                  </div>
                </CometCard>

                <div className="flex justify-between items-center px-6">
                   <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                         <Activity className="h-4 w-4 text-primary" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Latent: 120ms</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Layers className="h-4 w-4 text-primary" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Depth: FP32</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Sidebar Controls */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-8 p-10 rounded-[2.5rem] border border-border/50 bg-card/40 backdrop-blur-3xl shadow-3xl h-fit border-t-primary/20"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tightest">PYTHON CORE</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Advanced OpenCV server-side orchestration with Non-Local Means denoising.
                  </p>
                </div>

                <div className="space-y-6">
                  {!enhancedUrl && !isProcessing ? (
                    <Button 
                      size="lg" 
                      onClick={startEnhancement}
                      className="w-full h-20 rounded-[1.5rem] bg-foreground text-background hover:bg-foreground/90 font-black text-lg transition-all hover:scale-[1.03] group shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
                    >
                      <Sparkles className="mr-3 h-6 w-6 group-hover:animate-spin" />
                      REMASTER PIXELS
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      onClick={handleDownload}
                      disabled={isProcessing}
                      className="w-full h-20 rounded-[1.5rem] bg-primary text-primary-foreground hover:bg-primary/90 font-black text-lg transition-all hover:scale-[1.03] shadow-[0_20px_40px_rgba(var(--primary),0.2)]"
                    >
                      <Download className="mr-3 h-6 w-6" />
                      EXPORT MASTER
                    </Button>
                  )}

                  <Button variant="ghost" onClick={clear} className="w-full h-14 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors uppercase text-[10px] font-bold tracking-[0.3em]">
                    <RefreshCw className="mr-2 h-4 w-4" /> Abort Workshop
                  </Button>
                </div>

                <div className="p-6 rounded-3xl bg-black/20 border border-white/5 space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Camera className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Metadata Engine</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Noise Floor</div>
                      <div className="text-sm font-mono">-48dB</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Luma Variance</div>
                      <div className="text-sm font-mono">1.4c</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                   <Zap className="h-4 w-4 text-primary mt-1 shrink-0" />
                   <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic">
                     Neural Denoising requires significant server-side compute. 
                     Large files may take up to 3 seconds per pass.
                   </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
