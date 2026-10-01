import { site } from "./content.js";
import { icons, insignia } from "./svg.js";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

const pad = (n) => String(n).padStart(2, "0");

const escapeAttr = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

let logoUrl = null;
let eagleShape = null;
let rigCount = 0;

function probeImage(src) {
  const url = new URL(src, document.baseURI).href;
  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(url);
    probe.onerror = () => resolve(null);
    probe.src = url;
  });
}

export async function resolveLogo() {
  const src = site.logo?.src;
  if (!src) return null;
  logoUrl = await probeImage(src);
  return logoUrl;
}

export async function resolveEagle() {
  const { src, rig } = site.eagle ?? {};
  if (!src || !rig) return null;
  try {
    const response = await fetch(new URL(src, document.baseURI));
    if (!response.ok) return null;
    const doc = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
    const path = doc.querySelector("path");
    if (!path) return null;
    eagleShape = {
      viewBox: doc.querySelector("svg")?.getAttribute("viewBox") ?? "0 0 360 360",
      d: path.getAttribute("d"),
    };
  } catch {
    eagleShape = null;
  }
  return eagleShape;
}

export const hasRiggedEagle = () => Boolean(eagleShape);

export function riggedEagle(className = "") {
  const { far, near, body, joints } = site.eagle.rig;
  const id = `eagle-rig-${++rigCount}`;
  const d = escapeAttr(eagleShape.d);
  const piece = (part) => `<path d="${d}" clip-path="url(#${id}-${part})"/>`;
  const wing = (part, config) =>
    `<g class="eagle-rig__wing eagle-rig__wing--${part}" style="transform-origin: ${config.pivot[0]}px ${config.pivot[1]}px">${piece(part)}</g>`;
  const clips = Object.entries({ far, near, body })
    .map(([part, config]) => `<clipPath id="${id}-${part}"><polygon points="${config.clip}"/></clipPath>`)
    .join("");
  const joint = joints.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join("");
  return `<svg class="eagle-rig ${className}" viewBox="${eagleShape.viewBox}" fill="currentColor" aria-hidden="true" focusable="false"><defs>${clips}</defs>${wing("far", far)}<g class="eagle-rig__body">${piece("body")}${joint}</g>${wing("near", near)}</svg>`;
}

export const getLogo = () => logoUrl;

export const logoMark = (className = "", url = logoUrl) =>
  `<span class="logo-mark ${className}" style="--logo: url('${escapeAttr(url)}')" aria-hidden="true"></span>`;

const emblem = (className, colors) => (logoUrl ? logoMark(className) : insignia({ className, ...colors }));

function tornEdge(seed) {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const points = [];
  const steps = 18;
  const jag = () => rand() * 1.4;
  const pct = (n) => `${n.toFixed(2)}%`;
  const along = (i) => pct((i / steps) * 100);
  for (let i = 0; i <= steps; i++) points.push(`${along(i)} ${pct(jag())}`);
  for (let i = 1; i <= steps; i++) points.push(`${pct(100 - jag() * 0.8)} ${along(i)}`);
  for (let i = steps - 1; i >= 0; i--) points.push(`${along(i)} ${pct(100 - jag())}`);
  for (let i = steps - 1; i >= 1; i--) points.push(`${pct(jag() * 0.8)} ${along(i)}`);
  return `polygon(${points.join(", ")})`;
}

const isLive = (url) => Boolean(url) && url !== "#";

function renderHero() {
  document.querySelector("[data-name-first]").textContent = site.name.first;
  document.querySelector("[data-name-last]").textContent = site.name.last;
  document.querySelectorAll("[data-brand-name]").forEach((el) => {
    el.textContent = `${site.name.first} ${site.name.last}`;
  });
  const cv = document.querySelector("[data-cv]");
  cv.href = site.cvUrl;
  cv.hidden = !isLive(site.cvUrl);
  if (!cv.hidden) cv.setAttribute("download", "");
}

function renderOrigins() {
  const media = document.querySelector(".portrait__media");
  const img = media.querySelector("img");
  img.src = site.photo.src;
  media.classList.toggle("portrait--legacy", site.photo.legacy);
  media.querySelectorAll(".portrait__rgb").forEach((layer) => {
    layer.style.backgroundImage = `url("${site.photo.src}")`;
  });
  document.querySelector("[data-photo-date]").textContent = site.photo.caption;

  document.querySelector("#stats").innerHTML = site.stats
    .map(
      (stat) => `<div class="stats__item" data-reveal>
  <dt class="stats__label" data-i18n="origins.stats.${stat.id}"></dt>
  <dd class="stats__value" data-count="${stat.value}">${stat.value}</dd>
</div>`,
    )
    .join("");
}

function renderArsenal() {
  document.querySelector("#arsenal-grid").innerHTML = site.arsenal
    .map(
      (category, index) => `<article class="arsenal-card" data-reveal>
  <header class="arsenal-card__head">
    <span class="arsenal-card__slot" aria-hidden="true"><span>${ROMAN[index] ?? index + 1}</span></span>
    <div>
      <h3 data-i18n="arsenal.cats.${category.id}.name" data-scramble></h3>
      <p class="arsenal-card__sub" data-i18n="arsenal.cats.${category.id}.sub"></p>
    </div>
    <span class="arsenal-card__weapon">${icons[category.weapon] ?? ""}</span>
  </header>
  <ul class="arsenal-card__list">
    ${category.skills
      .map(
        (skill) => `<li class="skill">
      <span class="skill__icon" style="--icon: url('${escapeAttr(skill.icon)}')" aria-hidden="true"></span>
      <span class="skill__name">${skill.name}</span>
      <span class="skill__level"><span class="sr-only" data-i18n="arsenal.sync"></span> ${skill.level}%</span>
      <span class="skill__bar" aria-hidden="true"><span class="skill__fill" style="--level: ${skill.level / 100}"></span></span>
    </li>`,
      )
      .join("")}
  </ul>
</article>`,
    )
    .join("");
}

function renderContracts() {
  const categories = ["all", ...new Set(site.contracts.map((contract) => contract.category))];
  document.querySelector("#contract-filters").innerHTML = categories
    .map(
      (category) =>
        `<button class="filter" type="button" data-filter="${category}" aria-pressed="${category === "all"}" data-i18n="contracts.filters.${category}"></button>`,
    )
    .join("");

  document.querySelector("#contracts-grid").innerHTML = site.contracts
    .map((contract, index) => {
      const links = [
        isLive(contract.demo)
          ? `<a class="contract__link" href="${escapeAttr(contract.demo)}" target="_blank" rel="noopener" data-target><span data-i18n="contracts.demo"></span>${icons.arrowUpRight}</a>`
          : "",
        isLive(contract.repo)
          ? `<a class="contract__link" href="${escapeAttr(contract.repo)}" target="_blank" rel="noopener" data-target><span data-i18n="contracts.repo"></span>${icons.arrowUpRight}</a>`
          : "",
        isLive(contract.paper)
          ? `<a class="contract__link" href="${escapeAttr(contract.paper)}" target="_blank" rel="noopener" data-target><span data-i18n="contracts.paper"></span>${icons.arrowUpRight}</a>`
          : "",
      ].join("");
      return `<article class="contract" data-category="${contract.category}" data-reveal>
  <div class="contract__paper" style="--torn: ${tornEdge(index + 3)}" data-open="${contract.id}">
    <div class="contract__seal" aria-hidden="true">${emblem("", { bone: "#e8d9b8", blade: "#3a0507" })}</div>
    <p class="contract__no"><span data-i18n="contracts.no"></span> Nº ${pad(index + 1)} · ${contract.year}</p>
    ${contract.classified ? `<p class="contract__classified" data-i18n="contracts.classified"></p>` : ""}
    ${contract.image ? `<div class="contract__thumb"><img src="${escapeAttr(contract.image)}" alt="" loading="lazy"></div>` : ""}
    <h3 class="contract__title" data-i18n="contracts.items.${contract.id}.title"></h3>
    <p class="contract__summary" data-i18n="contracts.items.${contract.id}.summary"></p>
    <ul class="contract__tags">${contract.tech.map((tech) => `<li>${tech}</li>`).join("")}</ul>
    <div class="contract__actions">
      <button class="contract__open" type="button" data-open="${contract.id}" data-target><span data-i18n="contracts.open"></span>${icons.scroll}</button>
      ${links}
    </div>
  </div>
</article>`;
    })
    .join("");
}

function renderCodex() {
  document.querySelector("#codex-list").innerHTML = site.codex
    .map(
      (entry) => `<li class="codex__entry" data-type="${entry.type}" data-reveal>
  <span class="codex__marker" aria-hidden="true"></span>
  <article class="codex__page">
    <p class="codex__date"><span data-i18n="codex.anno"></span> ${entry.start}${
      entry.end === entry.start ? "" : ` &ndash; ${entry.end ?? `<span data-i18n="codex.present"></span>`}`
    }</p>
    <p class="codex__type" data-i18n="codex.types.${entry.type}"></p>
    <h3 data-i18n="codex.items.${entry.id}.role"></h3>
    <p class="codex__place" data-i18n="codex.items.${entry.id}.place"></p>
    <p class="codex__desc" data-i18n="codex.items.${entry.id}.desc"></p>
  </article>
</li>`,
    )
    .join("");
}

function renderBrotherhood() {
  document.querySelector("#socials").innerHTML = site.socials
    .map(
      (social) =>
        `<li><a class="social" href="${escapeAttr(social.url)}" ${social.url.startsWith("mailto:") ? "" : 'target="_blank" rel="noopener"'} aria-label="${escapeAttr(social.label)}" data-target>${icons[social.id] ?? ""}</a></li>`,
    )
    .join("");
  const mail = document.querySelector("[data-email]");
  mail.href = `mailto:${site.email}`;
  mail.textContent = site.email;
}

function renderIcons() {
  document.querySelectorAll("[data-insignia]").forEach((el) => {
    el.innerHTML = emblem(el.dataset.insignia, { bone: "var(--bone)" });
  });
  if (logoUrl) {
    const favicon = document.querySelector('link[rel="icon"]');
    favicon.removeAttribute("type");
    favicon.href = logoUrl;
  }
  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.insertAdjacentHTML("beforeend", icons[el.dataset.icon] ?? "");
  });
  document.querySelector("[data-year]").textContent = new Date().getFullYear();
}

export function renderAll() {
  renderHero();
  renderOrigins();
  renderArsenal();
  renderContracts();
  renderCodex();
  renderBrotherhood();
  renderIcons();
}

export function getContract(id) {
  return site.contracts.find((contract) => contract.id === id);
}

export function contractIndex(id) {
  return site.contracts.findIndex((contract) => contract.id === id);
}
