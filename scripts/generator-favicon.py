from PIL import Image

sizes = {
    "apple-touch-icon.png": (180, 180),
    "favicon-16.png": (16, 16),
    "favicon-32.png": (32, 32),
    "favicon-64.png": (64, 64),
    "favicon-512.png": (512, 512),
}

def generate_icons(source_file="source.png"):
    img = Image.open(source_file).convert("RGBA")

    for filename, size in sizes.items():
        resized = img.resize(size, Image.LANCZOS)
        resized.save(filename, format="PNG")

    ico_sizes = [(16, 16), (32, 32), (64, 64)]
    imgs = [img.resize(s, Image.LANCZOS) for s in ico_sizes]
    imgs[0].save("favicon.ico", format="ICO", sizes=ico_sizes)

if __name__ == "__main__":
    generate_icons(source_file="../doc/icon_raw/icon-v2_big.png")
