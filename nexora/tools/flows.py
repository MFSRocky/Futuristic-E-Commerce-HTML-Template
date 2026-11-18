"""Functional flow tests for the NEXORA demo (author QA tool, not shipped)."""
import asyncio, json
from playwright.async_api import async_playwright
import os
BASE = os.environ.get('NX_BASE', 'http://localhost:8080/')
results = []
def check(name, cond, info=''):
    results.append((name, bool(cond), info)); print(('PASS ' if cond else 'FAIL ') + name + (' — ' + str(info) if info else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        errors = []
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        ls = lambda k: pg.evaluate(f'JSON.parse(localStorage.getItem("{k}")||"null")')

        # --- Home: add to cart from a product card
        await pg.goto(BASE + 'index.html', wait_until='networkidle')
        await pg.evaluate('localStorage.clear()'); await pg.reload(wait_until='networkidle')
        btn = pg.locator('[data-products] [data-action="add"]').first
        await btn.scroll_into_view_if_needed(); await btn.click(); await pg.wait_for_timeout(900)
        cart = await ls('nexora.cart.v1')
        check('home: add to cart persists', cart and len(cart) == 1, cart)
        check('home: cart badge = 1', (await pg.locator('[data-count="cart"]').first.inner_text()).strip() == '1')
        check('home: toast shown', await pg.locator('.toast').count() > 0)
        # drawer
        await pg.evaluate('scrollTo(0,0)')
        await pg.locator('[data-action="open-cart"]').first.click(); await pg.wait_for_timeout(500)
        check('drawer opens', await pg.locator('.drawer.is-open').count() == 1)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        check('drawer closes on Esc', await pg.locator('.drawer.is-open').count() == 0)
        # wishlist toggle
        w = pg.locator('[data-products] [data-action="wish"]').first
        await w.scroll_into_view_if_needed(); await w.click(); await pg.wait_for_timeout(300)
        check('wishlist toggle persists', len(await ls('nexora.wishlist.v1') or []) == 1)
        # quick view
        q = pg.locator('[data-products] [data-action="quick"]').first
        await q.scroll_into_view_if_needed(); await q.click(); await pg.wait_for_timeout(600)
        check('quick view modal opens', await pg.locator('.modal.is-open').count() >= 1)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        check('quick view closes', await pg.locator('.modal.is-open').count() == 0)
        # search overlay
        await pg.evaluate('scrollTo(0,0)')
        await pg.locator('[data-action="open-search"]').first.click(); await pg.wait_for_timeout(400)
        await pg.keyboard.type('flux'); await pg.wait_for_timeout(500)
        check('search finds Flux 75', 'Flux' in await pg.locator('.search').inner_text())
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # newsletter
        nl = pg.locator('form[data-newsletter]').first
        await nl.scroll_into_view_if_needed()
        await nl.locator('input').fill('bad-email'); await nl.locator('button[type=submit]').click(); await pg.wait_for_timeout(300)
        msg = pg.locator('form[data-newsletter] ~ .form-message').first
        check('newsletter rejects invalid', 'is-error' in (await msg.get_attribute('class') or ''))
        await nl.locator('input').fill('alex@example.com'); await nl.locator('button[type=submit]').click(); await pg.wait_for_timeout(1500)
        check('newsletter accepts valid', 'is-success' in (await msg.get_attribute('class') or ''))

        # --- Shop: filters, sort, search, load more
        await pg.goto(BASE + 'shop.html', wait_until='networkidle'); await pg.wait_for_timeout(600)
        cards = lambda: pg.locator('#shop-grid .p-card').count()
        n0 = await cards()
        await pg.locator('input[name=cat][value=gaming]').check(force=True); await pg.wait_for_timeout(600)
        check('shop: gaming filter = 3', await cards() == 3, await cards())
        await pg.locator('input[name=cat][value=gaming]').uncheck(force=True); await pg.wait_for_timeout(500)
        await pg.select_option('#sort', 'price-asc'); await pg.wait_for_timeout(600)
        prices = await pg.evaluate('[...document.querySelectorAll("#shop-grid .p-card .price__now")].map(e=>parseFloat(e.textContent.replace(/[^0-9.]/g,"")))')
        check('shop: price asc sorted', prices == sorted(prices) and len(prices) > 0, prices)
        await pg.evaluate('const r=document.querySelector("#price-max"); r.value=200; r.dispatchEvent(new Event("input",{bubbles:true})); r.dispatchEvent(new Event("change",{bubbles:true}))'); await pg.wait_for_timeout(700)
        prices = await pg.evaluate('[...document.querySelectorAll("#shop-grid .p-card .price__now")].map(e=>parseFloat(e.textContent.replace(/[^0-9.]/g,"")))')
        check('shop: price max 200', prices and max(prices) <= 200, prices)
        await pg.goto(BASE + 'shop.html?q=ring', wait_until='networkidle'); await pg.wait_for_timeout(600)
        first = await pg.locator('#shop-grid .p-card').first.inner_text()
        check('shop: ?q=ring search ranks Halo first', 'Halo' in first and await cards() <= 4, await cards())
        await pg.goto(BASE + 'shop.html?cat=wearables', wait_until='networkidle'); await pg.wait_for_timeout(600)
        check('shop: ?cat=wearables', await cards() == 3, await cards())
        await pg.goto(BASE + 'shop.html', wait_until='networkidle'); await pg.wait_for_timeout(600)
        lm = pg.locator('#load-more, [data-load-more]').first
        if await lm.count():
            await lm.scroll_into_view_if_needed(); await lm.click(); await pg.wait_for_timeout(1200)
            check('shop: load more shows all 13', await cards() == 13, await cards())
        # list view
        await pg.locator('[data-view="list"]').first.click(); await pg.wait_for_timeout(300)
        check('shop: list view', await pg.locator('.product-grid.is-list').count() == 1)
        await pg.locator('[data-view="grid"]').first.click()

        # --- Product page: variants + qty + add
        await pg.goto(BASE + 'product.html?id=halo-ring', wait_until='networkidle'); await pg.wait_for_timeout(600)
        check('pdp: title loads', 'Halo' in await pg.locator('h1').inner_text())
        sw = pg.locator('[data-option] [aria-checked="false"], [data-option] [aria-pressed="false"]')
        if await sw.count(): await sw.first.click()
        plus = pg.locator('.pdp [data-step="1"]')
        await plus.click(); await pg.wait_for_timeout(100)
        await pg.locator('#pdp-add').click(); await pg.wait_for_timeout(1200)
        cart = await ls('nexora.cart.v1')
        ring = [i for i in cart if i['id'] == 'halo-ring']
        check('pdp: add with qty 2 + variant', ring and ring[0]['qty'] == 2 and ring[0].get('variant'), ring)
        # tabs keyboard
        await pg.locator('[role=tab]').first.focus(); await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(200)
        check('pdp: tabs arrow-key nav', await pg.evaluate('document.activeElement.getAttribute("aria-selected")') == 'true')
        await pg.goto(BASE + 'product.html?id=does-not-exist', wait_until='networkidle'); await pg.wait_for_timeout(400)
        check('pdp: unknown id falls back gracefully', await pg.locator('h1').count() == 1)

        # --- Cart: qty, coupons, totals math
        await pg.goto(BASE + 'cart.html', wait_until='networkidle'); await pg.wait_for_timeout(500)
        t = await pg.evaluate('NX.store.totals("standard")')
        sub = sum(i['qty'] * i['price'] for i in await pg.evaluate('NX.store.cartDetailed ? NX.store.cartDetailed() : []')) if False else None
        check('cart: rows render', await pg.locator('.cart-row').count() == 2)
        await pg.fill('#coupon-code', 'WRONG'); await pg.locator('#coupon-form button').click(); await pg.wait_for_timeout(300)
        check('coupon: invalid rejected', 'is-error' in (await pg.locator('#coupon-msg').get_attribute('class') or ''))
        await pg.fill('#coupon-code', 'nexora10'); await pg.locator('#coupon-form button').click(); await pg.wait_for_timeout(500)
        t = await pg.evaluate('NX.store.totals("standard")')
        check('coupon: NEXORA10 = 10% of subtotal', abs(t['discount'] - round(t['subtotal'] * .1, 2)) < 0.011, t)
        exp = round(t['subtotal'] - t['discount'] + t['shipping'] + t['tax'], 2)
        check('totals: total = sub - disc + ship + tax', abs(exp - t['total']) < 0.011, t)
        check('totals: tax = 8% of (sub - disc)', abs(t['tax'] - round((t['subtotal'] - t['discount']) * .08, 2)) < 0.011, t)
        check('totals: free shipping over $150', t['shipping'] == 0 if t['subtotal'] - t['discount'] >= 150 else t['shipping'] == 12, t)
        shown = await pg.locator('[data-total], .summary__total, .summary-total').first.inner_text() if await pg.locator('[data-total], .summary__total, .summary-total').count() else ''
        check('cart: displayed total matches', f"{t['total']:,.2f}" in (await pg.locator('.cart-layout').inner_text()), t['total'])
        # qty change + remove
        before = t['subtotal']
        await pg.locator('.cart-row [data-qty="1"]').first.click(); await pg.wait_for_timeout(500)
        t2 = await pg.evaluate('NX.store.totals("standard")')
        check('cart: qty increase updates subtotal', t2['subtotal'] > before, (before, t2['subtotal']))
        # FUTURE25 min check
        await pg.evaluate('NX.store.removeCoupon()'); await pg.reload(wait_until='networkidle'); await pg.wait_for_timeout(300)
        await pg.fill('#coupon-code', 'FUTURE25'); await pg.locator('#coupon-form button').click(); await pg.wait_for_timeout(400)
        t3 = await pg.evaluate('NX.store.totals("standard")')
        check('coupon: FUTURE25 $25 off (sub>=200)', t3['discount'] == 25 if t3['subtotal'] >= 200 else t3['discount'] == 0, t3)
        n_rows = await pg.locator('.cart-row').count()
        await pg.locator('.cart-row [data-remove]').first.click(); await pg.wait_for_timeout(700)
        check('cart: remove item', await pg.locator('.cart-row').count() == n_rows - 1)

        # --- Checkout validation + success
        await pg.goto(BASE + 'checkout.html', wait_until='networkidle'); await pg.wait_for_timeout(500)
        await pg.locator('#checkout-form button[type=submit]').click(); await pg.wait_for_timeout(400)
        inv = await pg.locator('#checkout-form .field.is-invalid').count()
        check('checkout: empty submit shows errors', inv >= 10, inv)
        check('checkout: focus moved to first invalid', await pg.evaluate('document.activeElement.id') == 'co-email')
        vals = {'#co-email': 'alex@example.com', '#co-phone': '+1 415 555 0101', '#co-first': 'Alex', '#co-last': 'Rivera', '#co-address': '1 Market St', '#co-city': 'San Francisco', '#co-zip': '94105', '#cc-name': 'Alex Rivera', '#cc-number': '4242424242424242', '#cc-exp': '1229', '#cc-cvc': '123'}
        for k, v in vals.items(): await pg.fill(k, v)
        await pg.select_option('#co-country', index=1)
        await pg.locator('#co-terms').check(force=True)
        await pg.locator('label:has(input[value=express]), [data-shipping=express]').first.click()
        await pg.wait_for_timeout(300)
        check('checkout: card number formatted', ' ' in await pg.input_value('#cc-number'), await pg.input_value('#cc-number'))
        check('checkout: expiry formatted', '/' in await pg.input_value('#cc-exp'), await pg.input_value('#cc-exp'))
        te = await pg.evaluate('NX.store.totals("express")')
        check('checkout: express = $24', te['shipping'] == 24, te)
        await pg.locator('#checkout-form button[type=submit]').click(); await pg.wait_for_timeout(2600)
        check('checkout: success modal', await pg.locator('#order-success.is-open, .success-modal.is-open, .modal.is-open').count() >= 1)
        check('checkout: cart cleared', (await ls('nexora.cart.v1') or []) == [])

        # --- Wishlist page
        await pg.goto(BASE + 'wishlist.html', wait_until='networkidle'); await pg.wait_for_timeout(500)
        n = await pg.locator('.p-card').count()
        check('wishlist page shows saved items', n >= 1, n)
        await pg.evaluate('localStorage.setItem("nexora.wishlist.v1","[]")'); await pg.reload(wait_until='networkidle'); await pg.wait_for_timeout(400)
        check('wishlist empty state', await pg.locator('.empty-state:visible').count() >= 1)

        # --- Contact form
        await pg.goto(BASE + 'contact.html', wait_until='networkidle')
        await pg.locator('#contact-form button[type=submit]').click(); await pg.wait_for_timeout(300)
        check('contact: validation', await pg.locator('#contact-form .field.is-invalid').count() >= 4)
        await pg.fill('#ct-name', 'Alex'); await pg.fill('#ct-email', 'alex@example.com'); await pg.select_option('#ct-topic', index=1)
        await pg.fill('#ct-msg', 'Hello, I have a question about my order.'); await pg.locator('#ct-consent').check(force=True)
        await pg.locator('#contact-form button[type=submit]').click(); await pg.wait_for_timeout(2000)
        check('contact: success', 'is-success' in (await pg.locator('#contact-msg').get_attribute('class') or ''))

        # --- FAQ search & filter
        await pg.goto(BASE + 'faq.html', wait_until='networkidle')
        await pg.fill('#faq-search', 'refund'); await pg.wait_for_timeout(500)
        vis = await pg.locator('.accordion__item:visible').count()
        check('faq: search filters', 1 <= vis <= 3, vis)
        await pg.fill('#faq-search', 'zzzzqq'); await pg.wait_for_timeout(500)
        check('faq: empty state', await pg.locator('#faq-empty:visible').count() == 1)
        await pg.fill('#faq-search', ''); await pg.wait_for_timeout(300)
        await pg.locator('[data-faq-filter=shipping]').click(); await pg.wait_for_timeout(300)
        check('faq: topic filter', await pg.locator('.faq-group:visible').count() == 1)
        await pg.goto(BASE + 'faq.html#returns', wait_until='networkidle'); await pg.wait_for_timeout(300)
        check('faq: #returns anchor exists', await pg.locator('#returns').count() == 1)
        # accordion
        await pg.locator('[data-faq-filter=all]').click()
        t0 = pg.locator('.accordion__trigger').nth(1)
        await t0.click(); await pg.wait_for_timeout(300)
        check('accordion toggles', await t0.get_attribute('aria-expanded') == 'true')

        # --- Blog filter + comments
        await pg.goto(BASE + 'blog.html', wait_until='networkidle')
        await pg.locator('[data-blog-filter=gaming]').click(); await pg.wait_for_timeout(400)
        check('blog: gaming filter = 2', await pg.locator('.post-card:visible').count() == 2)
        await pg.locator('[data-blog-filter=wellness]').click(); await pg.wait_for_timeout(400)
        check('blog: wellness = 1', await pg.locator('.post-card:visible').count() == 1)
        await pg.goto(BASE + 'blog-details.html', wait_until='networkidle')
        c0 = await pg.locator('#comment-list .comment').count()
        await pg.fill('#cm-name', 'Sam'); await pg.fill('#cm-email', 'sam@example.com'); await pg.fill('#cm-text', 'Brilliant article, thank you!')
        await pg.locator('#comment-form button[type=submit]').click(); await pg.wait_for_timeout(1200)
        check('post: comment added', await pg.locator('#comment-list .comment').count() == c0 + 1)
        check('post: count updated', (await pg.inner_text('#comment-count')).strip() == str(c0 + 1))
        await pg.reload(wait_until='networkidle'); await pg.wait_for_timeout(300)
        check('post: comment persisted', await pg.locator('#comment-list .comment').count() == c0 + 1)

        # --- Mobile nav
        m = await ctx.new_page(); await m.set_viewport_size({'width': 390, 'height': 844})
        m.on('pageerror', lambda e: errors.append(str(e)))
        await m.goto(BASE + 'index.html', wait_until='networkidle')
        await m.locator('.header__menu-btn').click(); await m.wait_for_timeout(500)
        check('mobile nav opens', await m.locator('.mobile-nav.is-open').count() == 1)
        check('body scroll locked', await m.evaluate('document.body.classList.contains("is-locked")'))
        await m.keyboard.press('Escape'); await m.wait_for_timeout(500)
        check('mobile nav closes on Esc', await m.locator('.mobile-nav.is-open').count() == 0)
        await m.goto(BASE + 'shop.html', wait_until='networkidle')
        await m.locator('[data-open-filters]').click(); await m.wait_for_timeout(500)
        check('mobile filters drawer opens', await m.locator('.filters.is-open').count() == 1)

        check('no JS errors during flows', not errors, errors[:5])
        await b.close()
    fails = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(fails)}/{len(results)} passed')
asyncio.run(main())
