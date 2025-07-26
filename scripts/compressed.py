import os
import argparse
from PIL import Image

# Parse CLI arguments
parser = argparse.ArgumentParser(description="Compress images recursively while preserving folder structure.")
parser.add_argument('--force', action='store_true', help="Force re-compression even if the output image already exists.")
args = parser.parse_args()

# Directories (based on your info)
input_base = "../static/images_origin/"
output_base = "../static/images/"

# Compression settings
quality = 70  # JPEG compression quality
max_size = (1920, 1080)  # Resize max dimensions (optional)

# Set resample method depending on Pillow version
try:
    resample = Image.Resampling.LANCZOS
except AttributeError:
    resample = Image.ANTIALIAS

# Process all image files in input_base recursively
for root, _, files in os.walk(input_base):
    for file in files:
        if file.lower().endswith((".jpg", ".jpeg", ".png")):
            input_path = os.path.join(root, file)

            # Keep relative path from input_base
            relative_path = os.path.relpath(input_path, input_base)
            output_path = os.path.join(output_base, relative_path)

            # Skip if already compressed and not forcing
            if not args.force and os.path.exists(output_path):
                print(f"⏭️ Skipping (exists): {relative_path}")
                continue

            # Ensure output folder exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            try:
                with Image.open(input_path) as img:
                    # Convert if needed for JPEG
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")

                    # Resize image while maintaining aspect ratio
                    img.thumbnail(max_size, resample)

                    # Save with compression
                    if file.lower().endswith(".png"):
                        img.save(output_path, optimize=True)
                    else:
                        img.save(output_path, "JPEG", optimize=True, quality=quality)

                    print(f"✔️ Compressed: {relative_path}")
            except Exception as e:
                print(f"❌ Error processing {relative_path}: {e}")
