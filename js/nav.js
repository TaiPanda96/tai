import { CHAPTERS, state } from "./chapters.js";

export function updateNav() {
  const { current } = state;
  const chapter   = CHAPTERS[current];
  const navBar    = document.getElementById("nav-bar");
  const prevBtn   = document.getElementById("nav-prev");
  const nextBtn   = document.getElementById("nav-next");
  const indicator = document.getElementById("nav-indicator");

  if (current === 0) {
    navBar.className    = "dark cover-mode";
    nextBtn.disabled    = false;
    nextBtn.textContent = "Open Portfolio →";
    prevBtn.disabled    = true;
  } else {
    navBar.className      = chapter.theme === "dark" ? "dark" : "light";
    indicator.textContent = chapter.label;

    prevBtn.disabled = current === 0;
    if (current > 0)
      prevBtn.textContent = `← ${CHAPTERS[current - 1].label}`;

    nextBtn.disabled = current === CHAPTERS.length - 1;
    if (current < CHAPTERS.length - 1)
      nextBtn.textContent = `${CHAPTERS[current + 1].label} →`;
  }
}
