// ICEBERG — interactions
// Vanilla, GPU-accelerated animations: rAF loop + lerp smoothing for a
// Framer-Motion-like buttery feel without a framework dependency.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

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

/* ---------- menu filter tabs ---------- */
// Cards can belong to several categories via space-separated tokens,
// e.g. data-category="falooda signature".
const tabs = document.querySelectorAll(".menu__tab");
const cards = document.querySelectorAll(".card[data-category]");
const menuHeading = document.getElementById("menuHeading");
const menuCount = document.getElementById("menuCount");

const headings = {
  all: "Everything on the Counter",
  pastry: "Pastries",
  cake: "Cakes & Wedding Cakes",
  icecream: "Ice Cream",
  falooda: "Faloodas",
  signature: "Signature Treats",
  sundae: "Sundaes",
  shake: "Shakes",
};

const updateHeader = (filter, shown) => {
  if (!menuHeading || !menuCount) return;
  menuHeading.classList.add("is-swapping");
  menuCount.classList.add("is-swapping");
  setTimeout(() => {
    menuHeading.textContent = headings[filter] || filter;
    menuCount.textContent = `${shown} ${shown === 1 ? "treat" : "treats"} on display`;
    menuHeading.classList.remove("is-swapping");
    menuCount.classList.remove("is-swapping");
  }, 180);
};

const applyFilter = (filter) => {
  let shown = 0;
  cards.forEach((card) => {
    const show = filter === "all" || card.dataset.category.split(" ").includes(filter);
    card.classList.toggle("is-hidden", !show);
    if (show) {
      card.style.transitionDelay = `${Math.min(shown * 45, 400)}ms`;
      shown += 1;
      card.classList.remove("is-visible");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => card.classList.add("is-visible"))
      );
      card.addEventListener(
        "transitionend",
        () => (card.style.transitionDelay = ""),
        { once: true }
      );
    } else {
      card.style.transitionDelay = "";
    }
  });
  updateHeader(filter, shown);
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      t.classList.remove("is-active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    applyFilter(tab.dataset.filter);
  });
});
if (menuCount) {
  menuCount.textContent = `${cards.length} treats on display`;
}

/* ---------- hero: cinematic product commercials ---------- */
// Each act performs the 10-second sequence from the campaign spots:
//   0.00-0.08  exploded view — ingredients separate vertically
//   0.08-0.20  suspended hero shot with sparkle particles
//   0.20-0.34  ingredients fly back and reconstruct the dessert
//   0.34-0.44  beauty shot
//   0.44-0.52  the dessert glides left; light particles sweep right
//   0.52-0.94  glassmorphism card and ingredient rows stagger in
//   0.94-1.00  crossfade to the next act
// One master position drives it all: it plays in real time (10s per act)
// while the page rests at the top, and scroll scrubs it directly.
const cine = document.querySelector(".hero--cine");
if (cine) {
  const acts = [...cine.querySelectorAll(".cine-act")].map((act) => ({
    act,
    dessert: act.querySelector(".cine-act__dessert"),
    shadow: act.querySelector(".cine-act__shadow"),
    orbs: [...act.querySelectorAll(".cine-act__orb")],
    card: act.querySelector(".cine-act__card"),
    line: act.querySelector(".cine-act__line"),
    rows: [...act.querySelectorAll(".cine-act__desc, .cine-act__cta")],
  }));
  const dots = [...cine.querySelectorAll(".hero__dots span")];
  const N = acts.length;
  const narrow = window.matchMedia("(max-width: 760px)");

  if (prefersReducedMotion) {
    cine.classList.add("is-static");
  } else {
    // CGI reels (assets/strawberry.mp4 · blueberry.mp4 · pista.mp4) take
    // over an act's stage when present. Phones and save-data connections
    // skip them entirely and keep the lightweight poster-crop animation.
    const allowVideo = !narrow.matches && !(navigator.connection && navigator.connection.saveData);
    if (allowVideo) {
      window.addEventListener("load", () => {
        acts.forEach((p) => {
          const src = p.act.dataset.video;
          if (!src) return;
          const v = document.createElement("video");
          v.muted = true;
          v.loop = true;
          v.playsInline = true;
          v.preload = "metadata";
          v.className = "cine-act__reel";
          v.src = src;
          v.addEventListener("loadedmetadata", () => {
            p.act.prepend(v);
            p.act.classList.add("has-reel");
            p.reel = v;
          });
          v.addEventListener("error", () => v.remove());
        });
      });
    }

    const sparkleLayer = document.getElementById("cineSparkles");
    const sparkles = [];
    const sparkleCount = narrow.matches ? 7 : 14;
    for (let i = 0; i < sparkleCount; i++) {
      const s = document.createElement("i");
      s.textContent = "\u2726";
      s.style.left = `${18 + Math.random() * 64}%`;
      s.style.top = `${16 + Math.random() * 58}%`;
      s.style.fontSize = `${6 + Math.random() * 10}px`;
      sparkleLayer.appendChild(s);
      sparkles.push({ el: s, drift: Math.random() * 2 - 1 });
    }

    const seg = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
    const outCubic = (t) => 1 - Math.pow(1 - t, 3);
    const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const orbSpots = [
      [0, -0.68],
      [0, 0.66],
      [0, 0.95],
    ];
    const eyebrow = cine.querySelector(".cine__eyebrow");

    const applyAct = (p, u, fade, scrubbing) => {
      p.act.style.opacity = fade;
      p.act.style.visibility = fade > 0.001 ? "visible" : "hidden";
      if (fade <= 0.001) {
        if (p.reel && !p.reel.paused) p.reel.pause();
        return;
      }

      // a loaded reel replaces the code-performed stage: it plays in real
      // time while idle and is seeked directly when scroll scrubs the act
      if (p.reel && p.reel.duration) {
        if (scrubbing) {
          if (!p.reel.paused) p.reel.pause();
          // compare against the last requested target, not currentTime —
          // re-issuing seeks because the browser landed on a keyframe
          // would fight the decoder forever
          const t = u * p.reel.duration;
          if (p.reelTarget === undefined || Math.abs(p.reelTarget - t) > 0.04) {
            p.reelTarget = t;
            p.reel.currentTime = t;
          }
        } else if (p.reel.paused) {
          p.reelTarget = undefined;
          p.reel.currentTime = u * p.reel.duration;
          p.reel.play().catch(() => {});
        }
      }

      const isN = narrow.matches;
      const explode = outCubic(seg(u, 0, 0.08));
      const rebuild = inOut(seg(u, 0.2, 0.34));
      const apart = explode * (1 - rebuild); // how separated the dessert is
      const beauty = inOut(seg(u, 0.34, 0.44));
      const glide = inOut(seg(u, 0.44, 0.52));

      const gx = isN ? 0 : -0.24 * window.innerWidth * glide;
      const gy = isN ? -0.14 * window.innerHeight * glide : 0;
      const scale = 1 - 0.08 * apart + 0.035 * beauty - (isN ? 0.32 : 0.1) * glide;
      p.dessert.style.transform =
        `translate(calc(-50% + ${gx}px), calc(-50% + ${gy}px)) scale(${scale})`;
      p.shadow.style.transform = `translateX(${gx}px) scale(${1 - 0.2 * apart - 0.15 * glide})`;
      p.shadow.style.opacity = (0.5 + 0.25 * apart) * (1 - 0.5 * glide);

      if (eyebrow) eyebrow.style.opacity = 1 - apart; // clear the exploded column

      const D = p.dessert.offsetWidth;
      p.orbs.forEach((orb, k) => {
        const [ox, oy] = orbSpots[k];
        const bob = Math.sin(u * 50 + k * 2.1) * 6 * apart;
        const x = ox * D * apart;
        const y = oy * D * apart + bob;
        orb.style.transform =
          `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${0.25 + 0.75 * apart})`;
        orb.style.opacity = apart;
      });

      const cardIn = inOut(seg(u, 0.52, 0.64));
      p.card.style.opacity = cardIn;
      p.card.style.pointerEvents = cardIn > 0.5 ? "auto" : "none";
      p.card.style.transform = isN
        ? `translateY(${(1 - cardIn) * 70}px)`
        : `translateY(-50%) translateX(${(1 - cardIn) * 80}px)`;
      p.line.style.transform = `scaleX(${inOut(seg(u, 0.58, 0.7))})`;
      p.rows.forEach((row, k) => {
        if (!row) return;
        const rv = seg(u, 0.6 + k * 0.05, 0.7 + k * 0.05);
        row.style.opacity = rv;
        row.style.transform = `translateY(${(1 - outCubic(rv)) * 14}px)`;
      });

      // sparkles: glow during the suspended shot, sweep right during the glide
      const hold = seg(u, 0.06, 0.12) * (1 - seg(u, 0.18, 0.3));
      const sweep = seg(u, 0.44, 0.5) * (1 - seg(u, 0.56, 0.68));
      const glow = Math.max(hold * 0.8, sweep);
      sparkles.forEach((sp, k) => {
        const tw = 0.5 + 0.5 * Math.sin(u * 90 + k * 1.7);
        sp.el.style.opacity = glow * tw * fade;
        sp.el.style.transform =
          `translateX(${sweep * 0.18 * window.innerWidth * (0.4 + sp.drift)}px) scale(${0.6 + tw * 0.6})`;
      });
    };

    const scrollPos = () => {
      const rect = cine.getBoundingClientRect();
      const runway = cine.offsetHeight - window.innerHeight;
      // stop just shy of N so the last act exits the hero on its card
      return runway > 0 ? clamp(-rect.top / runway, 0, 1) * (N - 0.06) : 0;
    };

    let basePos = 0;
    let lastT = performance.now();
    let lastDot = -1;

    const render = (now) => {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      const sp = scrollPos();
      if (sp === 0 && document.visibilityState === "visible") {
        basePos = (basePos + dt / 10) % N; // 10s per act, as scripted
      }
      const P = (basePos + sp) % N;
      const idx = Math.floor(P);
      const u = P - idx;
      const cross = inOut(seg(u, 0.94, 1));
      const scrubbing = sp > 0;

      acts.forEach((p, i) => {
        if (i === idx) applyAct(p, u, 1 - cross, scrubbing);
        else if (i === (idx + 1) % N) applyAct(p, 0, cross, scrubbing);
        else applyAct(p, 0, 0, scrubbing);
      });

      if (idx !== lastDot) {
        lastDot = idx;
        dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
      }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }
}

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
      items.forEach((item) => {
        const r = item.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - center);
        // 1.12 at dead center, easing down to 0.86 at the far edges
        const scale = clamp(1.12 - (dist / center) * 0.3, 0.86, 1.12);
        const fade = clamp(1.05 - (dist / center) * 0.45, 0.55, 1);
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

/* ---------- collections: parallax backdrops + menu handoff ---------- */
const collections = [...document.querySelectorAll(".collection")];
if (collections.length) {
  if (!prefersReducedMotion) {
    const scenes = collections.map((sec) => ({
      sec,
      img: sec.querySelector(".collection__bg img"),
    }));
    let parallaxQueued = false;
    const parallax = () => {
      parallaxQueued = false;
      const vh = window.innerHeight;
      scenes.forEach(({ sec, img }) => {
        const r = sec.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        // -1 (below viewport) … 1 (above); backdrop drifts against scroll
        const t = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
        img.style.transform = `translateY(${t * 6}svh)`;
      });
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!parallaxQueued) {
          parallaxQueued = true;
          requestAnimationFrame(parallax);
        }
      },
      { passive: true }
    );
    parallax();
  }

  // "Browse all …" pre-selects the matching menu category on the way down
  document.querySelectorAll(".collection__cta[data-filter]").forEach((cta) => {
    cta.addEventListener("click", () => {
      const tab = document.querySelector(`.menu__tab[data-filter="${cta.dataset.filter}"]`);
      if (tab) tab.click();
    });
  });
}

/* ---------- footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
