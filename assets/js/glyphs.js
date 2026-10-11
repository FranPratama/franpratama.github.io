import { site } from "./content.js";
import { glyphShapes } from "./svg.js";
import { t } from "./i18n.js";
import { toast } from "./effects.js";
import { bindDialog } from "./ui.js";
import { prefersReducedMotion } from "./scramble.js";

const SIZE = 40;
const EDGE = 12;
const GAP = 10;
const ATTEMPTS = 400;
const CONTENT =
  "p, h1, h2, h3, h4, li, a, button:not(.glyph), img:not(.hero__layer), input, textarea, select, label, blockquote, dl, figure, article, form, .hero__actions, .portrait, .filters, .scroll-blade";

function overlap(a, b) {
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return x * y;
}

function place(button, section) {
  const box = section.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const blockers = [...section.querySelectorAll(CONTENT)]
    .map((el) => el.getBoundingClientRect())
    .filter((rect) => rect.width && rect.height)
    .map((rect) => ({
      left: rect.left - box.left - GAP,
      top: rect.top - box.top - GAP,
      right: rect.right - box.left + GAP,
      bottom: rect.bottom - box.top + GAP,
    }));
  const minTop = section.id === "hero" ? parseFloat(getComputedStyle(section).paddingTop) + EDGE : EDGE;
  const spanX = Math.max(0, box.width - SIZE - EDGE * 2);
  const spanY = Math.max(0, box.height - SIZE - EDGE - minTop);

  let best = null;
  for (let i = 0; i < ATTEMPTS; i++) {
    const left = EDGE + Math.random() * spanX;
    const top = minTop + Math.random() * spanY;
    const candidate = { left, top, right: left + SIZE, bottom: top + SIZE };
    const covered = blockers.reduce((sum, rect) => sum + overlap(candidate, rect), 0);
    if (!best || covered < best.covered) best = { left, top, covered };
    if (covered === 0) break;
  }

  button.style.left = `${(best.left / box.width) * 100}%`;
  button.style.top = `${(best.top / box.height) * 100}%`;
}

export function initGlyphs() {
  const root = document.documentElement;
  const dialog = document.querySelector("#truth");
  if (!dialog) return;
  const close = bindDialog(dialog);
  const found = new Set();
  const total = site.glyphs.length;

  const glyphs = site.glyphs
    .map((glyph) => {
      const section = document.getElementById(glyph.section);
      if (!section) return null;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "glyph";
      button.dataset.glyph = glyph.id;
      button.dataset.i18nAttr = "aria-label:glyphs.label";
      button.setAttribute("aria-label", t("glyphs.label"));
      button.innerHTML = glyphShapes[glyph.shape] ?? "";
      section.append(button);
      return { id: glyph.id, button, section };
    })
    .filter(Boolean);

  const placeAll = () => glyphs.forEach(({ button, section }) => place(button, section));
  const openTruth = () => {
    if (!dialog.open) dialog.showModal();
  };

  glyphs.forEach(({ id, button }) => {
    button.addEventListener("click", () => {
      if (found.size === total) {
        openTruth();
        return;
      }
      if (found.has(id)) {
        toast(t("glyphs.already"));
        return;
      }
      found.add(id);
      button.classList.add("is-found");
      toast(t("glyphs.found").replace("{n}", found.size).replace("{total}", total));
      if (found.size === total) setTimeout(openTruth, prefersReducedMotion() ? 0 : 900);
    });
  });

  dialog.querySelector("[data-truth-contact]")?.addEventListener("click", (event) => {
    event.preventDefault();
    close();
    document.querySelector("#brotherhood")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  });

  dialog.querySelector("[data-truth-reset]")?.addEventListener("click", () => {
    found.clear();
    glyphs.forEach(({ button }) => button.classList.remove("is-found"));
    placeAll();
    close();
  });

  placeAll();
  document.fonts?.ready.then(placeAll);
  window.addEventListener("load", placeAll, { once: true });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!root.classList.contains("eagle-vision")) placeAll();
    }, 300);
  });
}
