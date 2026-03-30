import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          {/* Logo element: minimal, brutalist typography */}
          <span className="font-heading text-xl font-bold tracking-tighter">
            PixelForge<span className="text-primary">.</span>
          </span>
        </Link>
        
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/enhance" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Enhancer
          </Link>
          <Link href="/passport" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Passport Photo
          </Link>
          <Link href="/remove-bg" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Background Remover
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:inline-flex">
            Login
          </Button>
          <Button className="rounded-full shadow-lg hover:scale-[1.02] transition-transform duration-200">
            Start Creating
          </Button>
        </div>
      </div>
    </header>
  );
}
