import { scramble, prefersReducedMotion } from "./scramble.js";
import { eagle } from "./svg.js";
import { hasRiggedEagle, riggedEagle } from "./render.js";
import { t } from "./i18n.js";

export const isTyping = (event) => Boolean(event.target.closest?.("input, textarea, select, [contenteditable]"));

export function enableMotion() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || prefersReducedMotion()) return false;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("motion");
  return true;
}

export function prepareHeroIntro(motion) {
  if (motion) window.gsap.set("[data-hero-in]", { opacity: 0, y: 28 });
}

export function playHeroIntro(motion) {
  const names = document.querySelectorAll(".hero__name [data-scramble]");
  names.forEach((el, i) => setTimeout(() => scramble(el, el.textContent, { duration: 1300 }), i * 180));
  if (!motion) return;
  window.gsap.to("[data-hero-in]", {
    opacity: 1,
    y: 0,
    duration: 1.1,
    ease: "expo.out",
    stagger: 0.1,
    delay: 0.2,
    clearProps: "opacity,transform",
  });
}

export function initReveals(motion) {
  if (!motion) return;
  const { gsap, ScrollTrigger } = window;
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 90%",
    once: true,
    batchMax: 4,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "expo.out",
        stagger: 0.1,
        onComplete: () => {
          batch.forEach((el) => el.classList.add("is-revealed"));
          gsap.set(batch, { clearProps: "opacity,transform" });
        },
      }),
  });
}

export function initScrambleOnView() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        scramble(entry.target, entry.target.textContent, { duration: 1100 });
      });
    },
    { threshold: 0.6 },
  );
  document.querySelectorAll("main section:not(#hero) [data-scramble]").forEach((el) => observer.observe(el));
}

export function initCounters(motion) {
  if (!motion) return;
  const { gsap, ScrollTrigger } = window;
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    el.textContent = "0";
    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: () => {
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 1.8,
          ease: "power3.out",
          onUpdate: () => {
            el.textContent = Math.round(counter.value);
          },
        });
      },
    });
  });
}

export function initSectionTracking(onChange) {
  const line = document.querySelector(".glitch-line");
  const reduced = prefersReducedMotion();
  let current = null;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.target.id === current) return;
        const previous = current;
        current = entry.target.id;
        onChange(current);
        if (line && !reduced && previous) {
          line.classList.remove("is-active");
          void line.offsetWidth;
          line.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-50% 0px -50% 0px" },
  );
  document.querySelectorAll("main > section[id]").forEach((section) => observer.observe(section));
}

export function initCursor() {
  const cursor = document.querySelector(".cursor");
  if (!cursor || prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const root = document.documentElement;
  const ring = cursor.querySelector(".cursor__ring");
  const dot = cursor.querySelector(".cursor__dot");
  let x = -100;
  let y = -100;
  let ringX = x;
  let ringY = y;

  root.classList.add("has-cursor");

  window.addEventListener(
    "pointermove",
    (event) => {
      x = event.clientX;
      y = event.clientY;
      dot.style.setProperty("--x", `${x}px`);
      dot.style.setProperty("--y", `${y}px`);
      cursor.classList.remove("is-hidden");
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
  document.addEventListener("pointerover", (event) => {
    cursor.classList.toggle("is-hovering", Boolean(event.target.closest("a, button, [data-open], label")));
  });
  window.addEventListener("pointerdown", () => cursor.classList.add("is-pressed"));
  window.addEventListener("pointerup", () => cursor.classList.remove("is-pressed"));

  const loop = () => {
    ringX += (x - ringX) * 0.18;
    ringY += (y - ringY) * 0.18;
    ring.style.setProperty("--rx", `${ringX}px`);
    ring.style.setProperty("--ry", `${ringY}px`);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

let toastTimer = 0;

export function toast(message) {
  const el = document.querySelector(".toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 1800);
}

function streak() {
  const overlay = document.querySelector(".leap-overlay");
  if (!overlay || prefersReducedMotion()) return;
  overlay.classList.remove("is-active");
  void overlay.offsetWidth;
  overlay.classList.add("is-active");
}

const DIVE_MS = 1600;
const DIVE_EASING = "cubic-bezier(.55,0,.8,.4)";

const WING_POSES = {
  glide: ["rotate(-12deg)", "rotate(14deg)"],
  down: ["rotate(-44deg) scale(1, 0.9)", "rotate(48deg) scale(0.92, 1)"],
  trim: ["rotate(-20deg)", "rotate(6deg)"],
  draw: ["rotate(-28deg) scale(0.95, 0.85)", "rotate(-18deg) scale(0.95, 0.85)"],
  drawDeep: ["rotate(-36deg) scale(0.9, 0.75)", "rotate(-42deg) scale(0.9, 0.75)"],
  bend: ["rotate(-44deg) scale(0.85, 0.66)", "rotate(-64deg) scale(0.85, 0.66)"],
  halfOpen: ["rotate(-50deg) scale(0.8, 0.58)", "rotate(-86deg) scale(0.8, 0.58)"],
  half: ["rotate(-60deg) scale(0.75, 0.5)", "rotate(-100deg) scale(0.75, 0.5)"],
  swept: ["rotate(-68deg) scale(0.72, 0.48)", "rotate(-114deg) scale(0.72, 0.48)"],
};

const WING_TIMELINE = [
  [0, "glide"],
  [0.48, "glide"],
  [0.56, "down"],
  [0.64, "glide"],
  [0.7, "trim"],
  [0.76, "draw"],
  [0.8, "drawDeep"],
  [0.84, "bend"],
  [0.88, "halfOpen"],
  [0.92, "half"],
  [0.96, "swept"],
  [1, "swept"],
];

function leapOfFaith() {
  const banner = document.createElement("div");
  banner.className = "leap-banner";
  banner.setAttribute("aria-hidden", "true");
  banner.textContent = t("hero.leapBanner");
  document.body.append(banner);
  setTimeout(() => banner.remove(), 1900);

  if (prefersReducedMotion()) return;
  streak();

  const rigged = hasRiggedEagle();
  const diver = document.createElement("div");
  diver.className = "dive-eagle";
  diver.innerHTML = rigged ? riggedEagle("is-gliding") : eagle("is-gliding");
  document.body.append(diver);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  diver
    .animate(
      [
        { transform: `translate(${-0.2 * vw}px, ${-0.25 * vh}px) rotate(15deg) scale(0.5)` },
        { transform: `translate(${0.4 * vw}px, ${0.3 * vh}px) rotate(40deg) scale(1)`, offset: 0.55 },
        { transform: `translate(${1.1 * vw}px, ${1.2 * vh}px) rotate(62deg) scale(1.4)` },
      ],
      { duration: DIVE_MS, easing: DIVE_EASING },
    )
    .finished.then(() => diver.remove());

  if (!rigged) return;
  ["far", "near"].forEach((side, index) => {
    const wing = diver.querySelector(`.eagle-rig__wing--${side}`);
    const keyframes = WING_TIMELINE.map(([offset, name]) => ({ offset, transform: WING_POSES[name][index], easing: "ease-in-out" }));
    wing?.animate(keyframes, { duration: DIVE_MS, fill: "forwards" });
  });
}

export function initEasterEgg() {
  const word = "leap";
  let buffer = "";
  console.log(
    `%c${t("hero.creed")}%c\n${t("ui.consoleHint")}`,
    "font: 700 16px Cinzel, Georgia, serif; color: #c1121f; letter-spacing: 0.08em;",
    "font: 12px monospace; color: #b3ab9d;",
  );
  document.querySelectorAll("[data-leap-egg]").forEach((button) => button.addEventListener("click", leapOfFaith));
  window.addEventListener("keydown", (event) => {
    if (isTyping(event) || event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) return;
    buffer = (buffer + event.key.toLowerCase()).slice(-word.length);
    if (buffer === word) {
      buffer = "";
      leapOfFaith();
    }
  });
}

export function initLeapButton() {
  document.querySelectorAll("[data-leap]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      streak();
      target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  });
}

export function initPortraitGlitch() {
  const portrait = document.querySelector(".portrait");
  if (!portrait || prefersReducedMotion()) return;
  let visible = false;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }).observe(portrait);
  setInterval(() => {
    if (!visible || document.hidden) return;
    portrait.classList.add("is-glitching");
    setTimeout(() => portrait.classList.remove("is-glitching"), 700);
  }, 5200);
}
