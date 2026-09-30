import { t } from "./i18n.js";
import { toast, isTyping } from "./effects.js";
import { prefersReducedMotion } from "./scramble.js";

let pointer = null;
let transitionTimer = 0;

function ripple(origin, on) {
  if (prefersReducedMotion()) return;
  const el = document.createElement("span");
  el.className = on ? "ev-ripple" : "ev-ripple ev-ripple--off";
  el.style.left = `${origin.x}px`;
  el.style.top = `${origin.y}px`;
  document.body.append(el);
  el.addEventListener("animationend", () => el.remove(), { once: true });
}

export function initEagleVision() {
  const root = document.documentElement;
  const button = document.querySelector(".eagle-btn");

  const toggle = (origin) => {
    const on = !root.classList.contains("eagle-vision");
    root.classList.add("ev-transition");
    root.classList.toggle("eagle-vision", on);
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => root.classList.remove("ev-transition"), 800);
    button?.setAttribute("aria-pressed", String(on));
    ripple(origin ?? pointer ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }, on);
    toast(t(on ? "ui.eagleOn" : "ui.eagleOff"));
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer = { x: event.clientX, y: event.clientY };
    },
    { passive: true },
  );

  button?.addEventListener("click", (event) => {
    toggle(event.detail ? { x: event.clientX, y: event.clientY } : null);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "v" || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTyping(event) || root.classList.contains("is-loading")) return;
    toggle();
  });
}
