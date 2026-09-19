"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { GeminiKeyModal } from "./GeminiKeyModal";
import { useGeminiStore } from "@/lib/useGeminiStore";
import { cn } from "@/lib/utils";
import { Menu, X, Sparkles, SlidersHorizontal } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { apiKey, selectedModel, setIsKeyModalOpen } = useGeminiStore();

  const links = [
    { href: "/enhance", label: "Enhancer" },
    { href: "/dual-adjust", label: "2-Picture Joint Studio" },
    { href: "/passport", label: "Passport Photo" },
    { href: "/remove-bg", label: "Background Remover" },
  ];

  const formatModelName = (modelId: string) => {
    if (!modelId) return "Gemini AI";
    const cleaned = modelId.replace(/^models\//, "");
    if (cleaned.includes("2.5-pro")) return "Gemini 2.5 Pro";
    if (cleaned.includes("2.5-flash")) return "Gemini 2.5 Flash";
    if (cleaned.includes("2.0-flash")) return "Gemini 2.0 Flash";
    if (cleaned.includes("1.5-pro")) return "Gemini 1.5 Pro";
    if (cleaned.includes("1.5-flash")) return "Gemini 1.5 Flash";
    return cleaned;
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl transition-all">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
            <span className="font-heading text-xl font-black tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              PixelForge<span className="text-primary font-bold">.ai</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden w-fit items-center p-1 md:flex rounded-full border border-border/50 bg-muted/20 backdrop-blur-md">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300", 
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-border/50" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="flex items-center gap-3">
            {/* Gemini API Key & Model Status Pill */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300",
                apiKey 
                  ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                  : "bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/30 text-purple-400 hover:from-purple-500/20 hover:to-indigo-500/20"
              )}
              title="Configure Gemini Cloud AI and Models"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-primary shrink-0" />
              <span className="font-mono text-[11px] font-bold max-w-[120px] md:max-w-[150px] truncate">
                {apiKey ? formatModelName(selectedModel) : "Connect Gemini"}
              </span>
              {apiKey && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />}
              <SlidersHorizontal className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
            </button>

            <ThemeToggle />

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl p-4 animate-in slide-in-from-top-2 fade-in shadow-xl">
            <nav className="flex flex-col gap-2">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                      isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsKeyModalOpen(true);
                }}
                className="mt-2 w-full p-3 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-semibold flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Gemini Model: {apiKey ? formatModelName(selectedModel) : "Not Connected"}
                </span>
                <span className="underline text-[11px]">Configure</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Global Gemini API Key Onboarding & Settings Modal */}
      <GeminiKeyModal />
    </>
  );
}
