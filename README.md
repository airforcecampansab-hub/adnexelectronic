# Iceberg — House of Icecreams & Pastries

A high-end, cinematic single-page website for **Iceberg** (Nandyal, Andhra Pradesh) —
faloodas, sundaes, customized cakes and pastries.

## Highlights

- **Dark premium aesthetic** — deep charcoal gradients with gold accents, Fraunces + Outfit typography
- **Cinematic hero** — full-screen background video with layered gradient veil
- **Scroll-driven showcase** — a sticky horizontal slider where treats glide into center and scale with scroll position (lerp-smoothed, reduced-motion fallback to a swipeable row)
- **Cinematic menu** — full-screen snap-scroll category panels (Ice Creams / Cakes & Wedding Cakes / Pastries) driven by GSAP ScrollTrigger: presentation-style snap, background parallax, and staggered fine-dining list entrances over full-bleed studio photography
- **3D experience** — interactive tilt stage that follows the pointer/touch, with a ready-made container for a Spline scene (`data-spline-scene` on `#splineStage`)
- **Mobile-app UI** — sticky filter pills, full-screen menu overlay, safe-area padding, fluid type

## Structure

```
index.html   — single-page markup
styles.css   — all styling (dark theme, animations, responsive)
script.js    — nav, category panels, reveal-on-scroll, showcase slider, 3D tilt
js/          — vendored GSAP 3.12.5 + ScrollTrigger (no CDN dependency)
assets/      — brand photos + hero video
```

## Cinematic category panels (GSAP ScrollTrigger)

The menu is three full-screen panels that snap into view like a presentation
(desktop), each with a slow parallax background and staggered entrances that
play on arrival and reverse on exit. GSAP is vendored in `js/` so it loads
same-origin. Mobile skips snap and parallax for performance; if GSAP is
absent or the visitor prefers reduced motion, a CSS scroll-snap +
IntersectionObserver fallback takes over automatically.

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

## Signature Flavours showcase (Strawberry · Berry · Pista)

A single switchable showcase pairs a cinematic product stage (left) with an
Apple-style glassmorphism spec card (right). Each flavour's stage shows the
product photo with a scroll-triggered "reconstruct" motion (mimicking the
CGI exploded-view → reassembly) and re-plays on every switch.

Drop your CGI commercials in with these exact names to auto-upgrade each
stage from photo to video (desktop; the photo stays as the mobile fallback):

```
assets/strawberry.mp4
assets/blueberry.mp4
assets/pista.mp4
```

All muted, H.264/AAC MP4, faststart, ~1080p. Product-photo posters live at
`assets/strawberry-hero.png`, `assets/berry-hero.jpeg`, `assets/pista-hero.png`.

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
