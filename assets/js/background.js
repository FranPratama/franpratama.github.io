import { eagle } from "./svg.js";
import { prefersReducedMotion } from "./scramble.js";

function initParallax(hero, isVisible) {
  const layers = [...hero.querySelectorAll("[data-depth]")];
  if (!layers.length) return;

  const finePointer = window.matchMedia("(pointer: fine)").matches;
  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;

  if (finePointer) {
    hero.addEventListener(
      "pointermove",
      (event) => {
        targetX = event.clientX / window.innerWidth - 0.5;
        targetY = event.clientY / window.innerHeight - 0.5;
      },
      { passive: true },
    );
  }

  const loop = () => {
    if (isVisible()) {
      x += (targetX - x) * 0.06;
      y += (targetY - y) * 0.06;
      const scroll = window.scrollY;
      for (const layer of layers) {
        const depth = Number(layer.dataset.depth);
        const sway = Number(layer.dataset.sway || 0);
        layer.style.transform = `translate3d(${-x * sway}px, ${scroll * depth - y * sway * 0.3}px, 0)`;
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function initDust(canvas, isVisible) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const count = window.innerWidth < 700 ? 25 : 60;
  let width = 0;
  let height = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const spawn = (particle, anywhere = false) =>
    Object.assign(particle, {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : height + 10,
      r: 0.6 + Math.random() * 1.8,
      vx: -0.15 + Math.random() * 0.3,
      vy: -(0.15 + Math.random() * 0.45),
      life: 0,
      maxLife: 400 + Math.random() * 600,
      ember: Math.random() < 0.3,
      phase: Math.random() * Math.PI * 2,
    });

  resize();
  window.addEventListener("resize", resize);
  const particles = Array.from({ length: count }, () => spawn({}, true));

  const draw = (time) => {
    if (isVisible() && !document.hidden) {
      ctx.clearRect(0, 0, width, height);
      const eagleVision = document.documentElement.classList.contains("eagle-vision");
      for (const p of particles) {
        p.life += 1;
        p.x += p.vx + Math.sin(time * 0.001 + p.phase) * 0.2;
        p.y += p.vy;
        if (p.life > p.maxLife || p.y < -10) spawn(p);
        const fade = Math.max(0, Math.min(p.life / 60, 1, (p.maxLife - p.life) / 60));
        ctx.globalAlpha = fade * (p.ember ? 0.8 : 0.45);
        ctx.fillStyle = p.ember ? (eagleVision ? "#d8b477" : "#ff7a3d") : eagleVision ? "#9fc3ea" : "#e8e2d6";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

function initEagle(host, isVisible) {
  if (!host) return;
  host.innerHTML = eagle();
  const svg = host.firstElementChild;
  const hero = host.parentElement;

  const schedule = (delay = 12000 + Math.random() * 6000) => setTimeout(fly, delay);

  function fly() {
    if (!isVisible() || document.hidden) {
      schedule(4000);
      return;
    }
    const width = hero.clientWidth;
    const height = hero.clientHeight;
    const leftToRight = Math.random() < 0.6;
    const startY = height * (0.1 + Math.random() * 0.22);
    const arc = height * (0.04 + Math.random() * 0.1);
    const duration = 9000 + Math.random() * 4000;
    const scale = 0.55 + Math.random() * 0.6;
    const startedAt = performance.now();
    host.style.opacity = "1";

    const step = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const distance = (width + 260) * progress;
      const x = leftToRight ? -130 + distance : width + 130 - distance;
      const y = startY - Math.sin(progress * Math.PI) * arc + Math.sin(progress * Math.PI * 6) * 6;
      svg.classList.toggle("is-gliding", Math.sin(progress * Math.PI * 3) > 0.2);
      host.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${leftToRight ? scale : -scale}, ${scale})`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        host.style.opacity = "0";
        schedule();
      }
    };
    requestAnimationFrame(step);
  }

  schedule(3500);
}

export function initBackground() {
  const hero = document.querySelector(".hero");
  if (!hero || prefersReducedMotion()) return;

  let heroVisible = true;
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
  }).observe(hero);
  const isVisible = () => heroVisible;

  initParallax(hero, isVisible);
  initDust(hero.querySelector(".hero__dust"), isVisible);
  initEagle(hero.querySelector(".hero__eagle"), isVisible);
}
