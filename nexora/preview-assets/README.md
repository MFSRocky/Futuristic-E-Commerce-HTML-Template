# NEXORA — preview assets (author material, not shipped to buyers)

Every image here is built from **authentic screenshots of the finished template** (`screenshots/`, captured with Playwright from the live demo). Screenshots are framed and labelled, but never retouched, mocked or upscaled. `tools/compose.py` fails the build if any screenshot would be shown above its native resolution.

## Contents

| Requirement | File | Size |
|---|---|---|
| Main product thumbnail | `thumbnail/nexora-thumbnail-80x80.png` | 80×80 PNG |
| Main theme preview (inline, required) | `theme-preview/01_nexora_preview.jpg` | 590×300 |
| Main theme preview (3:2 cover) | `cover/nexora-cover-2340x1560.jpg` | 2340×1560 |
| Main preview, gallery copy | `theme-preview/02_nexora_main_preview.jpg` | 1170×780 |
| Full homepage | `theme-preview/03_nexora_homepage_full.jpg` | 1170×1038: the whole page in 3 consecutive slices |
| Homepage sections (readable) | `theme-preview/04_nexora_homepage_sections.jpg` | 1170×1478 |
| Features / highlights | `theme-preview/05_nexora_features_highlights.jpg` | 1170×1409 |
| Desktop | `theme-preview/06_nexora_desktop.jpg` | 1170×1166: 9 pages at 1440 px |
| Tablet | `theme-preview/07_nexora_tablet.jpg` | 1170×780: 768 px |
| Mobile | `theme-preview/08_nexora_mobile.jpg` | 1170×780: 390 px |
| Responsive overview | `theme-preview/09_nexora_responsive.jpg` | 1170×780 |
| Shop | `theme-preview/10_nexora_shop.jpg` | 1170×1464 |
| Product details | `theme-preview/11_nexora_product_details.jpg` | 1170×1426 |
| Inner pages: cart and checkout | `theme-preview/12_nexora_cart_checkout.jpg` | 1170×1413 |
| Inner pages: about, contact, FAQ | `theme-preview/13_nexora_inner_pages.jpg` | 1170×1266 |
| Inner pages: blog, article, wishlist, 404 | `theme-preview/14_nexora_blog_more.jpg` | 1170×1043 |

All JPGs are sRGB with an embedded profile and saved at quality 92–93 with 4:4:4 chroma, so small UI text is not blurred. Each file is under 410 KB, far below the 20 MB limit.

## Specs these follow (checked November 2026, Envato Author Help Center)
- **Required (ThemeForest upload form):** an 80×80 thumbnail, plus a Theme Preview ZIP whose first image is `01_*.jpg` at exactly **590×300**. The other images are numbered `02_`, `03_` … in display order.
- **Recommended ("Item Presentation Requirements"):**
  - A 3:2 cover: 2340×1560 recommended, 1170×780 minimum, 20 MB maximum. It should show the real item and keep marketing text to a minimum.
  - Preview images: **1170 px wide** recommended, 570 px minimum, **1500 px maximum height**, 20 MB maximum, up to 15 images.
- Older forum advice says previews should be "≤ 900 px wide". This set follows the newer official article (1170 px) instead. The marketplace scales previews down for display.

## Rebuild
`python3 tools/capture.py` (needs the demo on :8080, about 7 min) → `python3 tools/compose.py` (about 25 s) → `python3 tools/package.py`. `package.py` re-checks every spec above before it writes `release/nexora-theme-preview.zip`.
