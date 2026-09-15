# Inner Image Zoom — Shopify App Plan

Overview of planning and implementation for the Shopify app at `inner-image-zoom-app`, built on the [`inner-image-zoom`](https://github.com/laurenashpole/inner-image-zoom) vanilla package.

---

## Product direction

- **What it is:** A Shopify App Store app that adds **inner image zoom** to product pages — magnify inside the image frame, not a lightbox or gallery replacement.
- **Positioning:** Lightweight, performance-focused, simple setup. Compete on clarity and speed, not a full zoom suite (video, 360, gallery takeover).
- **Pricing (planned):** Monthly subscription, likely **$2.99/mo** (optional launch pricing at **$1.99/mo**). One-time pricing is uncommon in this category; Magic Zoom Plus at $69 is the main exception.
- **Distribution:** Public App Store listing via a **hosted React Router app** (not extension-only), with **Shopify App Pricing** for billing when ready to submit.

---

## Architecture

```text
inner-image-zoom-app/
├── app/                          # Embedded admin (React Router)
│   ├── routes/app._index.tsx     # Onboarding home
│   └── utils/                    # Theme deep link, embed status, product preview
├── extensions/inner-image-zoom/  # Theme app extension
│   ├── blocks/inner-image-zoom.liquid   # App embed (target: body)
│   └── assets/
│       ├── inner-image-zoom.min.js
│       ├── styles.min.css
│       └── iiz-init.js           # Theme compatibility wrapper
└── shopify.app.toml
```

| Layer | Role |
|-------|------|
| **Theme app extension** | Loads zoom on storefront; merchant settings in theme editor (App embeds) |
| **Hosted admin app** | Onboarding, embed status, deep links, preview link, future billing |
| **`inner-image-zoom` npm package** | Core zoom behavior (~4.5 KB gzip); copied/bundled into extension assets |

**Why not extension-only?** Extension-only apps are custom-distribution only — no App Store listing or Shopify billing.

---

## Done

### Scaffolding & extension

- [x] Scaffolded **hosted React Router app** (`inner-image-zoom-app`) with App Store distribution
- [x] Created **theme app extension** (`extensions/inner-image-zoom`)
- [x] Replaced template star-rating block with **app embed block** (`inner-image-zoom.liquid`)
- [x] Bundled **inner-image-zoom** UMD + CSS into extension assets
- [x] Merchant-configurable embed settings: zoom trigger, mobile fullscreen, breakpoint, preload, zoom scale

### Storefront adapter (`iiz-init.js`)

- [x] Product-page detection
- [x] Gallery image selectors (Dawn-oriented generic list)
- [x] Thumbnail exclusion
- [x] `getZoomSrc()` — Shopify CDN `?width=2048` for high-res zoom
- [x] Per-instance init via `$el` + `InnerImageZoomConfig`
- [x] `destroyAll()` / re-init on gallery changes
- [x] `MutationObserver` + debounced re-init
- [x] `shopify:section:load` + `variant:change` event hooks
- [x] Refactored naming: `initObservers`, `initEvents`, `debouncedInit`, `getGalleryImages`

### Admin onboarding

- [x] Replaced template demo home page with **setup instructions**
- [x] **Theme editor deep link** to activate app embed (live theme ID when available)
- [x] Removed template **additional page** and demo product/metaobject admin code
- [x] **Embed status banner** — reads `config/settings_data.json` via Admin API
- [x] **Product preview link** — first active product storefront URL when embed is enabled
- [x] Scope cleanup: **`read_themes,read_products`** (removed demo write scopes and metafield/metaobject config)

### Utilities

- [x] `app/utils/theme-editor.server.ts` — deep link builder
- [x] `app/utils/embed-status.server.ts` — enabled / disabled / not_added / unknown
- [x] `app/utils/product-preview.server.ts` — preview URL for active product

---

## Need to do

### Before meaningful storefront testing

- [ ] **Re-approve app scopes** on dev store after `read_themes` + `read_products` changes (`shopify app dev`, reinstall if needed)
- [ ] **Enable app embed** on dev store theme and verify zoom on a product page
- [ ] **Remove leftover template files** if still present (e.g. `extensions/inner-image-zoom/snippets/stars.liquid`)

### Theme compatibility (Step 3 — tabled until themes installed)

Blocked on installing **Dawn**, **Horizon**, and at least one other OS 2.0 theme on a dev store.

- [ ] Test on **Dawn** — click/hover zoom, variant swap, carousel slides, mobile fullscreen
- [ ] Test on **Horizon** — same; watch for conflicts with native tap-to-zoom / lightbox
- [ ] Tighten selectors and **init only visible slide** if carousel init causes issues
- [ ] **Skip non-image media** (video, 3D) if zoom attaches incorrectly
- [ ] Add **theme profiles** only where generic selectors fail
- [ ] Document supported themes for App Store listing (“tested on Dawn”, etc.)

### Launch path

- [ ] **Hosting + deploy** — production URL for `application_url` (Fly, Railway, etc.)
- [ ] **`shopify app deploy`** — push extension + app config
- [ ] **Billing** — Shopify App Pricing in Partner Dashboard (~$2.99/mo, trial)
- [ ] **App Store listing** — copy, screenshots, privacy policy, support contact, test credentials for review
- [ ] **README / CHANGELOG** — update away from template demo language
- [ ] Optional: pursue **Built for Shopify** (≤10 pt Lighthouse impact on PDP; embed scoped to product pages)

---

## Nice to have later

### Admin UX

- [ ] **Revalidate on focus** — refetch embed status when merchant returns from theme editor tab (avoids manual refresh after enabling embed)
- [ ] **`shopify:section:unload`** cleanup in theme editor preview (avoid stacked listeners during customize)

### Storefront / compatibility

- [ ] **Dawn pub/sub fast path** — subscribe to `PUB_SUB_EVENTS.variantChange` when available (optimization over MutationObserver alone)
- [ ] **Conflict detection** with theme lightbox / native zoom
- [ ] **Collection page zoom** (competitors like ZoomMaster support this; out of scope for v1 positioning)

### Product / pricing

- [ ] **Freemium tier** (free with badge, paid removes branding / unlocks all gallery images)
- [ ] **Launch pricing** at $1.99/mo for early merchants
- [ ] **Zoom quality preset** (“Standard / High”) instead of exposing raw CDN width — decided **not** to expose zoom width; fixed 2048 is fine for v1

### Package / release

- [ ] Build step to copy fresh UMD/CSS from `inner-image-zoom` monorepo into extension on release
- [ ] Performance comparison page on innerimagezoom.com (optional marketing)

---

## Key decisions (reference)

| Topic | Decision |
|-------|----------|
| App type | Hosted React Router app + theme extension (not extension-only) |
| Storefront integration | App **embed** block (`target: body`), not section block |
| High-res images | Fixed `width=2048` in `getZoomSrc`; no merchant-facing width setting |
| Zoom scale | Merchant setting in embed schema (0.5–1, step 0.1) |
| Re-init strategy | `MutationObserver` + debounce; not relying on `variant:change` alone |
| Admin settings | Zoom behavior in **theme editor** embed settings; admin app for onboarding only |
| Scopes (current) | `read_themes`, `read_products` |
| Theme compatibility | Generic selectors first; theme profiles only as needed after testing |

---

## Competitive context (brief)

- Category is **moderately crowded** (lightbox, lens, gallery apps dominate search).
- **Inner zoom** exists in competitors (Magic Zoom Plus, Gowebbaby, Magepow) but usually as one mode among many — not a dedicated inner-zoom-only product.
- **Performance angle** is credible: ~4.5 KB gzip, lazy high-res load, no gallery replacement.
- **Magic Zoom Plus** ($69 one-time) is the established full-featured incumbent.

---

## Suggested order of work

1. Dev store: enable embed, confirm zoom works on one product (current theme)
2. Install Dawn + Horizon → theme compatibility pass
3. Deploy + billing + App Store listing
4. Polish: revalidate on focus, Built for Shopify, marketing site tie-in

---

*Last updated from planning session — adjust checkboxes as work progresses.*
