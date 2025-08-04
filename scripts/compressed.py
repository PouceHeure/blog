import os
import argparse
from PIL import Image

# Parse CLI arguments
parser = argparse.ArgumentParser(description="Compress images recursively while preserving folder structure and file extension.")
parser.add_argument('--force', action='store_true', help="Force re-compression even if the output image already exists.")
args = parser.parse_args()

input_base = "../static/images_origin/"
output_base = "../static/images/"

quality = 70
max_size = (1920, 1080)

try:
    resample = Image.Resampling.LANCZOS
except AttributeError:
    resample = Image.ANTIALIAS

for root, _, files in os.walk(input_base):
    for file in files:
        if file.lower().endswith((".jpg", ".jpeg", ".png")):
            input_path = os.path.join(root, file)
            relative_path = os.path.relpath(input_path, input_base)
            output_path = os.path.join(output_base, relative_path)

            if not args.force and os.path.exists(output_path):
                print(f"⏭️ Skipping (exists): {relative_path}")
                continue

            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            try:
                with Image.open(input_path) as img:
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB") if file.lower().endswith((".jpg", ".jpeg")) else img

                    # Resize only if larger than max_size
                    if img.width > max_size[0] or img.height > max_size[1]:
                        img.thumbnail(max_size, resample)


                    if file.lower().endswith(".png"):
                        # Try to quantize (optional for PNG compression)
                        if img.mode != "P":
                            img = img.convert("P", palette=Image.ADAPTIVE)
                        img.save(output_path, format="PNG", optimize=True)
                    else:
                        img.save(output_path, format="JPEG", optimize=True, quality=quality, progressive=True)

                    print(f"✔️ Compressed: {relative_path}")

            except Exception as e:
                print(f"❌ Error processing {relative_path}: {e}")
