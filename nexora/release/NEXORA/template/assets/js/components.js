/**
 * NEXORA — Shared UI components
 * ------------------------------------------------------------------
 * Product cards · header & mega menu · search · mobile nav · cart drawer
 * quick view · global actions · reveal-on-scroll · page transitions
 * announcement bar · countdown · carousel · tabs · accordion · forms
 */
(function (window, document) {
  'use strict';

  var NX = window.NX, DATA = window.NX_DATA, $ = NX.$, $$ = NX.$$, icon = NX.icon;
  var BADGE = { sale: ['badge--sale', 'Sale'], new: ['badge--new', 'New'], bestseller: ['badge--hot', 'Bestseller'], hot: ['badge--hot', 'Hot'] };

  /* ================================================================
     PRODUCT CARD TEMPLATES
     ================================================================ */
  NX.discount = function (p) { return p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0; };
  NX.priceHTML = function (p, cls) {
    return '<div class="price ' + (cls || '') + '"><span class="price__now">' + NX.money(p.price) + '</span>' +
      (p.oldPrice ? '<span class="price__was"><span class="sr-only">Was </span>' + NX.money(p.oldPrice) + '</span>' : '') + '</div>';
  };
  NX.starsHTML = function (rating, count, lg) {
    return '<span class="rating"><span class="stars' + (lg ? ' stars--lg' : '') + '" style="--pct:' + (rating / 5 * 100) + '%" role="img" aria-label="Rated ' + rating + ' out of 5"></span>' +
      (count != null ? '<span>' + rating.toFixed(1) + ' (' + count.toLocaleString('en-US') + ')</span>' : '') + '</span>';
  };
  NX.badgesHTML = function (p) {
    var out = '';
    var d = NX.discount(p);
    if (d) out += '<span class="badge badge--sale">\u2212' + d + '%</span>';
    (p.badges || []).forEach(function (b) { if (b !== 'sale' && BADGE[b]) out += '<span class="badge ' + BADGE[b][0] + '">' + BADGE[b][1] + '</span>'; });
    return out;
  };
  NX.productUrl = function (p) { return 'product.html?id=' + encodeURIComponent(p.id); };

  NX.cardHTML = function (p, opts) {
    opts = opts || {};
    var cat = NX.getCategory(p.category);
    var wished = NX.store.isWished(p.id);
    var url = NX.productUrl(p);
    var alt = (p.gallery && p.gallery[1]) || p.image;
    var sw = (p.colors || []).map(function (c) { var col = DATA.colors[c]; return col ? '<i style="background:' + col.hex + '" title="' + col.name + '"></i>' : ''; }).join('');
    return '<article class="p-card" data-id="' + p.id + '"' + (opts.reveal !== false ? ' data-reveal style="--rd:' + ((opts.index || 0) % 4) * 80 + '"' : '') + '>' +
      '<div class="p-card__media">' +
        '<div class="p-card__badges">' + NX.badgesHTML(p) + '</div>' +
        '<button class="icon-btn icon-btn--solid p-card__wish' + (wished ? ' is-active' : '') + '" type="button" data-action="wish" data-id="' + p.id + '" aria-pressed="' + wished + '" aria-label="' + (wished ? 'Remove ' : 'Add ') + NX.escape(p.name) + (wished ? ' from' : ' to') + ' wishlist">' + icon('heart') + '</button>' +
        '<img src="' + p.image + '" alt="' + NX.escape(p.name) + '" width="800" height="800" loading="lazy" decoding="async">' +
        '<img class="p-card__img-alt" src="' + alt + '" alt="" width="800" height="800" loading="lazy" decoding="async">' +
        '<div class="p-card__actions">' +
          '<button class="btn btn--light" type="button" data-action="add" data-id="' + p.id + '" aria-label="Add to cart: ' + NX.escape(p.name) + '">' + icon('shopping-bag') + '<span>Add to cart</span></button>' +
          '<button class="icon-btn" type="button" data-action="quick" data-id="' + p.id + '" aria-label="Quick view ' + NX.escape(p.name) + '">' + icon('eye') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="p-card__body">' +
        '<span class="p-card__cat">' + (cat ? cat.name : '') + '</span>' +
        '<h3 class="p-card__name"><a href="' + url + '">' + NX.escape(p.name) + '</a></h3>' +
        '<p class="p-card__desc">' + NX.escape(p.short) + '</p>' +
        '<div class="p-card__foot">' + NX.priceHTML(p) + NX.starsHTML(p.rating, p.reviews) + '</div>' +
        '<div class="p-card__foot p-card__foot--sub"><div class="p-card__swatches" aria-hidden="true">' + sw + '</div>' +
          '<button class="icon-btn icon-btn--bordered p-card__add-touch" type="button" data-action="add" data-id="' + p.id + '" aria-label="Add ' + NX.escape(p.name) + ' to cart">' + icon('plus') + '</button></div>' +
      '</div>' +
    '</article>';
  };

  NX.skeletonHTML = function (n) {
    var s = ''; for (var i = 0; i < n; i++) s += '<div class="skeleton" aria-hidden="true"><div class="skeleton__media"></div><div class="skeleton__line"></div><div class="skeleton__line"></div></div>';
    return s;
  };

  /** Render products into any element with [data-products]. */
  NX.renderProductList = function (el, list) {
    el.innerHTML = list.map(function (p, i) { return NX.cardHTML(p, { index: i }); }).join('');
    NX.observeReveal(el);
  };

  NX.selectProducts = function (kind, limit, category) {
    var list = DATA.products.slice();
    if (category && category !== 'all') list = list.filter(function (p) { return p.category === category; });
    switch (kind) {
      case 'trending': list.sort(function (a, b) { return (b.rating * b.reviews) - (a.rating * a.reviews); }); break;
      case 'new': list.sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); }); break;
      case 'bestsellers': list.sort(function (a, b) { return b.sold - a.sold; }); break;
      case 'sale': list = list.filter(function (p) { return p.oldPrice; }); break;
    }
    return limit ? list.slice(0, limit) : list;
  };

  /* ================================================================
     BADGE COUNTERS & SYNC
     ================================================================ */
  function updateCounts(bump) {
    var c = NX.store.cartCount(), w = NX.store.wishlist.length;
    $$('[data-count="cart"]').forEach(function (el) { el.textContent = c; el.classList.toggle('is-visible', c > 0); if (bump === 'cart') { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); } });
    $$('[data-count="wishlist"]').forEach(function (el) { el.textContent = w; el.classList.toggle('is-visible', w > 0); if (bump === 'wishlist') { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); } });
    $$('[data-wish-label]').forEach(function (el) { el.setAttribute('aria-label', 'Wishlist, ' + w + ' saved item' + (w === 1 ? '' : 's')); });
    $$('[data-cart-label]').forEach(function (el) { el.setAttribute('aria-label', 'Open cart, ' + c + ' item' + (c === 1 ? '' : 's')); });
  }
  function syncWishButtons() {
    $$('[data-action="wish"]').forEach(function (b) {
      var on = NX.store.isWished(b.dataset.id);
      var p = NX.getProduct(b.dataset.id);
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on);
      if (p && !b.dataset.keepLabel) b.setAttribute('aria-label', (on ? 'Remove ' : 'Add ') + p.name + (on ? ' from' : ' to') + ' wishlist');
    });
  }

  /* ================================================================
     GLOBAL ACTIONS (event delegation)
     ================================================================ */
  NX.addToCartFlow = function (id, qty, variant, btn) {
    var p = NX.getProduct(id); if (!p) return;
    if (btn) { btn.classList.add('is-loading'); }
    setTimeout(function () {
      NX.store.addToCart(id, qty || 1, variant);
      if (btn) {
        btn.classList.remove('is-loading'); btn.classList.add('is-done');
        setTimeout(function () { btn.classList.remove('is-done'); }, 1200);
      }
      NX.toast({ title: 'Added to cart', message: NX.escape(p.name) + (qty > 1 ? ' \u00d7 ' + qty : '') + ' \u2014 <a href="cart.html">View cart</a>' });
    }, NX.reducedMotion ? 0 : 420);
  };
  NX.wishFlow = function (id) {
    var p = NX.getProduct(id); if (!p) return;
    var added = NX.store.toggleWish(id);
    NX.toast({ type: added ? 'wish' : 'info', title: added ? 'Saved to wishlist' : 'Removed from wishlist', message: NX.escape(p.name) + (added ? ' \u2014 <a href="wishlist.html">View wishlist</a>' : '') });
  };

  function initGlobalActions() {
    NX.on(document, 'click', '[data-action]', function (e, el) {
      var a = el.dataset.action, id = el.dataset.id;
      if (a === 'add') { e.preventDefault(); var p = NX.getProduct(id); var v = p && p.colors && p.colors.length ? { color: DATA.colors[p.colors[0]].name } : null; if (p && p.sizes) { v = v || {}; v.size = p.sizes[0]; } NX.addToCartFlow(id, 1, v, el.classList.contains('btn') ? el : null); }
      else if (a === 'wish') { e.preventDefault(); NX.wishFlow(id); }
      else if (a === 'quick') { e.preventDefault(); NX.quickView(id); }
      else if (a === 'open-cart') { e.preventDefault(); NX.openCart(); }
      else if (a === 'open-search') { e.preventDefault(); openSearch(); }
      else if (a === 'close-layer') { e.preventDefault(); var layer = el.closest('.is-open'); if (layer) NX.layer.close(layer); }
    });
    document.addEventListener('nx:cart', function () { updateCounts('cart'); renderCartDrawer(); });
    document.addEventListener('nx:wishlist', function () { updateCounts('wishlist'); syncWishButtons(); });
    updateCounts();
  }

  /* ================================================================
     ANNOUNCEMENT BAR
     ================================================================ */
  function initAnnouncement() {
    var bar = $('.announce'); if (!bar) return;
    if (NX.storage.get('nexora.announce.closed', false)) { bar.remove(); return; }
    var msgs = $$('.announce__msg', bar), i = 0;
    if (msgs.length > 1 && !NX.reducedMotion) {
      setInterval(function () {
        var cur = msgs[i]; i = (i + 1) % msgs.length; var next = msgs[i];
        cur.classList.remove('is-active'); cur.classList.add('is-out'); cur.setAttribute('aria-hidden', 'true'); cur.inert = true;
        next.classList.remove('is-out'); next.classList.add('is-active'); next.removeAttribute('aria-hidden'); next.inert = false;
        setTimeout(function () { cur.classList.remove('is-out'); }, 600);
      }, 4500);
    }
    var close = $('.announce__close', bar);
    if (close) close.addEventListener('click', function () { NX.storage.set('nexora.announce.closed', true); bar.remove(); });
  }

  /* ================================================================
     HEADER, MEGA MENU & DROPDOWNS
     ================================================================ */
  function initHeader() {
    var header = $('.header'); if (!header) return;
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 10); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    var items = $$('.nav__item[data-menu]', header);
    var closeAll = function (except) {
      items.forEach(function (it) { if (it !== except) { it.classList.remove('is-open'); var b = $('[aria-expanded]', it); if (b) b.setAttribute('aria-expanded', 'false'); } });
      header.classList.toggle('is-menu-open', !!except);
    };
    items.forEach(function (it) {
      var btn = $('.nav__link', it), timer;
      var open = function () { clearTimeout(timer); closeAll(it); it.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); };
      var close = function () { it.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); header.classList.remove('is-menu-open'); };
      it.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) open(); });
      it.addEventListener('mouseleave', function () { timer = setTimeout(close, 160); });
      btn.addEventListener('click', function (e) { e.preventDefault(); it.classList.contains('is-open') ? close() : open(); });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); open(); var f = $('a', it.querySelector('.mega, .dropdown')); if (f) f.focus(); }
      });
      it.addEventListener('keydown', function (e) { if (e.key === 'Escape' && it.classList.contains('is-open')) { e.stopPropagation(); close(); btn.focus(); } });
      it.addEventListener('focusout', function (e) { if (!it.contains(e.relatedTarget)) close(); });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.nav__item[data-menu]')) closeAll(null); });
  }

  /* ================================================================
     SEARCH OVERLAY
     ================================================================ */
  var searchEl;
  function highlight(text, q) {
    var safe = NX.escape(text); if (!q) return safe;
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return safe.replace(re, '<mark>$1</mark>');
  }
  NX.searchProducts = function (q) {
    q = (q || '').trim().toLowerCase(); if (!q) return [];
    var terms = q.split(/\s+/);
    return DATA.products.map(function (p) {
      var cat = NX.getCategory(p.category);
      var hay = (p.name + ' ' + p.tags.join(' ') + ' ' + (cat ? cat.name : '') + ' ' + p.short).toLowerCase();
      var score = 0;
      terms.forEach(function (t) { if (hay.indexOf(t) > -1) score += 1; if (p.name.toLowerCase().indexOf(t) > -1) score += 2; });
      return { p: p, score: terms.every(function (t) { return hay.indexOf(t) > -1; }) ? score : 0 };
    }).filter(function (r) { return r.score > 0; }).sort(function (a, b) { return b.score - a.score; }).map(function (r) { return r.p; });
  };
  function renderSearch(q) {
    var box = $('#search-results'), label = $('#search-label'), popular = $('#search-popular');
    if (!q.trim()) { popular.hidden = false; box.innerHTML = ''; label.textContent = 'Trending now'; renderSearchList(box, NX.selectProducts('trending', 4), ''); return; }
    popular.hidden = true;
    var res = NX.searchProducts(q);
    label.textContent = res.length + ' result' + (res.length === 1 ? '' : 's');
    if (!res.length) { box.innerHTML = '<p class="search__empty">No products match \u201c' + NX.escape(q) + '\u201d. Try \u201cwireless\u201d or \u201cgaming\u201d.</p>'; return; }
    renderSearchList(box, res.slice(0, 6), q);
  }
  function renderSearchList(box, list, q) {
    box.innerHTML = list.map(function (p) {
      var cat = NX.getCategory(p.category);
      return '<a class="search-result" href="' + NX.productUrl(p) + '"><img src="' + p.image + '" alt="" width="56" height="56" loading="lazy">' +
        '<div><p class="search-result__name">' + highlight(p.name, q) + '</p><p class="search-result__meta">' + (cat ? cat.name : '') + ' \u00b7 ' + p.rating + '\u2605</p></div>' + NX.priceHTML(p) + '</a>';
    }).join('');
  }
  function openSearch() { if (!searchEl) return; NX.layer.open(searchEl, { focus: '.search__input' }); renderSearch($('.search__input', searchEl).value); }
  function initSearch() {
    searchEl = $('#search'); if (!searchEl) return;
    var input = $('.search__input', searchEl);
    input.addEventListener('input', NX.debounce(function () { renderSearch(input.value); }, 120));
    $('#search-form').addEventListener('submit', function (e) {
      e.preventDefault(); var q = input.value.trim();
      window.location.href = 'shop.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    });
    NX.on(searchEl, 'click', '[data-term]', function (e, el) { input.value = el.dataset.term; renderSearch(input.value); input.focus(); });
    NX.on(searchEl, 'click', '.search__backdrop', function () { NX.layer.close(searchEl); });
    document.addEventListener('keydown', function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if ((e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag)) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
    });
  }

  /* ================================================================
     MOBILE NAVIGATION
     ================================================================ */
  function initMobileNav() {
    var nav = $('#mobile-nav'); if (!nav) return;
    $$('[data-open="mobile-nav"]').forEach(function (b) {
      b.addEventListener('click', function () { NX.layer.open(nav, { onClose: function () { b.setAttribute('aria-expanded', 'false'); } }); b.setAttribute('aria-expanded', 'true'); });
    });
    NX.on(nav, 'click', '.mobile-nav__backdrop', function () { NX.layer.close(nav); });
    NX.on(nav, 'click', '.mobile-nav__toggle', function (e, btn) {
      var sub = document.getElementById(btn.getAttribute('aria-controls'));
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open); sub.classList.toggle('is-open', open);
    });
    window.addEventListener('resize', NX.debounce(function () { if (window.innerWidth > 1023 && nav.classList.contains('is-open')) NX.layer.close(nav); }, 150));
  }

  /* ================================================================
     CART DRAWER
     ================================================================ */
  var drawer;
  NX.variantText = function (v) { if (!v) return ''; return Object.keys(v).map(function (k) { return v[k]; }).join(' \u00b7 '); };
  NX.shipProgressHTML = function (t) {
    var pct = Math.min(100, (t.subtotal / DATA.settings.freeShippingThreshold) * 100);
    var msg = t.freeShipRemaining > 0 ? 'You\u2019re <strong>' + NX.money(t.freeShipRemaining) + '</strong> away from free shipping' : '<strong>Free standard shipping</strong> unlocked';
    return '<div class="ship-progress"><p>' + msg + '</p><div class="ship-progress__bar" role="progressbar" aria-label="Progress to free shipping" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '"><span style="width:' + pct + '%"></span></div></div>';
  };
  function renderCartDrawer() {
    if (!drawer) return;
    var body = $('.drawer__body', drawer), foot = $('.drawer__foot', drawer), count = $('[data-drawer-count]', drawer);
    var t = NX.store.totals();
    count.textContent = '(' + t.count + ')';
    if (!NX.store.cart.length) {
      body.innerHTML = '<div class="empty-state"><span class="empty-state__icon">' + icon('shopping-bag') + '</span><h3>Your cart is empty</h3><p>Explore the latest drops and add something extraordinary.</p><a class="btn btn--primary" href="shop.html">Start shopping ' + icon('arrow-right', 'icon--move') + '</a></div>';
      foot.hidden = true; return;
    }
    foot.hidden = false;
    body.innerHTML = NX.shipProgressHTML(t) + NX.store.cart.map(function (l) {
      var p = NX.getProduct(l.id);
      return '<div class="mini-item" data-key="' + NX.escape(l.key) + '"><a href="' + NX.productUrl(p) + '"><img src="' + p.image + '" alt="' + NX.escape(p.name) + '" width="76" height="76"></a>' +
        '<div><p class="mini-item__name"><a href="' + NX.productUrl(p) + '">' + NX.escape(p.name) + '</a></p><p class="mini-item__variant">' + NX.escape(NX.variantText(l.variant)) + '</p>' +
        '<div class="mini-item__row">' + qtyHTML(l, true) + '</div></div>' +
        '<div class="mini-item__side"><span class="mini-item__price">' + NX.money(p.price * l.qty) + '</span><button class="remove-btn" type="button" data-remove aria-label="Remove ' + NX.escape(p.name) + '">' + icon('trash-2') + '</button></div></div>';
    }).join('');
    $('[data-drawer-subtotal]', drawer).textContent = NX.money(t.subtotal);
    $('[data-drawer-discount-row]', drawer).hidden = !t.discount;
    $('[data-drawer-discount]', drawer).textContent = '\u2212' + NX.money(t.discount);
  }
  function qtyHTML(line, small) {
    var p = NX.getProduct(line.id);
    return '<div class="qty' + (small ? ' qty--sm' : '') + '"><button type="button" data-qty="-1" aria-label="Decrease quantity of ' + NX.escape(p.name) + '">' + icon('minus') + '</button>' +
      '<input type="number" inputmode="numeric" min="1" max="' + DATA.settings.maxQty + '" value="' + line.qty + '" aria-label="Quantity of ' + NX.escape(p.name) + '" data-qty-input>' +
      '<button type="button" data-qty="1" aria-label="Increase quantity of ' + NX.escape(p.name) + '"' + (line.qty >= DATA.settings.maxQty ? ' disabled' : '') + '>' + icon('plus') + '</button></div>';
  }
  NX.qtyHTML = qtyHTML;
  /** Wires qty +/- , direct input and remove buttons inside a container of [data-key] rows. */
  NX.bindCartControls = function (container, onRemove) {
    NX.on(container, 'click', '[data-qty]', function (e, b) {
      var row = b.closest('[data-key]'); var line = NX.store.cart.find(function (l) { return l.key === row.dataset.key; });
      if (line) NX.store.setQty(line.key, line.qty + parseInt(b.dataset.qty, 10));
    });
    NX.on(container, 'change', '[data-qty-input]', function (e, inp) {
      var row = inp.closest('[data-key]'); var v = Math.max(1, Math.min(DATA.settings.maxQty, parseInt(inp.value, 10) || 1));
      NX.store.setQty(row.dataset.key, v);
    });
    NX.on(container, 'click', '[data-remove]', function (e, b) {
      var row = b.closest('[data-key]'); var line = NX.store.cart.find(function (l) { return l.key === row.dataset.key; });
      var p = line && NX.getProduct(line.id);
      var go = function () { NX.store.removeFromCart(row.dataset.key); if (p) NX.toast({ type: 'info', title: 'Removed from cart', message: NX.escape(p.name) }); if (onRemove) onRemove(); };
      row.classList.add('is-removing'); setTimeout(go, NX.reducedMotion ? 0 : 260);
    });
  };
  NX.openCart = function () { if (drawer) NX.layer.open(drawer); };
  function initCartDrawer() {
    drawer = $('#cart-drawer'); if (!drawer) return;
    NX.on(drawer, 'click', '.drawer__backdrop', function () { NX.layer.close(drawer); });
    NX.bindCartControls(drawer);
    renderCartDrawer();
  }

  /* ================================================================
     QUICK VIEW MODAL
     ================================================================ */
  NX.optionsHTML = function (p, prefix) {
    var out = '';
    if (p.colors && p.colors.length) {
      var first = DATA.colors[p.colors[0]];
      out += '<div class="option-group" data-option="color"><p class="option-group__label" id="' + prefix + '-color-label"><span>Colour: <strong data-option-value>' + first.name + '</strong></span></p><div class="swatches" role="radiogroup" aria-labelledby="' + prefix + '-color-label">' +
        p.colors.map(function (c, i) { var col = DATA.colors[c]; return '<button type="button" class="swatch" role="radio" aria-checked="' + (i === 0) + '" aria-label="' + col.name + '" data-value="' + col.name + '" data-filter="' + col.filter + '" tabindex="' + (i === 0 ? 0 : -1) + '" style="--sw:' + col.hex + '"><span></span></button>'; }).join('') + '</div></div>';
    }
    if (p.sizes && p.sizes.length) {
      var label = p.category === 'gaming' ? 'Switch' : 'Size';
      out += '<div class="option-group" data-option="size"><p class="option-group__label" id="' + prefix + '-size-label"><span>' + label + ': <strong data-option-value>' + p.sizes[0] + '</strong></span>' + (p.id === 'halo-ring' ? '<span class="text-muted">Free sizing kit included</span>' : '') + '</p><div class="sizes" role="radiogroup" aria-labelledby="' + prefix + '-size-label">' +
        p.sizes.map(function (s, i) { return '<button type="button" class="size-opt" role="radio" aria-checked="' + (i === 0) + '" data-value="' + s + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + s + '</button>'; }).join('') + '</div></div>';
    }
    return out;
  };
  /** Wires radio-style option groups. `onColor(filter)` previews colourways. */
  NX.bindOptions = function (root, onColor) {
    NX.on(root, 'click', '[role="radio"]', function (e, b) { select(b); });
    NX.on(root, 'keydown', '[role="radio"]', function (e, b) {
      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].indexOf(e.key) < 0) return;
      e.preventDefault();
      var all = $$('[role="radio"]', b.parentNode), i = all.indexOf(b);
      var n = all[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length];
      select(n); n.focus();
    });
    function select(b) {
      var group = b.closest('.option-group');
      $$('[role="radio"]', group).forEach(function (x) { x.setAttribute('aria-checked', x === b); x.tabIndex = x === b ? 0 : -1; });
      $('[data-option-value]', group).textContent = b.dataset.value;
      if (group.dataset.option === 'color' && onColor) onColor(b.dataset.filter);
    }
  };
  NX.readOptions = function (root) {
    var v = {};
    $$('.option-group', root).forEach(function (g) { var sel = $('[aria-checked="true"]', g); if (sel) v[g.dataset.option] = sel.dataset.value; });
    return Object.keys(v).length ? v : null;
  };

  NX.quickView = function (id) {
    var modal = $('#quick-view'), p = NX.getProduct(id); if (!modal || !p) return;
    var cat = NX.getCategory(p.category);
    var box = $('[data-qv-content]', modal);
    box.innerHTML = '<div class="qv"><div class="qv__media"><div class="gallery__badges">' + NX.badgesHTML(p) + '</div><img src="' + p.image + '" alt="' + NX.escape(p.name) + '" width="800" height="800" data-qv-img></div>' +
      '<div class="qv__body"><span class="eyebrow">' + (cat ? cat.name : '') + '</span><h2 class="qv__title" id="qv-title">' + NX.escape(p.name) + '</h2>' +
      '<div class="pdp__rating-row">' + NX.starsHTML(p.rating, p.reviews) + '</div>' + NX.priceHTML(p, 'price--lg') +
      '<p class="qv__desc">' + NX.escape(p.short) + '</p>' + NX.optionsHTML(p, 'qv') +
      '<div class="qv__actions">' + '<div class="qty"><button type="button" data-step="-1" aria-label="Decrease quantity">' + icon('minus') + '</button><input type="number" min="1" max="' + DATA.settings.maxQty + '" value="1" aria-label="Quantity" data-qv-qty><button type="button" data-step="1" aria-label="Increase quantity">' + icon('plus') + '</button></div>' +
      '<button class="btn btn--primary" type="button" data-qv-add>' + icon('shopping-bag') + 'Add to cart</button>' +
      '<button class="icon-btn icon-btn--bordered" type="button" data-action="wish" data-id="' + p.id + '" aria-pressed="' + NX.store.isWished(p.id) + '" aria-label="Add to wishlist">' + icon('heart') + '</button></div>' +
      '<a class="link-arrow" href="' + NX.productUrl(p) + '">View full details ' + icon('arrow-up-right') + '</a></div></div>';
    syncWishButtons();
    var img = $('[data-qv-img]', box), qty = $('[data-qv-qty]', box);
    NX.bindOptions(box, function (f) { img.style.filter = f; });
    NX.bindStepper(box, qty);
    $('[data-qv-add]', box).addEventListener('click', function (e) { NX.addToCartFlow(p.id, parseInt(qty.value, 10) || 1, NX.readOptions(box), e.currentTarget); });
    NX.layer.open(modal, { focus: '.modal__close' });
  };
  NX.bindStepper = function (root, input) {
    NX.on(root, 'click', '[data-step]', function (e, b) {
      var v = (parseInt(input.value, 10) || 1) + parseInt(b.dataset.step, 10);
      input.value = Math.max(1, Math.min(DATA.settings.maxQty, v));
    });
    input.addEventListener('change', function () { input.value = Math.max(1, Math.min(DATA.settings.maxQty, parseInt(input.value, 10) || 1)); });
  };
  function initModals() {
    $$('.modal').forEach(function (m) { NX.on(m, 'click', '.modal__backdrop', function () { NX.layer.close(m); }); });
  }

  /* ================================================================
     REVEAL ON SCROLL
     ================================================================ */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-revealed'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  NX.observeReveal = function (root) {
    $$('[data-reveal]:not(.is-revealed)', root || document).forEach(function (el) {
      if (!io || NX.reducedMotion) el.classList.add('is-revealed'); else io.observe(el);
    });
  };

  /* ================================================================
     PAGE TRANSITIONS (internal links)
     ================================================================ */
  function initPageTransitions() {
    document.body.classList.add('is-entering');
    window.addEventListener('pageshow', function (e) { if (e.persisted) document.documentElement.classList.remove('is-leaving'); });
    if (NX.reducedMotion) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download') || /^(mailto:|tel:|javascript:|https?:)/i.test(href)) return;
      var url = new URL(a.href, window.location.href);
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
      e.preventDefault();
      document.documentElement.classList.add('is-leaving');
      setTimeout(function () { window.location.href = a.href; }, 260);
    });
  }

  /* ================================================================
     MISC WIDGETS
     ================================================================ */
  function initBackToTop() {
    var b = $('.back-to-top'); if (!b) return;
    window.addEventListener('scroll', function () { b.classList.toggle('is-visible', window.scrollY > 900); }, { passive: true });
    b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: NX.reducedMotion ? 'auto' : 'smooth' }); });
  }

  NX.initCountdown = function (el) {
    // Deadline: data-countdown="2026-12-31T23:59:59" if provided, otherwise a rolling demo deadline
    // at the end of the current week (Sunday 23:59:59 local time).
    var end = new Date(); end.setDate(end.getDate() + ((7 - end.getDay()) % 7)); end.setHours(23, 59, 59, 0);
    var custom = Date.parse(el.getAttribute('data-countdown') || ''); if (!isNaN(custom)) end = new Date(custom);
    var f = { d: $('[data-cd="d"]', el), h: $('[data-cd="h"]', el), m: $('[data-cd="m"]', el), s: $('[data-cd="s"]', el) };
    var pad = function (n) { return String(n).padStart(2, '0'); };
    function tick() {
      var diff = Math.max(0, end - new Date());
      f.d.textContent = pad(Math.floor(diff / 864e5)); f.h.textContent = pad(Math.floor(diff / 36e5) % 24);
      f.m.textContent = pad(Math.floor(diff / 6e4) % 60); f.s.textContent = pad(Math.floor(diff / 1e3) % 60);
    }
    tick(); setInterval(tick, 1000);
  };

  NX.initCarousel = function (root) {
    var track = $('.carousel__track', root), prev = $('[data-carousel="prev"]', root), next = $('[data-carousel="next"]', root);
    if (!track) return;
    var step = function () { var c = track.firstElementChild; return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 24) : 300; };
    var update = function () { if (!prev) return; prev.disabled = track.scrollLeft < 8; next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8; };
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: NX.reducedMotion ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: NX.reducedMotion ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', NX.debounce(update, 60), { passive: true });
    window.addEventListener('resize', NX.debounce(update, 120));
    setTimeout(update, 50);
  };

  /** Accessible tabs: [role=tablist] > [role=tab][aria-controls] */
  NX.initTabs = function (list, onChange) {
    var tabs = $$('[role="tab"]', list);
    function activate(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        var panel = t.getAttribute('aria-controls') && document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      if (onChange) onChange(tab);
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { activate(t); });
      t.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(t);
        if (e.key === 'ArrowRight') { e.preventDefault(); activate(tabs[(i + 1) % tabs.length], true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); activate(tabs[(i - 1 + tabs.length) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); activate(tabs[0], true); }
        if (e.key === 'End') { e.preventDefault(); activate(tabs[tabs.length - 1], true); }
      });
    });
    return activate;
  };

  /** Accordion: .accordion__trigger[aria-controls] toggles .accordion__panel */
  NX.initAccordions = function (root) {
    NX.on(root || document, 'click', '.accordion__trigger', function (e, b) {
      var panel = document.getElementById(b.getAttribute('aria-controls'));
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open); panel.classList.toggle('is-open', open);
    });
  };

  /* ================================================================
     FORM VALIDATION
     ================================================================ */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  NX.validators = {
    required: function (v) { return v.trim().length > 0; },
    email: function (v) { return EMAIL_RE.test(v.trim()); },
    phone: function (v) { return /^[+()\d\s-]{7,20}$/.test(v.trim()); },
    zip: function (v) { return /^[A-Za-z0-9\s-]{3,10}$/.test(v.trim()); },
    card: function (v) {
      var d = v.replace(/\D/g, ''); if (d.length < 13 || d.length > 19) return false;
      var sum = 0, alt = false; for (var i = d.length - 1; i >= 0; i--) { var n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; } return sum % 10 === 0;
    },
    expiry: function (v) {
      var m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/); if (!m) return false;
      var mo = +m[1], yr = 2000 + +m[2]; if (mo < 1 || mo > 12) return false;
      var now = new Date(); return yr > now.getFullYear() || (yr === now.getFullYear() && mo >= now.getMonth() + 1);
    },
    cvc: function (v) { return /^\d{3,4}$/.test(v.trim()); },
    min10: function (v) { return v.trim().length >= 10; },
    checked: function (v, el) { return el.checked; }
  };
  /** Validate a single field wrapper (.field) — rules from data-validate="required email" */
  NX.validateField = function (input) {
    var field = input.closest('.field') || input.closest('.check-field');
    var rules = (input.dataset.validate || '').split(/\s+/).filter(Boolean);
    var ok = rules.every(function (r) { return !NX.validators[r] || NX.validators[r](input.value, input); });
    if (field) { field.classList.toggle('is-invalid', !ok); field.classList.toggle('is-valid', ok && input.type !== 'checkbox' && input.value.trim() !== ''); }
    input.setAttribute('aria-invalid', !ok);
    return ok;
  };
  NX.bindValidation = function (form, onValid) {
    form.setAttribute('novalidate', '');
    var inputs = $$('[data-validate]', form);
    inputs.forEach(function (i) {
      i.addEventListener('blur', function () { if (i.value || i.dataset.touched) NX.validateField(i); i.dataset.touched = '1'; });
      i.addEventListener('input', function () { if (i.closest('.is-invalid')) NX.validateField(i); });
      i.addEventListener('change', function () { if (i.type === 'checkbox') NX.validateField(i); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = $$('[data-validate]', form).filter(function (i) { return !NX.validateField(i); });
      if (bad.length) { bad[0].focus(); NX.toast({ type: 'error', title: 'Please check the highlighted fields', message: bad.length + ' field' + (bad.length > 1 ? 's need' : ' needs') + ' attention.' }); return; }
      onValid(form, e.submitter || $('[type="submit"]', form));
    });
  };

  /** Newsletter forms: [data-newsletter] */
  function initNewsletter() {
    $$('[data-newsletter]').forEach(function (form) {
      var input = $('input[type="email"]', form), msg = form.parentNode.querySelector('.form-message'), btn = $('button[type="submit"]', form);
      form.setAttribute('novalidate', '');
      // INTEGRATION POINT (newsletter): replace the simulated request below with a call to your
      // email provider (Mailchimp, Brevo, ConvertKit…) — usually via your own server endpoint.
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = NX.validators.email(input.value);
        form.classList.toggle('is-invalid', !ok); input.setAttribute('aria-invalid', !ok);
        if (!ok) { if (msg) { msg.className = 'form-message is-error'; msg.textContent = 'Please enter a valid email address, e.g. name@example.com'; } input.focus(); return; }
        btn.classList.add('is-loading');
        setTimeout(function () {
          btn.classList.remove('is-loading'); form.reset();
          if (msg) { msg.className = 'form-message is-success'; msg.textContent = 'You\u2019re on the list! Use code NEXORA10 for 10% off your first order.'; }
          NX.toast({ title: 'Subscribed', message: 'Welcome to the Nexora Signal.' });
        }, NX.reducedMotion ? 0 : 800);
      });
    });
  }

  /* ================================================================
     BOOT
     ================================================================ */
  NX.initComponents = function () {
    initGlobalActions(); initAnnouncement(); initHeader(); initSearch(); initMobileNav();
    initCartDrawer(); initModals(); initBackToTop(); initNewsletter(); initPageTransitions();
    // product lists declared in markup: <div data-products="trending" data-limit="8">
    $$('[data-products]').forEach(function (el) {
      NX.renderProductList(el, NX.selectProducts(el.dataset.products, parseInt(el.dataset.limit, 10) || 0, el.dataset.category));
    });
    $$('[data-countdown]').forEach(NX.initCountdown);
    $$('[data-carousel-root]').forEach(NX.initCarousel);
    NX.initAccordions();
    NX.observeReveal();
    var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
  };
})(window, document);
