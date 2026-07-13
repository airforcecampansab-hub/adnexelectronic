# Iceberg — House of Icecreams & Pastries

A premium, full-screen cinematic homepage for **Iceberg** (Nandyal, Andhra Pradesh) —
ice creams, thick shakes, sludges, pastries and custom celebration cakes.

## Experience

- **Full-screen snap-scroll** — GSAP ScrollTrigger snaps the viewport to each
  category section (hero → Ice Cream → Milk Shake → Sludge → Pastries → Cakes)
- **Cinematic reels** — the hero and video sections play optimized, muted,
  looping product films (`berry-reel.mp4`, `pista-reel.mp4`, `sludge-loop.mp4`);
  image sections get a scroll-scrubbed Ken Burns drift instead
- **Apple-style glassmorphism cards** — each category reveals a frosted product
  card (name, highlights, price, WhatsApp order CTA) after the scene plays
- **Luxury cafe aesthetic** — Fraunces + Outfit variable fonts (self-hosted),
  deep charcoal + gold palette, soft spacing, minimalist type
- **Contact integration** — sticky nav with Instagram
  ([@iceberg_ndl](https://www.instagram.com/iceberg_ndl)) and a floating
  WhatsApp button (+91 83408 13972) with prefilled order messages

## Performance

- Videos are lazy-loaded (`data-src` + IntersectionObserver) and only play
  while on screen; each is H.264, muted, `+faststart`, 0.4–2 MB
- Poster frames paint instantly; the hero poster is preloaded
- Zero third-party requests: GSAP and both fonts are vendored locally
- Reduced-motion users get a static, fully readable page (no snap, no autoplay)

## Structure

```
index.html      — single-page markup (hero + 5 category panels)
styles.css      — luxury theme, glass cards, responsive layout
script.js       — GSAP snap-scroll, panel choreography, lazy video engine
assets/         — reels, posters, panel crops, brand photos
assets/fonts/   — Fraunces & Outfit variable woff2
assets/vendor/  — gsap, ScrollTrigger, ScrollToPlugin
```

## Contact

- Instagram: [@iceberg_ndl](https://www.instagram.com/iceberg_ndl)
- WhatsApp: [+91 83408 13972](https://wa.me/918340813972)
