# PixelForge — Photos. Perfected. 

PixelForge is an elite, AI-driven photo processing suite designed for professional use. Rejecting boilerplate aesthetics, it features an unapologetic, custom-designed brutalist UI. The project combines state-of-the-art vision models with high-end interaction design.

![PixelForge AI Photo Suite](https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop)

## Features & Interfaces
1. **AI Image Enhancer (`/enhance`)**: A professional workspace incorporating fine-tuning for Real-ESRGAN and CodeFormer pipelines. Provides seamless drag-and-drop inputs, configurable upscale levels, denoising thresholds, and side-by-side interactive outcome dividers.
2. **Passport Photo Maker (`/passport`)**: A deterministic, flow-based utility handling background extraction, geometric alignment, and ICAO regulation checking specifically tailored for Bangladesh protocols (45x35mm, white backgrounds).
3. **Background Remover (`/remove-bg`)**: A hyper-fast, frictionless utility simulating `remove.bg`-tier segmentation. Allows swapping the extracted alpha layer with transparent tiles, solid hexadecimal tones, or dynamic gaussian blurred environmental contexts.

## The Design Philosophy
This project was constructed strictly around a boutique logic approach:
- **Zero Placeholder Aesthetics**: Built upon a customized absolute `#0A0A0A` and `#F5F5F3` token structure using `oklch()` integration in Tailwind CSS v4.
- **Electric Violet Accent**: Focused interaction elements use a strict `#7C3AED` accent against high-contrast backgrounds.
- **Custom Asymmetry**: Cards and grids avoid equal-column repetition.
- **Bespoke Toolings**: Rather than installing overwhelming third-party dependency bundles (like framer-motion grids), native CSS keyframe pipelines simulate components like the `Spotlight` gradient or `AnimatedBeams` natively.

## Tech Stack
*   **Framework**: Next.js 14+ (App Router)
*   **Aesthetics**: Tailwind CSS v4 (Custom configurations)
*   **Atoms**: Heavily customized `shadcn/ui` logical flows. Custom `<BeforeAfterSlider />` engineered natively.
*   **Typography**: Inter / Geist Monospace.
*   **Icons**: Lucide React.
*   **Environment**: TypeScript strict mode. Node architecture.

## Getting Started
The project comes completely uncoupled from legacy CSS systems. The front-end simulations are intact. To launch:

1. Validate dependency installations:
```bash
npm install
```

2. Boot the development hot-reloaded local environment:
```bash
npm run dev
```

3. Navigate to [http://localhost:3000](http://localhost:3000).

## Production Back-End Roadmap (API Enablement)
Currently, to isolate errors for front-end visual demonstrations without injecting unverified payload tokens, the UI utilizes localized simulated loading loops. 

To bridge actual AI computation layers to the front-end components, you must insert your model keys.

*   `app/api/enhance/route.ts` - Implement `process.env.REPLICATE_API_TOKEN`
*   `app/api/remove-bg/route.ts` - Implement `process.env.REMOVE_BG_KEY` or `RMBG` model tokens.
*   `app/api/passport/route.ts` - Add `sharp` context and OpenCV or simpler face-recognition (e.g. `face-api.js`) for the bounding-box generation algorithm. 

*Engineered with precision.*
