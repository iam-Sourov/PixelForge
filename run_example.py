import os
import sys
import time
from PIL import Image

# Add current directory and lib directory to system path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))

from lib.enhancer import PhotoEnhancerPipeline

def run_example():
    input_path = "test_input.jpg"
    output_path = "test_output.jpg"
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found. Please place a test image in the root directory first.")
        sys.exit(1)
        
    print("--------------------------------------------------")
    print("Starting PixelForge RealESRGAN Anime 6B Pipeline")
    print("--------------------------------------------------")
    print(f"Input image: {input_path}")
    print(f"Output image will be saved to: {output_path}")
    
    # 1. Initialize Pipeline
    print("\n[1/3] Initializing pipeline (auto device detection)...")
    start_time = time.time()
    enhancer = PhotoEnhancerPipeline(device="auto", use_fp16=True)
    print(f"Pipeline initialized on device: {enhancer.device}")
    
    # 2. Run Pipeline
    # Using scale=2 to test the backward-compatible downscaling logic
    print(f"\n[2/3] Processing image: upscaling using RealESRGAN Anime 6B (scale=2 fallback)...")
    result_pil = enhancer.enhance(
        input_image_path=input_path,
        upscale_factor=2,
        face_enhance=False,
        fidelity_weight=0.7,
        save_path=output_path
    )
    
    # 3. Complete
    duration = time.time() - start_time
    print(f"\n[3/3] Process completed successfully in {duration:.2f} seconds.")
    print("--------------------------------------------------")
    
    # Simple validation assertions
    assert os.path.exists(output_path), "Output image file was not created!"
    
    # Open input and output images to print dimensions
    in_img = Image.open(input_path)
    out_img = Image.open(output_path)
    print(f"Original size: {in_img.size[0]}x{in_img.size[1]}")
    print(f"Enhanced size: {out_img.size[0]}x{out_img.size[1]} (Expected: {in_img.size[0]*2}x{in_img.size[1]*2})")
    
    # Validate dimensions
    assert out_img.size[0] == in_img.size[0] * 2, "Width scale verification failed!"
    assert out_img.size[1] == in_img.size[1] * 2, "Height scale verification failed!"
    
    print("Successful enhancement verification complete!")
    print("--------------------------------------------------")

if __name__ == "__main__":
    run_example()
