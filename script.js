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

/* ---------- footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
