"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
        Something went wrong
      </h1>
      <p className="text-muted-foreground text-sm max-w-md mb-8">
        An unexpected error occurred while rendering this studio tool. You can try refreshing the page or head back home.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} size="lg" className="rounded-2xl font-bold">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-2xl">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
