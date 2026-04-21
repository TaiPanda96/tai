(function () {
  "use strict";

  /* ── 1a. positionEraNodes ───────────────────────────────────── */
  function positionEraNodes() {
    var section = document.querySelector(".timeline-section");
    if (!section) return;
    var sectionTop = section.getBoundingClientRect().top + window.scrollY;

    var eras = section.querySelectorAll(".era-section");
    eras.forEach(function (era) {
      var eraId = era.dataset.era;
      if (!eraId) return;
      var node = document.querySelector('.era-node[data-era="' + eraId + '"]');
      if (!node) return;
      var eraTop = era.getBoundingClientRect().top + window.scrollY;
      node.style.top = (eraTop - sectionTop) + "px";
    });
  }

  /* ── 1b. initRailProgress ──────────────────────────────────── */
  function initRailProgress() {
    var rail = document.querySelector(".rail-fill");
    if (!rail) return;

    function onScroll() {
      var section = document.querySelector(".timeline-section");
      if (!section) return;
      var sectionTop = section.getBoundingClientRect().top + window.scrollY;
      var sectionHeight = section.offsetHeight;
      var raw = (window.scrollY - sectionTop) / sectionHeight * 100;
      var clamped = Math.max(0, Math.min(100, raw));
      rail.style.height = clamped + "%";
    }

    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ── 1e. countUp ───────────────────────────────────────────── */
  function countUp(el, target, prefix, suffix, duration) {
    duration = duration || 800;
    var start = null;
    var targetNum = parseFloat(target) || 0;

    function step(timestamp) {
      if (!start) start = timestamp;
      var elapsed = timestamp - start;
      var value = Math.floor(Math.min(elapsed / duration, 1) * targetNum);
      el.textContent = prefix + value + suffix;
      if (elapsed < duration) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + targetNum + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  /* ── 1c. initScrollReveal ──────────────────────────────────── */
  function initScrollReveal() {
    if (!window.IntersectionObserver) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("revealed");

        if (el.classList.contains("count-up") && !el.dataset.counted) {
          el.dataset.counted = "true";
          var target = el.dataset.target || "0";
          var prefix = el.dataset.prefix || "";
          var suffix = el.dataset.suffix || "";
          countUp(el, target, prefix, suffix, 800);
        }

        observer.unobserve(el);
      });
    }, { threshold: 0.2 });

    var targets = document.querySelectorAll(".reveal-target");
    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ── 1d. initEraTracking ───────────────────────────────────── */
  function initEraTracking() {
    if (!window.IntersectionObserver) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var eraId = entry.target.dataset.era;
        if (!eraId) return;

        document.querySelectorAll(".era-node").forEach(function (node) {
          node.classList.remove("era-active");
        });

        var activeNode = document.querySelector('.era-node[data-era="' + eraId + '"]');
        if (activeNode) {
          activeNode.classList.add("era-active");
        }
      });
    }, { threshold: 0.3 });

    var sections = document.querySelectorAll(".era-section");
    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ── Init ──────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function () {
    positionEraNodes();
    initRailProgress();
    initScrollReveal();
    initEraTracking();
  });

}());
