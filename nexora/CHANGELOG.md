# Changelog — NEXORA

All notable changes to NEXORA will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-11-18

### Initial Release
- **13 Multi-Page HTML Templates**:
  - `index.html` (Home)
  - `shop.html` (Shop / Catalog)
  - `product.html` (Product Details)
  - `categories.html` (Categories Directory)
  - `wishlist.html` (Saved Products)
  - `cart.html` (Shopping Cart)
  - `checkout.html` (Demo Checkout Flow)
  - `about.html` (About Us)
  - `contact.html` (Contact)
  - `faq.html` (FAQ with Anchor Links)
  - `blog.html` (Journal / Blog Listing)
  - `blog-details.html` (Article Layout)
  - `404.html` (Error Page)
- **Frontend Commerce Engine**:
  - Live shopping cart with instant quantity update, tax (8%), and free shipping tracker ($150 threshold).
  - Multi-coupon support (`NEXORA10`, `FUTURE25`, `FREESHIP`).
  - Wishlist persistence via `localStorage`.
  - Multi-faceted product filtering (category, price, rating, sale).
  - Quick-view product modal with image zoom and variant selection.
  - Client-side checkout form validation and simulated order receipt.
- **Design & Architecture**:
  - Modern cyberpunk / futuristic dark-mode styling with unified CSS custom properties (`:root`).
  - Zero third-party runtime frameworks or libraries (pure vanilla JavaScript and semantic HTML5).
  - Self-hosted web fonts: Syne, Inter, and JetBrains Mono (SIL Open Font License 1.1).
  - Inlined Lucide SVG sprite (ISC License) with zero external network dependencies.
  - Complete `robots.txt` and `sitemap.xml` included.
- **Documentation**:
  - Offline, searchable HTML help documentation (`documentation/index.html`).
