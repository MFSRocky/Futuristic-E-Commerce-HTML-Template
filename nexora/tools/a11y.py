import asyncio, json, sys
from playwright.async_api import async_playwright
PAGES = ['index.html','shop.html','product.html?id=aether-x1','categories.html','wishlist.html','cart.html','checkout.html','about.html','contact.html','faq.html','blog.html','blog-details.html','404.html']
AXE = open('/tmp/pkgs/node_modules/axe-core/axe.min.js').read()
SEED = """localStorage.setItem('nexora.cart.v1', JSON.stringify([{key:'aether-x1::',id:'aether-x1',qty:1,variant:null}]));localStorage.setItem('nexora.wishlist.v1', JSON.stringify(['vision-lens','chronos-s']));"""
async def main():
    w = int(sys.argv[1]) if len(sys.argv) > 1 else 1440
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': w, 'height': 900}, reduced_motion='reduce'); await ctx.add_init_script(SEED)
        agg = {}
        for u in PAGES:
            pg = await ctx.new_page(); await pg.goto('http://localhost:8080/' + u, wait_until='networkidle'); await pg.wait_for_timeout(700)
            await pg.evaluate('document.querySelectorAll("[data-reveal]").forEach(e=>e.classList.add("is-revealed"))')
            await pg.add_script_tag(content=AXE)
            r = await pg.evaluate('axe.run(document, {runOnly: {type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa","best-practice"]}}).then(r => r.violations.map(v => ({id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, t: v.nodes.slice(0,3).map(n => n.target.join(" ") + " :: " + (n.any[0]?.message || n.all[0]?.message || "").slice(0,120))})))')
            for v in r:
                print(u, v['impact'], v['id'], v['n'], '|', v['help']); [print('     ', t) for t in v['t']]
            await pg.close()
        await b.close()
asyncio.run(main())
