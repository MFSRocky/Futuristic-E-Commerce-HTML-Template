/**
 * NEXORA — Demo catalogue data
 * ------------------------------------------------------------------
 * Edit this file to change products, categories, coupons and store
 * settings. All prices are in USD. Images live in assets/images/products.
 * See documentation → "Products & Data" for the full field reference.
 */
(function (window) {
  'use strict';

  var IMG = 'assets/images/products/';

  var settings = {
    currency: 'USD',
    locale: 'en-US',
    freeShippingThreshold: 150,
    standardShipping: 12,
    expressShipping: 24,
    taxRate: 0.08,
    maxQty: 10
  };

  var categories = [
    { id: 'audio', name: 'Audio', icon: 'headphones', tagline: 'Spatial sound, tuned to you', description: 'Headphones, earbuds and speakers engineered with adaptive acoustics and studio-grade drivers.', image: IMG + 'aether-x1.webp' },
    { id: 'wearables', name: 'Wearables', icon: 'watch', tagline: 'Intelligence you wear', description: 'Smartwatches, rings and AR eyewear that read your body and augment your world, quietly.', image: IMG + 'chronos-s.webp' },
    { id: 'gaming', name: 'Gaming', icon: 'gamepad-2', tagline: 'Zero-latency play', description: 'Controllers, keyboards and mice built for competitive precision and endless sessions.', image: IMG + 'vector-pro.webp' },
    { id: 'bundles', name: 'Bundles', icon: 'package', tagline: 'Curated kits, smarter prices', description: 'Hand-paired sets that work beautifully together and save up to 15% on individual prices.', image: IMG + 'bundle-studio-sound.webp' }
  ];

  var colors = {
    graphite: { name: 'Graphite', hex: '#3B3F4C', filter: 'none' },
    lunar: { name: 'Lunar Silver', hex: '#C9CDD6', filter: 'brightness(1.18) saturate(.55)' },
    nebula: { name: 'Nebula', hex: '#8B5CF6', filter: 'hue-rotate(28deg) saturate(1.35)' },
    pearl: { name: 'Pearl', hex: '#EEF0F4', filter: 'none' },
    onyx: { name: 'Onyx', hex: '#16181F', filter: 'brightness(.82) contrast(1.1)' },
    aurora: { name: 'Aurora', hex: '#22D3EE', filter: 'hue-rotate(-40deg) saturate(1.2)' },
    titanium: { name: 'Titanium', hex: '#8A8F9C', filter: 'none' },
    smoke: { name: 'Smoke', hex: '#2B2E38', filter: 'none' },
    ice: { name: 'Ice', hex: '#A5F3FC', filter: 'hue-rotate(-60deg) brightness(1.1)' }
  };

  function p(o) { return o; }

  var products = [
    p({ id: 'aether-x1', name: 'Aether X1 Headphones', category: 'audio', price: 349, oldPrice: 399, rating: 4.9, reviews: 1284, stock: 24, sold: 8420, badges: ['bestseller'], tags: ['headphones', 'noise cancelling', 'wireless', 'anc'], createdAt: '2026-05-02',
      image: IMG + 'aether-x1.webp', gallery: [IMG + 'aether-x1.webp', IMG + 'aether-x1-detail.webp', IMG + 'bundle-studio-sound.webp'],
      colors: ['graphite', 'lunar', 'nebula'],
      short: 'Adaptive noise cancelling over-ears with a 60-hour battery, spatial audio and a featherweight titanium frame.',
      specs: { 'Driver': '40 mm beryllium-coated', 'Noise cancelling': 'Adaptive hybrid ANC, 8 mics', 'Battery': 'Up to 60 hours (ANC off)', 'Charging': 'USB-C fast charge — 10 min = 6 h', 'Connectivity': 'Bluetooth 5.4, multipoint', 'Weight': '254 g' } }),
    p({ id: 'pulse-buds-pro', name: 'Pulse Buds Pro', category: 'audio', price: 179, rating: 4.7, reviews: 932, stock: 56, sold: 6120, badges: ['new'], tags: ['earbuds', 'wireless', 'anc', 'sport'], createdAt: '2026-10-21',
      image: IMG + 'pulse-buds-pro.webp', gallery: [IMG + 'pulse-buds-pro.webp', IMG + 'pulse-buds-pro-detail.webp'],
      colors: ['pearl', 'onyx'],
      short: 'Pocketable earbuds with lossless audio, sweat-proof IP57 shells and a case that charges wirelessly.',
      specs: { 'Driver': '11 mm dynamic', 'Noise cancelling': 'Active, transparency mode', 'Battery': '9 h buds / 36 h with case', 'Water resistance': 'IP57', 'Connectivity': 'Bluetooth 5.4, LE Audio', 'Weight': '4.8 g per bud' } }),
    p({ id: 'orbit-360', name: 'Orbit 360 Speaker', category: 'audio', price: 229, oldPrice: 279, rating: 4.6, reviews: 418, stock: 7, sold: 2310, badges: ['sale'], tags: ['speaker', 'smart home', 'wifi'], createdAt: '2026-03-14',
      image: IMG + 'orbit-360.webp', gallery: [IMG + 'orbit-360.webp', IMG + 'orbit-360-detail.webp'],
      colors: ['graphite', 'lunar'],
      short: 'Room-filling 360° sound with a reactive light halo, voice control and multi-room pairing.',
      specs: { 'Output': '60 W, 360° array', 'Drivers': '1 woofer, 3 tweeters', 'Connectivity': 'Wi-Fi 6, Bluetooth 5.3, AirPlay-ready', 'Battery': 'Mains powered', 'Dimensions': '110 × 190 mm', 'Weight': '1.4 kg' } }),
    p({ id: 'chronos-s', name: 'Chronos S Smartwatch', category: 'wearables', price: 429, rating: 4.8, reviews: 1067, stock: 31, sold: 5480, badges: ['bestseller'], tags: ['smartwatch', 'fitness', 'health'], createdAt: '2026-08-30',
      image: IMG + 'chronos-s.webp', gallery: [IMG + 'chronos-s.webp', IMG + 'chronos-s-detail.webp', IMG + 'bundle-biometric-kit.webp'],
      colors: ['onyx', 'titanium'], sizes: ['41 mm', '45 mm'],
      short: 'A ceramic smartwatch with always-on AMOLED, ECG, blood-oxygen and a week of battery per charge.',
      specs: { 'Display': '1.9" LTPO AMOLED, 2000 nits', 'Case': 'Black zirconia ceramic', 'Sensors': 'ECG, SpO₂, skin temperature, HRV', 'Battery': 'Up to 7 days', 'Water resistance': '5 ATM', 'Connectivity': 'LTE (optional), GPS dual-band' } }),
    p({ id: 'halo-ring', name: 'Halo Smart Ring', category: 'wearables', price: 299, rating: 4.5, reviews: 356, stock: 18, sold: 1980, badges: ['new'], tags: ['ring', 'sleep', 'health', 'wearable'], createdAt: '2026-11-04',
      image: IMG + 'halo-ring.webp', gallery: [IMG + 'halo-ring.webp', IMG + 'halo-ring-detail.webp'],
      colors: ['titanium', 'onyx'], sizes: ['6', '7', '8', '9', '10', '11'],
      short: 'Sleep, recovery and readiness insights from a 4-gram titanium ring you will forget you are wearing.',
      specs: { 'Material': 'Aerospace-grade titanium', 'Sensors': 'PPG, temperature, 3-axis accelerometer', 'Battery': 'Up to 8 days', 'Water resistance': '100 m', 'Weight': '4 g', 'App': 'iOS & Android' } }),
    p({ id: 'vision-lens', name: 'Vision Lens AR Glasses', category: 'wearables', price: 799, oldPrice: 899, rating: 4.7, reviews: 284, stock: 4, sold: 940, badges: ['sale', 'new'], tags: ['ar', 'glasses', 'spatial', 'display'], createdAt: '2026-10-02',
      image: IMG + 'vision-lens.webp', gallery: [IMG + 'vision-lens.webp', IMG + 'vision-lens-detail.webp', IMG + 'bundle-creator-kit.webp'],
      colors: ['smoke', 'aurora'],
      short: 'Lightweight AR eyewear projecting a private 120" virtual display with open-ear spatial audio.',
      specs: { 'Display': 'Dual micro-OLED, 1920 × 1080 per eye', 'Field of view': '52°', 'Audio': 'Open-ear directional speakers', 'Battery': 'Up to 5 h', 'Connectivity': 'USB-C DisplayPort, Wi-Fi 6E', 'Weight': '79 g' } }),
    p({ id: 'vector-pro', name: 'Vector Pro Controller', category: 'gaming', price: 159, oldPrice: 189, rating: 4.8, reviews: 1532, stock: 40, sold: 9870, badges: ['bestseller', 'sale'], tags: ['controller', 'gamepad', 'wireless', 'haptics'], createdAt: '2026-02-18',
      image: IMG + 'vector-pro.webp', gallery: [IMG + 'vector-pro.webp', IMG + 'vector-pro-detail.webp'],
      colors: ['smoke', 'nebula'],
      short: 'Hall-effect sticks, adaptive triggers and four remappable back paddles in a translucent shell.',
      specs: { 'Sticks': 'Hall-effect, drift-free', 'Triggers': 'Adaptive with trigger stops', 'Latency': '1 ms (2.4 GHz)', 'Battery': 'Up to 40 h', 'Compatibility': 'PC, Android, iOS, consoles*', 'Weight': '268 g' } }),
    p({ id: 'flux-75', name: 'Flux 75 Keyboard', category: 'gaming', price: 219, rating: 4.9, reviews: 742, stock: 15, sold: 4120, badges: [], tags: ['keyboard', 'mechanical', 'rgb', 'hot-swap'], createdAt: '2026-06-11',
      image: IMG + 'flux-75.webp', gallery: [IMG + 'flux-75.webp', IMG + 'flux-75-detail.webp', IMG + 'bundle-command-deck.webp'],
      colors: ['smoke'], sizes: ['Linear', 'Tactile', 'Silent'],
      short: 'A gasket-mounted 75% mechanical keyboard with hot-swap sockets, PBT keycaps and underglow.',
      specs: { 'Layout': '75%, 82 keys', 'Mount': 'Gasket, poron dampened', 'Switches': 'Hot-swap 5-pin', 'Polling rate': '8000 Hz wired', 'Connectivity': 'USB-C, 2.4 GHz, Bluetooth', 'Battery': '4000 mAh' } }),
    p({ id: 'glide-x', name: 'Glide X Mouse', category: 'gaming', price: 129, rating: 4.6, reviews: 611, stock: 62, sold: 3760, badges: ['new'], tags: ['mouse', 'wireless', 'esports'], createdAt: '2026-09-25',
      image: IMG + 'glide-x.webp', gallery: [IMG + 'glide-x.webp', IMG + 'glide-x-detail.webp'],
      colors: ['onyx', 'ice'],
      short: 'A 49-gram wireless esports mouse with a 32K optical sensor and optical micro-switches.',
      specs: { 'Sensor': '32,000 DPI optical', 'Weight': '49 g', 'Switches': 'Optical, 100M clicks', 'Polling rate': '4000 Hz wireless', 'Battery': 'Up to 95 h', 'Feet': 'PTFE, rounded edges' } }),
    p({ id: 'studio-sound-kit', name: 'Studio Sound Kit', category: 'bundles', price: 499, oldPrice: 578, rating: 4.9, reviews: 203, stock: 12, sold: 860, badges: ['sale'], tags: ['bundle', 'headphones', 'speaker', 'audio'], createdAt: '2026-07-07',
      image: IMG + 'bundle-studio-sound.webp', gallery: [IMG + 'bundle-studio-sound.webp', IMG + 'bundle-studio-sound-detail.webp', IMG + 'aether-x1.webp', IMG + 'orbit-360.webp'],
      colors: ['graphite'],
      short: 'Aether X1 Headphones + Orbit 360 Speaker. Seamless hand-off between personal and room audio.',
      specs: { 'Includes': 'Aether X1 Headphones, Orbit 360 Speaker', 'You save': '$79 vs. separate', 'Warranty': '2 years on both items', 'Shipping': 'Free express shipping' } }),
    p({ id: 'command-deck', name: 'Command Deck Bundle', category: 'bundles', price: 299, oldPrice: 348, rating: 4.8, reviews: 177, stock: 20, sold: 1140, badges: ['hot'], tags: ['bundle', 'keyboard', 'mouse', 'gaming'], createdAt: '2026-09-01',
      image: IMG + 'bundle-command-deck.webp', gallery: [IMG + 'bundle-command-deck.webp', IMG + 'bundle-command-deck-detail.webp', IMG + 'flux-75.webp', IMG + 'glide-x.webp'],
      colors: ['smoke'],
      short: 'Flux 75 Keyboard + Glide X Mouse sharing one 8K receiver. The competitive desk, sorted.',
      specs: { 'Includes': 'Flux 75 Keyboard (Linear), Glide X Mouse', 'You save': '$49 vs. separate', 'Receiver': 'Shared 8K dongle', 'Warranty': '2 years' } }),
    p({ id: 'biometric-kit', name: 'Biometric Kit', category: 'bundles', price: 649, oldPrice: 728, rating: 4.7, reviews: 96, stock: 9, sold: 410, badges: ['new'], tags: ['bundle', 'smartwatch', 'ring', 'health'], createdAt: '2026-10-28',
      image: IMG + 'bundle-biometric-kit.webp', gallery: [IMG + 'bundle-biometric-kit.webp', IMG + 'bundle-biometric-kit-detail.webp', IMG + 'chronos-s.webp', IMG + 'halo-ring.webp'],
      colors: ['onyx'],
      short: 'Chronos S Smartwatch + Halo Smart Ring. Round-the-clock health data, day and night.',
      specs: { 'Includes': 'Chronos S (45 mm), Halo Smart Ring', 'You save': '$79 vs. separate', 'Membership': '12 months Nexora Health+ included', 'Warranty': '2 years' } }),
    p({ id: 'creator-kit', name: 'Creator Kit', category: 'bundles', price: 899, oldPrice: 978, rating: 4.6, reviews: 58, stock: 6, sold: 230, badges: [], tags: ['bundle', 'ar', 'earbuds', 'creator'], createdAt: '2026-08-12',
      image: IMG + 'bundle-creator-kit.webp', gallery: [IMG + 'bundle-creator-kit.webp', IMG + 'bundle-creator-kit-detail.webp', IMG + 'vision-lens.webp', IMG + 'pulse-buds-pro.webp'],
      colors: ['smoke'],
      short: 'Vision Lens AR Glasses + Pulse Buds Pro. A private cinema and studio wherever you go.',
      specs: { 'Includes': 'Vision Lens AR Glasses, Pulse Buds Pro', 'You save': '$79 vs. separate', 'Carry case': 'Included', 'Warranty': '2 years' } })
  ];

  // Demo coupon codes (frontend only — validate server-side in production)
  var coupons = {
    NEXORA10: { type: 'percent', value: 10, label: '10% off your order' },
    FUTURE25: { type: 'fixed', value: 25, min: 200, label: '$25 off orders over $200' },
    FREESHIP: { type: 'shipping', value: 0, label: 'Free standard shipping' }
  };

  var reviews = [
    { name: 'Maya Okafor', initials: 'MO', rating: 5, date: 'Oct 28, 2026', title: 'Silence never sounded this good', text: 'The noise cancelling is uncanny — the open office just disappears. Battery has lasted me two full work weeks.' },
    { name: 'Daniel Reyes', initials: 'DR', rating: 5, date: 'Oct 12, 2026', title: 'Premium in every detail', text: 'Packaging, materials, the app, the haptic click of the controls. It all feels considered. Worth every cent.' },
    { name: 'Lena Fischer', initials: 'LF', rating: 4, date: 'Sep 30, 2026', title: 'Comfortable for long sessions', text: 'Wore them on a 12-hour flight without any pressure points. Only wish the case was a little slimmer.' }
  ];

  window.NX_DATA = { settings: settings, categories: categories, colors: colors, products: products, coupons: coupons, reviews: reviews };
})(window);
