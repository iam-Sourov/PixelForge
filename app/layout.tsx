import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import "@/lib/fetch-patch";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

export const metadata: Metadata = {
  title: "PixelForge - AI Studio & Photo Workshop",
  description: "Next-generation AI Photo Studio for 2-Picture Joint photos, instant background removal, portrait remastering, and passport photo generation.",
  keywords: [
    "PixelForge",
    "2-Picture Joint Studio",
    "Duo Portrait Fusion",
    "Passport Photo Generator",
    "Background Remover",
    "Photo Enhancer",
    "AI Studio",
    "Bangladeshi Studio Photo",
  ],
  authors: [{ name: "Sourov" }],
  creator: "Sourov",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pixelforge.ai",
    title: "PixelForge - AI Studio & Photo Workshop",
    description: "Next-generation AI Photo Studio for 2-Picture Joint photos, instant background removal, portrait remastering, and passport photo generation.",
    siteName: "PixelForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelForge - AI Studio & Photo Workshop",
    description: "Next-generation AI Photo Studio for 2-Picture Joint photos, instant background removal, portrait remastering, and passport photo generation.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased overflow-x-hidden", fontMono.variable, "font-sans", inter.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var win = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis;
    if (!win) return;

    // Define a robust getter/setter for fetch on window instance
    // so any library assigning window.fetch = ... will succeed without "Cannot set property fetch of #<Window> which has only a getter"
    try {
      var activeFetch = win.fetch;
      Object.defineProperty(win, 'fetch', {
        get: function() {
          return activeFetch;
        },
        set: function(fn) {
          activeFetch = typeof fn === 'function' ? fn : activeFetch;
        },
        configurable: true,
        enumerable: true
      });
    } catch (e) {}

    // Suppress any uncaught "Cannot set property fetch of #<Window> which has only a getter"
    var suppressFetchError = function(e) {
      var msg = (e && (e.message || (e.error && e.error.message))) || '';
      if (typeof msg === 'string' && msg.indexOf('fetch') !== -1 && msg.indexOf('getter') !== -1) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        return true;
      }
    };

    win.addEventListener('error', suppressFetchError, true);
    win.addEventListener('unhandledrejection', function(e) {
      var reason = e && e.reason;
      var msg = (reason && (reason.message || String(reason))) || '';
      if (typeof msg === 'string' && msg.indexOf('fetch') !== -1 && msg.indexOf('getter') !== -1) {
        if (e.preventDefault) e.preventDefault();
      }
    }, true);
  } catch (err) {}
})();
`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-background text-foreground bg-noise overflow-x-hidden">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 w-full overflow-x-hidden">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
