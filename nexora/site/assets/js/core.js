/**
 * NEXORA — Core utilities, persistent store & toast notifications
 * ------------------------------------------------------------------
 * Exposes window.NX with:
 *   NX.$ / NX.$$          — query helpers
 *   NX.money(n)           — currency formatter
 *   NX.icon(name)         — inline SVG sprite reference
 *   NX.store              — cart, wishlist & coupon state (localStorage)
 *   NX.toast(opts)        — toast notifications
 *   NX.getProduct(id)     — catalogue lookup
 */
(function (window, document) {
  'use strict';

  var DATA = window.NX_DATA;
  var S = DATA.settings;
  var NX = window.NX = window.NX || {};

  /* ---------- DOM helpers ---------- */
  NX.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  NX.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  NX.on = function (el, evt, sel, fn) {
    // delegated listener when `sel` is a string
    if (typeof sel === 'function') { el.addEventListener(evt, sel); return; }
    el.addEventListener(evt, function (e) {
      var t = e.target.closest(sel);
      if (t && el.contains(t)) fn.call(t, e, t);
    });
  };
  NX.escape = function (str) {
    return String(str).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  NX.icon = function (name, cls) {
    return '<svg class="icon ' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  };
  NX.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var fmt = new Intl.NumberFormat(S.locale, { style: 'currency', currency: S.currency, minimumFractionDigits: 2 });
  NX.money = function (n) { return fmt.format(Math.max(0, Math.round(n * 100) / 100)); };
  NX.qs = function (key) { return new URLSearchParams(window.location.search).get(key); };
  NX.debounce = function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; };

  NX.getProduct = function (id) { return DATA.products.find(function (p) { return p.id === id; }) || null; };
  NX.getCategory = function (id) { return DATA.categories.find(function (c) { return c.id === id; }) || null; };

  /* ---------- Safe localStorage ---------- */
  var storage = {
    get: function (key, fallback) {
      try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable (private mode) */ }
    }
  };
  NX.storage = storage;

  /* ---------- Store: cart + wishlist + coupon ---------- */
  var KEYS = { cart: 'nexora.cart.v1', wish: 'nexora.wishlist.v1', coupon: 'nexora.coupon.v1' };

  function lineKey(id, variant) { return id + '::' + (variant ? JSON.stringify(variant) : ''); }

  var store = {
    cart: storage.get(KEYS.cart, []),
    wishlist: storage.get(KEYS.wish, []),
    coupon: storage.get(KEYS.coupon, null),

    _emit: function (type) {
      document.dispatchEvent(new CustomEvent('nx:' + type, { detail: store }));
      document.dispatchEvent(new CustomEvent('nx:change', { detail: { type: type } }));
    },
    _sanitize: function () {
      // drop lines whose product no longer exists in the catalogue
      store.cart = store.cart.filter(function (l) { return NX.getProduct(l.id); });
      store.wishlist = store.wishlist.filter(function (id) { return NX.getProduct(id); });
      if (store.coupon && !DATA.coupons[store.coupon]) store.coupon = null;
    },
    saveCart: function () { storage.set(KEYS.cart, store.cart); store._emit('cart'); },
    saveWish: function () { storage.set(KEYS.wish, store.wishlist); store._emit('wishlist'); },

    addToCart: function (id, qty, variant) {
      var product = NX.getProduct(id); if (!product) return false;
      qty = Math.max(1, parseInt(qty, 10) || 1);
      var key = lineKey(id, variant);
      var line = store.cart.find(function (l) { return l.key === key; });
      if (line) line.qty = Math.min(S.maxQty, line.qty + qty);
      else store.cart.push({ key: key, id: id, qty: Math.min(S.maxQty, qty), variant: variant || null });
      store.saveCart();
      return true;
    },
    setQty: function (key, qty) {
      var line = store.cart.find(function (l) { return l.key === key; });
      if (!line) return;
      qty = parseInt(qty, 10);
      if (!qty || qty < 1) { store.removeFromCart(key); return; }
      line.qty = Math.min(S.maxQty, qty);
      store.saveCart();
    },
    removeFromCart: function (key) {
      store.cart = store.cart.filter(function (l) { return l.key !== key; });
      store.saveCart();
    },
    clearCart: function () { store.cart = []; store.coupon = null; storage.set(KEYS.coupon, null); store.saveCart(); },
    cartCount: function () { return store.cart.reduce(function (n, l) { return n + l.qty; }, 0); },

    isWished: function (id) { return store.wishlist.indexOf(id) > -1; },
    toggleWish: function (id) {
      var added;
      if (store.isWished(id)) { store.wishlist = store.wishlist.filter(function (x) { return x !== id; }); added = false; }
      else { store.wishlist.unshift(id); added = true; }
      store.saveWish();
      return added;
    },

    applyCoupon: function (code) {
      code = String(code || '').trim().toUpperCase();
      var c = DATA.coupons[code];
      if (!c) return { ok: false, message: 'That code isn\u2019t valid. Try NEXORA10, FUTURE25 or FREESHIP.' };
      var sub = store.totals().subtotal;
      if (c.min && sub < c.min) return { ok: false, message: code + ' requires a subtotal of ' + NX.money(c.min) + ' or more.' };
      store.coupon = code; storage.set(KEYS.coupon, code); store._emit('cart');
      return { ok: true, message: c.label + ' applied.' };
    },
    removeCoupon: function () { store.coupon = null; storage.set(KEYS.coupon, null); store._emit('cart'); },

    /**
     * Calculates all cart totals. `shippingMethod` = 'standard' | 'express'.
     */
    totals: function (shippingMethod) {
      var subtotal = store.cart.reduce(function (sum, l) { var p = NX.getProduct(l.id); return sum + (p ? p.price * l.qty : 0); }, 0);
      var savings = store.cart.reduce(function (sum, l) { var p = NX.getProduct(l.id); return sum + (p && p.oldPrice ? (p.oldPrice - p.price) * l.qty : 0); }, 0);
      var discount = 0, freeShipCoupon = false, c = store.coupon && DATA.coupons[store.coupon];
      if (c) {
        if (c.min && subtotal < c.min) { c = null; }
        else if (c.type === 'percent') discount = subtotal * c.value / 100;
        else if (c.type === 'fixed') discount = Math.min(c.value, subtotal);
        else if (c.type === 'shipping') freeShipCoupon = true;
      }
      var afterDiscount = Math.max(0, subtotal - discount);
      var shipping = 0;
      if (subtotal > 0) {
        if (shippingMethod === 'express') shipping = S.expressShipping;
        else shipping = (freeShipCoupon || subtotal >= S.freeShippingThreshold) ? 0 : S.standardShipping;
      }
      var tax = afterDiscount * S.taxRate;
      var round = function (n) { return Math.round(n * 100) / 100; };
      return {
        subtotal: round(subtotal), discount: round(discount), shipping: round(shipping), tax: round(tax),
        total: round(afterDiscount + shipping + tax), savings: round(savings), count: store.cartCount(),
        couponActive: !!c, freeShipRemaining: round(Math.max(0, S.freeShippingThreshold - subtotal))
      };
    }
  };
  store._sanitize();
  NX.store = store;

  // keep tabs in sync
  window.addEventListener('storage', function (e) {
    if (e.key === KEYS.cart) { store.cart = storage.get(KEYS.cart, []); store._emit('cart'); }
    if (e.key === KEYS.wish) { store.wishlist = storage.get(KEYS.wish, []); store._emit('wishlist'); }
  });

  /* ---------- Toasts ---------- */
  var toastIcons = { success: 'circle-check', error: 'circle-alert', info: 'info', wish: 'heart' };
  NX.toast = function (opts) {
    if (typeof opts === 'string') opts = { title: opts };
    var wrap = NX.$('#toasts');
    if (!wrap) return;
    var type = opts.type || 'success';
    var duration = opts.duration || 3600;
    var el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = '<span class="toast__icon">' + NX.icon(toastIcons[type] || 'info') + '</span>' +
      '<div><p class="toast__title">' + NX.escape(opts.title || '') + '</p>' + (opts.message ? '<p class="toast__msg">' + opts.message + '</p>' : '') + '</div>' +
      '<button class="toast__close" type="button" aria-label="Dismiss notification">' + NX.icon('x') + '</button>' +
      '<span class="toast__timer" style="animation-duration:' + duration + 'ms"></span>';
    wrap.appendChild(el);
    var remove = function () {
      if (!el.parentNode) return;
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, NX.reducedMotion ? 0 : 300);
    };
    var timer = setTimeout(remove, duration);
    el.addEventListener('mouseenter', function () { clearTimeout(timer); el.querySelector('.toast__timer').style.animationPlayState = 'paused'; });
    el.addEventListener('mouseleave', function () { timer = setTimeout(remove, 1500); });
    el.querySelector('.toast__close').addEventListener('click', remove);
    // cap visible toasts
    var all = wrap.querySelectorAll('.toast:not(.is-leaving)');
    if (all.length > 3) all[0].remove();
  };

  /* ---------- Focus trap (modals, drawers) ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  NX.trapFocus = function (container) {
    function handler(e) {
      if (e.key !== 'Tab') return;
      var items = NX.$$(FOCUSABLE, container).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', handler);
    return function release() { container.removeEventListener('keydown', handler); };
  };
  NX.firstFocusable = function (container) { return NX.$(FOCUSABLE, container); };

  /* ---------- Overlay manager (one scroll lock for all layers) ---------- */
  var openLayers = [];
  NX.layer = {
    open: function (el, opts) {
      opts = opts || {};
      if (el.classList.contains('is-open')) return;
      var prev = document.activeElement;
      el.classList.add('is-open');
      el.removeAttribute('aria-hidden');
      el.inert = false;
      document.body.classList.add('is-locked');
      var release = NX.trapFocus(el);
      openLayers.push({ el: el, prev: prev, release: release, onClose: opts.onClose });
      setTimeout(function () { var f = opts.focus ? NX.$(opts.focus, el) : NX.firstFocusable(el); if (f) f.focus({ preventScroll: true }); }, 60);
    },
    close: function (el) {
      var idx = openLayers.findIndex(function (l) { return l.el === el; });
      if (idx < 0) return;
      var layer = openLayers.splice(idx, 1)[0];
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
      el.inert = true;
      layer.release();
      if (!openLayers.length) document.body.classList.remove('is-locked');
      if (layer.onClose) layer.onClose();
      if (layer.prev && layer.prev.focus) layer.prev.focus({ preventScroll: true });
    },
    closeTop: function () { if (openLayers.length) NX.layer.close(openLayers[openLayers.length - 1].el); },
    isOpen: function () { return openLayers.length > 0; }
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') NX.layer.closeTop(); });
})(window, document);
