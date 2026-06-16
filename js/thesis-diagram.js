/* ════════════════════════════════════════════════════════════════
   Fig. 01 — "The Determinism Layer", interactive.
   Probabilistic scatter → processed by the infrastructure layer →
   settled into a deterministic ledger grid. Ambient + click-to-feed.

   Markup contract:
     <div class="viz" data-diagram="thesis"><canvas></canvas></div>
   ════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  function mount(stage) {
    var canvas = stage.querySelector("canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    var C = {
      gold: "#D8B26B", goldHi: "#ECC987",
      gray: "#9D978C", faint: "#6A655C",
      fg: "#F1EEE8", panel: "#18171A",
      rule: "#262420", ruleHi: "#36332D",
    };

    var W = 920, H = 320;
    var cloud = { cx: 140, cy: 168, rx: 92, ry: 96 };
    var panel = { x: 330, y: 58, w: 252, h: 212 };
    var laneY = [118, 154, 190, 226];
    var laneLabel = ["agent harness", "access control", "audit trail", "zero-trust CI"];
    var laneValue = ["typed", "state-based", "per-step", "allowlist"];
    var grid = { x: 660, y: 80, w: 220, h: 170, cols: 3, rows: 5 };
    var gridState = ["settled", "audited", "signed", "legal", "final"];

    var cellW = grid.w / grid.cols, cellH = grid.h / grid.rows;
    var cells = [];
    for (var r = 0; r < grid.rows; r++)
      for (var c = 0; c < grid.cols; c++)
        cells.push({
          cx: grid.x + c * cellW + cellW / 2,
          cy: grid.y + r * cellH + cellH / 2,
          filled: false, fillT: -9, order: 0,
        });

    var lanes = laneY.map(function () { return { glow: 0 }; });
    var particles = [];
    var ambient = [];
    for (var a = 0; a < 14; a++) {
      var an = rand(0, 6.2832), ar = Math.sqrt(Math.random());
      ambient.push({
        x: cloud.cx + Math.cos(an) * cloud.rx * ar,
        y: cloud.cy + Math.sin(an) * cloud.ry * ar,
        vx: rand(-6, 6), vy: rand(-6, 6),
        r: rand(1.8, 3.6), gold: Math.random() < 0.18, ph: rand(0, 6.2832),
      });
    }
    var fillOrder = 0, processed = 0, nextLane = 0;
    var spawnAcc = 0, last = 0, running = false;
    var rmq = window.matchMedia("(prefers-reduced-motion: reduce)");

    var dpr = 1, S = 1, cssW = 0, cssH = 0;
    function resize() {
      var rect = stage.getBoundingClientRect();
      cssW = rect.width; cssH = rect.height || (cssW * H / W);
      S = cssW / W;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }

    function lerp(a, b, t) { return a + (b - a) * t; }
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function rand(a, b) { return a + Math.random() * (b - a); }
    function mix(c1, c2, t) {
      var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
      var rr = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
      var gg = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
      var bb = Math.round(lerp(a & 255, b & 255, t));
      return "rgb(" + rr + "," + gg + "," + bb + ")";
    }

    function spawn(x, y, dwell) {
      var ang = rand(0, Math.PI * 2), rd = Math.sqrt(Math.random());
      particles.push({
        state: "cloud",
        x: x != null ? x : cloud.cx + Math.cos(ang) * cloud.rx * rd,
        y: y != null ? y : cloud.cy + Math.sin(ang) * cloud.ry * rd,
        px: 0, py: 0, vx: rand(-6, 10), vy: rand(-8, 8),
        age: 0, dwell: dwell != null ? dwell : rand(0.5, 1.4),
        t: 0, dur: 0, sx: 0, sy: 0, lane: 0, cell: -1, mixv: 0, r: rand(2.2, 3.8),
      });
    }

    function pickCell() {
      var empty = [];
      for (var i = 0; i < cells.length; i++) if (!cells[i].filled) empty.push(i);
      if (empty.length) return empty[(Math.random() * empty.length) | 0];
      var oldest = 0;
      for (var j = 1; j < cells.length; j++)
        if (cells[j].order < cells[oldest].order) oldest = j;
      cells[oldest].filled = false;
      return oldest;
    }

    function update(dt, now) {
      for (var i = 0; i < lanes.length; i++)
        lanes[i].glow = Math.max(0, lanes[i].glow - dt * 2.5);

      for (var b = 0; b < ambient.length; b++) {
        var d = ambient[b];
        d.vx += rand(-16, 16) * dt; d.vy += rand(-16, 16) * dt;
        d.vx *= 0.9; d.vy *= 0.9;
        d.x += d.vx * dt; d.y += d.vy * dt;
        var ex = d.x - cloud.cx, ey = d.y - cloud.cy;
        if ((ex * ex) / (cloud.rx * cloud.rx) + (ey * ey) / (cloud.ry * cloud.ry) > 1) {
          d.vx -= ex * dt * 1.6; d.vy -= ey * dt * 1.6;
        }
      }

      spawnAcc += dt;
      if (spawnAcc > 0.4 && particles.length < 16) {
        spawnAcc = 0;
        var src = ambient[(Math.random() * ambient.length) | 0];
        spawn(src.x, src.y);
      }

      for (var p, k = particles.length - 1; k >= 0; k--) {
        p = particles[k]; p.px = p.x; p.py = p.y;
        if (p.state === "cloud") {
          p.age += dt;
          p.vx += rand(-22, 22) * dt; p.vy += rand(-22, 22) * dt;
          p.vx *= 0.92; p.vy *= 0.92;
          p.x += p.vx * dt; p.y += p.vy * dt;
          var dx = p.x - cloud.cx, dy = p.y - cloud.cy;
          if ((dx * dx) / (cloud.rx * cloud.rx) + (dy * dy) / (cloud.ry * cloud.ry) > 1) {
            p.vx -= dx * dt * 1.4; p.vy -= dy * dt * 1.4;
          }
          if (p.age > p.dwell) {
            p.lane = nextLane; nextLane = (nextLane + 1) % laneY.length;
            p.state = "toLane"; p.t = 0; p.dur = rand(0.45, 0.7); p.sx = p.x; p.sy = p.y;
          }
        } else if (p.state === "toLane") {
          p.t += dt / p.dur; var e = ease(Math.min(p.t, 1));
          p.x = lerp(p.sx, panel.x, e); p.y = lerp(p.sy, laneY[p.lane], e);
          if (p.t >= 1) { p.state = "processing"; p.t = 0; p.dur = rand(0.55, 0.85); }
        } else if (p.state === "processing") {
          p.t += dt / p.dur; var tt = Math.min(p.t, 1);
          p.x = lerp(panel.x, panel.x + panel.w, tt);
          p.y = laneY[p.lane] + Math.sin(tt * Math.PI) * 2;
          p.mixv = tt; lanes[p.lane].glow = 1;
          if (p.t >= 1) {
            p.cell = pickCell(); p.state = "toCell"; p.t = 0; p.dur = rand(0.45, 0.7);
            p.sx = p.x; p.sy = p.y;
          }
        } else if (p.state === "toCell") {
          p.t += dt / p.dur; var e2 = ease(Math.min(p.t, 1));
          var cell = cells[p.cell];
          p.x = lerp(p.sx, cell.cx, e2); p.y = lerp(p.sy, cell.cy, e2); p.mixv = 1;
          if (p.t >= 1) {
            cell.filled = true; cell.fillT = now; cell.order = ++fillOrder;
            processed++; particles.splice(k, 1);
          }
        }
      }
    }

    function roundRect(x, y, w, h, rr) {
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }

    function draw(now) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr * S, dpr * S);
      ctx.textBaseline = "alphabetic";

      ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.letterSpacing = "2px";
      ctx.fillStyle = C.faint; ctx.textAlign = "left";
      ctx.fillText("PROBABILISTIC", 40, 36);
      ctx.fillStyle = C.gold;
      ctx.fillText("THE INFRASTRUCTURE LAYER", panel.x, 36);
      ctx.fillStyle = C.faint; ctx.textAlign = "right";
      ctx.fillText("DETERMINISTIC", 880, 36);
      ctx.letterSpacing = "0px";

      for (var bi = 0; bi < ambient.length; bi++) {
        var dd = ambient[bi];
        ctx.globalAlpha = 0.20 + 0.30 * (0.5 + 0.5 * Math.sin(now * 1.5 + dd.ph));
        ctx.fillStyle = dd.gold ? C.gold : C.gray;
        ctx.beginPath(); ctx.arc(dd.x, dd.y, dd.r, 0, 6.2832); ctx.fill();
      }
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.state === "cloud") {
          ctx.globalAlpha = 0.22 + 0.45 * (1 - p.age / Math.max(p.dwell, 0.1));
          ctx.fillStyle = C.gray;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      roundRect(panel.x, panel.y, panel.w, panel.h, 5);
      ctx.fillStyle = C.panel; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(216,178,107,0.40)"; ctx.stroke();

      ctx.font = "10.5px 'IBM Plex Mono', monospace";
      ctx.fillStyle = C.gray; ctx.textAlign = "left";
      ctx.fillText("the layer you build", panel.x + 16, panel.y + 28);

      for (var L = 0; L < laneY.length; L++) {
        var y = laneY[L], g = lanes[L].glow;
        if (g > 0) {
          ctx.globalAlpha = g * 0.18; ctx.fillStyle = C.gold;
          ctx.fillRect(panel.x + 1, y - 14, panel.w - 2, 26);
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = g > 0.05 ? "rgba(216,178,107," + (0.3 + g * 0.5) + ")" : C.rule;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(panel.x + 16, y - 18); ctx.lineTo(panel.x + panel.w - 16, y - 18); ctx.stroke();
        ctx.font = "13px 'IBM Plex Mono', monospace";
        ctx.fillStyle = g > 0.05 ? mix(C.fg, C.goldHi, g) : C.fg;
        ctx.textAlign = "left";
        ctx.fillText(laneLabel[L], panel.x + 16, y + 4);
        ctx.font = "11px 'IBM Plex Mono', monospace";
        ctx.fillStyle = C.faint; ctx.textAlign = "right";
        ctx.fillText(laneValue[L], panel.x + panel.w - 16, y + 4);
      }

      ctx.strokeStyle = C.ruleHi; ctx.lineWidth = 1;
      for (var ci = 0; ci < cells.length; ci++) {
        var cl = cells[ci], x0 = cl.cx - cellW / 2, y0 = cl.cy - cellH / 2;
        if (cl.filled) {
          var fa = Math.min((now - cl.fillT) / 0.4, 1);
          ctx.fillStyle = "rgba(216,178,107," + (0.16 + 0.10 * (1 - fa)) + ")";
          ctx.fillRect(x0 + 1, y0 + 1, cellW - 2, cellH - 2);
          ctx.strokeStyle = "rgba(216,178,107," + (0.5 - 0.2 * fa) + ")";
          ctx.strokeRect(x0 + 0.5, y0 + 0.5, cellW - 1, cellH - 1);
          ctx.strokeStyle = C.ruleHi;
        } else {
          ctx.strokeRect(x0 + 0.5, y0 + 0.5, cellW - 1, cellH - 1);
        }
      }
      ctx.font = "9px 'IBM Plex Mono', monospace";
      ctx.fillStyle = C.faint; ctx.textAlign = "right"; ctx.letterSpacing = "1px";
      for (var ri = 0; ri < grid.rows; ri++)
        ctx.fillText(gridState[ri].toUpperCase(), grid.x - 12, grid.y + ri * cellH + cellH / 2 + 3);
      ctx.letterSpacing = "0px";

      for (var m = 0; m < particles.length; m++) {
        var q = particles[m];
        if (q.state === "cloud") continue;
        var col = q.state === "toLane" ? C.gray : mix(C.gray, C.gold, q.mixv);
        ctx.strokeStyle = col; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(q.px, q.py); ctx.lineTo(q.x, q.y); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(q.x, q.y, 2.6, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.fillStyle = C.faint; ctx.textAlign = "right"; ctx.letterSpacing = "1px";
      ctx.fillText(processed.toLocaleString() + " PROCESSED", 880, 306);
      ctx.letterSpacing = "0px";
    }

    function frame(ts) {
      if (!running) return;
      var now = ts / 1000;
      var dt = last ? Math.min(now - last, 0.05) : 0.016;
      last = now; update(dt, now); draw(now);
      requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); }
    function stop() { running = false; }

    function staticFrame() {
      for (var i = 0; i < cells.length; i++) { cells[i].filled = true; cells[i].fillT = -9; }
      for (var n = 0; n < 14; n++) spawn();
      processed = 1287; draw(0);
    }

    stage.addEventListener("pointerdown", function (ev) {
      if (rmq.matches) return;
      var rect = stage.getBoundingClientRect();
      var lx = (ev.clientX - rect.left) / S, ly = (ev.clientY - rect.top) / S;
      var inCloud = lx < panel.x;
      for (var i = 0; i < 7; i++)
        spawn(inCloud ? lx + rand(-12, 12) : null, inCloud ? ly + rand(-12, 12) : null, rand(0.05, 0.35));
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (rmq.matches) return;
        if (e.isIntersecting) start(); else stop();
      });
    }, { threshold: 0.1 });

    function boot() {
      resize();
      if (rmq.matches) staticFrame();
      else io.observe(stage);
    }
    window.addEventListener("resize", function () { resize(); if (!running) draw(last || 0); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (!rmq.matches && !running) start();
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
    else boot();
  }

  function init() {
    var nodes = document.querySelectorAll('[data-diagram="thesis"]');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
