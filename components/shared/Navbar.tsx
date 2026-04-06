"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/enhance", label: "Enhancer" },
    { href: "/passport", label: "Passport Photo" },
    { href: "/remove-bg", label: "Background Remover" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur-xl transition-all">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
          <span className="font-heading text-xl font-bold tracking-tighter">
            PixelForge<span className="text-primary">.</span>
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden items-center p-1 md:flex rounded-full border border-border/50 bg-muted/20 backdrop-blur-md">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300", 
                  isActive ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <Link href="/enhance" className="hidden md:block">
            <Button className="rounded-full shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300 active:scale-95">
              Start Creating
            </Button>
          </Link>

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
            <Link href="/enhance" onClick={() => setIsOpen(false)} className="mt-4">
              <Button className="w-full rounded-2xl shadow-lg h-12">Start Creating</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
