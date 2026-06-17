/* home.js — homepage interactions: stat count-up + scroll reveal.
   The thesis diagram self-initialises from thesis-diagram.js. */
(function () {
  "use strict";

  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "true";
    var target = parseInt(el.dataset.target, 10) || 0;
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";
    var duration = 700, start = performance.now();
    function step(now) {
      var p = Math.min((now - start) / duration, 1);
      var val = Math.round((1 - Math.pow(1 - p, 3)) * target);
      el.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function init() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
      document.querySelectorAll(".stat-num[data-target]").forEach(countUp);
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.classList.contains("reveal")) el.classList.add("in");
        if (el.classList.contains("stat-num") && el.dataset.target) {
          if (reduce) el.textContent = (el.dataset.prefix || "") + el.dataset.target + (el.dataset.suffix || "");
          else countUp(el);
        }
        obs.unobserve(el);
      });
    }, { threshold: 0.2 });

    document.querySelectorAll(".reveal, .stat-num[data-target]").forEach(function (el) { obs.observe(el); });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
