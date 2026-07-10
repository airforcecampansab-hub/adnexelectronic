// ICEBERG — interactions
// Vanilla, GPU-accelerated animations: rAF loop + lerp smoothing for a
// Framer-Motion-like buttery feel without a framework dependency.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ---------- video auto-upgrade ----------
   Each player ships a working fallback source. If the preferred commercial
   file has been dropped into /assets, swap to it seamlessly once confirmed
   present — the site is never left with a broken/blank player if it isn't
   there yet. Used for the hero (Black Forest) and the featured CGI showcase
   (Cherry Vanilla Sundae). */
function upgradeVideo(id, preferred) {
  const video = document.getElementById(id);
  if (!video) return;
  fetch(preferred, { method: "HEAD" })
    .then((res) => {
      if (!res.ok) return;
      const source = video.querySelector("source");
      if (source.getAttribute("src") === preferred) return;
      source.setAttribute("src", preferred);
      video.load();
      video.play().catch(() => {});
    })
    .catch(() => {});
}
upgradeVideo("heroVideo", "assets/hero-black-forest.mp4");

/* ---------- sticky nav ---------- */
const nav = document.getElementById("nav");
const onNavScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
onNavScroll();
window.addEventListener("scroll", onNavScroll, { passive: true });

/* ---------- mobile menu ---------- */
const burger = document.getElementById("navBurger");
const links = document.getElementById("navLinks");
burger.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  burger.classList.toggle("is-open", open);
  document.body.style.overflow = open ? "hidden" : "";
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("is-open");
    burger.classList.remove("is-open");
    document.body.style.overflow = "";
  })
);

/* ---------- reveal on scroll ---------- */
const revealables = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.classList.add("is-visible"));
}

/* ---------- showcase: scroll-driven horizontal slider ---------- */
const showcase = document.getElementById("showcase");
const track = document.getElementById("showcaseTrack");

if (showcase && track) {
  if (prefersReducedMotion) {
    // no scroll-jacking for reduced motion — plain swipeable row
    showcase.classList.add("is-static");
  } else {
    const items = [...track.children];
    let targetX = 0; // where scroll says the track should be
    let currentX = 0; // where the track actually is (eased toward targetX)
    let running = false;

    const measure = () => {
      const vw = window.innerWidth;
      const trackW = track.scrollWidth;
      return { startX: vw * 0.55, endX: -(trackW - vw * 0.45) };
    };

    const computeTarget = () => {
      const rect = showcase.getBoundingClientRect();
      const runway = rect.height - window.innerHeight;
      const progress = clamp(-rect.top / runway, 0, 1);
      const { startX, endX } = measure();
      targetX = lerp(startX, endX, progress);
    };

    const render = () => {
      currentX = lerp(currentX, targetX, 0.085); // buttery follow
      track.style.transform = `translate3d(${currentX}px, 0, 0)`;

      const center = window.innerWidth / 2;
      const easeOut = (t) => 1 - Math.pow(1 - t, 3); // cubic easeOut
      items.forEach((item) => {
        const r = item.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - center);
        // proximity: 1 at dead center → 0 at the far edge, shaped with easeOut
        const proximity = easeOut(clamp(1 - dist / center, 0, 1));
        const scale = 0.84 + proximity * 0.3; // 0.84 at edges → 1.14 at center
        const fade = 0.5 + proximity * 0.5; // 0.5 → 1
        item.style.transform = `scale(${scale})`;
        item.style.opacity = fade;
        item.classList.toggle("is-center", dist < r.width * 0.55);
      });

      if (Math.abs(targetX - currentX) > 0.1) {
        requestAnimationFrame(render);
      } else {
        running = false;
      }
    };

    const kick = () => {
      computeTarget();
      if (!running) {
        running = true;
        requestAnimationFrame(render);
      }
    };

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    kick();
  }
}

/* ---------- 3D experience: Spline embed or CSS-3D tilt fallback ---------- */
const stage = document.getElementById("splineStage");
const tilt = document.getElementById("tiltScene");

if (stage && stage.dataset.splineScene) {
  // Real Spline scene configured — swap the fallback for the viewer.
  const script = document.createElement("script");
  script.type = "module";
  script.src = "https://unpkg.com/@splinetool/viewer/build/spline-viewer.js";
  document.head.appendChild(script);
  const viewer = document.createElement("spline-viewer");
  viewer.setAttribute("url", stage.dataset.splineScene);
  stage.innerHTML = "";
  stage.appendChild(viewer);
} else if (stage && tilt && !prefersReducedMotion) {
  // Interactive tilt: the treat follows the pointer (mouse + touch).
  let targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
  let tiltRunning = false;
  const shine = tilt.querySelector(".tilt__shine");

  const renderTilt = () => {
    curRX = lerp(curRX, targetRX, 0.09);
    curRY = lerp(curRY, targetRY, 0.09);
    tilt.style.transform = `rotateX(${curRX}deg) rotateY(${curRY}deg)`;
    if (shine) shine.style.transform = `translateX(${curRY * 6 - 30}%)`;
    if (Math.abs(targetRX - curRX) > 0.05 || Math.abs(targetRY - curRY) > 0.05) {
      requestAnimationFrame(renderTilt);
    } else {
      tiltRunning = false;
    }
  };

  const kickTilt = () => {
    if (!tiltRunning) {
      tiltRunning = true;
      requestAnimationFrame(renderTilt);
    }
  };

  const onMove = (x, y) => {
    const r = stage.getBoundingClientRect();
    const nx = clamp((x - r.left) / r.width, 0, 1) - 0.5;
    const ny = clamp((y - r.top) / r.height, 0, 1) - 0.5;
    targetRY = nx * 26;
    targetRX = -ny * 20;
    kickTilt();
  };

  stage.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY));
  stage.addEventListener("pointerleave", () => {
    targetRX = 0;
    targetRY = 0;
    kickTilt();
  });

  // idle sway so the stage feels alive before first touch
  let idle = true;
  stage.addEventListener("pointerenter", () => (idle = false), { once: true });
  (function sway(t) {
    if (idle) {
      targetRY = Math.sin(t / 1600) * 7;
      targetRX = Math.cos(t / 2100) * 5;
      kickTilt();
      requestAnimationFrame(sway);
    }
  })(0);
}

/* ---------- Signature Flavours: switcher + scroll-triggered "reconstruct" ----------
   Vanilla ScrollTrigger-equivalent: the first flavour "performs" its
   reconstruct + ingredient stagger when the section scrolls into view, and
   every switch replays that cinematic intro. Each panel lazily upgrades its
   stage to a real commercial (assets/strawberry.mp4 etc.) on desktop when
   the file is present; the product photo is the animated fallback. */
(function signatureFlavours() {
  const section = document.getElementById("flavours");
  if (!section) return;
  const chips = [...section.querySelectorAll(".flavour__chip")];
  const panels = [...section.querySelectorAll(".flavourpanel")];
  const wantsVideo = window.matchMedia("(min-width: 641px)").matches && !prefersReducedMotion;
  const injected = new Set();

  const injectVideo = (panel) => {
    const stage = panel.querySelector(".flavour__stage");
    const src = stage && stage.dataset.video;
    if (!wantsVideo || !src || injected.has(src)) return;
    injected.add(src);
    fetch(src, { method: "HEAD" })
      .then((res) => {
        if (!res.ok) return;
        const v = document.createElement("video");
        v.className = "featured__video";
        v.autoplay = v.muted = v.loop = v.playsInline = true;
        v.preload = "auto";
        const s = document.createElement("source");
        s.src = src;
        s.type = "video/mp4";
        v.appendChild(s);
        stage.appendChild(v);
        v.play().catch(() => {});
      })
      .catch(() => {});
  };

  const activate = (name) => {
    chips.forEach((c) => {
      const on = c.dataset.flavour === name;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach((p) => {
      const on = p.dataset.flavour === name;
      p.classList.toggle("is-active", on);
      if (on) {
        const accent = p.style.getPropertyValue("--accent");
        section.style.setProperty("--accent", accent);
        const active = chips.find((c) => c.dataset.flavour === name);
        if (active) active.style.setProperty("--chip-accent", accent);
        // replay the reconstruct + stagger
        p.classList.remove("is-playing");
        void p.offsetWidth; // reflow so the animation re-runs
        requestAnimationFrame(() => p.classList.add("is-playing"));
        injectVideo(p);
      }
    });
  };

  chips.forEach((chip) =>
    chip.addEventListener("click", () => activate(chip.dataset.flavour))
  );

  // fire the first flavour's intro when the section scrolls into view
  const startName = (panels.find((p) => p.classList.contains("is-active")) || panels[0]).dataset.flavour;
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            activate(startName);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(section);
  } else {
    activate(startName);
  }
})();

/* ---------- cinematic category panels (GSAP ScrollTrigger) ----------
   Full-screen Ice Creams / Cakes / Pastries panels. GSAP (vendored in /js)
   drives: presentation-style snap between panels, a slow parallax scrub on
   each background, and staggered entrances that play as a panel arrives and
   reverse as it leaves. Mobile skips snap + parallax; if GSAP is missing or
   reduced-motion is set, a CSS/IntersectionObserver fallback takes over. */
(function cinematicCats() {
  const section = document.querySelector(".cats");
  if (!section) return;
  const panels = [...section.querySelectorAll(".cat")];
  const desktop = window.matchMedia("(min-width: 861px)").matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  if (hasGsap && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // presentation-style snap between the three panels (desktop only)
    if (desktop) {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        snap: {
          snapTo: 1 / (panels.length - 1),
          duration: { min: 0.3, max: 0.8 },
          delay: 0.08,
          ease: "power2.inOut",
        },
      });
    }

    panels.forEach((panel) => {
      // slow parallax on the full-bleed background
      if (desktop) {
        const bg = panel.querySelector(".cat__bg img");
        gsap.fromTo(
          bg,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      }
      // staggered entrance that performs on arrival, reverses on exit
      gsap.from(panel.querySelectorAll("[data-cat-fade]"), {
        opacity: 0,
        y: 44,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: { trigger: panel, start: "top 62%", toggleActions: "play none none reverse" },
      });
    });
  } else {
    // fallback: CSS scroll-snap (desktop) + IntersectionObserver fades
    document.documentElement.classList.add("no-gsap");
    if (desktop && !prefersReducedMotion) document.documentElement.classList.add("snap-cats");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.target.classList.toggle("in-view", e.isIntersecting)),
        { threshold: 0.35 }
      );
      panels.forEach((p) => io.observe(p));
    } else {
      panels.forEach((p) => p.classList.add("in-view"));
    }
  }
})();

/* ---------- footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
