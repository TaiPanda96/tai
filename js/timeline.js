(function () {
  "use strict";

  /* ── positionEraNodes ─────────────────────────────────────── */
  function positionEraNodes() {
    var section = document.querySelector(".timeline-section");
    if (!section) return;
    var sectionTop = section.getBoundingClientRect().top + window.scrollY;

    section.querySelectorAll(".era-section").forEach(function (era) {
      var eraId = era.dataset.era;
      if (!eraId) return;
      var node = section.querySelector('.era-node[data-era="' + eraId + '"]');
      if (!node) return;
      var eraTop = era.getBoundingClientRect().top + window.scrollY;
      node.style.top = eraTop - sectionTop + "px";
    });
  }

  /* ── rail progress ────────────────────────────────────────── */
  function initRailProgress() {
    var rail = document.querySelector(".rail-fill");
    if (!rail) return;

    function onScroll() {
      var section = document.querySelector(".timeline-section");
      if (!section) return;
      var sectionTop = section.getBoundingClientRect().top + window.scrollY;
      var pct = ((window.scrollY - sectionTop) / section.offsetHeight) * 100;
      rail.style.height = Math.max(0, Math.min(100, pct)) + "%";
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── count-up ─────────────────────────────────────────────── */
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "true";
    var target = parseInt(el.dataset.target) || 0;
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";
    var duration = 700;
    var start = performance.now();

    function frame(now) {
      var p = Math.min((now - start) / duration, 1);
      var val = Math.round((1 - Math.pow(1 - p, 3)) * target);
      el.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ── scroll reveal + era tracking ────────────────────────── */
  function initReveal() {
    if (!window.IntersectionObserver) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;

          if (
            el.classList.contains("project-card") ||
            el.classList.contains("era-header") ||
            el.classList.contains("era-divider")
          ) {
            el.classList.add("visible");
          }

          if (el.classList.contains("stat-num") && el.dataset.target) {
            countUp(el);
          }

          if (el.classList.contains("era-section")) {
            var eraId = el.dataset.era;
            document.querySelectorAll(".era-node").forEach(function (node) {
              node.classList.remove("active");
            });
            var activeNode = document.querySelector(
              '.era-node[data-era="' + eraId + '"]'
            );
            if (activeNode) activeNode.classList.add("active");
          }

          observer.unobserve(el);
        });
      },
      { threshold: 0.15 }
    );

    document
      .querySelectorAll(
        ".project-card, .era-header, .era-divider, .stat-num[data-target]"
      )
      .forEach(function (el) {
        observer.observe(el);
      });

    // Era tracking uses a lower threshold so the node activates before the
    // header is fully in view
    var eraObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var eraId = entry.target.dataset.era;
          if (!eraId) return;
          document.querySelectorAll(".era-node").forEach(function (node) {
            node.classList.remove("active");
          });
          var activeNode = document.querySelector(
            '.era-node[data-era="' + eraId + '"]'
          );
          if (activeNode) activeNode.classList.add("active");
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll(".era-section").forEach(function (el) {
      eraObserver.observe(el);
    });
  }

  /* ── Init ─────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function () {
    positionEraNodes();
    initRailProgress();
    initReveal();
  });
})();
