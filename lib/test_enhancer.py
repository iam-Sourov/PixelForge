import os
import sys
import time
import torch
from PIL import Image

# Add lib directory and workspace root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from enhancer import RealESRGANAnime6B

def main():
    print("=========================================")
    print("Real-ESRGAN Anime 6B Model Verification Test")
    print("=========================================")
    
    input_path = "test_input.jpg"
    
    # Locate test input image
    # If not in current directory, check parent directory
    if not os.path.exists(input_path):
        parent_input_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_input.jpg")
        if os.path.exists(parent_input_path):
            input_path = parent_input_path
        else:
            print(f"Error: {input_path} not found. Please place a test image in the root directory first.")
            sys.exit(1)
            
    # Resolve output path relative to workspace root
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_output_esrgan.png")
        
    # Check GPU device
    if torch.cuda.is_available():
        device = torch.device("cuda")
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
        
    print(f"Detected PyTorch execution device: {device}")
    
    # 1. Load model
    print("\n[1/3] Loading Real-ESRGAN Anime 6B model (scale=4)...")
    start_time = time.time()
    try:
        lib_dir = os.path.dirname(os.path.abspath(__file__))
        weights_dir = os.path.join(lib_dir, "weights")
        os.makedirs(weights_dir, exist_ok=True)
        weights_path = os.path.join(weights_dir, "RealESRGAN_x4plus_anime_6B.pth")
        
        print(f"Weights path: {weights_path}")
        model = RealESRGANAnime6B(device)
        model.load_weights(weights_path, download=True)
        model.model.float() # Convert model weights to float32
        print(f"Model loaded successfully in {time.time() - start_time:.2f} seconds.")
    except Exception as e:
        print(f"CRITICAL ERROR loading model: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
        
    # 2. Run Inference
    print(f"\n[2/3] Processing input image: {input_path}...")
    start_inference = time.time()
    
    try:
        image = Image.open(input_path).convert("RGB")
        print(f"Original size: {image.size[0]}x{image.size[1]}")
        
        # Run prediction
        sr_image = model.predict(image)
        
        # Save output
        sr_image.save(output_path, format="PNG")
        print(f"Inference completed in {time.time() - start_inference:.4f} seconds.")
        print(f"Upscaled result image saved to: {output_path}")
    except Exception as e:
        print(f"CRITICAL ERROR processing image: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
        
    # 3. Validation
    print("\n[3/3] Validating results...")
    if os.path.exists(output_path):
        res_img = Image.open(output_path)
        print(f"Original dimensions: {image.size[0]}x{image.size[1]}")
        print(f"Result dimensions: {res_img.size[0]}x{res_img.size[1]} (Expected: {image.size[0]*4}x{image.size[1]*4})")
        
        # Verify size matches scale=4
        assert res_img.size[0] == image.size[0] * 4, "Width does not match scale=4!"
        assert res_img.size[1] == image.size[1] * 4, "Height does not match scale=4!"
        print("Success! Real-ESRGAN Anime 6B photo enhancement model is functional.")
    else:
        print("Error: Output image was not created!")
        sys.exit(1)
        
    print("=========================================")

if __name__ == "__main__":
    main()
