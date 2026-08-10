import sys
import cv2
import numpy as np
import base64

def enhance_image(image_data):
    """
    Ultimate Studio Portrait Enhancer (Python Core) - Premium Upgrade
    Steps:
    1. Grayscale Detection (preserves neutral black & white tones)
    2. Professional Noise Reduction (Fast Non-Local Means with h=8)
    3. Soft Skin Smoothing (Bilateral Filter blended with original)
    4. Studio Lighting (LAB CLAHE with clipLimit=1.2 to preserve details)
    5. Detail Restoration (Edge-Masked Unsharp Masking)
    6. Premium Color Finish (Saturation & Highlights temperature blue-shift, bypassed for grayscale)
    7. Sub-contrast & Brightness balance
    """
    try:
        # Decode image from base64
        nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception:
        return None
    
    if img is None:
        return None

    # Detect if image is grayscale/B&W by analyzing channel variance
    is_grayscale = False
    if len(img.shape) == 3 and img.shape[2] == 3:
        # Check standard deviation across channels for each pixel
        channel_std = np.std(img, axis=2)
        if np.mean(channel_std) < 8.0:
            is_grayscale = True

    # Step 1: Denoise (Fast Non-Local Means)
    # Calibrated h=5 to clean noise/grain while preserving fine textures and film grain
    if is_grayscale:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, None, h=5, templateWindowSize=7, searchWindowSize=21)
        img = cv2.cvtColor(denoised, cv2.COLOR_GRAY2BGR)
    else:
        img = cv2.fastNlMeansDenoisingColored(img, None, h=5, hColor=5, templateWindowSize=7, searchWindowSize=21)

    # Step 2: Skin Smoothing (Precision Bilateral Filter)
    # Apply a gentle bilateral filter
    smoothed = cv2.bilateralFilter(img, d=5, sigmaColor=25, sigmaSpace=25)
    # Blend smoothed skin back with original to preserve natural pores/texture (70% original, 30% smoothed)
    img = cv2.addWeighted(img, 0.7, smoothed, 0.3, 0)

    # Step 3: Professional Lighting (L-Channel CLAHE in LAB space)
    # Low clipLimit (1.2) for professional dynamic range expansion without over-contrast
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=1.2, tileGridSize=(8, 8))
    l = clahe.apply(l)
    img = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)

    # Step 4: Detail Restoration (Edge-Masked Unsharp Masking)
    # Only sharpens true contrast edges (like eyes, glasses, clothing details),
    # preventing noise/grain amplification in flat regions (like skin or sky).
    gray_edges = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Smooth before Laplacian to eliminate high-frequency noise from edge detection
    gray_edges_smooth = cv2.GaussianBlur(gray_edges, (5, 5), 0)
    laplacian = cv2.Laplacian(gray_edges_smooth, cv2.CV_32F, ksize=3)
    laplacian = np.absolute(laplacian)
    
    # Threshold the Laplacian to isolate edges and blur it to make a smooth mask
    _, mask = cv2.threshold(laplacian, 10, 255, cv2.THRESH_TOZERO)
    mask = cv2.GaussianBlur(mask, (5, 5), 0)
    
    max_val = np.max(mask)
    if max_val > 0:
        mask = mask / max_val
    else:
        mask = np.zeros_like(mask)
        
    mask_3d = cv2.merge([mask, mask, mask])

    # Convert to float for correct unsharp masking (retaining negative and positive detail values)
    img_f = img.astype(np.float32)
    blurred = cv2.GaussianBlur(img_f, (0, 0), 1.5)
    detail = img_f - blurred
    
    # Blend detail back ONLY on the edge mask (scale = 0.35 for a slightly softer, natural detail boost)
    sharpened = img_f + detail * mask_3d * 0.35
    img = np.clip(sharpened, 0, 255).astype(np.uint8)

    # Step 5: Color Finish (Saturation & Temperature)
    # Bypassed for grayscale images to avoid color tinting
    if not is_grayscale:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        
        # Soft, natural saturation boost (5%)
        s = cv2.multiply(s, 1.05)
        img = cv2.cvtColor(cv2.merge((h, s, v)), cv2.COLOR_HSV2BGR)

        # Cool temperature adjustment (slight blue-shift in highlights/midtones)
        b_channel, g_channel, r_channel = cv2.split(img)
        # Gently add 1 to the blue channel for a very subtle cooling effect
        b_channel = cv2.add(b_channel, 1)
        img = cv2.merge((b_channel, g_channel, r_channel))

    # Step 6: Final Scale / Brightness / Contrast Pass
    # Very subtly boost contrast (1%) to keep it looking extremely natural
    img = cv2.convertScaleAbs(img, alpha=1.01, beta=0)

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
