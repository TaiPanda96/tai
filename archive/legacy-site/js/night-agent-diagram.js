/* ════════════════════════════════════════════════════════════════
   Fig. 02 — "The Night Agent". A spec flows through Planner →
   Implementer → QA (the prompt layer). Every command an agent emits
   drops to the zero-trust shell harness and is checked against the
   allowlist before execution. PR out by 8 AM.

   Markup contract:
     <div class="viz viz--pipeline" data-diagram="night-agent"><canvas></canvas></div>
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
      rule: "#262420", ruleHi: "#36332D", block: "#C36B5A",
    };

    var W = 920, H = 360;
    var panelY = 86, panelH = 74, panelMid = panelY + panelH;
    var midY = panelY + panelH / 2;
    var stages = [
      { name: "PLANNER", role: "spec → plan", x: 152, w: 146, dur: 2.2, rate: 0.42, vol: 0.5 },
      { name: "IMPLEMENTER", role: "plan → code", x: 387, w: 146, dur: 3.0, rate: 0.24, vol: 1.0 },
      { name: "QA", role: "code → review", x: 622, w: 146, dur: 2.0, rate: 0.40, vol: 0.6 },
    ];
    stages.forEach(function (s) { s.cx = s.x + s.w / 2; s.glow = 0; });
    var promptBox = { x: 134, y: 74, w: 652, h: 100 };
    var gate = { x: 134, y: 250, w: 652, h: 38 };
    var gateTop = gate.y, gateMid = gate.y + gate.h / 2;
    var inX = 44, outX = 878, blockRate = 0.12;

    var job = { phase: "enter", idx: 0, t: 0, emitAcc: 0 };
    var cmds = [];
    var checked = 0, blocked = 0, pr = 0;
    var running = false, last = 0;
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

    function emitCmd(cx) {
      cmds.push({ x: cx + rand(-10, 10), y: panelMid, t: 0, dur: rand(0.3, 0.45), state: "fall", verdict: null, life: 0 });
    }
    function advance() {
      if (job.idx < stages.length - 1) { job.idx++; job.t = 0; job.emitAcc = 0; }
      else { job.phase = "exit"; job.t = 0; }
    }

    function update(dt) {
      for (var i = 0; i < stages.length; i++) stages[i].glow = Math.max(0, stages[i].glow - dt * 2.2);

      if (job.phase === "enter") {
        job.t += dt / 0.8;
        if (job.t >= 1) { job.phase = "stage"; job.idx = 0; job.t = 0; job.emitAcc = 0; }
      } else if (job.phase === "stage") {
        var s = stages[job.idx];
        job.t += dt / s.dur; s.glow = 1; job.emitAcc += dt;
        if (job.emitAcc > s.rate && Math.random() < s.vol) { job.emitAcc = 0; emitCmd(s.cx); }
        else if (job.emitAcc > s.rate) { job.emitAcc = 0; }
        if (job.t >= 1) advance();
      } else if (job.phase === "exit") {
        job.t += dt / 1.0;
        if (job.t >= 1) { pr++; job.phase = "gap"; job.t = 0; }
      } else if (job.phase === "gap") {
        job.t += dt / 0.7;
        if (job.t >= 1) { job.phase = "enter"; job.t = 0; }
      }

      for (var c, k = cmds.length - 1; k >= 0; k--) {
        c = cmds[k];
        if (c.state === "fall") {
          c.t += dt / c.dur; c.y = lerp(panelMid, gateTop, ease(Math.min(c.t, 1)));
          if (c.t >= 1) {
            c.state = "judge"; c.t = 0; c.y = gateMid;
            c.verdict = Math.random() < blockRate ? "block" : "pass";
            checked++; if (c.verdict === "block") blocked++;
          }
        } else if (c.state === "judge") {
          c.t += dt / 0.16;
          if (c.t >= 1) { c.state = c.verdict; c.t = 0; }
        } else if (c.state === "pass") {
          c.t += dt / 0.5; c.life = c.t; c.y = lerp(gateMid, gate.y + gate.h + 14, c.t);
          if (c.t >= 1) cmds.splice(k, 1);
        } else if (c.state === "block") {
          c.t += dt / 0.5; c.life = c.t;
          c.y = gateMid - Math.sin(Math.min(c.t, 1) * Math.PI) * 12;
          c.x += Math.sin(c.t * 40) * 0.6;
          if (c.t >= 1) cmds.splice(k, 1);
        }
      }
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function arrow(x1, x2, y, alpha) {
      ctx.globalAlpha = alpha; ctx.strokeStyle = C.gold; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2 - 4, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2 - 8, y - 3.5); ctx.lineTo(x2 - 3, y); ctx.lineTo(x2 - 8, y + 3.5); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function token(x, y, col, label) {
      ctx.fillStyle = col;
      roundRect(x - 5, y - 5, 10, 10, 2); ctx.fill();
      ctx.font = "9px 'IBM Plex Mono', monospace"; ctx.fillStyle = col; ctx.textAlign = "center";
      ctx.fillText(label, x, y - 9);
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr * S, dpr * S);
      ctx.textBaseline = "alphabetic";

      ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.letterSpacing = "2px";
      ctx.fillStyle = C.faint; ctx.textAlign = "left";
      ctx.fillText("PROMPT LAYER", promptBox.x, promptBox.y - 8);
      ctx.font = "9px 'IBM Plex Mono', monospace"; ctx.letterSpacing = "1px"; ctx.textAlign = "right";
      ctx.fillText("CLAUDE CODE · GITHUB ACTIONS", promptBox.x + promptBox.w, promptBox.y - 8);
      ctx.letterSpacing = "0px";
      ctx.strokeStyle = C.ruleHi; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      roundRect(promptBox.x, promptBox.y, promptBox.w, promptBox.h, 6); ctx.stroke();
      ctx.setLineDash([]);

      var enterP = job.phase === "enter" ? ease(job.t) : 1;
      ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.letterSpacing = "1px";
      ctx.fillStyle = C.faint; ctx.textAlign = "left";
      ctx.fillText("SPEC", inX, midY - 10); ctx.letterSpacing = "0px";
      arrow(inX + 32, stages[0].x, midY, 0.5);
      if (job.phase === "enter") token(lerp(inX + 36, stages[0].x - 6, enterP), midY, C.gold, "spec");

      arrow(stages[0].x + stages[0].w, stages[1].x, midY, job.phase === "stage" && job.idx >= 1 ? 0.85 : 0.4);
      arrow(stages[1].x + stages[1].w, stages[2].x, midY, job.phase === "stage" && job.idx >= 2 ? 0.85 : 0.4);

      for (var i = 0; i < stages.length; i++) {
        var s = stages[i], active = (job.phase === "stage" && job.idx === i);
        roundRect(s.x, panelY, s.w, panelH, 5);
        ctx.fillStyle = C.panel; ctx.fill(); ctx.lineWidth = 1;
        ctx.strokeStyle = s.glow > 0.05 ? "rgba(216,178,107," + (0.35 + s.glow * 0.5) + ")" : C.rule;
        ctx.stroke();
        ctx.font = "12.5px 'IBM Plex Mono', monospace"; ctx.letterSpacing = "0.5px";
        ctx.fillStyle = s.glow > 0.05 ? C.goldHi : C.fg; ctx.textAlign = "left";
        ctx.fillText(s.name, s.x + 14, panelY + 28);
        ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.letterSpacing = "0px";
        ctx.fillStyle = C.faint; ctx.fillText(s.role, s.x + 14, panelY + 46);
        ctx.strokeStyle = C.rule; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(s.x + 14, panelY + panelH - 14); ctx.lineTo(s.x + s.w - 14, panelY + panelH - 14); ctx.stroke();
        if (active || s.glow > 0.05) {
          var prog = active ? job.t : 1;
          ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(s.x + 14, panelY + panelH - 14);
          ctx.lineTo(s.x + 14 + (s.w - 28) * Math.min(prog, 1), panelY + panelH - 14); ctx.stroke();
        }
        ctx.strokeStyle = C.rule; ctx.lineWidth = 1; ctx.setLineDash([2, 5]);
        ctx.beginPath(); ctx.moveTo(s.cx, panelMid); ctx.lineTo(s.cx, gateTop); ctx.stroke();
        ctx.setLineDash([]);
      }

      arrow(stages[2].x + stages[2].w, outX - 30, midY, job.phase === "exit" ? 0.85 : 0.4);
      ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.letterSpacing = "1px";
      ctx.fillStyle = job.phase === "exit" ? C.gold : C.faint; ctx.textAlign = "right";
      ctx.fillText("PR", outX, midY - 10); ctx.letterSpacing = "0px";
      if (job.phase === "exit") token(lerp(stages[2].x + stages[2].w + 6, outX - 22, ease(job.t)), midY, C.gold, "PR");

      ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.letterSpacing = "2px";
      ctx.fillStyle = C.gold; ctx.textAlign = "left";
      ctx.fillText("ZERO-TRUST SHELL · ALLOWLIST", gate.x, gate.y - 9); ctx.letterSpacing = "0px";
      roundRect(gate.x, gate.y, gate.w, gate.h, 5);
      ctx.fillStyle = C.panel; ctx.fill();
      ctx.strokeStyle = "rgba(216,178,107,0.40)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillStyle = C.gray; ctx.textAlign = "center";
      ctx.fillText("every command checked before execution", gate.x + gate.w / 2, gateMid + 4);

      for (var m = 0; m < cmds.length; m++) {
        var c = cmds[m];
        var col = c.state === "block" ? C.block : (c.state === "pass" ? C.gold : C.gray);
        var al = (c.state === "pass" || c.state === "block") ? 1 - c.life : 1;
        ctx.globalAlpha = Math.max(al, 0);
        ctx.strokeStyle = col; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(c.x, c.y - 5); ctx.lineTo(c.x, c.y + 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c.x - 5, c.y); ctx.lineTo(c.x + 5, c.y); ctx.stroke();
        if (c.state === "block") {
          ctx.beginPath(); ctx.moveTo(c.x - 4, c.y - 4); ctx.lineTo(c.x + 4, c.y + 4);
          ctx.moveTo(c.x + 4, c.y - 4); ctx.lineTo(c.x - 4, c.y + 4); ctx.stroke();
        } else {
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(c.x, c.y, 2.2, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.letterSpacing = "1px";
      ctx.textAlign = "left"; ctx.fillStyle = C.faint;
      ctx.fillText(checked.toLocaleString() + " CHECKED", gate.x, 330);
      var bw = ctx.measureText(checked.toLocaleString() + " CHECKED").width;
      ctx.fillStyle = C.block; ctx.fillText("· " + blocked + " BLOCKED", gate.x + bw + 14, 330);
      ctx.textAlign = "right"; ctx.fillStyle = C.gold;
      ctx.fillText(pr + " PR" + (pr === 1 ? "" : "s") + " SHIPPED", gate.x + gate.w, 330);
      ctx.letterSpacing = "0px";
    }

    function frame(ts) {
      if (!running) return;
      var now = ts / 1000;
      var dt = last ? Math.min(now - last, 0.05) : 0.016;
      last = now; update(dt); draw();
      requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); }
    function stop() { running = false; }

    function staticFrame() {
      checked = 1284; blocked = 37; pr = 6;
      job.phase = "stage"; job.idx = 1; job.t = 0.62; stages[1].glow = 1;
      for (var i = 0; i < 4; i++) emitCmd(stages[1].cx);
      cmds.forEach(function (c, i) { c.state = i === 0 ? "block" : "fall"; c.y = lerp(panelMid, gateTop, i / 4); c.verdict = c.state; });
      draw();
    }

    stage.addEventListener("pointerdown", function () {
      if (rmq.matches) return;
      if (job.phase === "gap") { job.phase = "enter"; job.t = 0; }
      var s = stages[job.idx] || stages[0];
      for (var i = 0; i < 4; i++) emitCmd(s.cx);
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
    window.addEventListener("resize", function () { resize(); if (!running) draw(); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (!rmq.matches && !running) start();
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
    else boot();
  }

  function init() {
    var nodes = document.querySelectorAll('[data-diagram="night-agent"]');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
