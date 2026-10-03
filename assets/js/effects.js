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

function leapOfFaith() {
  const banner = document.createElement("div");
  banner.className = "leap-banner";
  banner.setAttribute("aria-hidden", "true");
  banner.textContent = t("hero.leapBanner");
  document.body.append(banner);
  setTimeout(() => banner.remove(), 1900);

  if (prefersReducedMotion()) return;
  streak();

  const diver = document.createElement("div");
  diver.className = "dive-eagle";
  diver.innerHTML = hasRiggedEagle() ? riggedEagle("is-gliding") : eagle("is-gliding");
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
      { duration: 1600, easing: "cubic-bezier(.55,0,.8,.4)" },
    )
    .finished.then(() => diver.remove());
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
