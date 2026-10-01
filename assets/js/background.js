import { eagle } from "./svg.js";
import { hasRiggedEagle, riggedEagle } from "./render.js";
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
  if (!host) return () => {};
  host.innerHTML = hasRiggedEagle() ? riggedEagle() : eagle();
  const svg = host.firstElementChild;
  const hero = host.parentElement;
  let timer = 0;

  const schedule = (delay = 8000 + Math.random() * 4000) => {
    clearTimeout(timer);
    timer = setTimeout(fly, delay);
  };

  function fly() {
    if (!isVisible() || document.hidden) {
      schedule(3000);
      return;
    }
    const width = hero.clientWidth;
    const height = hero.clientHeight;
    const narrow = width <= 700;
    const cx = width * (narrow ? 0.62 : 0.8);
    const cy = height * 0.36;
    const rx = width * (narrow ? 0.3 : 0.13);
    const ry = height * 0.11;
    const direction = Math.random() < 0.5 ? 1 : -1;
    const startAngle = Math.random() * Math.PI * 2;
    const sweep = Math.PI * 2.5;
    const duration = 14000;
    const halfWidth = host.offsetWidth / 2;
    const halfHeight = host.offsetHeight / 2;
    const startedAt = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const angle = startAngle + direction * sweep * progress;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      const vx = -rx * Math.sin(angle) * direction;
      const vy = ry * Math.cos(angle) * direction;
      const facing = vx >= 0 ? 1 : -1;
      const tilt = Math.max(-18, Math.min(18, ((Math.atan2(vy, Math.abs(vx)) * 180) / Math.PI) * 0.5));
      const bob = Math.sin(now * 0.004) * 3;
      const scale = 0.75 + (0.35 * (Math.sin(angle) + 1)) / 2;
      host.style.opacity = String(Math.min(1, progress / 0.1, (1 - progress) / 0.1));
      svg.classList.toggle("is-gliding", vy > 0);
      host.style.transform = `translate3d(${x - halfWidth}px, ${y - halfHeight + bob}px, 0) rotate(${facing * tilt}deg) scale(${facing * scale}, ${scale})`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        host.style.opacity = "0";
        schedule();
      }
    };
    requestAnimationFrame(step);
  }

  return () => schedule(1500);
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
  return { startEagle: initEagle(hero.querySelector(".hero__eagle"), isVisible) };
}
