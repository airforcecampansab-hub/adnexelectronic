// ICEBERG — cinematic snap-scroll experience
// GSAP ScrollTrigger drives full-screen section snapping, media parallax
// and glass-card choreography; videos lazy-load and only play on screen.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

if (!hasGSAP) document.documentElement.classList.add("no-gsap");

/* ---------- footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- sticky nav ---------- */
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

function getPanelTargets(panel) {
  return [
    panel.querySelector(".panel__video, .panel__img"),
    panel.querySelector(".panel__head, .hero__content"),
    panel.querySelector(".glass-card"),
    panel.querySelector(".panel__bgtext"),
    ...Array.from(panel.querySelectorAll(".orb")),
  ].filter(Boolean);
}

function markActive(index) {
  if (currentPanel && hasGSAP) {
    gsap.to(getPanelTargets(currentPanel), {
      x: 0, y: 0, rotateY: 0, rotateX: 0,
      duration: 0.55, ease: "power2.out", overwrite: "auto",
    });
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

  /* smooth anchor scrolling */
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

  /* full-screen snap */
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
    const orbs = panel.querySelectorAll(".orb");
    const bgtext = panel.querySelector(".panel__bgtext");

    /* cinematic Ken Burns / parallax scrub on media — deeper zoom + slight 3D tilt */
    gsap.fromTo(
      media,
      { scale: 1.3, yPercent: -5, rotateX: 3.5 },
      {
        scale: 1.02,
        yPercent: 5,
        rotateX: -3.5,
        ease: "none",
        scrollTrigger: {
          trigger: panel,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );

    /* scroll-scrubbed 3D fly-through: content tilts back as it enters,
       flattens at screen center, then tips forward and recedes as it
       leaves — every scroll gesture reads as camera movement in depth.
       Targets the content wrapper, which the mouse-parallax tweens never
       animate, so the two systems can't fight over transforms.          */
    const content = panel.querySelector(".panel__content, .hero__content");
    if (content) {
      gsap.timeline({
        scrollTrigger: {
          trigger: panel,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      })
        .fromTo(
          content,
          { rotateX: 16, scale: 0.9, yPercent: 9, opacity: 0.25 },
          { rotateX: 0, scale: 1, yPercent: 0, opacity: 1, ease: "power1.out" }
        )
        .to(
          content,
          { rotateX: -12, scale: 0.94, yPercent: -9, opacity: 0.25, ease: "power1.in" }
        );
    }

    /* bgtext slow horizontal drift as panel scrolls through */
    if (bgtext) {
      gsap.fromTo(
        bgtext,
        { xPercent: -3 },
        {
          xPercent: 3,
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }

    /* 3D entrance for text + card */
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
      { autoAlpha: 0, y: 52, rotateX: 20, transformPerspective: 700 },
      { autoAlpha: 1, y: 0, rotateX: 0, duration: 1.1, stagger: 0.15, ease: "power3.out" }
    );

    if (card) {
      timeline.fromTo(
        card,
        { autoAlpha: 0, y: 80, rotateX: 18, scale: 0.93, filter: "blur(12px)", transformPerspective: 1000 },
        { autoAlpha: 1, y: 0, rotateX: 0, scale: 1, filter: "blur(0px)", duration: 1.25, ease: "power3.out" },
        "+=0.42"
      );
    }

    /* orbs float in from random directions */
    if (orbs.length) {
      gsap.fromTo(
        orbs,
        (i) => ({ autoAlpha: 0, scale: 0.35, x: (i % 2 === 0 ? -1 : 1) * 40, y: 30 }),
        {
          autoAlpha: 0.88,
          scale: 1,
          x: 0,
          y: 0,
          duration: 1.6,
          stagger: { amount: 0.5, from: "random" },
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: panel,
            start: "top 60%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  });

  ScrollTrigger.create({
    trigger: panels[0],
    start: "top top",
    onEnterBack: () => markActive(0),
  });
  markActive(0);

  /* ---------- 3D glass-card hover tilt ---------- */
  panels.forEach((panel) => {
    const card = panel.querySelector(".glass-card");
    if (!card) return;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
      const dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
      gsap.to(card, {
        rotateY: dx * 16,
        rotateX: dy * -11,
        transformPerspective: 900,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.9,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  });

  /* ---------- scroll-velocity reaction ----------
     Fast scrolling shears the giant watermark words; they spring
     back with an ease-out once the scroll settles, adding physical
     inertia to every flick of the wheel.                            */
  const bgtexts = gsap.utils.toArray(".panel__bgtext");
  if (bgtexts.length) {
    const proxy = { skew: 0 };
    const skewSetter = gsap.quickSetter(bgtexts, "skewY", "deg");
    const clampSkew = gsap.utils.clamp(-9, 9);

    ScrollTrigger.create({
      onUpdate(self) {
        const skew = clampSkew(self.getVelocity() / -320);
        if (Math.abs(skew) > Math.abs(proxy.skew)) {
          proxy.skew = skew;
          gsap.to(proxy, {
            skew: 0,
            duration: 0.9,
            ease: "power3.out",
            overwrite: true,
            onUpdate: () => skewSetter(proxy.skew),
          });
        }
      },
    });
  }

  /* ---------- Mouse-cursor parallax: layered depth across all elements ----------
     Background media:  drifts opposite the cursor (farthest layer)
     Bgtext watermark:  slow drift, same direction as media but less
     Text head:         follows toward cursor (mid layer)
     Glass card:        floats most toward cursor (nearest layer)
     Orbs:              each uses its own data-d depth multiplier             */
  window.addEventListener("mousemove", (e) => {
    if (!currentPanel) return;

    const nx = (e.clientX / window.innerWidth)  * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;

    const media  = currentPanel.querySelector(".panel__video, .panel__img");
    const head   = currentPanel.querySelector(".panel__head, .hero__content");
    const card   = currentPanel.querySelector(".glass-card");
    const bgtext = currentPanel.querySelector(".panel__bgtext");
    const orbs   = currentPanel.querySelectorAll(".orb");

    if (media)  gsap.to(media,  { x: nx * -16, y: ny * -10, duration: 1.8, ease: "power2.out", overwrite: "auto" });
    if (bgtext) gsap.to(bgtext, { x: nx * -10, y: ny * -6,  duration: 2.4, ease: "power2.out", overwrite: "auto" });
    if (head)   gsap.to(head,   { x: nx *  8,  y: ny *  5,  duration: 2.1, ease: "power2.out", overwrite: "auto" });
    if (card)   gsap.to(card,   { x: nx * 13,  y: ny *  8,  duration: 1.5, ease: "power2.out", overwrite: "auto" });

    orbs.forEach((orb) => {
      const d = parseFloat(orb.dataset.d || "0.8");
      gsap.to(orb, {
        x: nx * d * 44,
        y: ny * d * 28,
        duration: 1.0 + d * 0.7,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  }, { passive: true });

  document.addEventListener("mouseleave", () => {
    if (!currentPanel) return;
    gsap.to(getPanelTargets(currentPanel), {
      x: 0, y: 0, duration: 1.2, ease: "power3.out", overwrite: "auto",
    });
  });

} else {
  /* graceful fallback */
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

/* ---------- Infinite review ticker ----------
   Runs independently from the snap-scroll stack.
   GSAP moves the track from xPercent 0 → -50 on repeat:-1.
   Because the innerHTML is doubled, at -50% the visible cards
   are identical to 0%, giving a seamless infinite loop.          */
(function () {
  const track   = document.getElementById("tickerTrack");
  const wrap    = document.getElementById("tickerWrap");
  const section = document.querySelector(".ticker-section");
  if (!track || !wrap || !section || !hasGSAP || prefersReducedMotion) return;

  /* Double the card set for the seamless loop */
  track.innerHTML += track.innerHTML;

  /* Main ticker tween — ease:none keeps velocity perfectly constant */
  const tween = gsap.to(track, {
    xPercent: -50,
    ease: "none",
    duration: 42,
    repeat: -1,
  });

  /* Hover: pause smoothly, resume from exact position */
  wrap.addEventListener("mouseenter", () => tween.pause(),  { passive: true });
  wrap.addEventListener("mouseleave", () => tween.resume(), { passive: true });

  /* Visibility: don't burn GPU when off screen */
  new IntersectionObserver(([entry]) => {
    entry.isIntersecting ? tween.resume() : tween.pause();
  }, { threshold: 0.05 }).observe(section);
})();
