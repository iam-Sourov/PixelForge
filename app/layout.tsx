import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

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
    "Bangladeshi Studio Photo"
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
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body className="flex min-h-screen flex-col bg-background text-foreground bg-noise">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
