/**
 * BiRefNet / Server background removal bridge.
 * In a standard Node.js server environment, subject background isolation is performed
 * directly in-browser using @imgly/background-removal (WebAssembly/ONNX) for instant,
 * reliable zero-dependency matting.
 */
class BiRefNetBridge {
  public async removeBackground(_imageBufferBase64?: string): Promise<string> {
    void _imageBufferBase64;
    throw new Error(
      "Server background removal is not configured in this environment. Using high-precision browser client AI matting."
    );
  }

  public shutdown() {
    // No-op
  }
}

const globalForBridge = global as unknown as {
  birefnetBridge?: BiRefNetBridge;
};

export const birefnetBridge =
  globalForBridge.birefnetBridge || new BiRefNetBridge();

if (process.env.NODE_ENV !== "production") {
  globalForBridge.birefnetBridge = birefnetBridge;
}
