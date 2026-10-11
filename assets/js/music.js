import { t } from "./i18n.js";
import { icons } from "./svg.js";
import { toast, isTyping } from "./effects.js";

const VIDEO_ID = "1i3HnXAVWPo";
const VOLUME = 30;
const FADE_MS = 2000;
const VERIFY_MS = 8000;
const GESTURES = ["pointerdown", "touchend", "keydown"];

function loadApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = reject;
    document.head.append(script);
  });
}

export function initMusic() {
  const root = document.documentElement;
  const button = document.querySelector(".music-btn");
  const mount = document.getElementById("music-player");
  let player = null;
  let ready = false;
  let requested = false;
  let pending = false;
  let playing = false;
  let userMuted = false;
  let resumeOnShow = false;
  let fadeTimer = 0;
  let verifyTimer = 0;

  const render = (on) => {
    if (!button) return;
    button.setAttribute("aria-pressed", String(on));
    button.innerHTML = icons[on ? "sound" : "mute"];
  };

  const clearTimers = () => {
    clearInterval(fadeTimer);
    clearInterval(verifyTimer);
  };

  const fadeIn = () => {
    const startedAt = performance.now();
    player.setVolume(0);
    fadeTimer = setInterval(() => {
      const progress = Math.min((performance.now() - startedAt) / FADE_MS, 1);
      player.setVolume(Math.round(VOLUME * progress));
      if (progress === 1) clearInterval(fadeTimer);
    }, 50);
  };

  const arm = () => {
    GESTURES.forEach((type) => window.addEventListener(type, onGesture, true));
  };

  const disarm = () => {
    GESTURES.forEach((type) => window.removeEventListener(type, onGesture, true));
  };

  const disable = () => {
    clearTimers();
    disarm();
    pending = false;
    playing = false;
    if (button) button.hidden = true;
  };

  const verify = () => {
    const { PLAYING, BUFFERING, UNSTARTED, PAUSED, CUED } = window.YT.PlayerState;
    const startedAt = performance.now();
    let buffered = false;
    verifyTimer = setInterval(() => {
      const state = player.getPlayerState();
      if (state === BUFFERING) buffered = true;
      if (state === PLAYING && !player.isMuted()) {
        clearInterval(verifyTimer);
        disarm();
        return;
      }
      const blocked =
        state === PLAYING ||
        state === PAUSED ||
        state === CUED ||
        (state === UNSTARTED && buffered) ||
        performance.now() - startedAt > VERIFY_MS;
      if (!blocked) return;
      clearTimers();
      if (state === PLAYING) player.pauseVideo();
      playing = false;
      render(false);
      if (!userMuted) arm();
    }, 300);
  };

  const start = () => {
    playing = true;
    render(true);
    if (!ready) {
      pending = true;
      ensurePlayer();
      return;
    }
    clearTimers();
    player.unMute();
    player.playVideo();
    fadeIn();
    verify();
  };

  const stop = () => {
    clearTimers();
    pending = false;
    playing = false;
    render(false);
    if (ready) player.pauseVideo();
  };

  const onGesture = (event) => {
    if (event.type === "keydown" && (event.key === "Escape" || event.metaKey || event.ctrlKey || event.altKey)) return;
    disarm();
    const togglesItself =
      event.target.closest?.(".music-btn") ||
      (event.key?.toLowerCase() === "m" && !isTyping(event) && !root.classList.contains("is-loading"));
    if (!togglesItself) start();
  };

  const toggle = () => {
    disarm();
    if (button?.hidden) return;
    const on = !playing;
    userMuted = !on;
    if (on) start();
    else stop();
    toast(t(on ? "ui.musicOn" : "ui.musicOff"));
  };

  render(false);

  if (!mount) {
    disable();
    return;
  }

  const ensurePlayer = () => {
    if (requested) return;
    requested = true;
    loadApi()
      .then((YT) => {
        player = new YT.Player(mount, {
          videoId: VIDEO_ID,
          host: "https://www.youtube-nocookie.com",
          width: 200,
          height: 200,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            loop: 1,
            playlist: VIDEO_ID,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              ready = true;
              player.getIframe().tabIndex = -1;
              if (pending) {
                pending = false;
                start();
              }
            },
            onStateChange: (event) => {
              if (event.data !== YT.PlayerState.PLAYING || document.hidden || player.isMuted()) return;
              if (userMuted) {
                player.pauseVideo();
                return;
              }
              disarm();
              if (playing) return;
              playing = true;
              render(true);
            },
            onError: disable,
          },
        });
      })
      .catch(disable);
  };

  button?.addEventListener("click", toggle);

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "m" || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTyping(event) || root.classList.contains("is-loading")) return;
    toggle();
  });

  document.addEventListener("visibilitychange", () => {
    if (!ready) return;
    if (document.hidden) {
      clearInterval(verifyTimer);
      resumeOnShow = playing;
      if (playing) player.pauseVideo();
    } else if (resumeOnShow) {
      resumeOnShow = false;
      player.playVideo();
    }
  });

  arm();
}
