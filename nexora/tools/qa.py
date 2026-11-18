import asyncio, json, sys, os
from playwright.async_api import async_playwright
PAGES = ['index.html','shop.html','product.html?id=aether-x1','categories.html','wishlist.html','cart.html','checkout.html','about.html','contact.html','faq.html','blog.html','blog-details.html','404.html']
VPS = {'xs':(320,640),'sm':(375,812),'lg-m':(430,932),'tab':(768,1024),'lap':(1280,800),'desk':(1440,900),'wide':(1920,1080)}
SEED = """localStorage.setItem('nexora.cart.v1', JSON.stringify([{key:'aether-x1::{"color":"Graphite"}',id:'aether-x1',qty:1,variant:{color:'Graphite'}},{key:'halo-ring::{"color":"Titanium","size":"8"}',id:'halo-ring',qty:2,variant:{color:'Titanium',size:'8'}},{key:'command-deck::',id:'command-deck',qty:1,variant:null}]));
localStorage.setItem('nexora.wishlist.v1', JSON.stringify(['vision-lens','chronos-s','flux-75','pulse-buds-pro']));"""
async def main():
    only = sys.argv[1].split(',') if len(sys.argv) > 1 and sys.argv[1] != 'all' else list(VPS)
    shots = len(sys.argv) > 2
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for vk in only:
            w, h = VPS[vk]
            ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=w < 1024)
            await ctx.add_init_script(SEED)
            for pg_name in PAGES:
                pg = await ctx.new_page(); errs = []
                pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
                pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
                pg.on('requestfailed', lambda r: errs.append('REQFAIL ' + r.url))
                await pg.goto(os.environ.get('NX_BASE', 'http://localhost:8080/') + pg_name, wait_until='networkidle')
                await pg.wait_for_timeout(500)
                await pg.evaluate('document.querySelectorAll("[data-reveal]").forEach(e=>e.classList.add("is-revealed")); document.querySelector(".hero")?.classList.add("is-ready")')
                await pg.evaluate('document.querySelectorAll("img[loading=lazy]").forEach(i=>i.loading="eager")')
                H = await pg.evaluate('document.documentElement.scrollHeight')
                for y in range(0, H, 500):
                    await pg.evaluate(f'scrollTo(0,{y})'); await pg.wait_for_timeout(60)
                await pg.evaluate('scrollTo(0,0)')
                await pg.wait_for_timeout(900)
                ov = await pg.evaluate('''() => { const W = document.documentElement.clientWidth; const bad = [];
                  document.querySelectorAll('main *, header *, footer *').forEach(el => { const r = el.getBoundingClientRect(); if (getComputedStyle(el).visibility === 'hidden') return; if (r.width && (r.right > W + 1 || r.left < -1)) { let p = el, clipped = false; while ((p = p.parentElement) && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o !== 'visible') { const pr = p.getBoundingClientRect(); if (pr.right <= W + 1 && pr.left >= -1) { clipped = true; break; } } } if (!clipped) bad.push(el.tagName + '.' + String(el.className.baseVal ?? el.className).slice(0,40) + ' ' + Math.round(r.left) + '-' + Math.round(r.right)); } });
                  return { sw: document.documentElement.scrollWidth, W, bad: bad.slice(0, 6) }; }''')
                status = 'OK' if not errs and ov['sw'] <= ov['W'] and not ov['bad'] else 'ISSUE'
                if status != 'OK': print(vk, pg_name, status, json.dumps({'errs': errs[:4], 'ov': ov}))
                if shots:
                    name = pg_name.split('.')[0]
                    await pg.screenshot(path=f'/tmp/qa/{vk}-{name}.png', full_page=True)
                await pg.close()
            await ctx.close()
        print('QA done')
        await b.close()
asyncio.run(main())
