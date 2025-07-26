import os
from PIL import Image

# Directories
input_base = "../static/images_origin/"
output_base = "../static/images/"

# Compression settings
quality = 70  # JPEG quality (1 = low, 95 = high)
max_size = (1920, 1080)  # Resize images if they're too large

# Walk through all subdirectories
for root, _, files in os.walk(input_base):
    for file in files:
        if file.lower().endswith((".jpg", ".jpeg", ".png")):
            input_path = os.path.join(root, file)

            # Compute relative path to preserve folder structure
            relative_path = os.path.relpath(input_path, input_base)
            output_path = os.path.join(output_base, relative_path)

            # Create output folder if needed
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            try:
                with Image.open(input_path) as img:
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")

                    img.thumbnail(max_size, Image.Resampling.LANCZOS)

                    if file.lower().endswith(".png"):
                        img.save(output_path, optimize=True)
                    else:
                        img.save(output_path, "JPEG", optimize=True, quality=quality)

                    print(f"✔️ Compressed: {relative_path}")
            except Exception as e:
                print(f"❌ Error processing {relative_path}: {e}")
