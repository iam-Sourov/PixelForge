import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/50 bg-background py-10 md:py-16">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row md:px-8">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Link href="/" className="font-heading text-xl font-bold tracking-tighter hover:text-primary transition-colors">
            PixelForge<span className="text-primary">.</span>
          </Link>
          <p className="text-sm text-muted-foreground font-medium tracking-wide">
            Made with precision. Not templates.
          </p>
        </div>
        
        <nav className="flex items-center gap-6">
          <Link href="/enhance" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Enhancer
          </Link>
          <Link href="/passport" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Passport
          </Link>
          <Link href="/remove-bg" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Remove BG
          </Link>
        </nav>
        
        <div className="text-sm text-muted-foreground/60 font-mono tracking-widest hidden md:block">
          // {new Date().getFullYear()} © ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}
