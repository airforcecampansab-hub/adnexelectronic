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
