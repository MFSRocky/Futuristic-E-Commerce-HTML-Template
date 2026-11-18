/**
 * NEXORA — Page controllers
 * ------------------------------------------------------------------
 * Each page sets <body data-page="..."> and the matching controller
 * below is executed by main.js. Controllers only touch their own page.
 */
(function (window, document) {
  'use strict';

  var NX = window.NX, DATA = window.NX_DATA, $ = NX.$, $$ = NX.$$, icon = NX.icon;
  var pages = NX.pages = {};

  /* ================================================================
     HOME
     ================================================================ */
  pages.home = function () {
    var hero = $('.hero');
    if (hero) requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('is-ready'); }, 80); });

    // Trending tabs filter
    var grid = $('#trending-grid'), tabs = $('[data-trending-tabs]');
    if (grid && tabs) {
      NX.initTabs(tabs, function (tab) {
        var list = NX.selectProducts('trending', 8, tab.dataset.cat);
        grid.innerHTML = NX.skeletonHTML(Math.min(4, list.length));
        setTimeout(function () { NX.renderProductList(grid, list); }, NX.reducedMotion ? 0 : 260);
      });
    }

    // Best sellers ranking
    var rank = $('#bestseller-list');
    if (rank) {
      var list = NX.selectProducts('bestsellers', 5);
      rank.innerHTML = list.map(function (p, i) {
        return '<li class="rank-item" data-reveal style="--rd:' + i * 70 + '"><span class="rank-item__no">0' + (i + 1) + '</span><img src="' + p.image + '" alt="" width="84" height="84" loading="lazy">' +
          '<div><h3 class="rank-item__name"><a href="' + NX.productUrl(p) + '">' + NX.escape(p.name) + '</a></h3><div class="rank-item__meta">' + NX.priceHTML(p) + '<span class="rank-item__sold">' + p.sold.toLocaleString('en-US') + ' sold</span></div></div>' +
          '<button class="icon-btn icon-btn--bordered" type="button" data-action="add" data-id="' + p.id + '" aria-label="Add ' + NX.escape(p.name) + ' to cart">' + icon('plus') + '</button></li>';
      }).join('');
      NX.observeReveal(rank);
    }

    // Testimonials slider
    var slider = $('.t-slider');
    if (slider) {
      var slides = $$('.t-slide', slider), dots = $$('.t-dots [role="tab"]', slider), cur = 0, timer;
      var go = function (i) {
        cur = (i + slides.length) % slides.length;
        slides.forEach(function (s, k) { s.classList.toggle('is-active', k === cur); s.hidden = k !== cur; });
        dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === cur); d.tabIndex = k === cur ? 0 : -1; });
        $('[data-t-index]', slider).textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      };
      var auto = function () { clearInterval(timer); if (!NX.reducedMotion) timer = setInterval(function () { go(cur + 1); }, 7000); };
      dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); auto(); }); });
      $('[data-t="prev"]', slider).addEventListener('click', function () { go(cur - 1); auto(); });
      $('[data-t="next"]', slider).addEventListener('click', function () { go(cur + 1); auto(); });
      slider.addEventListener('mouseenter', function () { clearInterval(timer); });
      slider.addEventListener('mouseleave', auto);
      go(0); auto();
    }
  };

  /* ================================================================
     SHOP / PRODUCT LISTING
     ================================================================ */
  pages.shop = function () {
    var PAGE = 9;
    var grid = $('#shop-grid'), countEl = $('#shop-count');
    var allPrices = DATA.products.map(function (p) { return p.price; });
    var MIN = 0, MAX = Math.ceil(Math.max.apply(null, allPrices) / 100) * 100;
    var state = { q: NX.qs('q') || '', cats: NX.qs('cat') ? NX.qs('cat').split(',') : [], min: MIN, max: MAX, rating: 0, sale: NX.qs('sale') === '1', stock: false, sort: NX.qs('sort') || 'featured', shown: PAGE, view: NX.storage.get('nexora.view', 'grid') };

    var search = $('#shop-search'), sort = $('#sort'), minR = $('#price-min'), maxR = $('#price-max'), fill = $('.range__fill');
    var saleBox = $('#f-sale'), stockBox = $('#f-stock');
    minR.min = maxR.min = MIN; minR.max = maxR.max = MAX; minR.value = MIN; maxR.value = MAX;
    search.value = state.q; sort.value = state.sort; saleBox.checked = state.sale;
    $$('input[name="cat"]').forEach(function (c) { c.checked = state.cats.indexOf(c.value) > -1; });

    // category counts
    DATA.categories.forEach(function (c) { var el = $('[data-cat-count="' + c.id + '"]'); if (el) el.textContent = DATA.products.filter(function (p) { return p.category === c.id; }).length; });

    function filtered() {
      var list = state.q ? NX.searchProducts(state.q) : DATA.products.slice();
      list = list.filter(function (p) {
        return (!state.cats.length || state.cats.indexOf(p.category) > -1) && p.price >= state.min && p.price <= state.max &&
          p.rating >= state.rating && (!state.sale || p.oldPrice) && (!state.stock || p.stock > 5);
      });
      var sorters = {
        featured: null,
        'price-asc': function (a, b) { return a.price - b.price; },
        'price-desc': function (a, b) { return b.price - a.price; },
        rating: function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; },
        newest: function (a, b) { return b.createdAt.localeCompare(a.createdAt); },
        popular: function (a, b) { return b.sold - a.sold; }
      };
      if (sorters[state.sort]) list.sort(sorters[state.sort]);
      return list;
    }

    function chips() {
      var out = [];
      if (state.q) out.push(['q', 'Search: \u201c' + NX.escape(state.q) + '\u201d']);
      state.cats.forEach(function (c) { var cat = NX.getCategory(c); if (cat) out.push(['cat:' + c, cat.name]); });
      if (state.min > MIN || state.max < MAX) out.push(['price', NX.money(state.min) + ' \u2013 ' + NX.money(state.max)]);
      if (state.rating) out.push(['rating', state.rating + '\u2605 & up']);
      if (state.sale) out.push(['sale', 'On sale']);
      if (state.stock) out.push(['stock', 'In stock']);
      $('#active-filters').innerHTML = out.map(function (c) { return '<button class="chip" type="button" data-clear="' + c[0] + '" aria-label="Remove filter ' + c[1].replace(/<[^>]+>/g, '') + '">' + c[1] + icon('x') + '</button>'; }).join('') +
        (out.length > 1 ? '<button class="chip" type="button" data-clear="all">Clear all</button>' : '');
    }

    function render(skeleton) {
      var list = filtered();
      var visible = list.slice(0, state.shown);
      countEl.innerHTML = 'Showing <strong>' + visible.length + '</strong> of <strong>' + list.length + '</strong> products';
      chips();
      grid.classList.toggle('is-list', state.view === 'list');
      $$('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.view === state.view); });
      var draw = function () {
        if (!list.length) {
          grid.innerHTML = '<div class="empty-state"><span class="empty-state__icon">' + icon('search') + '</span><h3>No products found</h3><p>Try adjusting your filters or search term \u2014 or browse the full collection.</p><button class="btn btn--light" type="button" data-clear="all">Reset filters</button></div>';
        } else { NX.renderProductList(grid, visible); }
        var more = $('#load-more-wrap');
        more.hidden = list.length <= PAGE;
        $('#load-more').hidden = visible.length >= list.length;
        $('.load-more__info').textContent = 'Viewed ' + visible.length + ' of ' + list.length;
        $('.load-more__bar span').style.width = (visible.length / Math.max(1, list.length) * 100) + '%';
      };
      if (skeleton && !NX.reducedMotion) { grid.innerHTML = NX.skeletonHTML(Math.min(6, Math.max(3, visible.length))); setTimeout(draw, 300); } else draw();
      // keep URL shareable
      var params = new URLSearchParams();
      if (state.q) params.set('q', state.q);
      if (state.cats.length) params.set('cat', state.cats.join(','));
      if (state.sort !== 'featured') params.set('sort', state.sort);
      if (state.sale) params.set('sale', '1');
      var qs = params.toString();
      try { history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '')); } catch (e) { /* file:// in some browsers */ }
    }

    function updateRange() {
      var a = parseInt(minR.value, 10), b = parseInt(maxR.value, 10);
      if (a > b - 50) { if (document.activeElement === minR) { a = b - 50; minR.value = a; } else { b = a + 50; maxR.value = b; } }
      state.min = a; state.max = b;
      fill.style.left = (a / MAX * 100) + '%'; fill.style.right = (100 - b / MAX * 100) + '%';
      $('#price-min-out').textContent = NX.money(a); $('#price-max-out').textContent = NX.money(b);
    }
    updateRange();

    var reRender = NX.debounce(function () { state.shown = PAGE; render(true); }, 200);
    search.addEventListener('input', function () { state.q = search.value.trim(); reRender(); });
    $('#shop-search-form').addEventListener('submit', function (e) { e.preventDefault(); state.q = search.value.trim(); state.shown = PAGE; render(true); });
    sort.addEventListener('change', function () { state.sort = sort.value; render(true); });
    $$('input[name="cat"]').forEach(function (c) { c.addEventListener('change', function () { state.cats = $$('input[name="cat"]:checked').map(function (x) { return x.value; }); state.shown = PAGE; render(true); }); });
    $$('input[name="rating"]').forEach(function (r) { r.addEventListener('change', function () { state.rating = parseFloat(r.value); state.shown = PAGE; render(true); }); });
    saleBox.addEventListener('change', function () { state.sale = saleBox.checked; state.shown = PAGE; render(true); });
    stockBox.addEventListener('change', function () { state.stock = stockBox.checked; state.shown = PAGE; render(true); });
    [minR, maxR].forEach(function (r) { r.addEventListener('input', function () { updateRange(); reRender(); }); });
    $$('[data-view]').forEach(function (b) { b.addEventListener('click', function () { state.view = b.dataset.view; NX.storage.set('nexora.view', state.view); render(); }); });
    $('#load-more').addEventListener('click', function (e) {
      var btn = e.currentTarget; btn.classList.add('is-loading');
      setTimeout(function () { btn.classList.remove('is-loading'); state.shown += PAGE; render(); }, NX.reducedMotion ? 0 : 500);
    });

    function clear(key) {
      if (key === 'all' || key === 'q') { state.q = ''; search.value = ''; }
      if (key === 'all' || key.indexOf('cat') === 0) {
        state.cats = key === 'all' ? [] : state.cats.filter(function (c) { return 'cat:' + c !== key; });
        $$('input[name="cat"]').forEach(function (c) { c.checked = state.cats.indexOf(c.value) > -1; });
      }
      if (key === 'all' || key === 'price') { minR.value = MIN; maxR.value = MAX; updateRange(); }
      if (key === 'all' || key === 'rating') { state.rating = 0; var r0 = $('input[name="rating"][value="0"]'); if (r0) r0.checked = true; }
      if (key === 'all' || key === 'sale') { state.sale = false; saleBox.checked = false; }
      if (key === 'all' || key === 'stock') { state.stock = false; stockBox.checked = false; }
      state.shown = PAGE; render(true);
    }
    NX.on(document, 'click', '[data-clear]', function (e, b) { clear(b.dataset.clear); });
    $('#reset-filters').addEventListener('click', function () { clear('all'); });

    // mobile filter drawer
    var panel = $('#filters'), backdrop = $('.filters-backdrop'), release = null, opener = null;
    function openFilters() { opener = document.activeElement; panel.classList.add('is-open'); backdrop.classList.add('is-open'); document.body.classList.add('is-locked'); release = NX.trapFocus(panel); var f = NX.firstFocusable(panel); if (f) f.focus(); }
    function closeFilters() { panel.classList.remove('is-open'); backdrop.classList.remove('is-open'); document.body.classList.remove('is-locked'); if (release) release(); if (opener) opener.focus(); }
    $$('[data-open-filters]').forEach(function (b) { b.addEventListener('click', openFilters); });
    $$('[data-close-filters]').forEach(function (b) { b.addEventListener('click', closeFilters); });
    backdrop.addEventListener('click', closeFilters);
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('is-open')) closeFilters(); });

    render(true);
  };

  /* ================================================================
     PRODUCT DETAILS
     ================================================================ */
  pages.product = function () {
    var p = NX.getProduct(NX.qs('id')) || DATA.products[0];
    var cat = NX.getCategory(p.category);
    document.title = p.name + ' \u2014 NEXORA';
    var crumbCat = $('[data-pdp-cat]'); crumbCat.textContent = cat.name; crumbCat.href = 'shop.html?cat=' + cat.id;
    $('[data-pdp-crumb]').textContent = p.name;

    var gallery = p.gallery && p.gallery.length ? p.gallery : [p.image];
    var lowStock = p.stock <= 8;
    var root = $('#pdp-root');
    root.innerHTML =
      '<div class="gallery" data-reveal="fade">' +
        '<div class="gallery__thumbs" role="tablist" aria-label="Product images">' + gallery.map(function (src, i) {
          return '<button class="gallery__thumb" type="button" role="tab" aria-selected="' + (i === 0) + '" aria-label="Show image ' + (i + 1) + ' of ' + gallery.length + '" data-index="' + i + '" tabindex="' + (i === 0 ? 0 : -1) + '"><img src="' + src + '" alt="" width="120" height="120" loading="lazy"></button>';
        }).join('') + '</div>' +
        '<div class="gallery__main" data-zoom><div class="gallery__badges">' + NX.badgesHTML(p) + '</div>' +
          '<img src="' + gallery[0] + '" alt="' + NX.escape(p.name) + '" width="800" height="800" data-main-img>' +
          '<span class="gallery__counter" data-counter>01 / 0' + gallery.length + '</span>' +
          '<div class="gallery__nav"><button class="icon-btn icon-btn--solid" type="button" data-gal="-1" aria-label="Previous image">' + icon('chevron-left') + '</button><button class="icon-btn icon-btn--solid" type="button" data-gal="1" aria-label="Next image">' + icon('chevron-right') + '</button></div>' +
        '</div>' +
      '</div>' +
      '<div class="pdp__info" data-reveal>' +
        '<span class="eyebrow">' + cat.name + ' \u00b7 SKU NX-' + p.id.toUpperCase().slice(0, 6) + '</span>' +
        '<h1 class="pdp__title">' + NX.escape(p.name) + '</h1>' +
        '<div class="pdp__rating-row">' + NX.starsHTML(p.rating, null) + '<span>' + p.rating.toFixed(1) + ' \u00b7 <a href="#tab-reviews" data-goto-reviews>' + p.reviews.toLocaleString('en-US') + ' reviews</a></span><span>' + p.sold.toLocaleString('en-US') + ' sold</span></div>' +
        '<div class="price price--lg"><span class="price__now">' + NX.money(p.price) + '</span>' + (p.oldPrice ? '<span class="price__was">' + NX.money(p.oldPrice) + '</span><span class="price__save">Save ' + NX.money(p.oldPrice - p.price) + '</span>' : '') + '</div>' +
        '<p class="pdp__desc">' + NX.escape(p.short) + '</p>' +
        NX.optionsHTML(p, 'pdp') +
        '<span class="stock-line' + (lowStock ? ' stock-line--low' : '') + '">' + (lowStock ? 'Only ' + p.stock + ' left \u2014 order soon' : 'In stock \u00b7 ships in 24 hours') + '</span>' +
        '<div class="pdp__buy"><div class="qty"><button type="button" data-step="-1" aria-label="Decrease quantity">' + icon('minus') + '</button><input type="number" min="1" max="' + DATA.settings.maxQty + '" value="1" aria-label="Quantity" id="pdp-qty"><button type="button" data-step="1" aria-label="Increase quantity">' + icon('plus') + '</button></div>' +
          '<button class="btn btn--primary btn--lg" type="button" id="pdp-add">' + icon('shopping-bag') + 'Add to cart</button>' +
          '<button class="icon-btn icon-btn--bordered" style="width:56px;height:56px" type="button" data-action="wish" data-id="' + p.id + '" aria-pressed="' + NX.store.isWished(p.id) + '" aria-label="Add to wishlist">' + icon('heart') + '</button></div>' +
        '<button class="btn btn--ghost btn--block" type="button" id="pdp-buy">Buy it now ' + icon('arrow-right', 'icon--move') + '</button>' +
        '<div class="pdp__perks"><div class="perk">' + icon('truck') + '<strong>Free shipping</strong>On orders over ' + NX.money(DATA.settings.freeShippingThreshold) + '</div><div class="perk">' + icon('rotate-ccw') + '<strong>30-day returns</strong>No questions asked</div><div class="perk">' + icon('shield-check') + '<strong>2-year warranty</strong>Nexora Care included</div></div>' +
        '<div class="pdp__meta"><p>Category: <span>' + cat.name + '</span></p><p>Tags: <span>' + p.tags.join(', ') + '</span></p></div>' +
      '</div>';

    // Gallery behaviour
    var main = $('[data-main-img]', root), thumbs = $$('.gallery__thumb', root), idx = 0, colorFilter = 'none';
    function show(i, focus) {
      idx = (i + gallery.length) % gallery.length;
      main.classList.add('is-swapping');
      setTimeout(function () { main.src = gallery[idx]; main.classList.remove('is-swapping'); }, NX.reducedMotion ? 0 : 160);
      thumbs.forEach(function (t, k) { t.setAttribute('aria-selected', k === idx); t.tabIndex = k === idx ? 0 : -1; });
      if (focus) thumbs[idx].focus();
      $('[data-counter]', root).textContent = '0' + (idx + 1) + ' / 0' + gallery.length;
      main.style.filter = idx === 0 ? colorFilter : 'none';
    }
    thumbs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1, true); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1, true); }
      });
    });
    NX.on(root, 'click', '[data-gal]', function (e, b) { e.stopPropagation(); show(idx + parseInt(b.dataset.gal, 10)); });
    var zoom = $('[data-zoom]', root);
    zoom.addEventListener('mousemove', function (e) {
      if (!window.matchMedia('(hover: hover)').matches || e.target.closest('button')) { zoom.classList.remove('is-zoom'); return; }
      var r = zoom.getBoundingClientRect();
      zoom.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%');
      zoom.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%');
      zoom.classList.add('is-zoom');
    });
    zoom.addEventListener('mouseleave', function () { zoom.classList.remove('is-zoom'); });

    NX.bindOptions(root, function (f) { colorFilter = f; if (idx !== 0) show(0); else main.style.filter = f; });
    var qty = $('#pdp-qty'); NX.bindStepper(root, qty);
    $('#pdp-add').addEventListener('click', function (e) { NX.addToCartFlow(p.id, parseInt(qty.value, 10) || 1, NX.readOptions(root), e.currentTarget); });
    $('#pdp-buy').addEventListener('click', function (e) {
      var b = e.currentTarget; b.classList.add('is-loading');
      NX.store.addToCart(p.id, parseInt(qty.value, 10) || 1, NX.readOptions(root));
      setTimeout(function () { window.location.href = 'checkout.html'; }, 400);
    });

    // Tabs content
    $('#tab-description').innerHTML = '<div class="prose"><p>' + NX.escape(p.short) + '</p><p>Every Nexora product is designed in-house and engineered to feel inevitable: fewer seams, smarter materials and software that gets better with every update. ' + NX.escape(p.name) + ' pairs instantly with the Nexora app, where you can personalise controls, update firmware over the air and register your two-year Nexora Care warranty.</p>' +
      '<h3>In the box</h3><ul><li>' + NX.escape(p.name) + '</li><li>USB-C to USB-C braided cable (1 m)</li><li>Recycled-fibre travel pouch</li><li>Quick start guide &amp; warranty card</li></ul></div>';
    $('#tab-specs').innerHTML = '<table class="spec-table"><caption class="sr-only">' + NX.escape(p.name) + ' specifications</caption><tbody>' + Object.keys(p.specs).map(function (k) { return '<tr><th scope="row">' + k + '</th><td>' + NX.escape(p.specs[k]) + '</td></tr>'; }).join('') + '</tbody></table>';
    var dist = [78, 15, 4, 2, 1];
    $('#tab-reviews').innerHTML = '<div class="reviews"><div><p class="review-summary__score">' + p.rating.toFixed(1) + '</p>' + NX.starsHTML(p.rating, null, true) + '<p class="text-muted" style="margin-top:.5rem;font-size:.875rem">Based on ' + p.reviews.toLocaleString('en-US') + ' verified reviews</p>' +
      '<div class="rating-bars">' + dist.map(function (d, i) { return '<div class="rating-bar"><span>' + (5 - i) + '\u2605</span><div class="rating-bar__track"><span style="width:' + d + '%"></span></div><span>' + d + '%</span></div>'; }).join('') + '</div></div>' +
      '<div>' + DATA.reviews.map(function (r, i) { return '<article class="review"><div class="review__head"><span class="avatar' + (i === 1 ? ' avatar--alt' : i === 2 ? ' avatar--alt2' : '') + '" aria-hidden="true">' + r.initials + '</span><div><p class="review__name">' + r.name + '</p><p class="review__date">' + r.date + '</p></div><span class="review__verified">' + icon('circle-check') + 'Verified buyer</span></div>' + NX.starsHTML(r.rating, null) + '<h4>' + r.title + '</h4><p>' + r.text + '</p></article>'; }).join('') + '</div></div>';
    var activate = NX.initTabs($('#pdp-tablist'));
    NX.on(root, 'click', '[data-goto-reviews]', function (e) { e.preventDefault(); activate($('#tab-btn-reviews')); $('.tabs-panel').scrollIntoView({ behavior: NX.reducedMotion ? 'auto' : 'smooth' }); });

    // Related
    var related = DATA.products.filter(function (x) { return x.category === p.category && x.id !== p.id; });
    related = related.concat(NX.selectProducts('trending').filter(function (x) { return x.id !== p.id && related.indexOf(x) < 0; })).slice(0, 4);
    NX.renderProductList($('#related-grid'), related);
    NX.observeReveal(root.parentNode);
  };

  /* ================================================================
     CART PAGE
     ================================================================ */
  NX.couponHTML = function () {
    var applied = NX.store.coupon && NX.store.totals().couponActive;
    return '<div class="coupon"><form class="inline-form" id="coupon-form" novalidate><label for="coupon-code" class="sr-only">Coupon code</label><input id="coupon-code" type="text" placeholder="Coupon code" autocomplete="off" spellcheck="false"><button class="btn btn--sm btn--light" type="submit">Apply</button></form>' +
      '<p class="form-message" id="coupon-msg" aria-live="polite"></p>' +
      (applied ? '<div class="coupon__applied"><span>' + icon('ticket') + ' <strong>' + NX.store.coupon + '</strong> \u2014 ' + DATA.coupons[NX.store.coupon].label + '</span><button type="button" data-remove-coupon>Remove</button></div>' : '') +
      '<div class="coupon__codes"><span>Demo codes:</span>' + Object.keys(DATA.coupons).map(function (c) { return '<button type="button" data-fill-coupon="' + c + '">' + c + '</button>'; }).join('') + '</div></div>';
  };
  NX.bindCoupon = function (root, after) {
    NX.on(root, 'submit', '#coupon-form', function (e) {
      e.preventDefault();
      var input = $('#coupon-code', root), msg = $('#coupon-msg', root);
      if (!input.value.trim()) { msg.className = 'form-message is-error'; msg.textContent = 'Enter a coupon code first.'; input.focus(); return; }
      var r = NX.store.applyCoupon(input.value);
      if (r.ok) { NX.toast({ title: 'Coupon applied', message: NX.escape(r.message) }); if (after) after(); }
      else { msg = $('#coupon-msg', root); msg.className = 'form-message is-error'; msg.textContent = r.message; $('#coupon-form', root).classList.add('is-invalid'); }
    });
    NX.on(root, 'click', '[data-fill-coupon]', function (e, b) { var i = $('#coupon-code', root); i.value = b.dataset.fillCoupon; i.focus(); });
    NX.on(root, 'click', '[data-remove-coupon]', function () { NX.store.removeCoupon(); NX.toast({ type: 'info', title: 'Coupon removed' }); if (after) after(); });
  };
  NX.summaryRowsHTML = function (t, opts) {
    opts = opts || {};
    return '<div class="summary-row"><span>Subtotal (' + t.count + ' item' + (t.count === 1 ? '' : 's') + ')</span><strong>' + NX.money(t.subtotal) + '</strong></div>' +
      (t.savings ? '<div class="summary-row summary-row--discount"><span>Product savings</span><strong>' + NX.money(t.savings) + '</strong></div>' : '') +
      (t.discount ? '<div class="summary-row summary-row--discount"><span>Coupon (' + NX.store.coupon + ')</span><strong>\u2212' + NX.money(t.discount) + '</strong></div>' : '') +
      '<div class="summary-row"><span>Shipping' + (opts.express ? ' (express)' : '') + '</span><strong>' + (t.shipping ? NX.money(t.shipping) : 'Free') + '</strong></div>' +
      '<div class="summary-row"><span>Estimated tax (' + Math.round(DATA.settings.taxRate * 100) + '%)</span><strong>' + NX.money(t.tax) + '</strong></div>' +
      '<div class="summary-row summary-row--total"><span>Total</span><strong>' + NX.money(t.total) + '</strong></div>';
  };

  pages.cart = function () {
    var layout = $('#cart-layout'), empty = $('#cart-empty'), rows = $('#cart-rows'), summary = $('#cart-summary');
    function render() {
      var t = NX.store.totals();
      var has = NX.store.cart.length > 0;
      layout.hidden = !has; empty.hidden = has;
      $('#cart-heading-count').textContent = t.count + ' item' + (t.count === 1 ? '' : 's');
      if (!has) return;
      rows.innerHTML = NX.store.cart.map(function (l) {
        var p = NX.getProduct(l.id);
        return '<div class="cart-row" data-key="' + NX.escape(l.key) + '" role="row">' +
          '<div class="cart-row__product" role="cell"><a href="' + NX.productUrl(p) + '"><img src="' + p.image + '" alt="' + NX.escape(p.name) + '" width="88" height="88"></a><div><p class="cart-row__name"><a href="' + NX.productUrl(p) + '">' + NX.escape(p.name) + '</a></p><p class="cart-row__variant">' + NX.escape(NX.variantText(l.variant) || NX.getCategory(p.category).name) + '</p></div></div>' +
          '<div class="cart-row__price" role="cell">' + NX.money(p.price) + '</div>' +
          '<div role="cell">' + NX.qtyHTML(l) + '</div>' +
          '<div class="cart-row__total" role="cell">' + NX.money(p.price * l.qty) + '</div>' +
          '<div class="cart-row__remove" role="cell"><button class="icon-btn" type="button" data-remove aria-label="Remove ' + NX.escape(p.name) + ' from cart">' + icon('trash-2') + '</button></div></div>';
      }).join('');
      summary.innerHTML = '<h2>Order summary</h2>' + NX.shipProgressHTML(t) + NX.couponHTML() + NX.summaryRowsHTML(t) +
        '<a class="btn btn--primary btn--lg btn--block mt-6" href="checkout.html">Proceed to checkout ' + icon('arrow-right', 'icon--move') + '</a>' +
        '<p class="secure-note">' + icon('lock') + 'Demo checkout \u2014 no payment is processed</p>';
    }
    NX.bindCartControls(rows);
    NX.bindCoupon(summary, render);
    $('#clear-cart').addEventListener('click', function () {
      if (window.confirm('Remove all items from your cart?')) { NX.store.clearCart(); NX.toast({ type: 'info', title: 'Cart cleared' }); }
    });
    document.addEventListener('nx:cart', render);
    render();
  };

  /* ================================================================
     CHECKOUT
     ================================================================ */
  pages.checkout = function () {
    var form = $('#checkout-form'), layout = $('#checkout-layout'), empty = $('#checkout-empty'), summary = $('#checkout-summary');
    var method = function () { var r = $('input[name="shipping"]:checked'); return r ? r.value : 'standard'; };
    function render() {
      var has = NX.store.cart.length > 0;
      layout.hidden = !has; empty.hidden = has;
      if (!has) return;
      var t = NX.store.totals(method());
      summary.innerHTML = '<h2>Your order</h2><div class="order-lines">' + NX.store.cart.map(function (l) {
        var p = NX.getProduct(l.id);
        return '<div class="order-line"><div class="order-line__img"><img src="' + p.image + '" alt="" width="60" height="60"><b>' + l.qty + '</b></div><div><p class="order-line__name">' + NX.escape(p.name) + '</p><p class="order-line__var">' + NX.escape(NX.variantText(l.variant)) + '</p></div><span class="order-line__price">' + NX.money(p.price * l.qty) + '</span></div>';
      }).join('') + '</div>' + NX.couponHTML() + NX.summaryRowsHTML(t, { express: method() === 'express' }) +
        '<p class="secure-note">' + icon('shield-check') + 'Demonstration interface \u2014 no real payment</p>';
      var std = $('[data-ship-price="standard"]');
      if (std) { var tt = NX.store.totals('standard'); std.textContent = tt.shipping ? NX.money(tt.shipping) : 'Free'; }
      var btnTotal = $('[data-pay-total]'); if (btnTotal) btnTotal.textContent = NX.money(t.total);
    }
    NX.bindCoupon(summary, render);
    $$('input[name="shipping"]').forEach(function (r) { r.addEventListener('change', render); });
    document.addEventListener('nx:cart', render);

    // input formatting
    var card = $('#cc-number'), exp = $('#cc-exp'), cvc = $('#cc-cvc');
    card.addEventListener('input', function () { card.value = card.value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '); });
    exp.addEventListener('input', function () { var d = exp.value.replace(/\D/g, '').slice(0, 4); exp.value = d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d; });
    cvc.addEventListener('input', function () { cvc.value = cvc.value.replace(/\D/g, '').slice(0, 4); });
    $$('[data-fill-demo-card]').forEach(function (b) { b.addEventListener('click', function () { card.value = '4242 4242 4242 4242'; var d = new Date(); exp.value = '12 / ' + String(d.getFullYear() + 2).slice(2); cvc.value = '123'; [card, exp, cvc].forEach(NX.validateField); }); });

    // INTEGRATION POINT (checkout): this demo only simulates an order. In production, send the
    // validated form data + NX.store.cart / NX.store.coupon to your server / payment provider (e.g. Stripe, PayPal) here.
    // Never trust client-side totals or coupon validation — recalculate them on the server.
    NX.bindValidation(form, function (f, btn) {
      btn.classList.add('is-loading');
      setTimeout(function () {
        btn.classList.remove('is-loading');
        var order = 'NX-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        var t = NX.store.totals(method());
        $('[data-order-no]').textContent = order;
        $('[data-order-total]').textContent = NX.money(t.total);
        $('[data-order-email]').textContent = $('#co-email').value;
        NX.store.clearCart();
        f.reset();
        NX.layer.open($('#order-success'));
      }, NX.reducedMotion ? 0 : 1400);
    });
    render();
  };

  /* ================================================================
     WISHLIST
     ================================================================ */
  pages.wishlist = function () {
    var grid = $('#wish-grid'), bar = $('#wish-toolbar');
    function render() {
      var list = NX.store.wishlist.map(NX.getProduct).filter(Boolean);
      bar.hidden = !list.length;
      $('#wish-count').textContent = list.length + ' saved item' + (list.length === 1 ? '' : 's');
      if (!list.length) {
        grid.innerHTML = '<div class="empty-state"><span class="empty-state__icon">' + icon('heart') + '</span><h3>Your wishlist is empty</h3><p>Tap the heart on any product to save it here. Your list is stored on this device.</p><a class="btn btn--primary" href="shop.html">Discover products ' + icon('arrow-right', 'icon--move') + '</a></div>';
        return;
      }
      NX.renderProductList(grid, list);
    }
    $('#wish-add-all').addEventListener('click', function () {
      NX.store.wishlist.forEach(function (id) { var p = NX.getProduct(id); var v = p.colors ? { color: DATA.colors[p.colors[0]].name } : null; if (p.sizes) { v = v || {}; v.size = p.sizes[0]; } NX.store.addToCart(id, 1, v); });
      NX.toast({ title: 'All items added to cart', message: '<a href="cart.html">Review your cart</a>' });
    });
    $('#wish-clear').addEventListener('click', function () { if (window.confirm('Clear your wishlist?')) { NX.store.wishlist = []; NX.store.saveWish(); } });
    $('#wish-share').addEventListener('click', function () {
      var url = window.location.href.split('?')[0] + '?items=' + NX.store.wishlist.join(',');
      copy(url, 'Wishlist link copied');
    });
    // import a shared wishlist ?items=a,b
    var shared = NX.qs('items');
    if (shared) { shared.split(',').forEach(function (id) { if (NX.getProduct(id) && !NX.store.isWished(id)) NX.store.wishlist.push(id); }); NX.store.saveWish(); }
    document.addEventListener('nx:wishlist', render);
    render();
  };

  function copy(text, okMsg) {
    var done = function () { NX.toast({ type: 'info', title: okMsg }); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { NX.toast({ type: 'error', title: 'Copy failed' }); } t.remove(); }
  }
  NX.copy = copy;

  /* ================================================================
     CATEGORIES
     ================================================================ */
  pages.categories = function () {
    DATA.categories.forEach(function (c) {
      var list = DATA.products.filter(function (p) { return p.category === c.id; });
      var count = $('[data-cat-count="' + c.id + '"]'); if (count) count.textContent = list.length + ' products';
      var mini = $('[data-cat-mini="' + c.id + '"]');
      if (mini) mini.innerHTML = list.slice(0, 3).map(function (p) { return '<a href="' + NX.productUrl(p) + '"><img src="' + p.image + '" alt="" width="200" height="200" loading="lazy"><span>' + NX.escape(p.name) + '</span></a>'; }).join('');
      var from = $('[data-cat-from="' + c.id + '"]'); if (from) from.textContent = 'From ' + NX.money(Math.min.apply(null, list.map(function (p) { return p.price; })));
    });
  };

  /* ================================================================
     CONTACT
     ================================================================ */
  pages.contact = function () {
    var form = $('#contact-form');
    // INTEGRATION POINT (contact form): replace the simulated delay below with a fetch() to your
    // backend or a form service, e.g. fetch('https://formspree.io/f/XXXX', { method: 'POST', body: new FormData(f) }).
    NX.bindValidation(form, function (f, btn) {
      btn.classList.add('is-loading');
      setTimeout(function () {
        btn.classList.remove('is-loading'); f.reset();
        $$('.field', f).forEach(function (x) { x.classList.remove('is-valid'); });
        var msg = $('#contact-msg'); msg.className = 'form-message is-success'; msg.textContent = 'Thanks! Your message has been received \u2014 we reply within one business day.';
        NX.toast({ title: 'Message sent', message: 'This is a demo form; connect it to your backend or form service.' });
      }, NX.reducedMotion ? 0 : 1000);
    });
  };

  /* ================================================================
     FAQ
     ================================================================ */
  pages.faq = function () {
    var search = $('#faq-search'), groups = $$('.faq-group'), filterBtns = $$('[data-faq-filter]'), active = 'all';
    function apply() {
      var q = search.value.trim().toLowerCase(), any = false;
      groups.forEach(function (g) {
        var inGroup = active === 'all' || g.dataset.group === active, visible = 0;
        $$('.accordion__item', g).forEach(function (it) {
          var match = !q || it.textContent.toLowerCase().indexOf(q) > -1;
          it.hidden = !(match && inGroup); if (!it.hidden) visible++;
        });
        g.hidden = !visible; if (visible) any = true;
      });
      $('#faq-empty').hidden = any;
    }
    filterBtns.forEach(function (b) { b.addEventListener('click', function () { active = b.dataset.faqFilter; filterBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); apply(); }); });
    search.addEventListener('input', NX.debounce(apply, 120));
    $('#faq-search-form').addEventListener('submit', function (e) { e.preventDefault(); apply(); });
  };

  /* ================================================================
     BLOG LISTING
     ================================================================ */
  pages.blog = function () {
    var chips = $$('[data-blog-filter]'), cards = $$('.post-card');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.dataset.blogFilter, n = 0;
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c); });
        cards.forEach(function (card) { var show = f === 'all' || card.dataset.cat === f; card.hidden = !show; if (show) n++; });
        $('#blog-empty').hidden = n > 0;
      });
    });
  };

  /* ================================================================
     BLOG DETAILS
     ================================================================ */
  pages.post = function () {
    $$('[data-copy-link]').forEach(function (b) { b.addEventListener('click', function () { copy(window.location.href, 'Article link copied'); }); });
    // TOC active state
    var links = $$('.toc a'); var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    if ('IntersectionObserver' in window && secs.length) {
      var obs = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); }); }); }, { rootMargin: '-20% 0px -70% 0px' });
      secs.forEach(function (s) { obs.observe(s); });
    }
    // Comments (demo — stored locally)
    var form = $('#comment-form'), list = $('#comment-list'), KEY = 'nexora.comments.' + (document.body.dataset.post || 'post');
    function add(c, prepend) {
      var el = document.createElement('div'); el.className = 'comment';
      el.innerHTML = '<span class="avatar" aria-hidden="true">' + NX.escape(c.name.trim().split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase()) + '</span><div><p class="comment__name">' + NX.escape(c.name) + '<span class="comment__date">' + NX.escape(c.date) + '</span></p><p>' + NX.escape(c.text) + '</p></div>';
      prepend ? list.prepend(el) : list.appendChild(el);
    }
    NX.storage.get(KEY, []).forEach(function (c) { add(c, true); });
    function count() { $('#comment-count').textContent = $$('.comment', list).length; }
    count();
    // INTEGRATION POINT (comments): demo comments are stored in localStorage only.
    NX.bindValidation(form, function (f, btn) {
      btn.classList.add('is-loading');
      setTimeout(function () {
        var c = { name: $('#cm-name').value, text: $('#cm-text').value, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
        var saved = NX.storage.get(KEY, []); saved.push(c); NX.storage.set(KEY, saved);
        add(c, true); count(); f.reset(); btn.classList.remove('is-loading');
        $$('.field', f).forEach(function (x) { x.classList.remove('is-valid'); });
        NX.toast({ title: 'Comment posted', message: 'Stored locally for this demo.' });
      }, NX.reducedMotion ? 0 : 700);
    });
  };
})(window, document);
