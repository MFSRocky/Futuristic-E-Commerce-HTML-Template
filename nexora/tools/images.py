"""Build NEXORA demo imagery (preview-only, AI-generated) + licence-safe placeholders."""
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont
import os
RAW = os.path.expanduser('~/nexora/raw')
OUT = os.path.expanduser('~/nexora/site/assets/images')
BG = (9, 12, 19)
def ensure(p): os.makedirs(p, exist_ok=True)
for d in ['products', 'hero', 'blog', 'about', 'misc']: ensure(f'{OUT}/{d}')
def load(n): return Image.open(f'{RAW}/{n}.png').convert('RGB')
def save(im, path, q=80): im.save(f'{OUT}/{path}', 'WEBP', quality=q, method=6)

products = {'p01':'aether-x1','p02':'pulse-buds-pro','p03':'orbit-360','p04':'chronos-s',
 'p05':'halo-ring','p06':'vision-lens','p07':'vector-pro','p08':'flux-75','p09':'glide-x'}
for k, slug in products.items():
    im = load(k)
    save(im.resize((800, 800), Image.LANCZOS), f'products/{slug}.webp')
    # detail crop for gallery (zoomed macro)
    w, h = im.size
    c = im.crop((int(w*.2), int(h*.18), int(w*.8), int(h*.78))).resize((800, 800), Image.LANCZOS)
    save(c, f'products/{slug}-detail.webp')

def soft_mask(size, feather=90):
    m = Image.new('L', size, 0); d = ImageDraw.Draw(m)
    d.rounded_rectangle((feather//2, feather//2, size[0]-feather//2, size[1]-feather//2), radius=feather, fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather/2.2))

def composite(keys, out, size=(1000, 1000), scale=.62, positions=None):
    canvas = Image.new('RGB', size, BG)
    # ambient glow
    glow = Image.new('RGB', size, BG); gd = ImageDraw.Draw(glow)
    gd.ellipse((size[0]*.1, size[1]*.3, size[0]*.55, size[1]*.95), fill=(52, 24, 90))
    gd.ellipse((size[0]*.45, size[1]*.25, size[0]*.95, size[1]*.9), fill=(0, 60, 75))
    canvas = Image.blend(canvas, glow.filter(ImageFilter.GaussianBlur(160)), .55)
    n = len(keys)
    for i, k in enumerate(keys):
        im = load(k); s = int(size[1]*scale) if positions is None else int(size[1]*positions[i][2])
        im = im.resize((s, s), Image.LANCZOS)
        if positions: x, y = int(positions[i][0]*size[0]), int(positions[i][1]*size[1])
        else: x = int((size[0]-s) * (i/(n-1) if n > 1 else .5)); y = int((size[1]-s)/2 + (i % 2)*40 - 20)
        canvas.paste(im, (x, y), soft_mask((s, s), int(s*.22)))
    return canvas

save(composite(['p01','p03'], None, positions=[(-.02,.12,.66),(.40,.24,.62)]), 'products/bundle-studio-sound.webp')
save(composite(['p08','p09'], None, positions=[(-.04,.16,.68),(.42,.30,.58)]), 'products/bundle-command-deck.webp')
save(composite(['p04','p05'], None, positions=[(-.02,.14,.64),(.42,.28,.58)]), 'products/bundle-biometric-kit.webp')
save(composite(['p02','p06'], None, positions=[(-.03,.14,.62),(.38,.26,.64)]), 'products/bundle-creator-kit.webp')
for slug in ['bundle-studio-sound','bundle-command-deck','bundle-biometric-kit','bundle-creator-kit']:
    im = Image.open(f'{OUT}/products/{slug}.webp').resize((800,800), Image.LANCZOS); save(im, f'products/{slug}.webp')
    w,h=im.size; save(im.crop((int(w*.15),int(h*.15),int(w*.85),int(h*.85))).resize((800,800),Image.LANCZOS), f'products/{slug}-detail.webp')

# hero
hero = load('hero')
save(hero, 'hero/hero-main.webp', 82)
w, h = hero.size
save(hero.crop((int(w*.12), 0, int(w*.88), h)).resize((900, int(900*h/(w*.76))), Image.LANCZOS), 'hero/hero-mobile.webp', 80)

# blog covers - editorial crops with grade
def grade(im, tint=(40, 20, 70), amt=.18):
    over = Image.new('RGB', im.size, tint)
    im = Image.blend(im, over, amt)
    return ImageEnhance.Contrast(im).enhance(1.08)
def crop_ratio(im, cx, cy, zoom, ratio=1.6):
    w, h = im.size; cw = w/zoom; ch = cw/ratio
    if ch > h: ch = h; cw = ch*ratio
    x0 = max(0, min(w-cw, cx*w-cw/2)); y0 = max(0, min(h-ch, cy*h-ch/2))
    return im.crop((int(x0), int(y0), int(x0+cw), int(y0+ch)))
blog = [('p04', .45, .5, 1.25, 'smartwatch-interface'), ('p06', .5, .5, 1.0, 'spatial-computing'),
        ('p08', .5, .5, 1.05, 'mechanical-renaissance'), ('p05', .5, .45, 1.4, 'invisible-wearables'),
        ('p03', .5, .5, 1.0, 'sound-architecture'), ('p07', .5, .5, 1.05, 'haptic-play')]
for k, cx, cy, z, slug in blog:
    im = grade(crop_ratio(load(k), cx, cy, z))
    save(im.resize((1200, 750), Image.LANCZOS), f'blog/{slug}.webp', 78)

# about lineup (wide)
lineup = composite(['p06','p04','p01','p07','p02'], None, size=(1800, 900),
    positions=[(.0,.28,.52),(.17,.12,.62),(.34,.02,.78),(.58,.14,.62),(.76,.28,.52)])
save(lineup, 'about/lineup.webp', 80)
save(grade(crop_ratio(load('p08'), .5, .55, 1.0, 1.25), (0, 40, 60), .12).resize((1000, 800)), 'about/studio.webp', 78)
print('done')
