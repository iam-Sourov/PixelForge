"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import { useGeminiStore } from "@/lib/useGeminiStore";
import { useTheme } from "next-themes";
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  Check, 
  Bot, 
  ArrowRight, 
  ArrowLeftRight, 
  Layers, 
  FileImage, 
  Eye,
  Users,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { processImageForClient } from "@/lib/image-client";
import { removeBackgroundClient } from "@/lib/bg-client";

type BackdropType = "blue" | "white" | "gray" | "dark" | "gradient_purple" | "gradient_warm" | "transparent";
type AspectRatio = "4:3" | "4:5" | "1:1";
type InputMode = "separate" | "combined";

export default function DualAdjustPage() {
  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>("separate");

  // Input raw files
  const [image1Url, setImage1Url] = useState<string | null>(null);
  const [image2Url, setImage2Url] = useState<string | null>(null);
  const [combinedImageUrl, setCombinedImageUrl] = useState<string | null>(null);

  // Transformed transparent subjects
  const [person1Transparent, setPerson1Transparent] = useState<string | null>(null);
  const [person2Transparent, setPerson2Transparent] = useState<string | null>(null);

  // Studio adjustment state
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Extracting & Fusing Both Subjects...");
  const [isConverting1, setIsConverting1] = useState(false);
  const [isConverting2, setIsConverting2] = useState(false);
  const [isConvertingCombined, setIsConvertingCombined] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Placement & Transform controls
  const [scale1, setScale1] = useState(1.0);
  const [scale2, setScale2] = useState(1.0);
  const [offsetY1, setOffsetY1] = useState(0);
  const [offsetY2, setOffsetY2] = useState(0);
  const [closeness, setCloseness] = useState(0); // Spacing between subjects (-100 to +100)
  const [isSwapped, setIsSwapped] = useState(false); // Left vs Right order
  const [layerOrder, setLayerOrder] = useState<"1_over_2" | "2_over_1">("1_over_2");
  const [selectedBg, setSelectedBg] = useState<BackdropType>("blue"); // Default BD Sky Blue!
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:3");
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // HTML5 Live Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { apiKey, selectedModel, setIsKeyModalOpen } = useGeminiStore();
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const handleUpload1 = async (file: File) => {
    setIsConverting1(true);
    setErrorText(null);
    try {
      const processed = await processImageForClient(file);
      if (image1Url) URL.revokeObjectURL(image1Url);
      const url = URL.createObjectURL(processed);
      setImage1Url(url);
      setPerson1Transparent(null);
      setPerson2Transparent(null);
    } catch (e) {
      console.error(e);
      setErrorText("Failed to process Image 1. Please try another image.");
    } finally {
      setIsConverting1(false);
    }
  };

  const handleUpload2 = async (file: File) => {
    setIsConverting2(true);
    setErrorText(null);
    try {
      const processed = await processImageForClient(file);
      if (image2Url) URL.revokeObjectURL(image2Url);
      const url = URL.createObjectURL(processed);
      setImage2Url(url);
      setPerson1Transparent(null);
      setPerson2Transparent(null);
    } catch (e) {
      console.error(e);
      setErrorText("Failed to process Image 2. Please try another image.");
    } finally {
      setIsConverting2(false);
    }
  };

  const handleUploadCombined = async (file: File) => {
    setIsConvertingCombined(true);
    setErrorText(null);
    try {
      const processed = await processImageForClient(file);
      if (combinedImageUrl) URL.revokeObjectURL(combinedImageUrl);
      const url = URL.createObjectURL(processed);
      setCombinedImageUrl(url);
      setPerson1Transparent(null);
      setPerson2Transparent(null);
    } catch (e) {
      console.error(e);
      setErrorText("Failed to process combined photo. Please try another image.");
    } finally {
      setIsConvertingCombined(false);
    }
  };

  const toBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Helper to safely clean edge transparency noise without altering real clothing colors
  const autoCleanDuoCutout = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const w = img.width;
          const h = img.height;

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(dataUrl);

          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          // Safe thresholding for tiny floating translucent dust
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 12) {
              data[i + 3] = 0;
            }
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const startJointGeneration = async () => {
    if (!image1Url || !image2Url) {
      setErrorText("Please upload both Person 1 and Person 2 photos.");
      return;
    }

    setIsProcessing(true);
    setErrorText(null);
    setAiAnalysis(null);
    setStatusMessage("Extracting Person 1 foreground subject...");

    try {
      const b64_1 = await toBase64(image1Url);
      const b64_2 = await toBase64(image2Url);

      // 1. Isolate Person 1
      let p1Cutout = "";
      try {
        setStatusMessage("Isolating Person 1 with AI...");
        p1Cutout = await removeBackgroundClient(b64_1, (msg) => {
          setStatusMessage(`Person 1: ${msg}`);
        });
      } catch (e1) {
        console.warn("Person 1 cutout fallback:", e1);
        p1Cutout = b64_1;
      }

      // 2. Isolate Person 2
      let p2Cutout = "";
      try {
        setStatusMessage("Isolating Person 2 with AI...");
        p2Cutout = await removeBackgroundClient(b64_2, (msg) => {
          setStatusMessage(`Person 2: ${msg}`);
        });
      } catch (e2) {
        console.warn("Person 2 cutout fallback:", e2);
        p2Cutout = b64_2;
      }

      setPerson1Transparent(p1Cutout);
      setPerson2Transparent(p2Cutout);

      // 3. Call server for Gemini lighting harmonization if available
      try {
        setStatusMessage("Analyzing studio color harmony & alignment...");
        const res = await fetch("/api/gemini/adjust-dual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image1: b64_1,
            image2: b64_2,
            person1Transparent: p1Cutout,
            person2Transparent: p2Cutout,
            apiKey,
            model: selectedModel,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);
        }
      } catch (geminiErr) {
        console.warn("Gemini harmonization note:", geminiErr);
      }
    } catch (e: unknown) {
      console.error(e);
      setErrorText(e instanceof Error ? e.message : "Error preparing joint photo. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startCombinedJointGeneration = async () => {
    if (!combinedImageUrl) {
      setErrorText("Please upload a combined photo containing both subjects.");
      return;
    }

    setIsProcessing(true);
    setErrorText(null);
    setAiAnalysis(null);
    setStatusMessage("Extracting combined subjects from background with AI...");

    try {
      const b64_combined = await toBase64(combinedImageUrl);
      let combinedCutout = "";

      try {
        setStatusMessage("Isolating both people from background...");
        combinedCutout = await removeBackgroundClient(b64_combined, (msg) => {
          setStatusMessage(msg);
        });
      } catch (e) {
        console.warn("Combined cutout fallback:", e);
        combinedCutout = b64_combined;
      }

      setStatusMessage("Auto-cleaning background clutter & formatting studio duo...");

      // Auto clean green plastic bag artifact & printer box clutter
      const cleaned = await autoCleanDuoCutout(combinedCutout);

      // Set single unified duo cutout (prevents ghost duplicate head)
      setPerson1Transparent(cleaned);
      setPerson2Transparent(cleaned);

      // Default optimal alignment
      setScale1(1.0);
      setScale2(1.0);
      setOffsetY1(0);
      setOffsetY2(0);
      setCloseness(0);

      if (apiKey) {
        try {
          setStatusMessage("Analyzing facial alignment and lighting harmony...");
          const res = await fetch("/api/gemini/adjust-dual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image1: b64_combined,
              image2: b64_combined,
              person1Transparent: cleaned,
              person2Transparent: cleaned,
              apiKey,
              model: selectedModel,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);
          }
        } catch (geminiErr) {
          console.warn("Gemini harmonization note:", geminiErr);
        }
      }
    } catch (e: unknown) {
      console.error(e);
      setErrorText(e instanceof Error ? e.message : "Error processing combined photo. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    if (image1Url) URL.revokeObjectURL(image1Url);
    if (image2Url) URL.revokeObjectURL(image2Url);
    if (combinedImageUrl) URL.revokeObjectURL(combinedImageUrl);
    setImage1Url(null);
    setImage2Url(null);
    setCombinedImageUrl(null);
    setPerson1Transparent(null);
    setPerson2Transparent(null);
    setAiAnalysis(null);
    setErrorText(null);
    setScale1(1.0);
    setScale2(1.0);
    setOffsetY1(0);
    setOffsetY2(0);
    setCloseness(0);
    setIsSwapped(false);
  };

  // Render live composite on HTML5 Canvas
  const drawComposite = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !person1Transparent || !person2Transparent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Determine dimensions based on aspect ratio
    let targetW = 800;
    let targetH = 600; // 4:3

    if (aspectRatio === "4:5") {
      targetW = 640;
      targetH = 800;
    } else if (aspectRatio === "1:1") {
      targetW = 700;
      targetH = 700;
    }

    canvas.width = targetW;
    canvas.height = targetH;

    // 1. Draw Background
    ctx.clearRect(0, 0, targetW, targetH);

    if (selectedBg === "blue") {
      ctx.fillStyle = "#BAE6FD"; // BD Studio Sky Blue
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (selectedBg === "white") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (selectedBg === "gray") {
      ctx.fillStyle = "#E5E7EB";
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (selectedBg === "dark") {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (selectedBg === "gradient_purple") {
      const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
      grad.addColorStop(0, "#4F46E5");
      grad.addColorStop(1, "#9333EA");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (selectedBg === "gradient_warm") {
      const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
      grad.addColorStop(0, "#F97316");
      grad.addColorStop(1, "#EC4899");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (selectedBg === "transparent") {
      // Checkerboard pattern for transparent preview
      const size = 16;
      for (let y = 0; y < targetH; y += size) {
        for (let x = 0; x < targetW; x += size) {
          ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "#E2E8F0" : "#CBD5E1";
          ctx.fillRect(x, y, size, size);
        }
      }
    }

    // Check if this is a unified single duo cutout (when person1Transparent === person2Transparent)
    const isUnifiedDuo = person1Transparent === person2Transparent;

    if (isUnifiedDuo) {
      const imgDuo = new Image();
      imgDuo.onload = () => {
        const baseH = targetH * 0.94;
        const h = baseH * scale1;
        const w = (imgDuo.width / imgDuo.height) * h;
        const posX = (targetW - w) / 2;
        const posY = targetH - h + offsetY1;

        ctx.drawImage(imgDuo, posX, posY, w, h);

        if (showGuidelines) {
          ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);

          const eyeY = targetH * 0.35;
          ctx.beginPath();
          ctx.moveTo(0, eyeY);
          ctx.lineTo(targetW, eyeY);
          ctx.stroke();

          const chinY = targetH * 0.58;
          ctx.beginPath();
          ctx.moveTo(0, chinY);
          ctx.lineTo(targetW, chinY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(targetW / 2, 0);
          ctx.lineTo(targetW / 2, targetH);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      };
      imgDuo.src = person1Transparent;
      return;
    }

    // 2. Load and draw both separate transparent subject images
    const imgA = new Image();
    const imgB = new Image();

    const src1 = isSwapped ? person2Transparent : person1Transparent;
    const src2 = isSwapped ? person1Transparent : person2Transparent;

    const s1 = isSwapped ? scale2 : scale1;
    const s2 = isSwapped ? scale1 : scale2;

    const yOff1 = isSwapped ? offsetY2 : offsetY1;
    const yOff2 = isSwapped ? offsetY1 : offsetY2;

    let loadedCount = 0;
    const onLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        const baseH = targetH * 0.95;

        // Subject 1 (Left)
        const h1 = baseH * s1;
        const w1 = (imgA.width / imgA.height) * h1;

        // Subject 2 (Right)
        const h2 = baseH * s2;
        const w2 = (imgB.width / imgB.height) * h2;

        // Placement centers
        const centerX = targetW / 2;
        // Default spacing puts left person around centerX - 130 and right person at centerX + 130
        const separation = 130 - closeness * 0.8;

        const posX1 = centerX - separation - w1 / 2;
        const posY1 = targetH - h1 + yOff1;

        const posX2 = centerX + separation - w2 / 2;
        const posY2 = targetH - h2 + yOff2;

        const renderLeft = () => {
          ctx.drawImage(imgA, posX1, posY1, w1, h1);
        };

        const renderRight = () => {
          ctx.drawImage(imgB, posX2, posY2, w2, h2);
        };

        if (layerOrder === "2_over_1") {
          // Left person first, right person overlaps on top
          renderLeft();
          renderRight();
        } else {
          // Right person first, left person overlaps on top
          renderRight();
          renderLeft();
        }

        // 3. Optional Guidelines overlay
        if (showGuidelines) {
          ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);

          // Eye level line (around 35% from top)
          const eyeY = targetH * 0.35;
          ctx.beginPath();
          ctx.moveTo(0, eyeY);
          ctx.lineTo(targetW, eyeY);
          ctx.stroke();

          // Chin level line (around 58% from top)
          const chinY = targetH * 0.58;
          ctx.beginPath();
          ctx.moveTo(0, chinY);
          ctx.lineTo(targetW, chinY);
          ctx.stroke();

          // Center divider
          ctx.beginPath();
          ctx.moveTo(targetW / 2, 0);
          ctx.lineTo(targetW / 2, targetH);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    };

    imgA.onload = onLoad;
    imgB.onload = onLoad;
    imgA.src = src1;
    imgB.src = src2;
  }, [
    person1Transparent,
    person2Transparent,
    selectedBg,
    aspectRatio,
    scale1,
    scale2,
    offsetY1,
    offsetY2,
    closeness,
    isSwapped,
    layerOrder,
    showGuidelines,
  ]);

  useEffect(() => {
    if (person1Transparent && person2Transparent) {
      drawComposite();
    }
  }, [drawComposite, person1Transparent, person2Transparent]);

  const handleExport = async (format: "single_jpg" | "single_png" | "sheet_4x6" | "psd") => {
    if (!person1Transparent || !person2Transparent) return;

    setIsExporting(true);
    try {
      const isUnified = inputMode === "combined" || person1Transparent === person2Transparent;
      const src1 = isSwapped ? person2Transparent : person1Transparent;
      const src2 = isSwapped ? person1Transparent : person2Transparent;

      const s1 = isSwapped ? scale2 : scale1;
      const s2 = isSwapped ? scale1 : scale2;

      const yOff1 = isSwapped ? offsetY2 : offsetY1;
      const yOff2 = isSwapped ? offsetY1 : offsetY2;

      const separation = 130 - closeness * 0.8;

      const res = await fetch("/api/export-joint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image1: src1,
          image2: isUnified ? null : src2,
          person1: isUnified
            ? { scale: scale1, offsetX: 0, offsetY: offsetY1 }
            : { scale: s1, offsetX: -separation, offsetY: yOff1 },
          person2: isUnified
            ? { scale: scale1, offsetX: 0, offsetY: offsetY1 }
            : { scale: s2, offsetX: separation, offsetY: yOff2 },
          layerOrder,
          bgColor: selectedBg,
          aspectRatio,
          format,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to export joint photo.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      let filename = `bangladesh-joint-portrait-${Date.now()}.${format === "single_png" ? "png" : format === "psd" ? "psd" : "jpg"}`;
      if (format === "sheet_4x6") {
        filename = `bangladesh-joint-4x6-print-sheet-${Date.now()}.jpg`;
      } else if (format === "psd") {
        filename = `bangladesh-joint-portrait-master-${Date.now()}.psd`;
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setErrorText("Failed to generate master download file.");
    } finally {
      setIsExporting(false);
    }
  };

  const backdrops: Array<{ id: BackdropType; label: string; grad: string; hex?: string }> = [
    { id: "blue", label: "BD Studio Sky Blue", grad: "from-sky-300 via-blue-300 to-cyan-200" },
    { id: "white", label: "Passport White", grad: "from-slate-100 via-white to-slate-200" },
    { id: "gray", label: "Studio Gray", grad: "from-slate-200 via-gray-300 to-zinc-400" },
    { id: "dark", label: "Dark Studio", grad: "from-slate-800 via-zinc-900 to-black" },
    { id: "gradient_purple", label: "Royal Indigo", grad: "from-indigo-600 via-purple-600 to-pink-600" },
    { id: "gradient_warm", label: "Sunset Glow", grad: "from-orange-500 via-amber-500 to-rose-500" },
    { id: "transparent", label: "Transparent HD", grad: "from-slate-300 via-slate-400 to-slate-300 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-700" },
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden flex flex-col items-center justify-start p-4 md:p-8">
      {mounted && <Spotlight className="-top-40 left-0 md:left-40 md:-top-20" fill={resolvedTheme === "dark" ? "white" : "black"} />}

      <div className="z-10 w-full max-w-5xl flex flex-col items-center gap-6 sm:gap-8">
        
        {/* Header Section */}
        {!person1Transparent && (
          <div className="text-center space-y-3 sm:space-y-4 mb-2 sm:mb-4 px-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] sm:text-xs font-mono text-primary">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Duo Portrait Studio Fusion
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground break-words">
              2-Picture Joint Studio
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              Upload 2 individual photos or 1 combined photo. AI automatically isolates subjects from any background, levels eye lines, matches studio lighting, and centers them in perfect studio joint alignment.
            </p>

            {/* Model status bar */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-md text-xs hover:border-primary/40 transition-colors touch-manipulation max-w-[90vw] truncate"
              >
                <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 shadow-sm shrink-0" />
                <span className="truncate">Active Model: <strong className="text-foreground font-mono">{selectedModel}</strong></span>
                {!apiKey && <span className="text-[10px] text-amber-500 font-bold ml-1 shrink-0">(Click to add key)</span>}
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorText && (
          <div className="w-full max-w-3xl p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {errorText}
          </div>
        )}

        {/* Stage 1: Upload Selection Mode */}
        {!person1Transparent ? (
          <div className="w-full space-y-6 sm:space-y-8">
            
            {/* Input Mode Selector Tabs */}
            <div className="flex justify-center">
              <div className="inline-flex items-center p-1.5 rounded-2xl bg-card/70 border border-border/80 backdrop-blur-md shadow-lg gap-1.5">
                <button
                  type="button"
                  onClick={() => setInputMode("separate")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all touch-manipulation",
                    inputMode === "separate"
                      ? "bg-primary text-primary-foreground shadow-md font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>2 Separate Photos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode("combined")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all touch-manipulation",
                    inputMode === "combined"
                      ? "bg-primary text-primary-foreground shadow-md font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <UserCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>1 Combined Photo</span>
                </button>
              </div>
            </div>

            {inputMode === "separate" ? (
              /* Mode A: 2 Separate Photos */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl mx-auto">
                  
                  {/* Box 1: Person 1 */}
                  <div className="flex flex-col gap-2.5 sm:gap-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] ring-1 ring-white/20 shrink-0" />
                        Person 1 (Left / e.g. Groom)
                      </span>
                      {image1Url && (
                        <button
                          onClick={() => setImage1Url(null)}
                          className="text-xs text-muted-foreground hover:text-foreground touch-manipulation font-semibold"
                        >
                          Change
                        </button>
                      )}
                    </div>

                    <div className="relative rounded-3xl border border-border bg-card/40 backdrop-blur-xl p-2.5 sm:p-3 shadow-xl min-h-[280px] sm:min-h-[320px] flex items-center justify-center overflow-hidden">
                      {isConverting1 ? (
                        <div className="flex flex-col items-center justify-center gap-2 text-primary animate-pulse">
                          <Sparkles className="w-8 h-8 animate-spin" />
                          <span className="text-xs font-mono font-medium">Preparing image...</span>
                        </div>
                      ) : image1Url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image1Url}
                          alt="Person 1"
                          className="max-h-[260px] sm:max-h-[300px] w-full object-contain rounded-2xl animate-in fade-in"
                        />
                      ) : (
                        <UploadZone
                          onFileSelect={handleUpload1}
                          title="Drop Person 1 Photo"
                          description="Upload left portrait (JPG, PNG, HEIC)"
                          className="w-full h-full min-h-[260px] sm:min-h-[280px] border-dashed border-border/60 rounded-2xl bg-transparent"
                        />
                      )}
                    </div>
                  </div>

                  {/* Box 2: Person 2 */}
                  <div className="flex flex-col gap-2.5 sm:gap-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.6)] ring-1 ring-white/20 shrink-0" />
                        Person 2 (Right / e.g. Bride)
                      </span>
                      {image2Url && (
                        <button
                          onClick={() => setImage2Url(null)}
                          className="text-xs text-muted-foreground hover:text-foreground touch-manipulation font-semibold"
                        >
                          Change
                        </button>
                      )}
                    </div>

                    <div className="relative rounded-3xl border border-border bg-card/40 backdrop-blur-xl p-2.5 sm:p-3 shadow-xl min-h-[280px] sm:min-h-[320px] flex items-center justify-center overflow-hidden">
                      {isConverting2 ? (
                        <div className="flex flex-col items-center justify-center gap-2 text-indigo-400 animate-pulse">
                          <Sparkles className="w-8 h-8 animate-spin" />
                          <span className="text-xs font-mono font-medium">Preparing image...</span>
                        </div>
                      ) : image2Url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image2Url}
                          alt="Person 2"
                          className="max-h-[260px] sm:max-h-[300px] w-full object-contain rounded-2xl animate-in fade-in"
                        />
                      ) : (
                        <UploadZone
                          onFileSelect={handleUpload2}
                          title="Drop Person 2 Photo"
                          description="Upload right portrait (JPG, PNG, HEIC)"
                          className="w-full h-full min-h-[260px] sm:min-h-[280px] border-dashed border-border/60 rounded-2xl bg-transparent"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Launch Action */}
                <div className="flex justify-center pt-2 px-4 sm:px-0">
                  <Button
                    size="lg"
                    onClick={startJointGeneration}
                    disabled={isProcessing || isConverting1 || isConverting2 || !image1Url || !image2Url}
                    className="w-full sm:w-auto h-14 sm:h-16 px-6 sm:px-10 rounded-2xl text-sm sm:text-base font-bold shadow-2xl hover:shadow-primary/30 transition-all hover:scale-[1.02] touch-manipulation"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 animate-spin shrink-0" />
                        <span className="truncate">{statusMessage}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 shrink-0" />
                        <span>Attach & Create Joint Studio Photo</span>
                        <ArrowRight className="w-5 h-5 ml-1 shrink-0" />
                      </span>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              /* Mode B: 1 Combined Photo */
              <>
                <div className="flex flex-col gap-2.5 sm:gap-3 max-w-2xl mx-auto w-full">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-[0_0_8px_rgba(52,211,153,0.6)] ring-1 ring-white/20 shrink-0" />
                      Combined Photo (Both People Standing Together)
                    </span>
                    {combinedImageUrl && (
                      <button
                        onClick={() => setCombinedImageUrl(null)}
                        className="text-xs text-muted-foreground hover:text-foreground touch-manipulation font-semibold"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  <div className="relative rounded-3xl border border-border bg-card/40 backdrop-blur-xl p-3 sm:p-4 shadow-xl min-h-[320px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
                    {isConvertingCombined ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-emerald-400 animate-pulse">
                        <Sparkles className="w-8 h-8 animate-spin" />
                        <span className="text-xs font-mono font-medium">Preparing combined image...</span>
                      </div>
                    ) : combinedImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={combinedImageUrl}
                        alt="Combined Joint Photo"
                        className="max-h-[300px] sm:max-h-[340px] w-full object-contain rounded-2xl animate-in fade-in"
                      />
                    ) : (
                      <UploadZone
                        onFileSelect={handleUploadCombined}
                        title="Drop Combined Duo Photo"
                        description="Upload photo containing both subjects (JPG, PNG, HEIC). AI will strip messy background & auto-align."
                        className="w-full h-full min-h-[280px] sm:min-h-[320px] border-dashed border-border/60 rounded-2xl bg-transparent"
                      />
                    )}
                  </div>
                </div>

                {/* Launch Action */}
                <div className="flex justify-center pt-2 px-4 sm:px-0">
                  <Button
                    size="lg"
                    onClick={startCombinedJointGeneration}
                    disabled={isProcessing || isConvertingCombined || !combinedImageUrl}
                    className="w-full sm:w-auto h-14 sm:h-16 px-6 sm:px-10 rounded-2xl text-sm sm:text-base font-bold shadow-2xl hover:shadow-primary/30 transition-all hover:scale-[1.02] touch-manipulation"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 animate-spin shrink-0" />
                        <span className="truncate">{statusMessage}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 shrink-0" />
                        <span>Extract & Auto-Align Studio Joint Photo</span>
                        <ArrowRight className="w-5 h-5 ml-1 shrink-0" />
                      </span>
                    )}
                  </Button>
                </div>
              </>
            )}

          </div>
        ) : (
          /* Stage 2: Interactive Live Studio Joint Photo Editor */
          <div className="w-full max-w-6xl space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-500">
            
            <div className="grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Live Canvas Preview */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-full rounded-3xl border border-border bg-card/40 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-center min-h-[360px] sm:min-h-[440px] md:min-h-[480px]">
                  
                  <div className="flex items-center justify-between w-full mb-3 sm:mb-4 flex-wrap gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-sm shrink-0" />
                      Live Studio Joint Canvas
                    </span>

                    <button
                      onClick={() => setShowGuidelines(!showGuidelines)}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-mono touch-manipulation"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {showGuidelines ? "Hide Eye Guides" : "Show Eye Guides"}
                    </button>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border-2 border-border/80 shadow-2xl max-w-full flex items-center justify-center bg-black/10">
                    <canvas
                      ref={canvasRef}
                      className="max-h-[320px] sm:max-h-[420px] md:max-h-[460px] w-auto max-w-full object-contain"
                    />
                  </div>
                </div>

                {/* AI Retoucher Advice Note */}
                {aiAnalysis && (
                  <div className="w-full p-4 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl flex items-start gap-3 text-xs">
                    <Bot className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-primary font-mono uppercase tracking-wider">AI Studio Retoucher Note</strong>
                      <p className="text-muted-foreground whitespace-pre-line leading-relaxed font-light">{aiAnalysis}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Studio Controls Panel */}
              <div className="flex flex-col gap-5 sm:gap-6 p-4 sm:p-6 rounded-3xl border border-border bg-card/60 backdrop-blur-2xl shadow-2xl">
                
                {/* 1. Backdrop Selector & Aspect Ratio */}
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 shadow-sm shrink-0" />
                      Studio Backdrop Color
                    </h3>
                    <div className="flex items-center gap-1 bg-background/60 p-0.5 sm:p-1 rounded-xl border border-border/70 text-[10px]">
                      {(["4:3", "4:5", "1:1"] as AspectRatio[]).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAspectRatio(ratio)}
                          className={cn(
                            "px-2 py-0.5 rounded-lg font-medium transition-all touch-manipulation",
                            aspectRatio === ratio
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {backdrops.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBg(b.id)}
                        className={cn(
                          "p-2 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all touch-manipulation",
                          selectedBg === b.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm"
                            : "border-border/60 bg-background/40 hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-4 h-4 rounded-full border border-black/10 shrink-0 bg-gradient-to-br shadow-sm ring-1 ring-white/20",
                              b.grad
                            )}
                          />
                          <span className="truncate text-[11px] text-foreground">{b.label}</span>
                        </div>
                        {selectedBg === b.id && <Check className="w-3 h-3 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Combined couple framing controls */}
                {inputMode === "combined" && (
                  <div className="p-3.5 rounded-2xl bg-background/40 border border-border/60 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500" />
                        Couple Framing & Alignment
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                        <span>Couple Scale / Zoom</span>
                        <span className="text-foreground font-bold">{(scale1 * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.8}
                        max={1.3}
                        step={0.02}
                        value={scale1}
                        onChange={(e) => setScale1(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                        <span>Vertical Height (Eye Level)</span>
                        <span className="text-foreground font-bold">{offsetY1}px</span>
                      </div>
                      <input
                        type="range"
                        min={-80}
                        max={80}
                        value={offsetY1}
                        onChange={(e) => setOffsetY1(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Manual placement controls only for separate photos mode */}
                {inputMode === "separate" && (
                  <>
                    {/* 2. Position & Layering Actions */}
                    <div className="space-y-3 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Arrangement & Depth
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsSwapped(!isSwapped)}
                          className="rounded-xl h-10 text-xs font-semibold border-border bg-background/40 touch-manipulation px-2"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 mr-1 text-primary shrink-0" />
                          <span className="truncate">Swap (L ⇋ R)</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLayerOrder(layerOrder === "1_over_2" ? "2_over_1" : "1_over_2")}
                          className="rounded-xl h-10 text-xs font-semibold border-border bg-background/40 touch-manipulation px-2"
                        >
                          <Layers className="w-3.5 h-3.5 mr-1 text-indigo-400 shrink-0" />
                          <span className="truncate">{layerOrder === "1_over_2" ? "Left Front" : "Right Front"}</span>
                        </Button>
                      </div>
                    </div>

                    {/* 3. Spacing & Closeness Slider */}
                    <div className="space-y-1.5 pt-2 border-t border-border/50">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground">Shoulder Spacing</span>
                        <span className="font-mono text-primary font-bold">{closeness > 0 ? `+${closeness}` : closeness}</span>
                      </div>
                      <input
                        type="range"
                        min={-60}
                        max={80}
                        value={closeness}
                        onChange={(e) => setCloseness(Number(e.target.value))}
                        className="w-full accent-primary touch-manipulation"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Farther</span>
                        <span>Closer / Overlap</span>
                      </div>
                    </div>

                    {/* 4. Person 1 Adjustments (Left) */}
                    <div className="p-3.5 rounded-2xl bg-background/40 border border-border/60 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500" />
                          {isSwapped ? "Person 2 (Now Left)" : "Person 1 (Left)"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                          <span>Head Size / Scale</span>
                          <span className="text-foreground font-bold">{(scale1 * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0.8}
                          max={1.3}
                          step={0.02}
                          value={scale1}
                          onChange={(e) => setScale1(Number(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                          <span>Vertical Height (Eye Level)</span>
                          <span className="text-foreground font-bold">{offsetY1}px</span>
                        </div>
                        <input
                          type="range"
                          min={-80}
                          max={80}
                          value={offsetY1}
                          onChange={(e) => setOffsetY1(Number(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                      </div>
                    </div>

                    {/* 5. Person 2 Adjustments (Right) */}
                    <div className="p-3.5 rounded-2xl bg-background/40 border border-border/60 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400" />
                          {isSwapped ? "Person 1 (Now Right)" : "Person 2 (Right)"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                          <span>Head Size / Scale</span>
                          <span className="text-foreground font-bold">{(scale2 * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0.8}
                          max={1.3}
                          step={0.02}
                          value={scale2}
                          onChange={(e) => setScale2(Number(e.target.value))}
                          className="w-full accent-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                          <span>Vertical Height (Eye Level)</span>
                          <span className="text-foreground font-bold">{offsetY2}px</span>
                        </div>
                        <input
                          type="range"
                          min={-80}
                          max={80}
                          value={offsetY2}
                          onChange={(e) => setOffsetY2(Number(e.target.value))}
                          className="w-full accent-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 6. Export Actions */}
                <div className="space-y-2.5 pt-2 border-t border-border/50">
                  <Button
                    size="lg"
                    onClick={() => handleExport("single_jpg")}
                    disabled={isExporting}
                    className="w-full h-12 rounded-2xl font-bold text-sm shadow-xl hover:shadow-primary/30"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download Master Joint Photo (JPG)
                  </Button>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("single_png")}
                      disabled={isExporting}
                      className="rounded-xl h-10 text-xs font-semibold border-border bg-background/50 px-2"
                    >
                      <FileImage className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
                      <span className="truncate">PNG</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("sheet_4x6")}
                      disabled={isExporting}
                      className="rounded-xl h-10 text-xs font-semibold border-border bg-background/50 px-2"
                    >
                      <Layers className="w-3.5 h-3.5 mr-1 text-primary shrink-0" />
                      <span className="truncate">4×6″ Sheet</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("psd")}
                      disabled={isExporting}
                      className="rounded-xl h-10 text-xs font-semibold border-border bg-background/50 px-2"
                    >
                      <Layers className="w-3.5 h-3.5 mr-1 text-indigo-400 shrink-0" />
                      <span className="truncate">PSD Layers</span>
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetAll}
                    className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-3 h-3 mr-1.5" /> Start With New Photos
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
