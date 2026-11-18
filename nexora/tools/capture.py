"""Capture authentic screenshots of the finished demo for marketplace previews (author tool)."""
import asyncio, os, sys
from playwright.async_api import async_playwright
OUT = os.path.join(os.path.dirname(__file__), '..', 'preview-assets', 'screenshots')
BASE = 'http://localhost:8080/'
PAGES = {'home': 'index.html', 'shop': 'shop.html', 'product': 'product.html?id=aether-x1', 'categories': 'categories.html',
         'wishlist': 'wishlist.html', 'cart': 'cart.html', 'checkout': 'checkout.html', 'about': 'about.html', 'contact': 'contact.html',
         'faq': 'faq.html', 'blog': 'blog.html', 'blog-details': 'blog-details.html', '404': '404.html'}
DEVICES = {'desktop': (1440, 900, 1), 'tablet': (768, 1024, 1), 'mobile': (390, 844, 2)}
SEED = """if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1');
localStorage.setItem('nexora.cart.v1', JSON.stringify([{key:'aether-x1::{"color":"Graphite"}',id:'aether-x1',qty:1,variant:{color:'Graphite'}},{key:'chronos-s::{"color":"Onyx","size":"45 mm"}',id:'chronos-s',qty:1,variant:{color:'Onyx',size:'45 mm'}},{key:'flux-75::{"color":"Smoke"}',id:'flux-75',qty:1,variant:{color:'Smoke'}}]));
localStorage.setItem('nexora.wishlist.v1', JSON.stringify(['vision-lens','pulse-buds-pro','vector-pro','halo-ring'])); }"""
async def prep(pg):
    await pg.wait_for_timeout(700)
    H = await pg.evaluate('document.documentElement.scrollHeight')
    for y in range(0, H, 450):
        await pg.evaluate(f'scrollTo(0,{y})'); await pg.wait_for_timeout(70)
    await pg.evaluate('scrollTo(0,0)')
    await pg.evaluate('document.querySelectorAll("[data-reveal]").forEach(e=>e.classList.add("is-revealed"))')
    await pg.add_style_tag(content='.announce__msg{transition:none!important}')  # no mid-transition announcement frames
    await pg.evaluate('document.activeElement && document.activeElement.blur()')  # no stray focus / skip link
    await pg.wait_for_timeout(1400)
async def home_sections(b):
    # authentic per-section captures of the homepage at 1440 (used for readable homepage previews)
    ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1); await ctx.add_init_script(SEED)
    pg = await ctx.new_page(); await pg.goto(BASE + 'index.html', wait_until='networkidle'); await prep(pg)
    els = pg.locator('main > section, main > .marquee, footer.footer')
    await pg.add_style_tag(content='.header{visibility:hidden!important}.skip-link{display:none!important}.back-to-top{display:none!important}')  # sticky header would overlap mid-page section crops
    for i in range(await els.count()):
        el = els.nth(i); await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(450)
        await el.screenshot(path=f'{OUT}/home-section-{i:02d}.jpg', quality=92)
    await ctx.close()

async def main():
    os.makedirs(OUT, exist_ok=True)
    if '--sections-only' in sys.argv:
        async with async_playwright() as p:
            b = await p.chromium.launch(); await home_sections(b); await b.close()
        print('sections captured'); return
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for dev, (w, h, dpr) in DEVICES.items():
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, has_touch=dev == 'mobile', is_mobile=dev == 'mobile')
            await ctx.add_init_script(SEED)
            for name, url in PAGES.items():
                pg = await ctx.new_page(); await pg.goto(BASE + url, wait_until='networkidle'); await prep(pg)
                await pg.screenshot(path=f'{OUT}/{dev}-{name}-full.jpg', full_page=True, quality=92)
                await pg.screenshot(path=f'{OUT}/{dev}-{name}.jpg', quality=92)
                await pg.close()
            await ctx.close()
        # interaction states (desktop @2x for crisp compositions)
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=2); await ctx.add_init_script(SEED)
        pg = await ctx.new_page(); await pg.goto(BASE + 'index.html', wait_until='networkidle'); await prep(pg)
        await pg.screenshot(path=f'{OUT}/state-hero@2x.jpg', quality=92)
        await pg.hover('.nav__item[data-menu] > .nav__link'); await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{OUT}/state-megamenu@2x.jpg', quality=92)
        await pg.mouse.move(700, 600); await pg.wait_for_timeout(500)
        await pg.locator('[data-action="open-cart"]').first.click(); await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{OUT}/state-cart-drawer@2x.jpg', quality=92)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(600)
        await pg.locator('[data-action="open-search"]').first.click(); await pg.wait_for_timeout(500)
        await pg.keyboard.type('pro'); await pg.wait_for_timeout(800)
        await pg.screenshot(path=f'{OUT}/state-search@2x.jpg', quality=92)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        q = pg.locator('[data-products] [data-action="quick"]').first
        await q.scroll_into_view_if_needed(); await pg.wait_for_timeout(300); await q.click(force=True); await pg.wait_for_timeout(1000)
        await pg.screenshot(path=f'{OUT}/state-quick-view@2x.jpg', quality=92)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # sections of home at 1440
        for i, sel in enumerate(['.bento, .categories, #categories', '#trending, [data-tabs]', '.campaigns, .campaign', '.spotlight', '.testimonials', '.newsletter']):
            el = pg.locator(sel).first
            if await el.count():
                await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(500)
                await el.screenshot(path=f'{OUT}/section-{i+1}@2x.jpg', quality=92)
        await pg.goto(BASE + 'checkout.html', wait_until='networkidle'); await prep(pg)
        await pg.locator('#checkout-form button[type=submit]').click(); await pg.wait_for_timeout(500)
        await pg.evaluate('scrollTo(0,0)'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f'{OUT}/state-checkout-validation@2x.jpg', quality=92)
        await ctx.close()
        # mobile states
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True); await ctx.add_init_script(SEED)
        pg = await ctx.new_page(); await pg.goto(BASE + 'index.html', wait_until='networkidle'); await prep(pg)
        await pg.locator('.header__menu-btn').click(); await pg.wait_for_timeout(800)
        await pg.screenshot(path=f'{OUT}/state-mobile-nav@2x.jpg', quality=92)
        await pg.goto(BASE + 'shop.html', wait_until='networkidle'); await prep(pg)
        await pg.locator('[data-open-filters]').click(); await pg.wait_for_timeout(800)
        await pg.screenshot(path=f'{OUT}/state-mobile-filters@2x.jpg', quality=92)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        await pg.goto(BASE + 'product.html?id=chronos-s', wait_until='networkidle'); await prep(pg)
        await pg.screenshot(path=f'{OUT}/state-mobile-product@2x.jpg', quality=92)
        await ctx.close(); await home_sections(b); await b.close()
    print('captured', len(os.listdir(OUT)))
asyncio.run(main())
