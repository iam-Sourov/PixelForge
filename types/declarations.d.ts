declare module "heic-decode" {
  interface DecodeOptions {
    buffer: Uint8Array | Buffer | ArrayBuffer;
  }
  interface DecodedImage {
    width: number;
    height: number;
    data: Uint8Array | ArrayBuffer;
  }
  export default function decode(options: DecodeOptions): Promise<DecodedImage>;
}

declare module "heic2any" {
  interface Heic2AnyOptions {
    blob: Blob;
    toType?: string;
    quality?: number;
    multiple?: boolean;
  }
  export default function heic2any(options: Heic2AnyOptions): Promise<Blob | Blob[]>;
}
