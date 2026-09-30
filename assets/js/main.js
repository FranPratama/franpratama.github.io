import { initLang, applyTranslations, onLangChange } from "./i18n.js";
import { renderAll, resolveLogo } from "./render.js";
import { runLoader } from "./loader.js";
import { initBackground } from "./background.js";
import { initEagleVision } from "./eagle-vision.js";
import * as fx from "./effects.js";
import * as ui from "./ui.js";

initLang();
await resolveLogo();
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
initBackground();
fx.prepareHeroIntro(motion);

await runLoader();

fx.playHeroIntro(motion);
fx.initReveals(motion);
fx.initScrambleOnView();
fx.initCounters(motion);
fx.initSkillBars(motion);

if (motion) onLangChange(() => setTimeout(() => window.ScrollTrigger.refresh(), 700));
