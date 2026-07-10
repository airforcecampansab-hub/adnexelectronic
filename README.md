# Iceberg — House of Icecreams & Pastries

A high-end, cinematic single-page website for **Iceberg** (Nandyal, Andhra Pradesh) —
faloodas, sundaes, customized cakes and pastries.

## Highlights

- **Dark premium aesthetic** — deep charcoal gradients with gold accents, Fraunces + Outfit typography
- **Cinematic hero** — full-screen background video with layered gradient veil
- **Scroll-driven showcase** — a sticky horizontal slider where treats glide into center and scale with scroll position (lerp-smoothed, reduced-motion fallback to a swipeable row)
- **Menu section** — grid of ice creams, faloodas, cakes and pastries with prices, filter tabs and Order Now buttons
- **3D experience** — interactive tilt stage that follows the pointer/touch, with a ready-made container for a Spline scene (`data-spline-scene` on `#splineStage`)
- **Mobile-app UI** — sticky filter pills, full-screen menu overlay, safe-area padding, fluid type

## Structure

```
index.html   — single-page markup
styles.css   — all styling (dark theme, animations, responsive)
script.js    — nav, menu filters, reveal-on-scroll, showcase slider, 3D tilt
assets/      — brand photos + hero video
```

## Swapping in the hero video

The hero is a full-screen, muted, looping, controls-free video player,
load-optimized with `preload="auto"` and a dark instant-paint poster.

To use your **Black Forest Torte commercial**, drop the file in as:

```
assets/hero-black-forest.mp4      (H.264/AAC MP4, faststart, ~1080p, muted)
```

On load the page HEAD-checks for that file and auto-upgrades the hero to it —
no code change needed. Until it exists, the hero plays `assets/hero-reel.mp4`
as a fallback, so the site is never left with a blank hero. For best
compression you can also add a `.webm` and list it as an extra `<source>`.

## Featured showcase video (Cherry Vanilla Sundae)

The Featured section pairs a looping CGI commercial (left) with an
Apple-style glassmorphism spec card (right). Drop your CGI file in as:

```
assets/cherry-vanilla-sundae.mp4   (muted, H.264/AAC MP4, faststart)
```

Same auto-upgrade mechanism as the hero — it swaps in on load when present,
and falls back to `assets/hero-reel.mp4` until then.

## Embedding a Spline 3D model

Set the scene URL on the stage container in `index.html`:

```html
<div class="spline__stage" id="splineStage"
     data-spline-scene="https://prod.spline.design/XXXX/scene.splinecode">
```

The Spline viewer loads automatically and replaces the CSS tilt fallback.

## Contact

- Instagram: [@iceberg_ndl](https://www.instagram.com/iceberg_ndl)
- Phone: +91 83408 13972
