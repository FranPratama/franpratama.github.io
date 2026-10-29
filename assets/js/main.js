import { initLang, applyTranslations, onLangChange } from "./i18n.js";
import { renderAll, resolveLogo, resolveEagle } from "./render.js";
import { runLoader } from "./loader.js";
import { initBackground } from "./background.js";
import { initEagleVision } from "./eagle-vision.js";
import { initGlyphs } from "./glyphs.js";
import { initMusic } from "./music.js";
import * as fx from "./effects.js";
import * as ui from "./ui.js";
import { prefersReducedMotion } from "./scramble.js";

const toTop = () => window.scrollTo({ top: 0, behavior: "instant" });
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

toTop();

initLang();
initMusic();
await Promise.all([resolveLogo(), resolveEagle()]);
renderAll();
applyTranslations();
document.documentElement.classList.add("is-rendered");
await nextTask();

for (const block of document.querySelectorAll("main > .section, .footer")) {
  block.classList.add("is-laid-out");
  void block.offsetHeight;
  await nextTask();
}

const motion = fx.enableMotion();
const nav = ui.initNav();

ui.initLangToggle();
ui.initFilters(motion);
ui.initDossier();
ui.initContactForm();
initEagleVision();
initGlyphs();
fx.initCursor();
fx.initEasterEgg();
fx.initLeapButton();
fx.initPortraitGlitch();
fx.initSectionTracking(nav.setActive);
fx.prepareHeroIntro(motion);
await nextTask();

await runLoader();

const anchorTarget = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
if (anchorTarget) {
  toTop();
  anchorTarget.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

const background = initBackground();
background?.startEagle();

fx.playHeroIntro(motion);
fx.initReveals(motion);
fx.initScrambleOnView();
fx.initCounters(motion);

if (motion) onLangChange(() => setTimeout(() => window.ScrollTrigger.refresh(), 700));
