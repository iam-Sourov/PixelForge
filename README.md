# PixelForge. ✦
**The High-Performance, Zero-API Image Engineering Toolkit**

> Enhance clarity, remove backgrounds flawlessly, and generate ICAO-compliant passport photo sheets instantly using highly optimized native machine-learning models and browser rendering engines — with absolutely **zero API costs or external dependencies**.

![PixelForge Banner](https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=100&w=1400&auto=format&fit=crop)

---

## ⚡ Features & Modules

### 1. Magic Background Eraser
Powered by `@imgly/background-removal`.
Extract human subjects from backgrounds instantly in entirely isolated local runtimes.
- 100% Client-side processing utilizing WASM binaries. No data leaves the browser.
- Accurate strand-level semantic segmentation using advanced machine learning.
- Fluid glassmorphism UI with async loading wrappers.

### 2. Auto-Passport Generator
Generate ready-to-print passport matrices within seconds.
- Integrated background removal pipeline to handle complex portrait shots.
- `react-easy-crop` integration to perfectly scale faces to standard 45x35mm dimensions.
- **Export standard JPGs** or deploy physical print sheets!
- Backend compilation routing directly interfaces with `sharp` and `ag-psd` to render a fully composited **4x6" Landscape PSD Print Sheet** mapped with 8 distinct photos on an array payload for professional printing.

### 3. OpenCV Hardware-Accelerated Enhancer
Professional-grade image restoration and re-grading dynamically in the browser.
- Utilizing **OpenCV.js (WASM)** for industry-standard image processing.
- **CLAHE Integration**: High-fidelity Contrast-Limited Adaptive Histogram Equalization for balanced exposure.
- **Lab Space Corrections**: Perform luminance and saturation adjustments in the Lab color space to preserve chromatic integrity.
- **Blur Detection Core**: Laplacian-based focus scoring and thresholding to assist with image selection.
- One-click immediate export of studio-quality masters.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Server Actions)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + Custom Glassmorphism System
- **Image Processing**:
  - `sharp` - High-performance Node.js image processing.
  - `ag-psd` - Headless Photoshop Document (PSD) parser and wrapper.
  - `@imgly` - Local WASM Background Segmenting.
  - `Python 3.10+` - Backend compute for heavy vision tasks.
  - `opencv-python` - Professional-grade image processing backend.
  - `NumPy` - High-performance numerical compute for image matrices.
  - Native Canvas & WebGL pipelines.
- **UI Tooling**: [Lucide React](https://lucide.dev/), `react-easy-crop`, `framer-motion`.

---

## 🚀 Quick Start / Local Setup

**1. Clone the repository**
```bash
git clone https://github.com/iam-Sourov/PixelForge.git
cd photo-workshop
```

**2. Install dependencies**
```bash
npm install
```

**3. Run the development server**
```bash
npm run dev
```

**4. Open the environment**
Navigate to `http://localhost:3000` in your browser.

---

## 🏎️ Production Deployment (Vercel)

This application has been explicitly optimized for Vercel's Edge & Serverless environment.

1. High-load machine learning tasks have structured dynamically initialized components using `import("...")` to minimize First Load JS payload.
2. The compilation targets override native Vercel Worker Memory bounds via internal Next Config adjustments (`ignoreDuringBuilds`).
3. NextJS `Metadata` hooks ensure flawless SEO tagging.
4. Uses the standard `npm run build` procedure without crashing standard limits.

```bash
vercel deploy --prod
```

---

## 🎨 Philosophy

*Made with precision. Not templates.*

We focused on engineering an immaculate, Neobrutalist UI utilizing floating capsule nav-bars, reactive micro-interactions, dark-mode spotlighting (`next-themes`), and smooth dropzone mechanics (`react-dropzone`). All while ensuring the tool accurately and effortlessly hits exact physical parameters like 300dpi, 4x6in print boundaries, and robust error handling loops.
