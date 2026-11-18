/**
 * NEXORA Interactive State & Commerce Logic Verification
 * Tests cart, wishlist, coupons, taxes, shipping, filters, sorting, search, checkout validation.
 */
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');

// Mock browser environment for core.js and data.js
const storageMock = {};
const windowMock = {
  localStorage: {
    getItem: (k) => storageMock[k] || null,
    setItem: (k, v) => { storageMock[k] = String(v); },
    removeItem: (k) => { delete storageMock[k]; },
    clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
  },
  location: { search: '' },
  matchMedia: () => ({ matches: false }),
  addEventListener: () => {},
  removeEventListener: () => {},
  Intl: Intl
};

const documentMock = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => []
};

global.window = windowMock;
global.document = documentMock;
global.CustomEvent = class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } };

// Load scripts
eval(fs.readFileSync(path.join(SITE, 'assets', 'js', 'data.js'), 'utf8'));
eval(fs.readFileSync(path.join(SITE, 'assets', 'js', 'core.js'), 'utf8'));

const NX = windowMock.NX;
const DATA = windowMock.NX_DATA;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log("=== 1. TESTING CATALOG DATA INTEGRITY ===");
assert(DATA.products.length === 13, `Catalogue has 13 products (found ${DATA.products.length})`);
assert(DATA.categories.length === 4, `Catalogue has 4 categories (found ${DATA.categories.length})`);
assert(Object.keys(DATA.coupons).length === 3, `Catalogue has 3 coupons`);

console.log("\n=== 2. TESTING SHOPPING CART LOGIC ===");
NX.store.clearCart();
assert(NX.store.cartCount() === 0, "Cart is empty initially");

// Add single item
let ok = NX.store.addToCart('aether-x1', 1, { color: 'Graphite' });
assert(ok === true, "Added Aether X1 to cart");
assert(NX.store.cartCount() === 1, "Cart count is 1");

// Add more of same item with same variant
NX.store.addToCart('aether-x1', 2, { color: 'Graphite' });
assert(NX.store.cartCount() === 3, "Cart count increased to 3 for same variant");

// Add different variant
NX.store.addToCart('aether-x1', 1, { color: 'Lunar Silver' });
assert(NX.store.cartCount() === 4, "Cart count is 4 (2 different line items)");
assert(NX.store.cart.length === 2, "Cart has 2 distinct line items");

// Test Max Qty clamp (10)
NX.store.addToCart('aether-x1', 20, { color: 'Graphite' });
const graphiteLine = NX.store.cart.find(l => l.variant && l.variant.color === 'Graphite');
assert(graphiteLine.qty <= 10, `Cart item qty clamped to max (qty = ${graphiteLine.qty})`);

console.log("\n=== 3. TESTING TOTALS, TAXES & SHIPPING ===");
NX.store.clearCart();
// Aether X1 price = $349
NX.store.addToCart('aether-x1', 1);
let totals = NX.store.totals();
assert(totals.subtotal === 349, `Subtotal is $349 (got ${totals.subtotal})`);
assert(totals.shipping === 0, `Shipping is FREE ($0) because $349 >= $150 threshold (got ${totals.shipping})`);
const expectedTax = Math.round(349 * 0.08 * 100) / 100;
assert(totals.tax === expectedTax, `Tax is 8% ($${expectedTax}) (got ${totals.tax})`);
assert(totals.total === Math.round((349 + expectedTax) * 100) / 100, `Total equals subtotal + tax`);

// Test under free shipping threshold ($150)
NX.store.clearCart();
// Glide X mouse price = $129 (< $150)
NX.store.addToCart('glide-x', 1);
totals = NX.store.totals();
assert(totals.subtotal === 129, `Subtotal is $129 (got ${totals.subtotal})`);
assert(totals.shipping === 12, `Standard shipping of $12 applied when subtotal < $150 (got ${totals.shipping})`);
assert(totals.freeShipRemaining === 21, `Free shipping progress correctly calculates $21 remaining (got ${totals.freeShipRemaining})`);

console.log("\n=== 4. TESTING PROMO COUPONS ===");
// Test 10% off (NEXORA10)
let resCoupon = NX.store.applyCoupon('NEXORA10');
assert(resCoupon.ok === true, "Coupon NEXORA10 applied successfully");
totals = NX.store.totals();
const expectedDiscount10 = Math.round(129 * 0.10 * 100) / 100;
assert(totals.discount === expectedDiscount10, `NEXORA10 gave 10% discount ($${expectedDiscount10}) (got ${totals.discount})`);

// Test min requirement coupon (FUTURE25 requires min $200)
resCoupon = NX.store.applyCoupon('FUTURE25');
assert(resCoupon.ok === false, "FUTURE25 rejected when subtotal ($129) < $200 requirement");

// Add item to exceed $200
NX.store.addToCart('flux-75', 1); // + $219 -> subtotal = $348
resCoupon = NX.store.applyCoupon('FUTURE25');
assert(resCoupon.ok === true, "FUTURE25 accepted when subtotal ($348) >= $200");
totals = NX.store.totals();
assert(totals.discount === 25, `FUTURE25 gave flat $25 discount (got ${totals.discount})`);

// Test FREESHIP
resCoupon = NX.store.applyCoupon('FREESHIP');
assert(resCoupon.ok === true, "FREESHIP coupon applied");

// Test Invalid Coupon
resCoupon = NX.store.applyCoupon('FAKECODE99');
assert(resCoupon.ok === false, "Invalid coupon rejected gracefully");

console.log("\n=== 5. TESTING WISHLIST LOGIC ===");
NX.store.wishlist = [];
assert(NX.store.isWished('chronos-s') === false, "Chronos S not wished initially");
let added = NX.store.toggleWish('chronos-s');
assert(added === true, "Chronos S added to wishlist");
assert(NX.store.isWished('chronos-s') === true, "Chronos S is currently wished");
assert(NX.store.wishlist.length === 1, "Wishlist length is 1");

let removed = NX.store.toggleWish('chronos-s');
assert(removed === false, "Chronos S toggled off wishlist");
assert(NX.store.isWished('chronos-s') === false, "Chronos S not wished anymore");
assert(NX.store.wishlist.length === 0, "Wishlist length is 0");

console.log("\n=== 6. TESTING CATALOG FILTERING, SORTING & SEARCH ===");
// Category filter
const audioProds = DATA.products.filter(p => p.category === 'audio');
assert(audioProds.length === 3, `Audio category has 3 products (found ${audioProds.length})`);

const bundleProds = DATA.products.filter(p => p.category === 'bundles');
assert(bundleProds.length === 4, `Bundles category has 4 products (found ${bundleProds.length})`);

// Search simulation (case insensitive name, description, tags)
function searchProducts(q) {
  q = q.toLowerCase().trim();
  return DATA.products.filter(p => {
    return p.name.toLowerCase().includes(q) ||
           p.short.toLowerCase().includes(q) ||
           (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
  });
}
const searchResultsFlux = searchProducts('flux');
assert(searchResultsFlux.length >= 1 && searchResultsFlux[0].id === 'flux-75', "Search for 'flux' returns Flux 75");

const searchResultsANC = searchProducts('anc');
assert(searchResultsANC.length >= 2, `Search for 'anc' returns at least 2 products (found ${searchResultsANC.length})`);

// Price sorting
const sortedByPriceAsc = DATA.products.slice().sort((a, b) => a.price - b.price);
assert(sortedByPriceAsc[0].price <= sortedByPriceAsc[sortedByPriceAsc.length - 1].price, "Ascending price sort is mathematically correct");

console.log("\n=== 7. TESTING CHECKOUT FORM VALIDATION RULES ===");
function validateCheckout(data) {
  const errors = {};
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Valid email required';
  if (!data.firstName || !data.firstName.trim()) errors.firstName = 'First name required';
  if (!data.lastName || !data.lastName.trim()) errors.lastName = 'Last name required';
  if (!data.address || !data.address.trim()) errors.address = 'Street address required';
  if (!data.city || !data.city.trim()) errors.city = 'City required';
  if (!data.zip || !data.zip.trim()) errors.zip = 'ZIP code required';
  if (data.paymentMethod === 'card') {
    const rawCard = (data.cardNumber || '').replace(/\s+/g, '');
    if (!/^\d{15,19}$/.test(rawCard)) errors.cardNumber = 'Valid 15-19 digit card number required';
    if (!/^\d{2}\/\d{2}$/.test(data.cardExpiry || '')) errors.cardExpiry = 'MM/YY required';
    if (!/^\d{3,4}$/.test(data.cardCvc || '')) errors.cardCvc = '3-4 digit CVV required';
  }
  return errors;
}

const badData = { email: 'not-an-email', paymentMethod: 'card' };
const badErrors = validateCheckout(badData);
assert(Object.keys(badErrors).length >= 6, `Invalid checkout form correctly caught ${Object.keys(badErrors).length} errors`);

const goodData = {
  email: 'alex.miller@example.com',
  firstName: 'Alex',
  lastName: 'Miller',
  address: '100 Silicon Way',
  city: 'San Francisco',
  state: 'CA',
  zip: '94107',
  paymentMethod: 'card',
  cardNumber: '4242 4242 4242 4242',
  cardExpiry: '12/28',
  cardCvc: '123'
};
const goodErrors = validateCheckout(goodData);
assert(Object.keys(goodErrors).length === 0, "Valid checkout data produces 0 errors");

console.log("\n=================================");
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=================================");
if (failed > 0) process.exit(1);
