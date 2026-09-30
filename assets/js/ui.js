import { site } from "./content.js";
import { t, getLang, toggleLang, onLangChange } from "./i18n.js";
import { getContract, contractIndex } from "./render.js";
import { icons } from "./svg.js";
import { prefersReducedMotion } from "./scramble.js";

const pad = (n) => String(n).padStart(2, "0");

export function initNav() {
  const root = document.documentElement;
  const nav = document.querySelector(".nav");
  const toggle = nav.querySelector(".nav__toggle");
  const links = [...document.querySelectorAll("[data-nav]")];
  const hud = document.querySelector(".hud-sync");
  const hudValue = hud.querySelector(".hud-sync__value");
  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const menuOpen = root.classList.contains("menu-open");
    nav.classList.toggle("is-scrolled", y > 40);
    nav.classList.toggle("is-hidden", !menuOpen && y > lastY + 2 && y > window.innerHeight * 0.6);
    if (y < lastY - 2) nav.classList.remove("is-hidden");
    lastY = y;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(y / max, 1) : 0;
    nav.style.setProperty("--sync", progress);
    hudValue.textContent = `${String(Math.round(progress * 100)).padStart(3, "0")}%`;
    hud.classList.toggle("is-visible", y > window.innerHeight * 0.5);
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();

  const setMenu = (open) => {
    root.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
  links.forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root.classList.contains("menu-open")) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
    if (event.matches) setMenu(false);
  });

  return {
    setActive(id) {
      links.forEach((link) => {
        const active = link.hash === `#${id}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    },
  };
}

export function initLangToggle() {
  const button = document.querySelector(".lang-btn");
  const paint = () => {
    button.querySelectorAll("[data-lang]").forEach((el) => {
      el.classList.toggle("is-current", el.dataset.lang === getLang());
    });
  };
  button.addEventListener("click", toggleLang);
  onLangChange(paint);
  paint();
}

export function initFilters(motion) {
  const group = document.querySelector("#contract-filters");
  const cards = [...document.querySelectorAll(".contract")];

  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;
    group.querySelectorAll("[data-filter]").forEach((el) => el.setAttribute("aria-pressed", String(el === button)));
    cards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
    const shown = cards.filter((card) => !card.hidden);
    shown.forEach((card) => card.classList.add("is-revealed"));
    if (motion) {
      window.gsap.fromTo(
        shown,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "expo.out", clearProps: "opacity,transform" },
      );
      window.ScrollTrigger.refresh();
    }
  });
}

export function initDossier() {
  const dialog = document.querySelector("#dossier");
  const label = dialog.querySelector("[data-dossier-label]");
  const title = dialog.querySelector(".dossier__title");
  const meta = dialog.querySelector(".dossier__meta");
  const body = dialog.querySelector(".dossier__body");
  const tags = dialog.querySelector(".contract__tags");
  const actions = dialog.querySelector(".dossier__actions");
  let currentId = null;

  const fill = () => {
    const contract = getContract(currentId);
    if (!contract) return;
    label.textContent = `${t("contracts.dossier")} // ${t("contracts.no")} Nº ${pad(contractIndex(currentId) + 1)}`;
    title.textContent = t(`contracts.items.${contract.id}.title`);
    meta.textContent = [
      t(`contracts.categories.${contract.category}`),
      `${t("codex.anno")} ${contract.year}`,
      contract.classified ? t("contracts.classified") : "",
    ]
      .filter(Boolean)
      .join(" · ");
    body.textContent = t(`contracts.items.${contract.id}.detail`);
    tags.innerHTML = contract.tech.map((tech) => `<li>${tech}</li>`).join("");
    const links = [];
    if (contract.demo && contract.demo !== "#") {
      links.push(
        `<a class="btn btn--blood" href="${contract.demo}" target="_blank" rel="noopener" data-target>${t("contracts.demo")}${icons.arrowUpRight}</a>`,
      );
    }
    if (contract.repo && contract.repo !== "#") {
      links.push(
        `<a class="btn btn--ghost" href="${contract.repo}" target="_blank" rel="noopener" data-target>${t("contracts.repo")}${icons.arrowUpRight}</a>`,
      );
    }
    if (contract.paper) {
      links.push(
        `<a class="btn btn--ghost" href="${contract.paper}" target="_blank" rel="noopener" data-target>${t("contracts.paper")}${icons.arrowUpRight}</a>`,
      );
    }
    actions.innerHTML = links.join("");
  };

  const close = () => {
    if (!dialog.open || dialog.classList.contains("is-closing")) return;
    if (prefersReducedMotion()) {
      dialog.close();
      return;
    }
    dialog.classList.add("is-closing");
    dialog.addEventListener(
      "animationend",
      () => {
        dialog.classList.remove("is-closing");
        dialog.close();
      },
      { once: true },
    );
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open]");
    if (!trigger || event.target.closest("a")) return;
    currentId = trigger.dataset.open;
    fill();
    dialog.showModal();
  });

  dialog.querySelector("[data-close]").addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  onLangChange(() => {
    if (dialog.open) fill();
  });
}

export function initContactForm() {
  const form = document.querySelector("#contact-form");
  const status = form.querySelector(".raven__status");
  const submit = form.querySelector('[type="submit"]');

  const setStatus = (key, isError = false) => {
    status.dataset.i18n = key;
    status.textContent = t(key);
    status.classList.toggle("is-error", isError);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fields = [...form.querySelectorAll("input, textarea")];
    let valid = true;
    fields.forEach((field) => {
      const invalid = !field.value.trim() || !field.checkValidity();
      field.closest(".field").classList.toggle("is-invalid", invalid);
      field.setAttribute("aria-invalid", String(invalid));
      valid &&= !invalid;
    });
    if (!valid) {
      setStatus("brotherhood.form.invalid", true);
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const data = new FormData(form);
    const name = data.get("name").trim();
    const email = data.get("email").trim();
    const message = data.get("message").trim();

    if (!site.formEndpoint) {
      const subject = encodeURIComponent(`Contract from ${name}`);
      const bodyText = encodeURIComponent(`${message}\n\n${name} <${email}>`);
      setStatus("brotherhood.form.mailto");
      window.location.href = `mailto:${site.email}?subject=${subject}&body=${bodyText}`;
      return;
    }

    submit.disabled = true;
    setStatus("brotherhood.form.sending");
    try {
      const response = await fetch(site.formEndpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(String(response.status));
      form.reset();
      setStatus("brotherhood.form.success");
    } catch {
      setStatus("brotherhood.form.error", true);
    } finally {
      submit.disabled = false;
    }
  });

  form.addEventListener("input", (event) => {
    const field = event.target.closest(".field");
    if (field?.classList.contains("is-invalid") && event.target.checkValidity() && event.target.value.trim()) {
      field.classList.remove("is-invalid");
      event.target.setAttribute("aria-invalid", "false");
    }
  });
}
