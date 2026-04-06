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
  description = "Supports JPG, PNG up to 10MB",
  accept = { "image/*": [] },
  maxSize = 10 * 1024 * 1024,
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
        <div className="relative flex h-full w-full items-center justify-center">
          <Image
            src={currentImage}
            alt="Uploaded photo preview"
            fill
            className="object-contain p-2"
          />
          
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex gap-4">
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} aria-label="Replace current image" />
                <Button variant="secondary" className="gap-2 rounded-full px-6 shadow-xl">
                  <ImagePlus className="h-4 w-4" />
                  Replace
                </Button>
              </div>

              {onClear && (
                <Button
                  variant="destructive"
                  className="gap-2 rounded-full px-6 shadow-xl"
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
        </div>
      ) : (
        <div
          {...getRootProps()}
          className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-12 text-center"
        >
          <input {...getInputProps()} aria-label="Upload file input" />
          
          <div
            className={cn(
              "mb-6 rounded-full bg-background/80 p-5 ring-1 ring-border/50 shadow-sm transition-transform duration-300",
              isDragActive ? "scale-110 shadow-primary/20 ring-primary/50" : "scale-100"
            )}
          >
            <Upload className={cn("h-8 w-8 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground")} />
          </div>
          
          <h3 className="font-heading text-xl font-medium tracking-tight text-foreground transition-colors">
            {isDragActive ? "Drop to upload" : title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      )}
    </div>
  );
}
