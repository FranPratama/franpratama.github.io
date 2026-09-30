import { INSIGNIA_SHARDS } from "./svg.js";
import { t } from "./i18n.js";
import { scramble, prefersReducedMotion } from "./scramble.js";
import { getLogo, logoMark } from "./render.js";

const SESSION_KEY = "animus-synced";
const SVG_NS = "http://www.w3.org/2000/svg";

const random = (min, max) => min + Math.random() * (max - min);

function wasSynced() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSynced() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {}
}

function pageReady() {
  const loaded =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const timeout = new Promise((resolve) => setTimeout(resolve, 8000));
  return Promise.race([Promise.all([loaded, fonts]), timeout]);
}

function buildInsignia(svg) {
  return INSIGNIA_SHARDS.map((shard) => {
    const polygon = document.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("points", shard.points);
    if (shard.blade) polygon.classList.add("is-blade");
    svg.append(polygon);
    return polygon;
  });
}

function buildLogoSlices(svg, url, count = 8) {
  const wrap = document.createElement("div");
  wrap.className = "loader__logo is-assembling";
  wrap.innerHTML = Array.from({ length: count }, () => logoMark("loader__slice", url)).join("");
  const slices = [...wrap.children];
  slices.forEach((slice, i) => {
    const top = Math.max(0, (i / count) * 100 - 0.4);
    const bottom = Math.max(0, 100 - ((i + 1) / count) * 100 - 0.4);
    slice.style.clipPath = `inset(${top}% 0 ${bottom}% 0)`;
  });
  svg.replaceWith(wrap);
  return slices;
}

function buildHelix(svg, count = 30) {
  const pairs = Array.from({ length: count }, (_, i) => {
    const x = 10 + (i * 380) / (count - 1);
    const line = document.createElementNS(SVG_NS, "line");
    const a = document.createElementNS(SVG_NS, "circle");
    const b = document.createElementNS(SVG_NS, "circle");
    line.setAttribute("x1", x);
    line.setAttribute("x2", x);
    a.setAttribute("cx", x);
    b.setAttribute("cx", x);
    if (i % 2) line.style.display = "none";
    svg.append(line, a, b);
    return { line, a, b };
  });

  return (time) => {
    pairs.forEach(({ line, a, b }, i) => {
      const phase = time * 0.0022 + i * 0.4;
      const wave = Math.sin(phase);
      const depth = Math.cos(phase);
      const ya = 80 + wave * 44;
      const yb = 80 - wave * 44;
      a.setAttribute("cy", ya);
      b.setAttribute("cy", yb);
      a.setAttribute("r", 1.4 + (depth + 1) * 1.1);
      b.setAttribute("r", 1.4 + (1 - depth) * 1.1);
      a.style.opacity = 0.25 + (depth + 1) * 0.35;
      b.style.opacity = 0.25 + (1 - depth) * 0.35;
      line.setAttribute("y1", ya);
      line.setAttribute("y2", yb);
      line.style.opacity = 0.15 + Math.abs(wave) * 0.25;
    });
  };
}

function setPageInert(inert) {
  document.querySelectorAll("[data-app]").forEach((el) => {
    el.inert = inert;
  });
}

export function runLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return Promise.resolve();

  const root = document.documentElement;
  const gsap = window.gsap;
  const reduced = prefersReducedMotion();
  const short = wasSynced();
  const duration = short ? 700 : 2800;

  const titleEl = loader.querySelector(".loader__title");
  const percentEl = loader.querySelector("[data-percent]");
  const bar = loader.querySelector(".loader__bar");
  const statusEl = loader.querySelector(".loader__status");
  const announcer = loader.querySelector("[data-announce]");
  const skip = loader.querySelector(".loader__skip");
  const flash = loader.querySelector(".loader__flash");
  const readout = loader.querySelector(".loader__readout");
  const helixSvg = loader.querySelector(".loader__helix");
  const logo = getLogo();
  const emblemSvg = loader.querySelector(".loader__insignia");
  const shards = logo ? buildLogoSlices(emblemSvg, logo) : buildInsignia(emblemSvg);
  const settle = () => shards[0]?.parentElement.classList.remove("is-assembling");
  const scatter = (spread) =>
    logo
      ? { x: () => random(-spread, spread), y: () => random(-10, 10), skewX: () => random(-35, 35) }
      : {
          x: () => random(-spread, spread),
          y: () => random(-spread * 0.75, spread * 0.75),
          rotation: () => random(-180, 180),
        };
  const drawHelix = reduced ? null : buildHelix(helixSvg);

  titleEl.textContent = t("loader.init");
  skip.textContent = t("loader.skip");
  loader.querySelectorAll("[data-loader-text]").forEach((el) => {
    el.textContent = t(el.dataset.loaderText);
  });
  announcer.textContent = t("loader.init");

  root.classList.add("is-loading");
  setPageInert(true);

  let ready = false;
  pageReady().then(() => {
    ready = true;
  });

  if (gsap && !reduced) {
    if (short) {
      gsap.from(shards, { opacity: 0, scale: 0.6, duration: 0.4, stagger: 0.03, ease: "power2.out", onComplete: settle });
    } else {
      gsap.from(shards, {
        ...scatter(logo ? 320 : 260),
        scale: logo ? 1 : 0.3,
        opacity: 0,
        duration: 1.4,
        ease: "expo.out",
        delay: 0.25,
        stagger: { each: logo ? 0.07 : 0.09, from: "random" },
        onComplete: settle,
      });
    }
  } else {
    settle();
  }

  return new Promise((resolve) => {
    const statuses = t("loader.status");
    const startedAt = performance.now();
    let shown = 0;
    let frameId = 0;
    let lastStatus = -1;
    let switchedTitle = false;
    let finished = false;

    const glitch = () => {
      loader.classList.add("is-glitching");
      setTimeout(() => loader.classList.remove("is-glitching"), 700);
    };

    const hide = () => {
      loader.hidden = true;
      root.classList.remove("is-loading");
      setPageInert(false);
    };

    const finish = (skipped = false) => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frameId);
      document.removeEventListener("keydown", onKey);
      percentEl.textContent = "100";
      bar.style.setProperty("--progress", 1);
      announcer.textContent = t("loader.done");
      markSynced();

      if (!gsap || reduced) {
        loader.style.transition = "opacity 0.5s";
        loader.style.opacity = "0";
        setTimeout(() => {
          hide();
          resolve();
        }, 500);
        return;
      }

      scramble(titleEl, t("loader.done"), { duration: 450 });
      const radius = Math.hypot(window.innerWidth, window.innerHeight) / 2 + 60;
      gsap
        .timeline({ onComplete: hide })
        .to({}, { duration: skipped ? 0.05 : 0.5 })
        .to(flash, { opacity: 0.85, duration: 0.08, ease: "none" })
        .to(flash, { opacity: 0, duration: 0.6, ease: "power2.out" })
        .to(
          shards,
          {
            ...scatter(640),
            opacity: 0,
            duration: 1,
            ease: "expo.out",
            stagger: { each: 0.02, from: "center" },
          },
          "<",
        )
        .to([readout, helixSvg], { opacity: 0, y: 16, duration: 0.4 }, "<")
        .add(resolve, "<0.15")
        .to(loader, { "--hole": `${radius}px`, duration: 1.1, ease: "expo.inOut" }, "<");
    };

    const onKey = (event) => {
      if (event.key === "Escape") finish(true);
    };

    const tick = (now) => {
      const elapsed = now - startedAt;
      const cap = ready ? 100 : 92;
      const target = Math.min(elapsed / duration, 1) * cap;
      shown += (target - shown) * 0.12;
      if (Math.abs(target - shown) < 0.4) shown = target;
      const value = Math.floor(shown);

      percentEl.textContent = String(value).padStart(3, "0");
      bar.style.setProperty("--progress", shown / 100);

      if (!switchedTitle && value >= 12) {
        switchedTitle = true;
        scramble(titleEl, t("loader.sync"), { duration: 500 });
      }

      const statusIndex = Math.min(statuses.length - 1, Math.floor((value / 100) * statuses.length));
      if (statusIndex !== lastStatus) {
        lastStatus = statusIndex;
        scramble(statusEl, statuses[statusIndex], { duration: 420 });
      }

      drawHelix?.(now);
      if (!reduced && Math.random() < 0.01) glitch();

      if (value >= 100) {
        finish();
        return;
      }
      frameId = requestAnimationFrame(tick);
    };

    skip.addEventListener("click", () => finish(true), { once: true });
    document.addEventListener("keydown", onKey);
    frameId = requestAnimationFrame(tick);
  });
}
