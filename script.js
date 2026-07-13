// ICEBERG — cinematic snap-scroll experience
// GSAP ScrollTrigger drives full-screen section snapping, media parallax
// and glass-card choreography; videos lazy-load and only play on screen.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

if (!hasGSAP) document.documentElement.classList.add("no-gsap");

/* ---------- footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- sticky nav: glass background after leaving the hero top ---------- */
const nav = document.getElementById("nav");
const onScrollNav = () => nav.classList.toggle("is-solid", window.scrollY > 40);
onScrollNav();
window.addEventListener("scroll", onScrollNav, { passive: true });

/* ---------- mobile sheet menu ---------- */
const burger = document.getElementById("navBurger");
const sheet = document.getElementById("sheet");

function setSheet(open) {
  burger.classList.toggle("is-open", open);
  sheet.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  sheet.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
}
burger.addEventListener("click", () => setSheet(!sheet.classList.contains("is-open")));

/* ---------- lazy video loading + on-screen playback ---------- */
const videos = Array.from(document.querySelectorAll(".panel__video"));

const loadObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const video = entry.target;
    if (video.dataset.src) {
      video.src = video.dataset.src;
      delete video.dataset.src;
      video.load();
    }
    loadObserver.unobserve(video);
  });
}, { rootMargin: "150% 0px" });

const playObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const video = entry.target;
    if (entry.intersectionRatio >= 0.35 && !prefersReducedMotion) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}, { threshold: [0, 0.35] });

videos.forEach((video) => {
  loadObserver.observe(video);
  playObserver.observe(video);
});

/* ---------- GSAP: snap-scroll + per-panel cinematics ---------- */
const panels = Array.from(document.querySelectorAll(".panel"));
const dots = Array.from(document.querySelectorAll("#dots a"));
const navLinks = Array.from(document.querySelectorAll("#navLinks a"));

let currentPanel = panels[0];

function markActive(index) {
  // Smoothly reset cursor-parallax offsets on the panel we're leaving
  if (currentPanel && hasGSAP) {
    const leaving = [
      currentPanel.querySelector(".panel__video, .panel__img"),
      currentPanel.querySelector(".panel__head, .hero__content"),
      currentPanel.querySelector(".glass-card"),
    ].filter(Boolean);
    gsap.to(leaving, { x: 0, y: 0, duration: 0.55, ease: "power2.out", overwrite: "auto" });
  }

  currentPanel = panels[index];

  dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  const id = panels[index] ? panels[index].id : "";
  navLinks.forEach((link) =>
    link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`)
  );
}

if (hasGSAP && !prefersReducedMotion) {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  /* smooth anchor scrolling for nav, dots, cue */
  document.querySelectorAll("[data-scroll]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      setSheet(false);
      gsap.to(window, {
        duration: 1.1,
        ease: "power3.inOut",
        scrollTo: { y: target, autoKill: true },
      });
    });
  });

  /* full-screen snap across hero + category panels */
  ScrollTrigger.create({
    trigger: "#snapZone",
    start: "top top",
    end: "bottom bottom",
    snap: {
      snapTo: 1 / (panels.length - 1),
      duration: { min: 0.25, max: 0.75 },
      delay: 0.08,
      ease: "power2.inOut",
    },
  });

  /* per-panel choreography */
  panels.forEach((panel, index) => {
    const media = panel.querySelector(".panel__video, .panel__img");
    const reveals = panel.querySelectorAll(".reveal");
    const card = panel.querySelector(".glass-card");

    /* slow cinematic drift on the media while the panel crosses the viewport */
    gsap.fromTo(
      media,
      { scale: 1.18, yPercent: -4 },
      {
        scale: 1,
        yPercent: 4,
        ease: "none",
        scrollTrigger: {
          trigger: panel,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );

    /* text rises first; the glass card arrives after the scene has played */
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: "top 55%",
        toggleActions: "play none none reverse",
        onToggle: (self) => { if (self.isActive) markActive(index); },
      },
    });

    timeline.fromTo(
      reveals,
      { autoAlpha: 0, y: 46 },
      { autoAlpha: 1, y: 0, duration: 1.05, stagger: 0.14, ease: "power3.out" }
    );

    if (card) {
      timeline.fromTo(
        card,
        { autoAlpha: 0, y: 60, scale: 0.96, filter: "blur(10px)" },
        { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.1, ease: "power3.out" },
        "+=0.55"
      );
    }
  });

  /* keep active states honest when scrolling back above triggers */
  ScrollTrigger.create({
    trigger: panels[0],
    start: "top top",
    onEnterBack: () => markActive(0),
  });
  markActive(0);

  /* ---------- Mouse-cursor parallax: layered depth on active panel ----------
     Background (farthest layer) drifts opposite to cursor.
     Text (mid layer) drifts slightly toward cursor.
     Glass card (nearest layer) floats the most toward cursor.
     Uses pixel x/y so it doesn't conflict with the scroll scrub (yPercent/scale). */
  window.addEventListener("mousemove", (e) => {
    if (!currentPanel) return;

    const nx = (e.clientX / window.innerWidth)  * 2 - 1;  // -1 → +1
    const ny = (e.clientY / window.innerHeight) * 2 - 1;  // -1 → +1

    const media = currentPanel.querySelector(".panel__video, .panel__img");
    const head  = currentPanel.querySelector(".panel__head, .hero__content");
    const card  = currentPanel.querySelector(".glass-card");

    if (media) {
      gsap.to(media, { x: nx * -16, y: ny * -10, duration: 1.8, ease: "power2.out", overwrite: "auto" });
    }
    if (head) {
      gsap.to(head,  { x: nx *  8,  y: ny *  5,  duration: 2.1, ease: "power2.out", overwrite: "auto" });
    }
    if (card) {
      gsap.to(card,  { x: nx * 13,  y: ny *  8,  duration: 1.5, ease: "power2.out", overwrite: "auto" });
    }
  }, { passive: true });

  /* Reset parallax when the cursor leaves the page */
  document.addEventListener("mouseleave", () => {
    if (!currentPanel) return;
    const targets = [
      currentPanel.querySelector(".panel__video, .panel__img"),
      currentPanel.querySelector(".panel__head, .hero__content"),
      currentPanel.querySelector(".glass-card"),
    ].filter(Boolean);
    gsap.to(targets, { x: 0, y: 0, duration: 1.2, ease: "power3.out", overwrite: "auto" });
  });

} else {
  /* graceful fallback: everything visible, plain anchors, native smooth scroll */
  document.querySelectorAll(".reveal, .glass-card").forEach((el) => {
    el.style.opacity = 1;
  });
  document.querySelectorAll("[data-scroll]").forEach((link) => {
    link.addEventListener("click", () => setSheet(false));
  });

  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) markActive(panels.indexOf(entry.target));
    });
  }, { threshold: 0.55 });
  panels.forEach((panel) => activeObserver.observe(panel));
}
