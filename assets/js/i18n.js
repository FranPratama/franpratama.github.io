import { strings } from "./content.js";
import { scramble } from "./scramble.js";

const STORAGE_KEY = "animus-lang";
const listeners = new Set();
let current = "en";

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function store(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
}

export function initLang() {
  const stored = readStored();
  const browser = (navigator.language || "en").toLowerCase().startsWith("id") ? "id" : "en";
  current = stored in strings ? stored : browser;
  document.documentElement.lang = current;
  return current;
}

export const getLang = () => current;

export function t(key, lang = current) {
  const value = key.split(".").reduce((node, part) => node?.[part], strings[lang]);
  return value ?? key;
}

function isOnScreen(el) {
  const rect = el.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
}

export function applyTranslations(root = document, { animate = false } = {}) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const text = t(el.dataset.i18n);
    if (el.textContent === text) return;
    if (animate && el.hasAttribute("data-scramble") && isOnScreen(el)) {
      scramble(el, text, { duration: 600 });
    } else {
      el.textContent = text;
    }
  });

  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(";").forEach((pair) => {
      const [attr, key] = pair.split(":").map((part) => part.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });

  if (root === document) {
    document.title = t("meta.title");
    document.querySelector('meta[name="description"]')?.setAttribute("content", t("meta.description"));
  }
}

export function setLang(lang) {
  if (!(lang in strings) || lang === current) return;
  current = lang;
  store(lang);
  document.documentElement.lang = lang;
  applyTranslations(document, { animate: true });
  listeners.forEach((listener) => listener(lang));
}

export const toggleLang = () => setLang(current === "en" ? "id" : "en");

export function onLangChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
