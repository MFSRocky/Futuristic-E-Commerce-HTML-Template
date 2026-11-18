"""Generate licence-safe placeholder images for the buyer package.

Every demo photo in site/assets/images is replaced by a branded placeholder with the
SAME path, file name, format and pixel size, so the template works out of the box and
buyers can drop their own photos in. Placeholders are generated from scratch (gradients,
shapes and text rendered with the bundled OFL fonts) — no third-party imagery.

Usage: python3 tools/placeholders.py <target_images_dir>
"""
import sys, os, glob, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC = os.path.join(os.path.dirname(__file__), '..', 'site', 'assets', 'images')
MONO = '/tmp/ttf/mono.ttf'; SYNE = '/tmp/ttf/syne.ttf'
BG = (9, 11, 18); SURF = (23, 26, 39); VIOLET = (168, 85, 247); CYAN = (0, 229, 255)

def glow(size, center, radius, color, alpha):
    layer = Image.new('RGBA', size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    x, y = center; d.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(radius * .55))

def make(path_rel, w, h):
    im = Image.new('RGBA', (w, h), BG + (255,))
    # vertical surface gradient
    grad = Image.new('RGBA', (1, h)); 
    for y in range(h):
        t = y / max(h - 1, 1); c = tuple(int(BG[i] + (SURF[i] - BG[i]) * (1 - abs(t - .55) * 1.6)) for i in range(3)); grad.putpixel((0, y), c + (255,))
    im.alpha_composite(grad.resize((w, h)))
    im.alpha_composite(glow((w, h), (int(w * .62), int(h * .42)), int(min(w, h) * .32), VIOLET, 90))
    im.alpha_composite(glow((w, h), (int(w * .4), int(h * .62)), int(min(w, h) * .22), CYAN, 50))
    ov = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    step = max(32, min(w, h) // 12)
    for x in range(0, w, step): d.line([(x, 0), (x, h)], fill=(255, 255, 255, 10))
    for y in range(0, h, step): d.line([(0, y), (w, y)], fill=(255, 255, 255, 10))
    # centred ring "object" silhouette
    cx, cy, r = w // 2, int(h * .46), int(min(w, h) * .17)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(255, 255, 255, 60), width=max(2, r // 40))
    d.ellipse((cx - r * .55, cy - r * .55, cx + r * .55, cy + r * .55), outline=(168, 85, 247, 120), width=max(2, r // 30))
    d.ellipse((cx - 6, cy - 6, cx + 6, cy + 6), fill=CYAN + (220,))
    fs = max(14, min(w, h) // 26)
    try:
        mono = ImageFont.truetype(MONO, fs)
        big = ImageFont.truetype(SYNE, int(fs * 1.5))
    except Exception:
        mono = ImageFont.load_default()
        big = ImageFont.load_default()
    label = os.path.splitext(os.path.basename(path_rel))[0].replace('-', ' ').upper()
    t1 = 'REPLACE WITH YOUR IMAGE'; t2 = f'{w} × {h} px'
    for txt, font, y, col in [(label, big, cy + r + fs * 1.4, (244, 244, 247, 235)), (t2, mono, cy + r + fs * 3.4, (0, 229, 255, 230)), (t1, mono, cy + r + fs * 4.8, (161, 167, 187, 200))]:
        try:
            tw = d.textlength(txt, font=font)
            if tw > w * .9 and hasattr(font, 'path'):
                font = ImageFont.truetype(font.path, int(font.size * w * .9 / tw))
                tw = d.textlength(txt, font=font)
        except Exception:
            tw = len(txt) * 6
        d.text(((w - tw) / 2, y), txt, font=font, fill=col)
    d.rectangle((0, 0, w - 1, h - 1), outline=(255, 255, 255, 18))
    im.alpha_composite(ov)
    return im.convert('RGB')

def main(target):
    n = 0
    for f in sorted(glob.glob(os.path.join(SRC, '**', '*.*'), recursive=True)):
        rel = os.path.relpath(f, SRC); ext = os.path.splitext(f)[1].lower()
        out = os.path.join(target, rel); os.makedirs(os.path.dirname(out), exist_ok=True)
        if ext not in ('.webp', '.jpg', '.jpeg', '.png'):
            continue  # svg brand files are original vector work and are copied as-is by the packager
        with Image.open(f) as src: w, h = src.size
        make(rel, w, h).save(out, quality=72, method=6) if ext == '.webp' else make(rel, w, h).save(out, quality=82)
        n += 1
    print(f'placeholders: {n}')

if __name__ == '__main__':
    main(sys.argv[1])
