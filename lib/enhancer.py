import sys
import os
import cv2
import numpy as np
import base64
from typing import Union
from PIL import Image
import torch
import huggingface_hub
from huggingface_hub import hf_hub_download

# Monkey patch huggingface_hub before importing RealESRGAN
huggingface_hub.cached_download = hf_hub_download

from RealESRGAN import RealESRGAN
from RealESRGAN.rrdbnet_arch import RRDBNet

def legacy_enhance_image(img: np.ndarray) -> np.ndarray:
    """
    Original lightweight portrait enhancer using refined OpenCV filters.
    Optimized to run under 0.2s on CPU and prioritize smooth, noise-free skin and backgrounds.
    """
    # Detect if image is grayscale/B&W by analyzing channel variance
    is_grayscale = False
    if len(img.shape) == 3 and img.shape[2] == 3:
        channel_std = np.std(img, axis=2)
        if np.mean(channel_std) < 8.0:
            is_grayscale = True

    # Step 1: Smooth Skin & Denoise via full Bilateral Filter
    img = cv2.bilateralFilter(img, d=5, sigmaColor=20, sigmaSpace=20)

    # Step 2: Color Finish (Saturation & Temperature)
    if not is_grayscale:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        s = cv2.multiply(s, 1.02) # subtle 2% saturation boost
        img = cv2.cvtColor(cv2.merge((h, s, v)), cv2.COLOR_HSV2BGR)

        # Subtle highlights cooling
        b_channel, g_channel, r_channel = cv2.split(img)
        b_channel = cv2.add(b_channel, 1)
        img = cv2.merge((b_channel, g_channel, r_channel))

    # Step 3: Final Scale (1% contrast boost)
    img = cv2.convertScaleAbs(img, alpha=1.01, beta=0)
    return img

class RealESRGANAnime6B(RealESRGAN):
    """
    Custom subclass of RealESRGAN optimized for 4x anime/illustration super-resolution
    using a 6-block RRDBNet model downloaded from Hugging Face.
    """
    def __init__(self, device):
        super().__init__(device, scale=4)
        # Override the standard 23-block RRDBNet with the 6-block model
        self.model = RRDBNet(
            num_in_ch=3, num_out_ch=3, num_feat=64,
            num_block=6, num_grow_ch=32, scale=4
        )

    def load_weights(self, model_path, download=True):
        if not os.path.exists(model_path) and download:
            cache_dir = os.path.dirname(model_path)
            local_filename = os.path.basename(model_path)
            sys.stderr.write(f"[RealESRGANAnime6B] Weights not found at {model_path}. Downloading from Hugging Face...\n")
            sys.stderr.flush()
            
            # Download using hf_hub_download directly from amd/realesrgan-x4plus-anime-6b
            downloaded_path = hf_hub_download(
                repo_id="amd/realesrgan-x4plus-anime-6b",
                filename="RealESRGAN_x4plus_anime_6B.pth",
                cache_dir=cache_dir
            )
            
            # Copy the downloaded file to the exact model_path
            import shutil
            os.makedirs(cache_dir, exist_ok=True)
            shutil.copy(downloaded_path, model_path)
            sys.stderr.write(f"[RealESRGANAnime6B] Weights downloaded and copied to: {model_path}\n")
            sys.stderr.flush()

        loadnet = torch.load(model_path, map_location=self.device)
        if 'params' in loadnet:
            self.model.load_state_dict(loadnet['params'], strict=True)
        elif 'params_ema' in loadnet:
            self.model.load_state_dict(loadnet['params_ema'], strict=True)
        else:
            self.model.load_state_dict(loadnet, strict=True)
        self.model.eval()
        self.model.to(self.device)

class PhotoEnhancerPipeline:
    """
    Simplified, backward-compatible PhotoEnhancerPipeline class that integrates
    with the new realesrgan-x4plus-anime-6b model.
    """
    def __init__(self, device: str = "auto", use_fp16: bool = True):
        # Determine GPU or CPU execution
        if device == "auto":
            if torch.cuda.is_available():
                self.device = torch.device("cuda")
            elif torch.backends.mps.is_available():
                self.device = torch.device("mps")
            else:
                self.device = torch.device("cpu")
        else:
            self.device = torch.device(device)
            
        # FP16 is only reliable/supported on CUDA
        self.use_fp16 = use_fp16 and (self.device.type == "cuda")
        
        self.lib_dir = os.path.dirname(os.path.abspath(__file__))
        self.weights_dir = os.path.join(self.lib_dir, "weights")
        os.makedirs(self.weights_dir, exist_ok=True)
        self.weights_path = os.path.join(self.weights_dir, "RealESRGAN_x4plus_anime_6B.pth")
        
        # Instantiate and load our custom model
        self.model = RealESRGANAnime6B(self.device)
        self.model.load_weights(self.weights_path, download=True)
        self.model.model.float() # For device compatibility (MPS, etc)

    def enhance(
        self,
        input_image_path: Union[str, np.ndarray, Image.Image],
        upscale_factor: int = 4,
        face_enhance: bool = True,
        fidelity_weight: float = 0.7,
        save_path: str = None,
        tile: int = 512,
        tile_pad: int = 10
    ) -> Image.Image:
        """
        Runs the realesrgan-x4plus-anime-6b photo enhancement pipeline.
        Args:
            input_image_path: Str path, PIL Image, or BGR numpy array.
            upscale_factor: Requested scale factor. Downscales the 4x result if upscale_factor < 4.
            face_enhance: Ignored (legacy/compatibility option).
            fidelity_weight: Ignored (legacy/compatibility option).
            save_path: Optional path to save output file.
            tile: Ignored (legacy/compatibility option).
            tile_pad: Ignored (legacy/compatibility option).
        """
        # 1. Load/Standardize Image to PIL Image
        if isinstance(input_image_path, str):
            image = Image.open(input_image_path).convert("RGB")
        elif isinstance(input_image_path, np.ndarray):
            # Convert BGR CV2 array to RGB PIL Image
            image = Image.fromarray(cv2.cvtColor(input_image_path, cv2.COLOR_BGR2RGB))
        elif isinstance(input_image_path, Image.Image):
            image = input_image_path.convert("RGB")
        else:
            raise TypeError("Unsupported input image type. Expected str, np.ndarray, or PIL.Image")

        # 2. Run prediction using the 4x anime model
        sr_image = self.model.predict(image)

        # 3. Downscale if a lower upscale factor was requested (e.g. 2x)
        if upscale_factor != 4 and upscale_factor > 0:
            target_width = int(image.size[0] * upscale_factor)
            target_height = int(image.size[1] * upscale_factor)
            sr_image = sr_image.resize((target_width, target_height), Image.Resampling.LANCZOS)

        # 4. Save if requested
        if save_path:
            os.makedirs(os.path.dirname(os.path.abspath(save_path)), exist_ok=True)
            sr_image.save(save_path)
            
        return sr_image

if __name__ == "__main__":
    import argparse
    
    # CLI Mode
    if len(sys.argv) > 1:
        parser = argparse.ArgumentParser(description="RealESRGAN-x4plus-anime-6B Pipeline CLI")
        parser.add_argument("--input", required=True, help="Path to input image file")
        parser.add_argument("--output", required=True, help="Path to save enhanced image file")
        parser.add_argument("--scale", type=int, default=4, help="Upscale factor (e.g. 2, 4)")
        parser.add_argument("--face_restore", action="store_true", default=False, help="Ignored (legacy/compatibility)")
        parser.add_argument("--no_face_restore", dest="face_restore", action="store_false", help="Ignored (legacy/compatibility)")
        parser.add_argument("--fidelity", type=float, default=0.7, help="Ignored (legacy/compatibility)")
        parser.add_argument("--tile", type=int, default=512, help="Ignored (legacy/compatibility)")
        
        args = parser.parse_args()
        
        print(f"Running RealESRGAN-x4plus-anime-6B pipeline (scale={args.scale})...")
        pipeline = PhotoEnhancerPipeline(device="auto", use_fp16=True)
        pipeline.enhance(
            input_image_path=args.input,
            upscale_factor=args.scale,
            save_path=args.output
        )
        print(f"Enhancement completed. Saved to {args.output}")
        sys.exit(0)
        
    # Stdin / Stdout Mode (for Next.js API route backward compatibility)
    else:
        if not sys.stdin.isatty():
            input_data = sys.stdin.read().strip()
            if not input_data:
                sys.stderr.write("No stdin data received\n")
                sys.exit(1)
                
            try:
                # 1. Decode base64 image
                img_bytes = base64.b64decode(input_data)
                nparr = np.frombuffer(img_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if img is None:
                    sys.stderr.write("Failed to decode BGR image from stdin\n")
                    sys.exit(1)
                
                # 2. Check PyTorch availability
                try:
                    import torch
                    pytorch_available = True
                except ImportError:
                    pytorch_available = False
                
                if pytorch_available:
                    sys.stderr.write("Running RealESRGAN-x4plus-anime-6B deep pipeline...\n")
                    pipeline = PhotoEnhancerPipeline(device="auto", use_fp16=True)
                    # Use default lightweight scale=2 and downscale from the 4x model result
                    result_pil = pipeline.enhance(
                        input_image_path=img,
                        upscale_factor=2
                    )
                    # Convert PIL back to BGR numpy array
                    output_img = cv2.cvtColor(np.array(result_pil), cv2.COLOR_RGB2BGR)
                else:
                    sys.stderr.write("PyTorch not installed. Running lightweight fallback filters.\n")
                    output_img = legacy_enhance_image(img)
                
                # 3. Base64 encode the output BGR image as PNG
                _, buffer = cv2.imencode('.png', output_img)
                output_base64 = base64.b64encode(buffer).decode('utf-8')
                sys.stdout.write(output_base64)
                sys.exit(0)
                
            except Exception as e:
                sys.stderr.write(f"Enhancement error: {str(e)}\n")
                sys.exit(1)
        else:
            print("PixelForge Photo Enhancer Pipeline CLI usage:")
            print("  python3 enhancer.py --input <input_path> --output <output_path> [options]")
            print("\nOr pipe a base64 encoded image to stdin for stdout base64 output.")
            sys.exit(1)
