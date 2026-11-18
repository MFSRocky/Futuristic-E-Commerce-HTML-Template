"""Compose NEXORA marketplace preview images from AUTHENTIC screenshots (author tool, not shipped).

Specs followed (verified 2026-11 against Envato Author Help):
  * ThemeForest upload: Thumbnail 80x80 JPG/PNG; Theme Preview ZIP with 01_*.jpg = 590x300,
    further images 02_, 03_ ... (JPG/PNG) in display order.
  * Envato "Item Presentation Requirements": cover image 3:2 (recommended 2340x1560, min 1170x780,
    <= 20 MB, show the actual item, minimal marketing text); preview images recommended 1170 px wide,
    min 570 px wide, max height 1500 px, <= 20 MB, up to 15 images; no upscaled / over-compressed images.

Every composition is rendered with Playwright at 2x and downsampled with Lanczos for crisp text.
The renderer FAILS if any screenshot would be displayed larger than its native resolution (no upscaling).
"""
import asyncio, os, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageCms

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SS = 'file://' + ROOT + '/preview-assets/screenshots/'
FONTS = 'file://' + ROOT + '/site/assets/fonts/'
OUT = ROOT + '/preview-assets/'
for d in ('theme-preview', 'thumbnail', 'cover'): os.makedirs(OUT + d, exist_ok=True)
os.makedirs(ROOT + '/tools/preview', exist_ok=True)
SRGB = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
W = 1170  # preview width (Envato recommended)

CSS = f"""
@font-face {{ font-family: Syne; src: url({FONTS}syne-latin-700-normal.woff2); font-weight: 700; }}
@font-face {{ font-family: Syne; src: url({FONTS}syne-latin-800-normal.woff2); font-weight: 800; }}
@font-face {{ font-family: Inter; src: url({FONTS}inter-latin-400-normal.woff2); font-weight: 400; }}
@font-face {{ font-family: Inter; src: url({FONTS}inter-latin-500-normal.woff2); font-weight: 500; }}
@font-face {{ font-family: Inter; src: url({FONTS}inter-latin-600-normal.woff2); font-weight: 600; }}
@font-face {{ font-family: Mono; src: url({FONTS}jetbrains-mono-latin-500-normal.woff2); font-weight: 500; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ background: #090B12; color: #F4F4F7; font-family: Inter, sans-serif; -webkit-font-smoothing: antialiased; }}
.canvas {{ position: relative; overflow: hidden; background:
  radial-gradient(55% 45% at 88% 0%, rgba(168,85,247,.26), transparent 70%),
  radial-gradient(45% 40% at 0% 100%, rgba(0,229,255,.13), transparent 70%), #090B12; }}
.canvas::before {{ content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
  background-size: 52px 52px; -webkit-mask-image: radial-gradient(80% 60% at 50% 20%, #000, transparent); }}
.pad {{ padding: 64px 60px 64px; }}
.head {{ position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; margin-bottom: 40px; }}
.eyebrow {{ font-family: Mono; font-size: 13px; letter-spacing: .22em; text-transform: uppercase; color: #00E5FF; display: inline-flex; align-items: center; gap: 12px; }}
.eyebrow::before {{ content: ""; width: 28px; height: 1px; background: currentColor; }}
.title {{ font-family: Syne; font-weight: 700; letter-spacing: -.02em; line-height: 1.04; font-size: 46px; margin-top: 14px; }}
.grad {{ background: linear-gradient(100deg, #D8B4FE, #A855F7 40%, #00E5FF); -webkit-background-clip: text; background-clip: text; color: transparent; }}
.sub {{ color: #A1A7BB; font-size: 16px; line-height: 1.6; max-width: 400px; text-align: right; }}
.browser {{ position: relative; border-radius: 14px; overflow: hidden; background: #0F1220; border: 1px solid rgba(255,255,255,.12); box-shadow: 0 40px 90px -30px rgba(0,0,0,.9), 0 0 0 1px rgba(168,85,247,.07); }}
.browser .bar {{ height: 30px; display: flex; align-items: center; gap: 7px; padding: 0 14px; background: #131726; border-bottom: 1px solid rgba(255,255,255,.07); }}
.browser .bar i {{ width: 10px; height: 10px; border-radius: 50%; background: #2C3146; }}
.browser .bar span {{ margin-left: 14px; flex: 1; max-width: 62%; height: 16px; border-radius: 8px; background: #1B2033; font: 500 9.5px/16px Mono; color: #6E7590; padding-left: 10px; white-space: nowrap; overflow: hidden; }}
.shot {{ overflow: hidden; position: relative; }}
.shot img {{ display: block; width: 100%; }}
.phone {{ border-radius: 36px; padding: 8px; background: linear-gradient(160deg, #2A2F45, #12141F); box-shadow: 0 40px 80px -25px rgba(0,0,0,.9), inset 0 0 0 1px rgba(255,255,255,.13); }}
.phone .shot {{ border-radius: 29px; }}
.tablet {{ border-radius: 26px; padding: 11px; background: linear-gradient(160deg, #2A2F45, #12141F); box-shadow: 0 40px 80px -25px rgba(0,0,0,.9), inset 0 0 0 1px rgba(255,255,255,.13); }}
.tablet .shot {{ border-radius: 16px; }}
.label {{ font-family: Mono; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: #A1A7BB; margin-top: 14px; display: flex; gap: 10px; align-items: center; }}
.label b {{ color: #00E5FF; font-weight: 500; }}
.grid {{ position: relative; z-index: 1; display: grid; gap: 28px 24px; }}
.card {{ padding: 20px; border-radius: 16px; background: rgba(23,26,39,.78); border: 1px solid rgba(255,255,255,.08); }}
.card h4 {{ font: 600 15px Inter; margin-bottom: 6px; }}
.card p {{ color: #A1A7BB; font-size: 13px; line-height: 1.5; }}
.card .k {{ font: 700 26px Syne; margin-bottom: 4px; }}
.logo {{ display: inline-flex; align-items: center; gap: 12px; font-family: Syne; font-weight: 800; letter-spacing: .1em; }}
.logo i {{ display: grid; place-items: center; font-style: normal; border-radius: 10px; border: 1.5px solid #6D7CFF; color: #A5B4FC; font-family: Syne; }}
.chip {{ display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); background: rgba(23,26,39,.7); font-size: 12px; color: #D3D6E0; }}
.chip b {{ width: 6px; height: 6px; border-radius: 50%; background: linear-gradient(135deg, #A855F7, #00E5FF); }}
"""

def shot(img, h=None, top=0):
    """Screenshot window: optional fixed height and vertical offset (px in displayed scale, via %)."""
    style = f'height:{h}px' if h else ''
    off = f' style="margin-top:-{top}px"' if top else ''
    return f'<div class="shot" style="{style}"><img src="{SS}{img}"{off}></div>'
def browser(img, h=None, top=0, url='nexora.store', style=''):
    return f'<div class="browser" style="{style}"><div class="bar"><i></i><i></i><i></i><span>{url}</span></div>{shot(img, h, top)}</div>'
def phone(img, w, style=''):
    h = round(w * 844 / 390)  # true device aspect of the 390x844 captures
    return f'<div class="phone" style="width:{w + 16}px;{style}">{shot(img, h)}</div>'
def tablet(img, w, style=''):
    h = round(w * 1024 / 768)
    return f'<div class="tablet" style="width:{w + 22}px;{style}">{shot(img, h)}</div>'
def logo(size):
    return f'<span class="logo" style="font-size:{size}px"><i style="width:{size*1.45}px;height:{size*1.45}px;font-size:{size*.82}px">N</i><span>NEXORA<span style="color:#00E5FF">.</span></span></span>'
def head(eyebrow, title, sub=''):
    return f'<div class="head"><div><span class="eyebrow">{eyebrow}</span><h2 class="title">{title}</h2></div>{f"<p class=sub>{sub}</p>" if sub else ""}</div>'
def label(n, text): return f'<p class="label"><b>{n}</b>{text}</p>'

C = {}  # name -> (css_w, css_h or None, html, out_scale, kind)

# ---------- COVER 3:2 — 2340x1560 (item-focused, minimal text) ----------
COVER = f"""
<div class="canvas" style="width:1170px;height:780px">
  <div style="position:absolute;left:56px;top:48px;z-index:3;display:flex;align-items:center;gap:18px">{logo(18)}<span style="font:500 13px Mono;letter-spacing:.18em;color:#A1A7BB;text-transform:uppercase">E-commerce HTML Template</span></div>
  {browser('state-hero@2x.jpg', style='position:absolute;left:56px;top:118px;width:900px')}
  {phone('mobile-home.jpg', 196, 'position:absolute;left:910px;top:250px;z-index:2')}
</div>"""
C['cover'] = (1170, 780, COVER, 2, 'cover')
C['02_nexora_main_preview'] = (1170, 780, COVER, 1, 'preview')

# ---------- 01 — ThemeForest inline preview 590x300 ----------
C['01_nexora_preview'] = (590, 300, f"""
<div class="canvas" style="width:590px;height:300px">
  <div style="position:absolute;left:28px;top:34px;width:205px;z-index:2">
    {logo(14)}
    <h1 style="font:700 27px/1.04 Syne;letter-spacing:-.02em;margin-top:24px">Futuristic<br><span class="grad">e-commerce</span><br>HTML template</h1>
    <p style="color:#A1A7BB;font-size:10.5px;line-height:1.55;margin-top:12px">13 pages · working cart, wishlist, coupons &amp; checkout UI · vanilla JS · responsive</p>
    <div style="display:flex;gap:5px;margin-top:14px"><span class="chip" style="font-size:9px;padding:4px 8px;gap:5px"><b style="width:5px;height:5px"></b>HTML5</span><span class="chip" style="font-size:9px;padding:4px 8px;gap:5px"><b style="width:5px;height:5px"></b>CSS3</span><span class="chip" style="font-size:9px;padding:4px 8px;gap:5px"><b style="width:5px;height:5px"></b>Vanilla JS</span></div>
  </div>
  {browser('state-hero@2x.jpg', style='position:absolute;left:250px;top:44px;width:340px;border-radius:9px 0 0 9px;border-right:0')}
</div>""", 1, 'inline')

# ---------- THUMBNAIL 80x80 ----------
C['thumbnail'] = (80, 80, """
<div style="width:80px;height:80px;display:grid;place-items:center;background:radial-gradient(80% 80% at 80% 10%, rgba(168,85,247,.55), transparent 70%),radial-gradient(70% 70% at 0% 100%, rgba(0,229,255,.35), transparent 70%),#090B12">
  <div style="text-align:center"><div style="width:38px;height:38px;margin:0 auto;border-radius:11px;border:2px solid #8B9BFF;display:grid;place-items:center;font:800 22px Syne;color:#F4F4F7;box-shadow:0 0 20px rgba(168,85,247,.5)">N</div>
  <div style="font:800 9.5px Syne;letter-spacing:.14em;margin-top:7px">NEXORA</div></div>
</div>""", 1, 'thumb')

# ---------- 03 — Full homepage (entire page, 3 consecutive slices) ----------
col_w = 334; page_h = round(8104 * col_w / 1440); slice_h = -(-page_h // 3)
cols = ''.join(f'<div>{browser("desktop-home-full.jpg", h=slice_h, top=slice_h * i, url=f"nexora.store · part {i+1}/3")}{label(f"0{i+1}", ["Hero · categories · trending", "Campaigns · arrivals · charts", "Advantages · reviews · footer"][i])}</div>' for i in range(3))
C['03_nexora_homepage_full'] = (W, None, f"""
<div class="canvas pad" style="width:{W}px">
  {head('Homepage · full page', 'The complete homepage,<br><span class="grad">top to bottom</span>', 'Every section of the live homepage, shown as three consecutive slices of one authentic 1440 px capture.')}
  <div class="grid" style="grid-template-columns:repeat(3,1fr)">{cols}</div>
</div>""", 1, 'preview')

# ---------- 04 — Homepage sections, readable ----------
S = lambda i: f'home-section-{i:02d}.jpg'
C['04_nexora_homepage_sections'] = (W, None, f"""
<div class="canvas pad" style="width:{W}px">
  {head('Homepage · sections', 'Layouts that <span class="grad">change pace</span>', 'Bento categories, tabbed trending grid, campaign banners with countdown, spotlight, testimonials and newsletter.')}
  <div class="grid" style="grid-template-columns:1fr 1fr;align-items:start">
    <div style="display:grid;gap:26px">
      <div>{browser(S(3))}{label('01', 'Trending · tabbed product grid')}</div>
      <div>{browser(S(8))}{label('02', 'Testimonials')}</div>
      <div>{browser(S(9))}{label('03', 'Newsletter')}</div>
    </div>
    <div style="display:grid;gap:26px">
      <div>{browser(S(2))}{label('04', 'Category bento')}</div>
      <div>{browser(S(4))}{label('05', 'Campaign banners · countdown')}</div>
      <div>{browser(S(6))}{label('06', 'Best-seller spotlight')}</div>
    </div>
  </div>
</div>""", 1, 'preview')

# ---------- 05 — Features & highlights ----------
feat = [('13', 'HTML pages', 'Home to 404, one design system'), ('0', 'Dependencies', 'HTML5, CSS3 &amp; vanilla JS only'), ('58/58', 'Flow tests passed', 'Cart, coupons, checkout, filters, forms'), ('0', 'axe violations', 'WCAG 2.1 AA checks on every page'),
        ('320+', 'px responsive', 'Tested 320 → 1920 px'), ('3', 'Demo coupons', 'Percent, fixed &amp; free shipping'), ('localStorage', 'Persistence', 'Cart, wishlist &amp; coupon'), ('Reduced', 'motion support', 'Respects user preferences')]
cards = ''.join(f'<div class="card"><div class="k grad">{k}</div><h4>{t}</h4><p>{d}</p></div>' for k, t, d in feat)
C['05_nexora_features_highlights'] = (W, None, f"""
<div class="canvas pad" style="width:{W}px">
  {head('Features &amp; highlights', 'A storefront that<br><span class="grad">actually works</span>', 'Real interface states captured from the live demo: mega menu, cart drawer, quick view and instant search.')}
  <div class="grid" style="grid-template-columns:1fr 1fr">
    <div>{browser('state-megamenu@2x.jpg')}{label('01', 'Mega menu')}</div>
    <div>{browser('state-cart-drawer@2x.jpg')}{label('02', 'Cart drawer · live totals')}</div>
    <div>{browser('state-quick-view@2x.jpg')}{label('03', 'Quick view · variants')}</div>
    <div>{browser('state-search@2x.jpg')}{label('04', 'Instant search')}</div>
  </div>
  <div class="grid" style="grid-template-columns:repeat(4,1fr);gap:14px;margin-top:40px">{cards}</div>
</div>""", 1, 'preview')

# ---------- 06 — Desktop ----------
dp = [('desktop-home.jpg', 'Home'), ('desktop-shop.jpg', 'Shop'), ('desktop-product.jpg', 'Product details'), ('desktop-categories.jpg', 'Categories'), ('desktop-cart.jpg', 'Cart'), ('desktop-checkout.jpg', 'Checkout'), ('desktop-about.jpg', 'About'), ('desktop-blog.jpg', 'Blog'), ('desktop-faq.jpg', 'FAQ')]
C['06_nexora_desktop'] = (W, None, f"""
<div class="canvas pad" style="width:{W}px">
  {head('Desktop · 1440 px', 'Every step of the<br><span class="grad">shopping journey</span>', 'Shared navigation, footer and design system across all 13 pages.')}
  <div class="grid" style="grid-template-columns:repeat(3,1fr)">{''.join(f'<div>{browser(i)}{label(f"{n+1:02d}", l)}</div>' for n, (i, l) in enumerate(dp))}</div>
</div>""", 1, 'preview')

# ---------- 07 — Tablet ----------
tp = [('tablet-home.jpg', 'Home'), ('tablet-shop.jpg', 'Shop'), ('tablet-product.jpg', 'Product details')]
C['07_nexora_tablet'] = (W, 780, f"""
<div class="canvas pad" style="width:{W}px;height:780px">
  {head('Tablet · 768 px', 'Tuned for <span class="grad">tablet</span>', 'Mobile navigation, two- and three-column grids and touch-first product cards.')}
  <div class="grid" style="grid-template-columns:repeat(3,1fr);justify-items:center;margin-top:62px">{''.join(f'<div>{tablet(i, 318)}{label(f"0{n+1}", l)}</div>' for n, (i, l) in enumerate(tp))}</div>
</div>""", 1, 'preview')

# ---------- 08 — Mobile ----------
mp = [('mobile-home.jpg', 'Home'), ('state-mobile-nav@2x.jpg', 'Navigation'), ('mobile-shop.jpg', 'Shop'), ('state-mobile-product@2x.jpg', 'Product'), ('mobile-cart.jpg', 'Cart')]
C['08_nexora_mobile'] = (W, 780, f"""
<div class="canvas pad" style="width:{W}px;height:780px">
  {head('Mobile · 390 px', 'Designed for the <span class="grad">thumb</span>', 'Distinct mobile hero composition, off-canvas navigation and filters, 2-up product grids.')}
  <div class="grid" style="grid-template-columns:repeat(5,1fr);gap:18px;justify-items:center;margin-top:96px">{''.join(f'<div>{phone(i, 178)}{label(f"0{n+1}", l)}</div>' for n, (i, l) in enumerate(mp))}</div>
</div>""", 1, 'preview')

# ---------- 09 — Responsive (all devices) ----------
C['09_nexora_responsive'] = (W, 780, f"""
<div class="canvas pad" style="width:{W}px;height:780px">
  {head('Responsive', 'Distinct compositions<br>for <span class="grad">every screen</span>', 'Desktop, tablet and mobile captures of the same homepage.')}
  {browser('desktop-home.jpg', style='position:absolute;left:60px;top:250px;width:760px')}
  {tablet('tablet-home.jpg', 290, 'position:absolute;left:690px;top:300px;z-index:2')}
  {phone('mobile-home.jpg', 170, 'position:absolute;left:940px;top:350px;z-index:3')}
</div>""", 1, 'preview')

# ---------- 10 — Shop ----------
C['10_nexora_shop'] = (W, None, f"""
<div class="canvas pad" style="width:{W}px">
  {head('Shop', 'Filter, sort, <span class="grad">find fast</span>', 'Search, categories, dual price range, rating, availability, active-filter chips, grid / list view and load more.')}
  <div style="position:relative;z-index:1">{browser('desktop-shop.jpg')}{label('01', 'Shop · desktop')}</div>
  <div class="grid" style="grid-template-columns:repeat(3,auto);justify-content:center;gap:40px;margin-top:36px">
    <div>{phone('mobile-shop.jpg', 190)}{label('02', 'Mobile grid')}</div>
    <div>{phone('state-mobile-filters@2x.jpg', 190)}{label('03', 'Off-canvas filters')}</div>
    <div>{phone('mobile-categories.jpg', 190)}{label('04', 'Categories')}</div>
  </div>
</div>""", 1, 'preview')

# ---------- 11 — Product details ----------
C['11_nexora_product_details'] = (W, None, f"""
<div class="canvas pad" style="width:{W}px">
  {head('Product details', 'Product pages that<br><span class="grad">sell the detail</span>', 'Zoomable gallery, colour &amp; size variants, quantity, buy now, specification / review / shipping tabs and related products.')}
  <div style="position:relative;z-index:1">{browser('desktop-product.jpg', h=546)}{label('01', 'Product page · desktop')}</div>
  <div class="grid" style="grid-template-columns:1fr auto;gap:28px;margin-top:34px;align-items:start">
    <div>{browser('state-quick-view@2x.jpg', h=420, top=55)}{label('02', 'Quick view modal')}</div>
    <div>{phone('state-mobile-product@2x.jpg', 200)}{label('03', 'Mobile')}</div>
  </div>
</div>""", 1, 'preview')

# ---------- 12 — Cart & checkout ----------
C['12_nexora_cart_checkout'] = (W, None, f"""
<div class="canvas pad" style="width:{W}px">
  {head('Cart &amp; checkout', 'Real calculations,<br><span class="grad">clear flow</span>', 'Coupons, free-shipping progress, tax and shipping, inline validation. Payment is a clearly labelled demo.')}
  <div style="position:relative;z-index:1">{browser('desktop-cart-full.jpg', h=640)}{label('01', 'Cart · coupons, shipping progress &amp; totals')}</div>
  <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:28px">
    <div>{browser('desktop-checkout.jpg')}{label('02', 'Checkout · demo notice')}</div>
    <div>{browser('state-checkout-validation@2x.jpg')}{label('03', 'Inline validation')}</div>
  </div>
</div>""", 1, 'preview')

# ---------- 13 / 14 — Inner pages (tall page left, readable viewport captures right) ----------
SPLIT = 'grid-template-columns:334px 1fr;align-items:start'
C['13_nexora_inner_pages'] = (W, None, f"""
<div class="canvas pad" style="width:{W}px">
  {head('Inner pages', 'Brand &amp; <span class="grad">support</span>', 'About, contact and FAQ: story, timeline, team, validated contact form, stylised map and searchable accordions.')}
  <div class="grid" style="{SPLIT}">
    <div>{browser('desktop-about-full.jpg', h=950)}{label('01', 'About · full page')}</div>
    <div style="display:grid;gap:26px">
      <div>{browser('desktop-contact.jpg')}{label('02', 'Contact')}</div>
      <div>{browser('desktop-faq.jpg')}{label('03', 'FAQ')}</div>
    </div>
  </div>
</div>""", 1, 'preview')
C['14_nexora_blog_more'] = (W, None, f"""
<div class="canvas pad" style="width:{W}px">
  {head('Inner pages', 'Journal, wishlist <span class="grad">&amp; 404</span>', 'Filterable journal, long-form article with table of contents and comments, saved wishlist and a branded error page.')}
  <div class="grid" style="{SPLIT}">
    <div>{browser('desktop-blog-details-full.jpg', h=727)}{label('01', 'Blog details · article')}</div>
    <div style="display:grid;gap:26px">
      <div>{browser('desktop-blog.jpg')}{label('02', 'Blog listing')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div>{browser('desktop-wishlist.jpg')}{label('03', 'Wishlist')}</div>
        <div>{browser('desktop-404.jpg')}{label('04', '404')}</div>
      </div>
    </div>
  </div>
</div>""", 1, 'preview')

CHECK_UPSCALE = """(scale) => [...document.images].map(i => {
  const r = i.getBoundingClientRect();
  return { src: i.src.split('/').pop(), natural: i.naturalWidth, shown: Math.round(r.width * scale), ok: i.naturalWidth > 0 && r.width * scale <= i.naturalWidth + 1 };
}).filter(x => !x.ok)"""

async def main():
    only = sys.argv[1:]
    async with async_playwright() as p:
        b = await p.chromium.launch(); bad = []
        for name, (w, h, html, out_scale, kind) in C.items():
            if only and name not in only: continue
            path = f'{ROOT}/tools/preview/{name}.html'
            open(path, 'w').write(f'<!DOCTYPE html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{html}</body></html>')
            render = 2 * out_scale if kind != 'cover' else 2
            ctx = await b.new_context(viewport={'width': w, 'height': h or 400}, device_scale_factor=render)
            pg = await ctx.new_page(); await pg.goto('file://' + path); await pg.wait_for_load_state('networkidle')
            await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(250)
            up = await pg.evaluate(CHECK_UPSCALE, out_scale)
            if up: bad.append((name, up))
            tmp = f'/tmp/{name}.png'; await pg.screenshot(path=tmp, full_page=h is None)
            im = Image.open(tmp).convert('RGB')
            tw = w * out_scale; im = im.resize((tw, round(im.height * tw / im.width)), Image.LANCZOS)
            if kind == 'thumb': dst = OUT + 'thumbnail/nexora-thumbnail-80x80.png'; im.save(dst, optimize=True, icc_profile=SRGB)
            elif kind == 'cover': dst = OUT + f'cover/nexora-cover-{im.width}x{im.height}.jpg'; im.save(dst, quality=93, optimize=True, progressive=True, subsampling=0, icc_profile=SRGB)
            else: dst = OUT + f'theme-preview/{name}.jpg'; im.save(dst, quality=92, optimize=True, progressive=True, subsampling=0, icc_profile=SRGB)
            print(f'{name:34s} {im.width}x{im.height}  {os.path.getsize(dst)/1024:.0f} KB')
            await ctx.close()
        await b.close()
    if bad:
        for n, u in bad: print('UPSCALE', n, u)
        sys.exit(1)
    print('no upscaled screenshots')

asyncio.run(main())
