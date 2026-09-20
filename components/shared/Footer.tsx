import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/50 bg-background/80 py-8 md:py-10">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row md:px-8">
        <div className="flex flex-col items-center gap-1.5 md:items-start text-center md:text-left">
          <Link href="/" className="font-heading text-lg sm:text-xl font-bold tracking-tighter hover:text-primary transition-colors">
            PixelForge<span className="text-primary font-black">.ai</span>
          </Link>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-wide">
            Next-Gen AI Photo Studio & Darkroom.
          </p>
        </div>
        
        <nav className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center text-xs sm:text-sm">
          <Link href="/enhance" className="font-medium text-muted-foreground hover:text-foreground transition-colors touch-manipulation py-1">
            Enhancer
          </Link>
          <Link href="/dual-adjust" className="font-medium text-muted-foreground hover:text-foreground transition-colors touch-manipulation py-1">
            2-Picture Joint
          </Link>
          <Link href="/passport" className="font-medium text-muted-foreground hover:text-foreground transition-colors touch-manipulation py-1">
            Passport
          </Link>
          <Link href="/remove-bg" className="font-medium text-muted-foreground hover:text-foreground transition-colors touch-manipulation py-1">
            Remove BG
          </Link>
        </nav>
        
        <div className="text-[11px] sm:text-xs text-muted-foreground/70 font-mono tracking-wider text-center md:text-right">
          {new Date().getFullYear()} © ALL RIGHTS RESERVED BY <span className="text-primary font-bold">SOUROV</span>
        </div>
      </div>
    </footer>
  );
}
