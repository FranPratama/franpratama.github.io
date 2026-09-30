const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/\\|";
const active = new WeakMap();

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

export function scramble(el, text, { duration = 900 } = {}) {
  active.get(el)?.();

  if (prefersReducedMotion()) {
    el.textContent = text;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const from = el.textContent;
    const length = Math.max(from.length, text.length);
    const slots = Array.from({ length }, (_, i) => {
      const start = Math.random() * 0.45;
      return {
        from: from[i] ?? "",
        to: text[i] ?? "",
        start,
        end: start + 0.25 + Math.random() * 0.3,
        glyph: randomGlyph(),
      };
    });
    const startedAt = performance.now();
    let frameId = 0;

    const finish = () => {
      cancelAnimationFrame(frameId);
      el.textContent = text;
      el.classList.remove("is-scrambling");
      active.delete(el);
      resolve();
    };

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      let output = "";
      for (const slot of slots) {
        if (progress >= slot.end) {
          output += slot.to;
        } else if (progress >= slot.start) {
          if (Math.random() < 0.35) slot.glyph = randomGlyph();
          output += slot.to === " " ? " " : slot.glyph;
        } else {
          output += slot.from;
        }
      }
      el.textContent = output;
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    el.classList.add("is-scrambling");
    active.set(el, finish);
    frameId = requestAnimationFrame(tick);
  });
}
