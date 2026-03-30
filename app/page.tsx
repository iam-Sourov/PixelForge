"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import { BeforeAfterSlider } from "@/components/shared/BeforeAfterSlider";
import { Sparkles, Users, Image as ImageIcon, Wand2, Crop, ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";

export default function Home() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] w-full flex-col items-center justify-center overflow-hidden bg-background px-4 md:px-8">
        {mounted && <Spotlight className="-top-40 left-0 md:-top-20 md:left-60 lg:-top-20 lg:left-80" fill={resolvedTheme === "dark" ? "white" : "black"} />}
        {mounted && <Spotlight className="top-20 left-full md:left-3/4 hidden md:block" fill="#7C3AED" />}
        
        <div className="z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
          
          <h1 className="mb-6 font-heading text-6xl font-bold tracking-tighter text-foreground sm:text-7xl lg:text-8xl">
            Photos.<br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground"> Perfected.</span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl font-light leading-relaxed tracking-wide">
            Enhance clarity, remove backgrounds, and generate ICAO-compliant passport portraits in seconds. Machine learning, engineered for designers.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="group rounded-full px-8 text-base shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]">
               <Link href="/enhance" className="flex items-center">
                  Try for free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
               </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 text-base transition-transform hover:scale-[1.02]">
               <Link href="#showcase">View Showcase</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="w-full border-y border-border bg-muted/30 py-10 backdrop-blur-sm">
        <div className="container mx-auto flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12 lg:gap-24 opacity-60 grayscale filter">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-foreground" />
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">10,000+ Processed</span>
          </div>
          <div className="flex items-center gap-3">
            <ImageIcon className="h-6 w-6 text-foreground" />
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">99.9% Accuracy</span>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-foreground" />
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">Studio Quality</span>
          </div>
        </div>
      </section>

      {/* Tool Cards (Asymmetric Grid) */}
      <section className="w-full py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-16 md:w-2/3">
            <h2 className="mb-4 font-heading text-4xl font-bold tracking-tighter text-foreground md:text-5xl">
              Professional tools.<br /> Zero friction.
            </h2>
            <p className="text-xl text-muted-foreground font-light">
              Everything you need to process images at scale, built on cutting-edge vision models.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:grid-rows-2">
            {/* Large Card */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card/50 p-8 transition-all hover:bg-card/80 md:col-span-2 md:row-span-2 min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="z-10">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Wand2 className="h-6 w-6" />
                </div>
                <h3 className="mb-3 font-heading text-3xl font-bold tracking-tight text-foreground">AI Enhancer</h3>
                <p className="mb-8 max-w-sm text-muted-foreground leading-relaxed">
                  Restore details, denoise, and upsample your images up to 8x resolution using our customized robust pipeline.
                </p>
                <Link href="/enhance">
                  <span className="inline-flex items-center font-medium text-primary transition-colors hover:text-primary/80">
                    Try Enhancer <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              </div>
              <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-primary/10 blur-[90px]" />
            </div>

            {/* Stacked Card 1 */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card/50 p-8 transition-all hover:bg-card/80 min-h-[250px]">
              <div className="z-10">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Crop className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-heading text-xl font-bold tracking-tight text-foreground">Passport Photo</h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  Auto-crop, align, and generate ICAO-compliant passport formats instantly.
                </p>
                <Link href="/passport">
                  <span className="inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80">
                    Make Passport Photo <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Stacked Card 2 */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card/50 p-8 transition-all hover:bg-card/80 min-h-[250px]">
              <div className="z-10">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-heading text-xl font-bold tracking-tight text-foreground">Background Remover</h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  Flawless segmentation and subject extraction seamlessly in entirely local process.
                </p>
                <Link href="/remove-bg">
                  <span className="inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80">
                    Remove Background <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Showcase */}
      <section id="showcase" className="relative w-full overflow-hidden border-t border-border py-24 md:py-32">
        <div className="absolute inset-0 bg-primary/5 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
        <div className="container relative z-10 mx-auto px-4 text-center md:px-8">
          <h2 className="mb-6 font-heading text-4xl font-bold tracking-tighter text-foreground md:text-5xl">
            See the difference.
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-lg text-muted-foreground font-light">
            Interactive visual proof of our proprietary upscaling and enhancement algorithms.
          </p>
          
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-border bg-card/50 p-2 backdrop-blur-xl shadow-2xl">
            {/* The Before/After Slider Component */}
            <BeforeAfterSlider 
              beforeImage="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=60&w=1400&auto=format&fit=crop&blur=100" 
              afterImage="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=100&w=1400&auto=format&fit=crop"
              beforeLabel="Original (Low Res)"
              afterLabel="Enhanced (4x AI)"
              className="h-[500px] w-full rounded-[1.5rem]"
            />
          </div>
          
        </div>
      </section>
    </div>
  );
}
