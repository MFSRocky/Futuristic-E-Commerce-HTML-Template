# NEXORA — ThemeForest submission guide (author notes, not shipped)

## Upload files (in `release/`)
| Upload field | File | Spec |
|---|---|---|
| Thumbnail | `nexora-thumbnail-80x80.png` | 80×80 PNG/JPG |
| Theme Preview | `nexora-theme-preview.zip` | `01_nexora_preview.jpg` is 590×300 (inline preview). `02_`–`14_` are 1170 px wide JPGs, each ≤ 1500 px tall (see `preview-assets/README.md`) |
| Cover image (only where the form offers a cover field) | `nexora-cover-2340x1560.jpg` | 3:2, 2340×1560 |
| Main Files | `nexora-main-files-v1.0.0.zip` | `NEXORA/` → `template/`, `documentation/`, `CREDITS.txt`, `README.txt` |
| Live preview | Host `site/` (with demo images) and enter the URL | — |

## Required by Envato (verified against Envato author help articles)
- [x] 80×80 thumbnail, and a 590×300 first preview image named `01_…` in the Theme Preview ZIP, with the rest numbered in display order.
- [x] English documentation (HTML) that covers installation, file structure and customisation.
- [x] Credits and source URLs for every font, icon and image used (docs plus `CREDITS.txt`).
- [x] Only assets licensed for redistribution in the download: OFL fonts, ISC icons and original placeholders.
- [x] AI-generated images used in previews only. **They are not in the download** (`package.py` hash-checks this).
- [x] No photos of real people or celebrities. No Envato Elements assets.
- [x] The item description must state that preview-only images are not included (text below).

## Recommended, not mandated
- Main ZIP root named after the item, with separate template and documentation folders.
- Preview images 1170 px wide (570 px minimum), ≤ 1500 px tall, ≤ 20 MB, up to 15 images, and a 3:2 cover of 2340×1560 (1170×780 minimum) that shows the real item with little marketing text. Source: Envato's "Item Presentation Requirements" article. It replaces older forum advice of "≤ 900 px wide"; `package.py` checks all of this.
- A consistent visual style across previews. All previews are composed from authentic screenshots, never upscaled.
- `?v=` cache-busting, HTML region comments, `INTEGRATION POINT` code comments.

## Suggested item description: key lines
> NEXORA is a premium, futuristic multi-page e-commerce HTML template for audio, wearables, gaming and lifestyle-tech stores. It has **13 HTML pages**: Home, Shop, Product Details, Categories, Wishlist, Cart, Checkout, About, Contact, FAQ, Blog, Blog Details and 404. It is built with HTML5, CSS3 and vanilla JavaScript, with no frameworks.
>
> **Note:** Checkout and payment are a front-end demonstration. No payment is processed, so connect your own backend or payment provider.
>
> **Images:** The product and lifestyle images in the live preview are for demonstration only and are **not included** in the download. Branded placeholders with the same file names and dimensions ship instead.
>
> **Credits:** Syne, Inter and JetBrains Mono (SIL OFL 1.1) · Lucide icons (ISC).

## Rebuild pipeline (author tools in `tools/`)
`build.py` (assemble pages) → `qa.py` / `flows.py` / `a11y.py` / `audit.py` (verification) → `capture.py` (screenshots) → `compose.py` (previews) → `package.py` (ZIPs).
Note: `build.py` needs `lucide-static` in `/tmp/pkgs` (`npm i lucide-static@1.75.0`) and `a11y.py` needs `axe-core`.
