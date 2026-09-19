import sys
import json
import base64
import torch
import traceback
import os
from io import BytesIO
from PIL import Image

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enhancer import RealESRGANAnime6B

# Set up logging helper
def log(msg):
    print(f"[Python Enhancer] {msg}", file=sys.stderr, flush=True)

# Select GPU if available
if torch.cuda.is_available():
    device = torch.device("cuda")
elif torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")

log(f"Initializing Real-ESRGAN Anime 6B on device: {device}...")

try:
    # Use scale=4 by default since it is realesrgan-x4plus-anime-6b
    scale = int(os.environ.get("REAL_ESRGAN_SCALE", "4"))
    
    # Establish weights path in the project's weights directory
    lib_dir = os.path.dirname(os.path.abspath(__file__))
    weights_dir = os.path.join(lib_dir, "weights")
    os.makedirs(weights_dir, exist_ok=True)
    weights_path = os.path.join(weights_dir, "RealESRGAN_x4plus_anime_6B.pth")
    
    log(f"Loading weights from {weights_path}...")
    model = RealESRGANAnime6B(device)
    model.load_weights(weights_path, download=True)
    model.model.float() # Force float32 to prevent MPS type mismatch
    log("Real-ESRGAN Anime 6B loaded successfully!")
except Exception as e:
    log(f"CRITICAL ERROR loading Real-ESRGAN Anime 6B model: {e}")
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

def process_image(base64_image):
    # Decode base64 to PIL Image
    img_data = base64.b64decode(base64_image)
    image = Image.open(BytesIO(img_data)).convert("RGB")
    
    # Run prediction
    sr_image = model.predict(image)
    
    # Save back to PNG base64
    buffered = BytesIO()
    sr_image.save(buffered, format="PNG")
    result_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return result_base64

# Process stdin lines (CGI-like loop)
log("Ready to receive requests.")
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        data = json.loads(line)
        req_id = data.get("req_id")
        base64_image = data.get("image")
        
        # Strip out base64 URL prefix if present (e.g. data:image/png;base64,...)
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]
            
        result_image = process_image(base64_image)
        
        response = {
            "req_id": req_id,
            "status": "success",
            "image": f"data:image/png;base64,{result_image}"
        }
        print(json.dumps(response), flush=True)
    except Exception as e:
        req_id = None
        try:
            req_id = json.loads(line).get("req_id")
        except:
            pass
        
        err_msg = str(e)
        log(f"Error processing request {req_id}: {err_msg}")
        traceback.print_exc(file=sys.stderr)
        
        response = {
            "req_id": req_id,
            "status": "error",
            "error": err_msg
        }
        print(json.dumps(response), flush=True)
