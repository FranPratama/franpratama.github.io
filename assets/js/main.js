import { initLang, applyTranslations, onLangChange } from "./i18n.js";
import { renderAll, resolveLogo, resolveEagle } from "./render.js";
import { runLoader } from "./loader.js";
import { initBackground } from "./background.js";
import { initEagleVision } from "./eagle-vision.js";
import * as fx from "./effects.js";
import * as ui from "./ui.js";
import { prefersReducedMotion } from "./scramble.js";

const toTop = () => window.scrollTo({ top: 0, behavior: "instant" });

toTop();

initLang();
await Promise.all([resolveLogo(), resolveEagle()]);
renderAll();
applyTranslations();

const motion = fx.enableMotion();
const nav = ui.initNav();

ui.initLangToggle();
ui.initFilters(motion);
ui.initDossier();
ui.initContactForm();
initEagleVision();
fx.initCursor();
fx.initEasterEgg();
fx.initLeapButton();
fx.initPortraitGlitch();
fx.initSectionTracking(nav.setActive);
const background = initBackground();
fx.prepareHeroIntro(motion);

await runLoader();

const anchorTarget = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
if (anchorTarget) {
  toTop();
  anchorTarget.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

background?.startEagle();

fx.playHeroIntro(motion);
fx.initReveals(motion);
fx.initScrambleOnView();
fx.initCounters(motion);

if (motion) onLangChange(() => setTimeout(() => window.ScrollTrigger.refresh(), 700));
