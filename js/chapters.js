export const CHAPTERS = [
  { id: "cover", label: "Cover",                 theme: "dark"  },
  { id: "toc",   label: "Contents",              theme: "light" },
  { id: "ch1",   label: "I — Who I Am",          theme: "light" },
  { id: "ch2",   label: "II — Agent Harness",    theme: "light" },
  { id: "ch3",   label: "III — Millie & Penny",  theme: "light" },
  { id: "ch4",   label: "IV — Night Agent",      theme: "light" },
  { id: "ch5",   label: "V — Financial Engines", theme: "light" },
  { id: "ch6",   label: "VI — Before HighFi",    theme: "light" },
];

export const state = { current: 0 };

// Registered by main.js after importing updateNav — avoids circular imports
let _onNavigate = null;
export function onNavigate(cb) { _onNavigate = cb; }

export function goTo(index) {
  if (index < 0 || index >= CHAPTERS.length) return;

  const prev = document.querySelector(".chapter.active");
  if (prev) {
    prev.classList.remove("visible");
    setTimeout(() => prev.classList.remove("active"), 300);
  }

  setTimeout(
    () => {
      state.current = index;
      const el = document.getElementById(CHAPTERS[index].id);
      el.classList.add("active");
      el.scrollTop = 0;
      requestAnimationFrame(() => el.classList.add("visible"));
      if (_onNavigate) _onNavigate();
    },
    prev ? 150 : 0,
  );
}

export function navigate(dir) {
  goTo(state.current + dir);
}
