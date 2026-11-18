"""Screenshot + QA helper. usage: shot.py page.html WIDTHxHEIGHT out.png [full] [scrollY]"""
import sys, asyncio, json
from playwright.async_api import async_playwright
async def main():
    page_name, size, out = sys.argv[1], sys.argv[2], sys.argv[3]
    full = len(sys.argv) > 4 and sys.argv[4] == 'full'
    scroll = int(sys.argv[5]) if len(sys.argv) > 5 else 0
    w, h = map(int, size.split('x'))
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pg = await ctx.new_page()
        errs = []
        pg.on('console', lambda m: errs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: ' + str(e)))
        pg.on('requestfailed', lambda r: errs.append('REQFAIL: ' + r.url))
        await pg.goto('http://localhost:8080/' + page_name, wait_until='networkidle')
        await pg.wait_for_timeout(600)
        if full:
            # trigger reveals
            hgt = await pg.evaluate('document.body.scrollHeight')
            for y in range(0, hgt, 500):
                await pg.evaluate(f'window.scrollTo(0,{y})'); await pg.wait_for_timeout(60)
            await pg.evaluate('document.querySelectorAll("[data-reveal]").forEach(e=>e.classList.add("is-revealed"))')
            await pg.evaluate('window.scrollTo(0,0)'); await pg.wait_for_timeout(1200)
        elif scroll:
            await pg.evaluate(f'window.scrollTo(0,{scroll})'); await pg.wait_for_timeout(1300)
        else:
            await pg.wait_for_timeout(1400)
        ov = await pg.evaluate('''() => { const W = document.documentElement.clientWidth; const bad = [];
          document.querySelectorAll('body *').forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > W + 1) && getComputedStyle(el).position !== 'fixed') { let p = el, clipped = false; while (p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip') { const pr = p.getBoundingClientRect(); if (pr.right <= W + 1) { clipped = true; break; } } } if (!clipped) bad.push(el.tagName + '.' + (el.className.baseVal ?? el.className) + ' ' + Math.round(r.right)); } });
          return { scrollW: document.documentElement.scrollWidth, W, bad: bad.slice(0, 8) }; }''')
        await pg.screenshot(path=out, full_page=full)
        print(json.dumps({'errors': errs, 'overflow': ov}))
        await b.close()
asyncio.run(main())
