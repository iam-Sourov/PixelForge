"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center p-6 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-6">
        <Sparkles className="w-3.5 h-3.5" />
        404 Page Not Found
      </div>
      <h1 className="text-6xl md:text-8xl font-black tracking-tight text-foreground mb-4">
        404
      </h1>
      <p className="text-muted-foreground text-lg max-w-md mb-8">
        The studio page or tool you are looking for doesn't exist or has been moved.
      </p>
      <div className="flex items-center gap-4">
        <Button asChild size="lg" className="rounded-2xl font-bold shadow-xl">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Studio Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
