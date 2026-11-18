# NEXORA — Futuristic E-Commerce HTML Template

[![Template Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Envato%20Market-green.svg)](LICENSE.txt)
[![Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg)](#)
[![HTML5](https://img.shields.io/badge/HTML5-Semantic-orange.svg)](#)
[![CSS3](https://img.shields.io/badge/CSS3-Custom%20Properties-blue.svg)](#)

> **NEXORA** is a premium, futuristic multi-page e-commerce HTML template for audio, wearables, gaming gear, and lifestyle-tech stores. Built with semantic HTML5, modern CSS3, and modular vanilla JavaScript with zero frameworks and zero dependencies.

---

## Highlights

- **13 Complete Multi-Page HTML Pages**: Home, Shop, Product Details, Categories, Wishlist, Cart, Checkout, About, Contact, FAQ, Blog, Blog Details, and 404.
- **Pure Vanilla Stack**: Zero frameworks, zero jQuery, zero NPM dependencies required for deployment.
- **Working Client-Side Storefront UI**:
  - Live shopping cart with instant quantity controls, item removal, tax (8%), and free shipping progress bar ($150 threshold).
  - Promo coupon redemption (`NEXORA10`, `FUTURE25`, `FREESHIP`).
  - Wishlist persistence via browser `localStorage`.
  - Multi-faceted product catalog filtering by category, price, rating, and on-sale status.
  - Instant live search overlay with real-time keyword indexing.
  - Quick-view product modal with image zoom and variant pickers.
  - Interactive checkout demonstration with comprehensive field validation.
- **Cyberpunk Luxury Aesthetic**:
  - Deep dark mode color system (`#090B12`, glowing violet `#A855F7`, electric cyan `#00E5FF`, emerald green `#34D399`).
  - Fluid clamp typography and CSS custom properties for effortless rebranding.
  - Complete `prefers-reduced-motion` accessibility support.
- **100% Responsive**: Tested across 320px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px, and 1920px viewports with zero horizontal overflow.
- **SEO & Search Engine Ready**: Unique page titles, meta descriptions, Open Graph cards, `robots.txt`, and `sitemap.xml`.
- **Self-Hosted Open Source Fonts**: Syne, Inter, and JetBrains Mono (SIL Open Font License 1.1).
- **Vector Icons**: Inlined Lucide SVG icons (ISC License) with zero flicker or network latency.

---

## Directory Structure

```text
NEXORA/
├── documentation/               # Offline HTML help documentation
│   └── index.html               # Main documentation guide
├── template/                    # Deployable production website
│   ├── index.html               # Homepage
│   ├── shop.html                # Catalog & product grid
│   ├── product.html             # Product details
│   ├── categories.html          # Category index
│   ├── wishlist.html            # Saved products
│   ├── cart.html                # Cart page
│   ├── checkout.html            # Checkout demo
│   ├── about.html               # About brand
│   ├── contact.html             # Contact & inquiry form
│   ├── faq.html                 # Frequently asked questions
│   ├── blog.html                # Tech & lifestyle journal
│   ├── blog-details.html        # Article layout
│   ├── 404.html                 # Error page
│   ├── robots.txt               # Search engine directives
│   ├── sitemap.xml              # XML Sitemap
│   └── assets/
│       ├── css/style.css        # Central design system & tokens
│       ├── js/                  # Modular vanilla JS scripts
│       ├── fonts/               # Self-hosted WOFF2 fonts
│       ├── icons/               # SVG sprite & licenses
│       └── images/              # Branded placeholders (same sizes as demo)
├── CHANGELOG.md                 # Semantic version history
├── CREDITS.txt                  # Complete third-party asset credits
├── LICENSE.txt                  # Envato commercial license terms
├── README.md                    # Project overview & documentation
└── START-HERE.txt               # Quick buyer onboarding guide
```

---

## Local Development & Testing

Run a lightweight local server from the `template/` directory:

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

Open `http://localhost:8080` in your web browser.

---

## Important Disclosures

- **Checkout & Payments**: NEXORA is a static frontend website template. The checkout, cart, and payment forms are frontend demonstrations persisted in `localStorage`. To sell real goods, connect your backend API or payment provider (Stripe, PayPal, Lemon Squeezy, etc.).
- **Images**: Photography shown in live previews is for presentation only and is not included in the download. High-resolution branded placeholders with identical file names and pixel dimensions ship instead.

---

## Credits & License

- **Syne Font**: SIL OFL 1.1 (Bonjour Monde)
- **Inter Font**: SIL OFL 1.1 (Rasmus Andersson)
- **JetBrains Mono**: SIL OFL 1.1 (JetBrains)
- **Lucide Icons**: ISC License (Lucide Contributors)
- **Template & Code**: © 2026 TemplateFlux under Envato Market License.
