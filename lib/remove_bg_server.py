import sys
import json
import base64
import torch
import traceback
import os
from io import BytesIO
from PIL import Image
from torchvision import transforms
from transformers import AutoModelForImageSegmentation

# Set up logging helper
def log(msg):
    print(f"[Python Worker] {msg}", file=sys.stderr, flush=True)

# Select GPU if available
if torch.cuda.is_available():
    device = torch.device("cuda")
elif torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")

log(f"Initializing BiRefNet on device: {device}...")

try:
    # Load model once on startup
    # Since BiRefNet uses custom code on HF, trust_remote_code=True is required
    model_name = os.environ.get("BIREFNET_MODEL", "ZhengPeng7/BiRefNet_lite")
    model = AutoModelForImageSegmentation.from_pretrained(
        model_name, 
        trust_remote_code=True
    )
    model.to(device)
    model.float()
    model.eval()
    log(f"BiRefNet model '{model_name}' loaded successfully on {device}!")
except Exception as e:
    log(f"CRITICAL ERROR loading BiRefNet model: {e}")
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

# Preprocessing transforms (BiRefNet is trained/optimized for 1024x1024)
transform_image = transforms.Compose([
    transforms.Resize((1024, 1024)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def process_image(base64_image):
    # Decode base64 to PIL Image
    img_data = base64.b64decode(base64_image)
    image = Image.open(BytesIO(img_data)).convert("RGB")
    original_size = image.size
    
    # Pre-process
    input_tensor = transform_image(image).unsqueeze(0).to(device)
    
    # Inference
    with torch.no_grad():
        preds = model(input_tensor)[-1].sigmoid().cpu()
        pred = preds[0].squeeze()
        pred_pil = transforms.ToPILImage()(pred)
        
    # Resize mask back to original image size
    mask = pred_pil.resize(original_size, Image.Resampling.BILINEAR)
    
    # Add alpha channel using the generated mask
    image_rgba = image.convert("RGBA")
    image_rgba.putalpha(mask)
    
    # Save back to PNG base64
    buffered = BytesIO()
    image_rgba.save(buffered, format="PNG")
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
