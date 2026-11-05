"""Render the existing map-pin brand as installation icons (Pillow required)."""
from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parent.parent

def icon(size):
    scale = 4
    image = Image.new('RGB', (size*scale, size*scale), '#f1f7f3')
    draw = ImageDraw.Draw(image)
    def box(values): return tuple(round(v*size*scale/100) for v in values)
    draw.ellipse(box((29, 23, 71, 65)), fill='#1c6560')
    draw.polygon([box((30, 48)), box((70, 48)), box((50, 79))], fill='#1c6560')
    draw.ellipse(box((43, 37, 57, 51)), fill='white')
    return image.resize((size, size), Image.Resampling.LANCZOS)

for size in (192, 512, 180):
    target = root/'public/icons'/f'icon-{size}.png'
    target.parent.mkdir(parents=True, exist_ok=True)
    icon(size).save(target)
