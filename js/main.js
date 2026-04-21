import { goTo, navigate, onNavigate } from "./chapters.js";
import { updateNav } from "./nav.js";

// Register updateNav before calling goTo(0) so the init render fires correctly
onNavigate(updateNav);

// TOC entries — DOM order matches chapter indices 2–7
document.querySelectorAll(".toc-entry").forEach((entry, i) => {
  entry.addEventListener("click", () => goTo(i + 2));
});

// Nav bar buttons
document.getElementById("nav-prev").addEventListener("click", () => navigate(-1));
document.getElementById("nav-next").addEventListener("click", () => navigate(1));

// Cover — full surface clickable (links exempt)
document.getElementById("cover").addEventListener("click", (e) => {
  if (e.target.closest("a")) return;
  goTo(1);
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowDown") navigate(1);
  if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   navigate(-1);
});

// If a chapter hash is in the URL (e.g. ebook.html#ch2), open that chapter directly
const hashId = window.location.hash.slice(1);
const hashIndex = CHAPTERS.findIndex(c => c.id === hashId);
goTo(hashIndex >= 0 ? hashIndex : 0);
