#!/usr/bin/env python3
"""NEXORA page assembler (author tool, not shipped).
Wraps src/pages/*.html with shared partials and writes static HTML into site/.
"""
import json, os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'pages')
OUT = os.path.join(ROOT, 'site')
LUCIDE = '/tmp/pkgs/node_modules/lucide-static/icons'
VERSION = '1.0.0'

ICONS = ['search', 'shopping-bag', 'heart', 'user', 'menu', 'x', 'chevron-down', 'chevron-right', 'chevron-left',
         'arrow-right', 'arrow-up-right', 'arrow-up', 'arrow-left', 'star', 'eye', 'plus', 'minus', 'trash-2', 'truck',
         'shield-check', 'rotate-ccw', 'headphones', 'watch', 'gamepad-2', 'package', 'sparkles', 'zap', 'mail', 'phone',
         'map-pin', 'clock', 'check', 'circle-check', 'circle-alert', 'info', 'sliders-horizontal', 'layout-grid', 'list',
         'tag', 'credit-card', 'lock', 'gift', 'send', 'cpu', 'leaf', 'award', 'message-circle', 'calendar', 'share-2',
         'copy', 'ticket', 'badge-percent', 'user-round', 'flame', 'circle-help', 'wallet', 'refresh-cw', 'globe']

CUSTOM = {
    'social-x': '<path d="M4 4l16 16M20 4L4 20"/>',
    'social-instagram': '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>',
    'social-youtube': '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/>',
    'social-tiktok': '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.6 2.6 2.4 4.3 5 4.6"/>',
}

def sprite():
    out = ['<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true"><!-- Icons: Lucide (ISC licence) + NEXORA custom glyphs -->']
    for n in ICONS:
        svg = open(os.path.join(LUCIDE, n + '.svg')).read()
        inner = re.search(r'<svg[^>]*>(.*)</svg>', svg, re.S).group(1)
        inner = re.sub(r'\s+', ' ', inner).strip()
        out.append('<symbol id="i-%s" viewBox="0 0 24 24">%s</symbol>' % (n, inner))
    for n, body in CUSTOM.items():
        out.append('<symbol id="i-%s" viewBox="0 0 24 24">%s</symbol>' % (n, body))
    out.append('</svg>')
    return ''.join(out)

def ic(name, cls=''):
    return '<svg class="icon %s" aria-hidden="true" focusable="false"><use href="#i-%s"></use></svg>' % (cls, name)

def logo(uid):
    return ('<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg-%s" x1="0" y1="0" x2="1" y2="1">'
            '<stop stop-color="#A855F7"/><stop offset="1" stop-color="#00E5FF"/></linearGradient></defs>'
            '<rect x="1" y="1" width="30" height="30" rx="9" fill="none" stroke="url(#lg-%s)" stroke-width="1.5" opacity=".55"/>'
            '<path d="M9 23V9h3.6l6.8 8.6V9H23v14h-3.6l-6.8-8.6V23z" fill="url(#lg-%s)"/></svg>') % (uid, uid, uid)

NAV = [('home', 'index.html', 'Home'), ('shop', 'shop.html', 'Shop'), ('categories', 'categories.html', 'Categories'),
       ('pages', None, 'Pages'), ('blog', 'blog.html', 'Blog'), ('contact', 'contact.html', 'Contact')]
PAGES_MENU = [('about', 'about.html', 'About Us'), ('faq', 'faq.html', 'FAQ'), ('wishlist', 'wishlist.html', 'Wishlist'),
              ('cart', 'cart.html', 'Shopping Cart'), ('checkout', 'checkout.html', 'Checkout'),
              ('product', 'product.html?id=aether-x1', 'Product Details'), ('post', 'blog-details.html', 'Blog Details'), ('404', '404.html', '404 Error')]

def cur(active, key):
    return ' aria-current="page"' if active == key else ''

def header(active):
    cats = [('audio', 'headphones', 'Audio', 'Headphones · earbuds · speakers'), ('wearables', 'watch', 'Wearables', 'Watches · rings · AR glasses'),
            ('gaming', 'gamepad-2', 'Gaming', 'Controllers · keyboards · mice'), ('bundles', 'package', 'Bundles', 'Curated kits, save up to 15%')]
    mega_cats = ''.join('<li><a href="shop.html?cat=%s"><span class="mega__cat-icon">%s</span><span><strong>%s</strong><small>%s</small></span></a></li>' % (c, ic(i), n, d) for c, i, n, d in cats)
    pages_dd = ''.join('<li><a href="%s"%s>%s%s</a></li>' % (h, cur(active, k), t, ic('arrow-right')) for k, h, t in PAGES_MENU)
    items = []
    for key, href, label in NAV:
        if key == 'shop':
            items.append('''<li class="nav__item" data-menu>
  <a class="nav__link" href="shop.html" aria-expanded="false" aria-controls="mega-shop" aria-haspopup="true"%s>Shop%s</a>
  <div class="mega" id="mega-shop"><div class="container"><div class="mega__panel">
    <div><p class="mega__title">Categories</p><ul class="mega__cats">%s</ul></div>
    <div><p class="mega__title">Collections</p><ul class="mega__links">
      <li><a href="shop.html?sort=newest">New arrivals <span class="badge badge--new">Drop 07</span></a></li>
      <li><a href="shop.html?sort=popular">Best sellers</a></li>
      <li><a href="shop.html?sale=1">On sale <span class="badge badge--sale">−15%%</span></a></li>
      <li><a href="shop.html?sort=rating">Top rated</a></li>
      <li><a href="shop.html">Shop all products</a></li>
    </ul></div>
    <div><p class="mega__title">Explore</p><ul class="mega__links">
      <li><a href="product.html?id=aether-x1">Aether X1 Headphones</a></li>
      <li><a href="product.html?id=chronos-s">Chronos S Smartwatch</a></li>
      <li><a href="product.html?id=flux-75">Flux 75 Keyboard</a></li>
      <li><a href="categories.html">All categories</a></li>
      <li><a href="faq.html">Shipping &amp; returns</a></li>
    </ul></div>
    <a class="mega__feature" href="product.html?id=vision-lens"><img src="assets/images/products/vision-lens.webp" alt="" width="800" height="800" loading="lazy">
      <span class="badge badge--new">Just landed</span><h3>Vision Lens AR</h3><span class="link-arrow">Discover %s</span></a>
  </div></div></div>
</li>''' % (cur(active, 'shop'), ic('chevron-down'), mega_cats, ic('arrow-up-right')))
        elif key == 'pages':
            is_cur = active in [k for k, _, _ in PAGES_MENU]
            items.append('''<li class="nav__item nav__item--dropdown" data-menu>
  <button class="nav__link" type="button" aria-expanded="false" aria-controls="dd-pages" aria-haspopup="true"%s>Pages%s</button>
  <div class="dropdown" id="dd-pages"><ul class="dropdown__panel">%s</ul></div>
</li>''' % (' data-current="true"' if is_cur else '', ic('chevron-down'), pages_dd))
        else:
            items.append('<li class="nav__item"><a class="nav__link" href="%s"%s>%s</a></li>' % (href, cur(active, key), label))
    return '''<div class="announce" role="region" aria-label="Announcements">
  <div class="container announce__inner">
    <div class="announce__track" aria-live="off">
      <p class="announce__msg is-active">%s <span><strong>Free express shipping</strong> on orders over $150</span></p>
      <p class="announce__msg" aria-hidden="true" inert><span>Winter Drop 07 is live — <a href="shop.html?sort=newest">explore new arrivals</a></span></p>
      <p class="announce__msg" aria-hidden="true" inert><span>Use code <strong>NEXORA10</strong> for 10%% off your first order</span></p>
    </div>
    <button class="announce__close" type="button" aria-label="Dismiss announcements">%s</button>
  </div>
</div>
<header class="header" id="top">
  <div class="container header__inner">
    <button class="icon-btn header__menu-btn" type="button" data-open="mobile-nav" aria-controls="mobile-nav" aria-expanded="false" aria-label="Open menu">%s</button>
    <a class="logo" href="index.html" aria-label="NEXORA home">%s<span>NEXORA<span class="logo__dot">.</span></span></a>
    <nav class="nav" aria-label="Primary"><ul class="nav__list">%s</ul></nav>
    <div class="header__actions">
      <button class="icon-btn" type="button" data-action="open-search" aria-label="Search products (press /)">%s</button>
      <a class="icon-btn hide-mobile" href="wishlist.html" aria-label="Wishlist" data-wish-label>%s<span class="count-badge" data-count="wishlist" aria-hidden="true">0</span></a>
      <a class="icon-btn hide-tablet" href="contact.html" aria-label="Account and support">%s</a>
      <button class="icon-btn" type="button" data-action="open-cart" data-cart-label aria-label="Open cart" aria-controls="cart-drawer">%s<span class="count-badge" data-count="cart" aria-hidden="true">0</span></button>
    </div>
  </div>
</header>''' % (ic('truck'), ic('x'), ic('menu'), logo('h'), ''.join(items), ic('search'), ic('heart'), ic('user'), ic('shopping-bag'))

def mobile_nav(active):
    sub_shop = ''.join('<li><a href="%s">%s</a></li>' % (h, t) for h, t in [('shop.html', 'All products'), ('shop.html?cat=audio', 'Audio'), ('shop.html?cat=wearables', 'Wearables'), ('shop.html?cat=gaming', 'Gaming'), ('shop.html?cat=bundles', 'Bundles'), ('shop.html?sale=1', 'On sale')])
    sub_pages = ''.join('<li><a href="%s"%s>%s</a></li>' % (h, cur(active, k), t) for k, h, t in PAGES_MENU)
    return '''<div class="mobile-nav" id="mobile-nav" aria-hidden="true" inert>
  <div class="mobile-nav__backdrop"></div>
  <div class="mobile-nav__panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="mobile-nav__head"><a class="logo" href="index.html">%s<span>NEXORA<span class="logo__dot">.</span></span></a>
      <button class="icon-btn icon-btn--bordered" type="button" data-action="close-layer" aria-label="Close menu">%s</button></div>
    <div class="mobile-nav__body"><ul class="mobile-nav__list">
      <li><a class="mobile-nav__link" href="index.html"%s>Home</a></li>
      <li><button class="mobile-nav__toggle" type="button" aria-expanded="false" aria-controls="m-shop">Shop%s</button><div class="mobile-nav__sub" id="m-shop"><ul>%s</ul></div></li>
      <li><a class="mobile-nav__link" href="categories.html"%s>Categories</a></li>
      <li><button class="mobile-nav__toggle" type="button" aria-expanded="false" aria-controls="m-pages">Pages%s</button><div class="mobile-nav__sub" id="m-pages"><ul>%s</ul></div></li>
      <li><a class="mobile-nav__link" href="blog.html"%s>Blog</a></li>
      <li><a class="mobile-nav__link" href="contact.html"%s>Contact</a></li>
    </ul></div>
    <div class="mobile-nav__foot">
      <a class="btn btn--ghost btn--block" href="wishlist.html">%s Wishlist</a>
      <button class="btn btn--primary btn--block" type="button" data-action="open-search">%s Search products</button>
    </div>
  </div>
</div>''' % (logo('m'), ic('x'), cur(active, 'home'), ic('plus'), sub_shop, cur(active, 'categories'), ic('plus'), sub_pages, cur(active, 'blog'), cur(active, 'contact'), ic('heart'), ic('search'))

def overlays():
    terms = ''.join('<button class="chip" type="button" data-term="%s">%s</button>' % (t, t) for t in ['Headphones', 'Wireless', 'Smartwatch', 'Gaming', 'AR glasses', 'Bundle'])
    return '''<div class="search" id="search" aria-hidden="true" inert>
  <div class="search__backdrop"></div>
  <div class="search__panel" role="dialog" aria-modal="true" aria-label="Search products">
    <form class="search__bar" id="search-form" role="search">%s
      <label for="search-input" class="sr-only">Search products</label>
      <input class="search__input" id="search-input" type="search" placeholder="Search devices, categories…" autocomplete="off" aria-controls="search-results">
      <button class="icon-btn icon-btn--bordered" type="button" data-action="close-layer" aria-label="Close search">%s</button>
    </form>
    <div class="search__body">
      <div id="search-popular"><p class="search__label">Popular searches</p><div class="chip-row" style="margin-bottom:1.5rem">%s</div></div>
      <p class="search__label" id="search-label" aria-live="polite">Trending now</p>
      <div class="search__results" id="search-results"></div>
    </div>
    <div class="search__footer"><span><span class="kbd">Enter</span> see all results</span><span><span class="kbd">Esc</span> close</span></div>
  </div>
</div>
<div class="drawer" id="cart-drawer" aria-hidden="true" inert>
  <div class="drawer__backdrop"></div>
  <aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
    <div class="drawer__head"><h2 id="cart-drawer-title">Your cart <small data-drawer-count>(0)</small></h2>
      <button class="icon-btn icon-btn--bordered" type="button" data-action="close-layer" aria-label="Close cart">%s</button></div>
    <div class="drawer__body" aria-live="polite"></div>
    <div class="drawer__foot" hidden>
      <div class="summary-row"><span>Subtotal</span><strong data-drawer-subtotal>$0.00</strong></div>
      <div class="summary-row summary-row--discount" data-drawer-discount-row hidden><span>Coupon</span><strong data-drawer-discount></strong></div>
      <p class="field__hint">Shipping, taxes and coupons are calculated at checkout.</p>
      <div class="drawer__btns"><a class="btn btn--ghost" href="cart.html">View cart</a><a class="btn btn--primary" href="checkout.html">Checkout %s</a></div>
    </div>
  </aside>
</div>
<div class="modal" id="quick-view" aria-hidden="true" inert>
  <div class="modal__backdrop"></div>
  <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="qv-title">
    <button class="icon-btn icon-btn--solid modal__close" type="button" data-action="close-layer" aria-label="Close quick view">%s</button>
    <div data-qv-content></div>
  </div>
</div>
<div class="toasts" id="toasts" aria-live="polite"></div>
<button class="icon-btn icon-btn--solid back-to-top" type="button" aria-label="Back to top">%s</button>
<div class="page-curtain" aria-hidden="true"></div>''' % (ic('search'), ic('x'), terms, ic('x'), ic('arrow-right', 'icon--move'), ic('x'), ic('arrow-up'))

def footer():
    col = lambda title, links: '<div><h2 class="footer__title">%s</h2><ul class="footer__links">%s</ul></div>' % (title, ''.join('<li><a href="%s">%s</a></li>' % l for l in links))
    return '''<footer class="footer">
  <div class="container">
    <div class="footer__top">
      <div class="footer__brand">
        <a class="logo" href="index.html">%s<span>NEXORA<span class="logo__dot">.</span></span></a>
        <p>Objects from the near future. Designed in our studio, engineered for everyday life, delivered carbon-neutral worldwide.</p>
        <div class="footer__social">
          <a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="NEXORA on Instagram">%s</a>
          <a href="https://x.com/" target="_blank" rel="noopener" aria-label="NEXORA on X">%s</a>
          <a href="https://www.youtube.com/" target="_blank" rel="noopener" aria-label="NEXORA on YouTube">%s</a>
          <a href="https://www.tiktok.com/" target="_blank" rel="noopener" aria-label="NEXORA on TikTok">%s</a>
        </div>
      </div>
      %s%s%s
      <div><h2 class="footer__title">Contact</h2><ul class="footer__contact">
        <li>%s<span>210 Orbit Avenue, Suite 7<br>San Francisco, CA 94107</span></li>
        <li>%s<a href="tel:+14155550142">+1 (415) 555-0142</a></li>
        <li>%s<a href="mailto:hello@nexora.example">hello@nexora.example</a></li>
      </ul></div>
    </div>
    <div class="footer__bottom">
      <p>© <span data-year>2026</span> NEXORA. Template by TemplateFlux. All rights reserved.</p>
      <div class="footer__pay" aria-label="Accepted payment methods"><span>%sCards</span><span>%sWallets</span><span>%sPay later</span><span>%sSSL secured</span></div>
    </div>
  </div>
  <div class="footer__wordmark" aria-hidden="true">NEXORA</div>
</footer>''' % (logo('f'), ic('social-instagram'), ic('social-x'), ic('social-youtube'), ic('social-tiktok'),
                col('Shop', [('shop.html', 'All products'), ('shop.html?cat=audio', 'Audio'), ('shop.html?cat=wearables', 'Wearables'), ('shop.html?cat=gaming', 'Gaming'), ('shop.html?cat=bundles', 'Bundles')]),
                col('Company', [('about.html', 'About us'), ('blog.html', 'Journal'), ('categories.html', 'Categories'), ('contact.html', 'Contact'), ('404.html', '404 page')]),
                col('Support', [('faq.html', 'FAQ'), ('faq.html#shipping', 'Shipping'), ('faq.html#returns', 'Returns'), ('wishlist.html', 'Wishlist'), ('cart.html', 'Cart')]),
                ic('map-pin'), ic('phone'), ic('mail'), ic('credit-card'), ic('wallet'), ic('calendar'), ic('lock'))

SPRITE = None

def page(meta, body):
    global SPRITE
    SPRITE = SPRITE or sprite()
    active = meta.get('nav', meta['page'])
    extra_body = (' data-post="%s"' % meta['post']) if meta.get('post') else ''
    return '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%(title)s</title>
  <meta name="description" content="%(description)s">
  <meta name="theme-color" content="#090B12">
  <meta name="color-scheme" content="dark">
  <meta property="og:title" content="%(title)s">
  <meta property="og:description" content="%(description)s">
  <meta property="og:type" content="website">
  <link rel="icon" href="assets/images/brand/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="assets/fonts/%(dfont)s.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/css/style.css?v=%(v)s">
  <script>document.documentElement.classList.add('js');</script>
</head>
<body data-page="%(page)s"%(extra)s>
<!-- ================= SVG ICON SPRITE (usage example: <svg class="icon"><use href="#i-search"/></svg>) ================= -->
%(sprite)s
<a class="skip-link" href="#main">Skip to content</a>
<div class="page-bg" aria-hidden="true"></div>
<!-- ================= ANNOUNCEMENT BAR + HEADER (shared on every page) ================= -->
%(header)s
<!-- ================= MOBILE NAVIGATION (shared) ================= -->
%(mobile)s
<!-- ================= PAGE CONTENT ================= -->
<main id="main" tabindex="-1">
%(body)s
</main>
<!-- ================= FOOTER (shared) ================= -->
%(footer)s
<!-- ================= OVERLAYS: search, cart drawer, quick view, toasts (shared) ================= -->
%(overlays)s
<!-- ================= SCRIPTS (order matters: data → core → components → pages → main) ================= -->
<script src="assets/js/data.js?v=%(v)s" defer></script>
<script src="assets/js/core.js?v=%(v)s" defer></script>
<script src="assets/js/components.js?v=%(v)s" defer></script>
<script src="assets/js/pages.js?v=%(v)s" defer></script>
<script src="assets/js/main.js?v=%(v)s" defer></script>
</body>
</html>
''' % dict(title=meta['title'], description=meta['description'], page=meta['page'], extra=extra_body, dfont=('syne-latin-800-normal' if meta['page'] == 'home' else 'syne-latin-700-normal'), sprite=SPRITE,
           header=header(active), mobile=mobile_nav(active), body=body.strip(), footer=footer(), overlays=overlays(), v=VERSION)

def expand(body):
    """Allow {{icon:name}} and {{icon:name|cls}} shortcuts inside page sources."""
    def rep(m):
        parts = m.group(1).split('|')
        return ic(parts[0], parts[1] if len(parts) > 1 else '')
    return re.sub(r'\{\{icon:([a-z0-9_\-|]+)\}\}', rep, body)

def main():
    os.makedirs(os.path.join(OUT, 'assets/images/brand'), exist_ok=True)
    open(os.path.join(OUT, 'assets/images/brand/favicon.svg'), 'w').write(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#A855F7"/><stop offset="1" stop-color="#00E5FF"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="#090B12"/><path d="M9 23V9h3.6l6.8 8.6V9H23v14h-3.6l-6.8-8.6V23z" fill="url(#g)"/></svg>')
    open(os.path.join(OUT, 'assets/images/brand/logo.svg'), 'w').write(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#A855F7"/><stop offset="1" stop-color="#00E5FF"/></linearGradient></defs><rect x="1" y="5" width="30" height="30" rx="9" fill="none" stroke="url(#g)" stroke-width="1.5" opacity=".55"/><path d="M9 27V13h3.6l6.8 8.6V13H23v14h-3.6l-6.8-8.6V27z" fill="url(#g)"/><text x="42" y="28" font-family="Syne, sans-serif" font-weight="800" font-size="20" letter-spacing="1.2" fill="#F4F4F7">NEXORA</text></svg>')
    n = 0
    for path in sorted(glob.glob(os.path.join(SRC, '*.html'))):
        raw = open(path).read()
        m = re.match(r'<!--meta\s*(\{.*?\})\s*-->', raw, re.S)
        meta = json.loads(m.group(1))
        body = expand(raw[m.end():])
        name = os.path.basename(path)
        open(os.path.join(OUT, name), 'w').write(page(meta, body))
        n += 1
    print('built', n, 'pages')

if __name__ == '__main__':
    main()
