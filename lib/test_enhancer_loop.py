import os
import sys
import time
import torch
from PIL import Image

# Add current directory and workspace root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from enhancer import RealESRGANAnime6B

def main():
    input_path = "test_input.jpg"
    
    # Locate test input image
    if not os.path.exists(input_path):
        parent_input_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_input.jpg")
        if os.path.exists(parent_input_path):
            input_path = parent_input_path
        else:
            print(f"Error: {input_path} not found. Please place a test image in the root directory first.")
            sys.exit(1)

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Device: {device}")
    
    print("Loading model...")
    model = RealESRGANAnime6B(device)
    lib_dir = os.path.dirname(os.path.abspath(__file__))
    weights_path = os.path.join(lib_dir, "weights", "RealESRGAN_x4plus_anime_6B.pth")
    model.load_weights(weights_path, download=True)
    model.model.float()
    model.model.eval()
    print("Model loaded successfully!")
    
    image = Image.open(input_path).convert("RGB")
    
    print("\nStarting loop...")
    for i in range(1, 6):
        start_inference = time.time()
        sr_image = model.predict(image, patches_size=1024)
        duration = time.time() - start_inference
        print(f"Iteration {i}: Inference completed in {duration:.4f} seconds")

if __name__ == "__main__":
    main()
