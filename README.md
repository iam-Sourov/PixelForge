# PixelForge ✦
### **The Next-Generation AI Photo Studio & Image Workshop**

PixelForge is a production-ready, client-side first AI image engineering suite. It combines client-side WebAssembly deep learning models, Google Gemini Cloud AI vision intelligence, and high-performance serverless image compositing pipelines to deliver studio-grade photo workflows—with **instant in-browser previews and zero serverless bottlenecks**.

---

## ⚡ Studio Suites & Tools

### 1. 👥 2-Picture Joint Studio (যৌথ ছবি / Duo Portrait Fusion)
* **Technology**: `@imgly/background-removal` (WASM), Google Gemini Vision AI, HTML5 Canvas, and Sharp.
* **Capabilities**:
  * Upload 2 individual portraits to automatically isolate subjects side-by-side.
  * Live interactive controls: independent scaling, vertical eye-level leveling, spacing distance, and depth layer ordering.
  * Standard Bangladeshi Studio Backdrops (BD Studio Sky Blue `#BAE6FD`, Passport White, Studio Gray, Dark Studio, Royal Indigo).
  * Instant exports: High-Resolution Single Portrait (JPG/PNG) & 4x6" Studio Print Sheets (300 DPI).

### 2. 🪪 Bangladesh & International Passport Photo Studio
* **Technology**: `react-easy-crop`, `sharp`, `ag-psd` (Layered PSD generation).
* **Presets**:
  * **BD Passport / MRP**: Official $45\text{mm} \times 35\text{mm}$ ICAO Standard.
  * **BD Stamp Size**: $25\text{mm} \times 20\text{mm}$.
  * **BD e-Passport / 2x2"**: $50\text{mm} \times 50\text{mm}$.
* **Exports**: Single JPEG/PNG, 4x1 Strip, 4x2 Studio Sheet, Bangladeshi Studio Combo Sheet, and Layered 4x6" PSD file.

### 3. ✨ Studio AI Enhancer & Neural Remaster
* **Technology**: Google Gemini Vision (Gemini 2.5 Pro / Flash / 2.0), Sharp, and Bilateral Denoising / High-Pass Frequency Separation.
* **Modes**:
  * **Portrait Studio Glow**: Edge-preserving skin smoothing & highlight remastering.
  * **Super-Resolution**: High-frequency micro-contrast and Lanczos edge definition.
  * **Low-Light Recovery**: Shadow dynamic range lift and noise suppression.
  * **Custom AI Prompt**: Tailored retouching instructions via Gemini Vision.

### 4. 🪄 Magic Background Remover
* **Technology**: `@imgly/background-removal` (WebAssembly & ONNX Runtime Web).
* **Execution**: 100% in-browser on the client side with zero serverless cold-starts or external API bills.
* **Backdrops**: Transparent HD PNG, Passport White, BD Studio Sky Blue, Studio Gray, Dark Studio, and gradient themes.

---

## 🛠️ Tech Stack & Architecture

* **Framework**: [Next.js 16 (App Router & Turbopack)](https://nextjs.org/)
* **Language**: [TypeScript 5](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables
* **Animations**: [Framer Motion](https://motion.dev/) & Lucide React
* **AI & Machine Learning**: Google Generative AI SDK, `@imgly/background-removal` WASM
* **Image Engine**: [Sharp](https://sharp.pixelplumbing.com/) & `ag-psd`

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/iam-Sourov/PixelForge.git
cd PixelForge
npm install
```

### 2. Start Local Development
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. (Optional) Connect Gemini AI
Click the **Connect Gemini** pill in the top navigation bar to enter your free Google Gemini API key to enable Gemini 2.5 Pro/Flash vision studio analysis.

---

## 📦 Production Builds & Verification

```bash
# Type check TypeScript
npm run typecheck

# Verify production build with Turbopack
npm run build

# Start production server
npm run start
```
