"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  className,
  beforeLabel = "Original",
  afterLabel = "Enhanced",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  // Ensure releasing event listeners globally when dragging
  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
    }
    
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto h-[300px] sm:h-[380px] md:h-[460px] w-full max-w-4xl cursor-ew-resize overflow-hidden rounded-2xl bg-muted/20 select-none glass-card touch-none",
        className
      )}
      onClick={(e) => handleMove(e.clientX)}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Container for both images to ensure exact overlay */}
      <div className="absolute inset-0 m-auto h-full w-full">
        <Image
          src={afterImage}
          alt={afterLabel}
          fill
          className="object-cover"
          draggable={false}
          priority
        />
      </div>

      <div
        className="absolute inset-y-0 left-0 right-0 w-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={beforeImage}
          alt={beforeLabel}
          fill
          className="object-cover"
          draggable={false}
          priority
        />
      </div>

      {/* Slider Line & Handle */}
      <div
        className="absolute bottom-0 top-0 flex w-[2px] cursor-ew-resize items-center justify-center bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)]"
        style={{ left: `${sliderPosition}%`, pointerEvents: "none" }}
      >
        <div 
          className="flex h-11 w-11 sm:h-10 sm:w-10 origin-center translate-x-[-1px] items-center justify-center rounded-full border-2 border-white/40 bg-background/90 shadow-2xl backdrop-blur-md touch-manipulation active:scale-110 transition-transform"
          onMouseDown={(e) => { e.stopPropagation(); setIsDragging(true); }}
          onTouchStart={(e) => { e.stopPropagation(); setIsDragging(true); }}
          style={{ pointerEvents: "auto" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-foreground stroke-current opacity-90" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 9L8 12L11 15" />
            <path d="M13 9L16 12L13 15" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 rounded-full bg-background/80 px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-semibold tracking-wide text-foreground backdrop-blur-md border border-border/40 shadow-sm pointer-events-none">
        {beforeLabel}
      </span>
      <span className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 rounded-full bg-primary/90 px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-semibold tracking-wide text-primary-foreground backdrop-blur-md border border-white/20 shadow-sm pointer-events-none">
        {afterLabel}
      </span>
    </div>
  );
}
