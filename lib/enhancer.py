import sys
import cv2
import numpy as np
import base64

def enhance_image(image_data):
    """
    Ultimate Studio Portrait Enhancer (Python Core)
    Steps:
    1. Denoise (Non-Local Means)
    2. Skin Smoothing (Iterative Bilateral Filter)
    3. Professional Lighting (L-Channel CLAHE)
    4. Detail Restoration (Unsharp Masking / Sharpening Kernel)
    5. Color Finish (Vibrance, Temperature & Brightness)
    """
    try:
        # Decode image from base64
        nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception:
        return None
    
    if img is None:
        return None

    # Step 1: Denoise (Fast Non-Local Means)
    # Cleans up digital noise while preserving overall structure
    img = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)

    # Step 2: Skin Smoothing (Precision Bilateral Filter)
    # Single pass with lower sigma to prevent "dreamy" blur while still smoothing skin
    img = cv2.bilateralFilter(img, d=7, sigmaColor=50, sigmaSpace=50)

    # Step 3: Professional Lighting (L-Channel CLAHE in LAB space)
    # Enhances details in shadows/highlights (folds in shirt) without shifting colors
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8,8)) # Slightly higher clipLimit for crisper detail
    l = clahe.apply(l)
    img = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)

    # Step 4: Detail Restoration (Advanced Sharpening Kernel)
    # Restores micro-details in hair, eyes, and beard
    kernel = np.array([
        [-1, -1, -1], 
        [-1,  9, -1], 
        [-1, -1, -1]
    ])
    # Increased sharpening ratio to 0.5 for punchier detail
    sharpened = cv2.filter2D(img, -1, kernel)
    img = cv2.addWeighted(img, 0.5, sharpened, 0.5, 0)

    # Bonus: Final Crispness Pass
    # Subsurface scattering control to ensure textures remain "real"
    img = cv2.detailEnhance(img, sigma_s=10, sigma_r=0.15)

    # Step 5: Color Finish (Vibrance & Color Balance)
    # Target: Clean, cool-toned "studio" look with popping colors
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    # Boost saturation by 20%
    s = cv2.multiply(s, 1.2)
    img = cv2.cvtColor(cv2.merge((h, s, v)), cv2.COLOR_HSV2BGR)

    # Cool temperature adjustment (Slightly blue-shifted)
    blue_channel = img[:, :, 0]
    img[:, :, 0] = cv2.add(blue_channel, 5) # Increase blue channel slightly
    
    # Final scale/brightness/contrast pass
    img = cv2.convertScaleAbs(img, alpha=1.05, beta=2)

    # Encode back to base64
    _, buffer = cv2.imencode('.png', img)
    return base64.b64encode(buffer).decode('utf-8')

if __name__ == "__main__":
    # Expecting base64 string from stdin
    input_data = sys.stdin.read()
    if not input_data:
        sys.exit(0)
    
    output = enhance_image(input_data)
    if output:
        sys.stdout.write(output)
    else:
        sys.stderr.write("Processing failed")
