"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import { 
  Sparkles, 
  Users, 
  Image as ImageIcon, 
  Wand2, 
  Crop, 
  ArrowRight, 
  SlidersHorizontal,
  Layers,
  Cpu,
  ShieldCheck
} from "lucide-react";
import { useTheme } from "next-themes";
import { useGeminiStore } from "@/lib/useGeminiStore";

export default function Home() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { apiKey, selectedModel, setIsKeyModalOpen } = useGeminiStore();

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] w-full flex-col items-center justify-center overflow-hidden bg-background px-4 md:px-8">
        {mounted && <Spotlight className="-top-40 left-0 md:-top-20 md:left-60 lg:-top-20 lg:left-80" fill={resolvedTheme === "dark" ? "white" : "black"} />}
        {mounted && <Spotlight className="top-20 left-full md:left-3/4 hidden md:block" fill="#7C3AED" />}
        
        <div className="z-10 mx-auto flex max-w-5xl flex-col items-center text-center space-y-6">
          
          {/* Cloud AI Pill */}
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary hover:bg-primary/20 transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Gemini Cloud AI Pro & Flash Studio</span>
            <span className="font-bold underline ml-1">{apiKey ? `[${selectedModel}]` : "[Connect Key]"}</span>
          </button>
          
          <h1 className="font-heading text-5xl font-black tracking-tight text-foreground sm:text-7xl lg:text-8xl leading-[1.05]">
            Photos.<br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary/60">
              Perfected by AI.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl font-light leading-relaxed tracking-wide">
            Attach two individual photos into a seamless joint portrait, generate official Bangladeshi passport & stamp photos, remaster portrait clarity, and extract perfect backgrounds instantly.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <Link href="/dual-adjust">
              <Button size="lg" className="group rounded-full px-8 text-sm md:text-base font-bold shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] h-14">
                <Users className="mr-2 h-4 w-4" />
                2-Picture Joint Studio
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            <Link href="/passport">
              <Button size="lg" variant="outline" className="rounded-full px-8 text-sm md:text-base font-semibold border-border/80 bg-card/50 backdrop-blur-md hover:bg-muted/50 h-14">
                <Crop className="mr-2 h-4 w-4 text-emerald-400" />
                🇧🇩 Bangladeshi Passport
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof & Capabilities */}
      <section className="w-full border-y border-border bg-muted/30 py-10 backdrop-blur-sm">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-16 lg:gap-24 opacity-90">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-sm ring-1 ring-white/20" />
            <span className="font-heading text-base font-bold tracking-tight text-foreground">Gemini 2.5 Pro & Flash</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-sm ring-1 ring-white/20" />
            <span className="font-heading text-base font-bold tracking-tight text-foreground">BD 45×35mm MRP & Stamp</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 shadow-sm ring-1 ring-white/20" />
            <span className="font-heading text-base font-bold tracking-tight text-foreground">Sub-pixel Neural Denoising</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-sm ring-1 ring-white/20" />
            <span className="font-heading text-base font-bold tracking-tight text-foreground">300 DPI Lab Print PSD</span>
          </div>
        </div>
      </section>

      {/* Tool Cards (4-Grid Architecture) */}
      <section className="w-full py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="mb-16 md:w-2/3">
            <h2 className="mb-4 font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Professional Suite.<br /> Cloud Intelligence.
            </h2>
            <p className="text-lg text-muted-foreground font-light">
              Four specialized tools engineered for retouchers, photographers, and studio designers.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Tool 1: 2-Picture Joint Studio */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card/40 p-6 transition-all hover:bg-card/70 hover:border-primary/50 min-h-[340px] shadow-xl">
              <div className="z-10 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 shadow-lg shadow-purple-500/25 ring-1 ring-white/20 shrink-0 flex items-center justify-center text-white">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
                  2-Picture Joint Studio
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Attach two individual portrait photos into a seamless couple/duo studio shot with custom backdrops, depth layers, and height leveling.
                </p>
              </div>
              <Link href="/dual-adjust" className="z-10 pt-6">
                <span className="inline-flex items-center text-xs font-bold text-primary transition-colors hover:text-primary/80">
                  Open Joint Studio <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </span>
              </Link>
            </div>

            {/* Tool 2: Bangladeshi Passport */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card/40 p-6 transition-all hover:bg-card/70 hover:border-emerald-500/50 min-h-[340px] shadow-xl">
              <div className="z-10 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 shadow-lg shadow-emerald-500/25 ring-1 ring-white/20 shrink-0 flex items-center justify-center text-white">
                  <Crop className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
                  Bangladeshi Passport
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Official 45×35mm MRP, 25×20mm Stamp size, studio blue/white backgrounds, and 4×6&quot; combo print sheets.
                </p>
              </div>
              <Link href="/passport" className="z-10 pt-6">
                <span className="inline-flex items-center text-xs font-bold text-emerald-400 transition-colors hover:text-emerald-300">
                  Create BD Photos <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </span>
              </Link>
            </div>

            {/* Tool 3: AI Enhancer */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card/40 p-6 transition-all hover:bg-card/70 hover:border-primary/50 min-h-[340px] shadow-xl">
              <div className="z-10 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 shadow-lg shadow-violet-500/25 ring-1 ring-white/20 shrink-0 flex items-center justify-center text-white">
                  <Wand2 className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
                  AI Remaster Enhancer
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Portrait skin texture restoration, neural super-resolution, low-light recovery, and natural prompt guidance.
                </p>
              </div>
              <Link href="/enhance" className="z-10 pt-6">
                <span className="inline-flex items-center text-xs font-bold text-primary transition-colors hover:text-primary/80">
                  Enhance Photos <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </span>
              </Link>
            </div>

            {/* Tool 4: Background Eraser */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card/40 p-6 transition-all hover:bg-card/70 hover:border-blue-500/50 min-h-[340px] shadow-xl">
              <div className="z-10 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 shadow-lg shadow-blue-500/25 ring-1 ring-white/20 shrink-0 flex items-center justify-center text-white">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
                  Background Eraser
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deep learning subject extraction with transparent PNG or studio solid & gradient backdrops.
                </p>
              </div>
              <Link href="/remove-bg" className="z-10 pt-6">
                <span className="inline-flex items-center text-xs font-bold text-blue-400 transition-colors hover:text-blue-300">
                  Erase Background <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </span>
              </Link>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
