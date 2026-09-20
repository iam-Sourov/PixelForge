"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  title?: string;
  description?: string;
  accept?: Record<string, string[]>;
  maxSize?: number; // in bytes
  className?: string;
  currentImage?: string | null;
}

export function UploadZone({
  onFileSelect,
  onClear,
  title = "Drop your photo here",
  description = "Supports JPG, PNG, HEIC up to 25MB",
  accept = {
    "image/*": [],
    "image/heic": [".heic"],
    "image/heif": [".heif"],
  },
  maxSize = 25 * 1024 * 1024,
  className,
  currentImage,
}: UploadZoneProps) {
  const [isHovered, setIsHovered] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300",
        isDragActive ? "border-primary bg-primary/5" : "border-border/50 bg-card/40 hover:border-primary/50 hover:bg-card",
        isDragReject && "border-destructive bg-destructive/10",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {currentImage ? (
        <div className="relative flex h-full w-full items-center justify-center min-h-[220px]">
          <Image
            src={currentImage}
            alt="Uploaded photo preview"
            fill
            className="object-contain p-2"
          />
          
          {/* Desktop Hover Overlay */}
          <div
            className={cn(
              "hidden sm:flex absolute inset-0 items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex gap-4">
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} aria-label="Replace current image" />
                <Button variant="secondary" className="gap-2 rounded-full px-6 shadow-xl touch-manipulation">
                  <ImagePlus className="h-4 w-4" />
                  Replace
                </Button>
              </div>

              {onClear && (
                <Button
                  variant="destructive"
                  className="gap-2 rounded-full px-6 shadow-xl touch-manipulation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Always-Accessible Control Pills */}
          <div className="sm:hidden absolute bottom-3 right-3 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-md p-1.5 rounded-2xl border border-border/80 shadow-xl">
            <div {...getRootProps()} className="cursor-pointer">
              <input {...getInputProps()} aria-label="Replace image on mobile" />
              <Button size="sm" variant="secondary" className="h-8 px-3 rounded-xl text-xs gap-1.5 touch-manipulation">
                <ImagePlus className="h-3.5 w-3.5" />
                Replace
              </Button>
            </div>

            {onClear && (
              <Button
                size="sm"
                variant="destructive"
                className="h-8 px-3 rounded-xl text-xs gap-1.5 touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 sm:p-10 md:p-12 text-center touch-manipulation"
        >
          <input {...getInputProps()} aria-label="Upload file input" />
          
          <div
            className={cn(
              "mb-4 sm:mb-6 rounded-full bg-background/80 p-3.5 sm:p-5 ring-1 ring-border/50 shadow-sm transition-transform duration-300",
              isDragActive ? "scale-110 shadow-primary/20 ring-primary/50" : "scale-100"
            )}
          >
            <Upload className={cn("h-6 w-6 sm:h-8 sm:w-8 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground")} />
          </div>
          
          <h3 className="font-heading text-base sm:text-xl font-medium tracking-tight text-foreground transition-colors">
            {isDragActive ? "Drop to upload" : title}
          </h3>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground max-w-xs">
            {description}
          </p>
        </div>
      )}
    </div>
  );
}
