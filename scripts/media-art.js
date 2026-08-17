/* Browser-side procedural art used by scripts/generate-media.mjs.
   Runs inside a headless Chrome page; attaches drawing helpers to window. */
(function () {
  const C = {
    paper: "#f6ecd8",
    cream: "#f0e2c8",
    ink: "#2b2620",
    red: "#b64a3a",
    redDark: "#8f362a",
    jade: "#4f7d6a",
    jadeDark: "#35594b",
    gold: "#c1904a",
    goldDark: "#96682c",
    blue: "#66839a",
    blueDark: "#3f5c74",
    brown: "#7a5b3f",
    brownDark: "#533e2d",
    sky: "#9db6c4",
    skyWarm: "#e9cba4"
  };

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rr(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y + h - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  function fillRR(ctx, x, y, w, h, r, color) {
    rr(ctx, x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function polyPath(ctx, pts) {
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    });
    ctx.closePath();
  }

  function fillPoly(ctx, pts, color) {
    polyPath(ctx, pts);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function strokePoly(ctx, pts, color, width = 3, alpha = 1) {
    polyPath(ctx, pts);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function line(ctx, x1, y1, x2, y2, color, width = 3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function circle(ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function glow(ctx, x, y, r, color, alpha = 0.35) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  function sky(ctx, w, h, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function text(ctx, str, x, y, size, color, opts = {}) {
    const { weight = "700", align = "center", alpha = 1, rotate = 0 } = opts;
    ctx.save();
    ctx.translate(x, y);
    if (rotate) ctx.rotate(rotate);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "Microsoft JhengHei","PingFang TC",sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(str, 0, 0);
    ctx.restore();
  }

  function grain(ctx, w, h, alpha = 0.045, seed = 7) {
    const rnd = mulberry32(seed);
    const count = Math.floor((w * h) / 520);
    ctx.save();
    for (let i = 0; i < count; i += 1) {
      const x = rnd() * w;
      const y = rnd() * h;
      const s = rnd() > 0.85 ? 2 : 1;
      ctx.globalAlpha = alpha * (0.35 + rnd() * 0.65);
      ctx.fillStyle = rnd() > 0.5 ? "rgba(48,40,30,1)" : "rgba(255,250,240,1)";
      ctx.fillRect(x, y, s, s);
    }
    ctx.restore();
  }

  function vignette(ctx, w, h, strength = 0.22) {
    const g = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.42,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.72
    );
    g.addColorStop(0, "rgba(20,14,10,0)");
    g.addColorStop(1, `rgba(20,14,10,${strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function cloud(ctx, x, y, s, color, alpha = 0.85) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.42, 0, Math.PI * 2);
    ctx.arc(x + s * 0.34, y - s * 0.16, s * 0.3, 0, Math.PI * 2);
    ctx.arc(x + s * 0.62, y, s * 0.34, 0, Math.PI * 2);
    ctx.arc(x + s * 0.3, y + s * 0.1, s * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function windowGrid(ctx, x, y, w, h, cols, rows, frame, pane, lit = 0.25) {
    const rnd = mulberry32(x * 31 + y * 17);
    const pad = Math.min(w, h) * 0.07;
    const cw = (w - pad * (cols + 1)) / cols;
    const ch = (h - pad * (rows + 1)) / rows;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const wx = x + pad + c * (cw + pad);
        const wy = y + pad + r * (ch + pad);
        ctx.fillStyle = frame;
        ctx.fillRect(wx - 3, wy - 3, cw + 6, ch + 6);
        const warm = rnd() < lit;
        ctx.fillStyle = warm ? "rgba(244,195,110,0.95)" : pane;
        ctx.fillRect(wx, wy, cw, ch);
        if (rnd() > 0.5) {
          line(ctx, wx + cw / 2, wy + 2, wx + cw / 2, wy + ch - 2, frame, 2);
        }
      }
    }
  }

  function facade(ctx, x, y, w, h, color, opts = {}) {
    const { windows = true, sign = "", seed = 3, parapet = 18 } = opts;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(70,56,40,0.18)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(60,48,36,0.9)";
    ctx.fillRect(x, y, w, parapet);
    if (windows) {
      const cols = Math.max(2, Math.round(w / 120));
      const rows = Math.max(2, Math.round(h / 150));
      windowGrid(ctx, x + 10, y + parapet + 10, w - 20, h - parapet - 18, cols, rows, "rgba(58,46,34,0.95)", "rgba(226,224,210,0.9)", 0.24);
    }
    if (sign) {
      const sw = Math.min(180, w - 40);
      const sx = x + (w - sw) / 2;
      const sy = y + 8;
      ctx.save();
      ctx.fillStyle = "rgba(251,247,238,0.92)";
      ctx.fillRect(sx, sy, sw, 36);
      text(ctx, sign, x + w / 2, sy + 19, 20, C.red, { weight: "700" });
      ctx.restore();
    }
  }

  function road(ctx, w, h, horizon, color = "#8d8b84") {
    const g = ctx.createLinearGradient(0, horizon, 0, h);
    g.addColorStop(0, color);
    g.addColorStop(1, "#6f6d67");
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon, w, h - horizon);
  }

  function water(ctx, w, h, horizon, top, bottom) {
    const g = ctx.createLinearGradient(0, horizon, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon, w, h - horizon);
  }

  function silhouettePeople(ctx, x, y, scale, color = "rgba(38,32,26,0.92)", flip = false) {
    ctx.save();
    if (flip) {
      ctx.translate(x * 2, 0);
      ctx.scale(-1, 1);
    }
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -scale * 0.62, scale * 0.13, 0, Math.PI * 2);
    ctx.moveTo(-scale * 0.16, -scale * 0.46);
    ctx.lineTo(scale * 0.16, -scale * 0.46);
    ctx.lineTo(scale * 0.26, scale * 0.42);
    ctx.lineTo(scale * 0.09, scale * 0.42);
    ctx.lineTo(scale * 0.06, scale * 0.16);
    ctx.lineTo(-scale * 0.06, scale * 0.16);
    ctx.lineTo(-scale * 0.09, scale * 0.42);
    ctx.lineTo(-scale * 0.26, scale * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ------------------------------ Photos ------------------------------ */

  function sceneTram(ctx, w, h) {
    sky(ctx, w, h, "#efd9b6", "#a9bfc9");
    glow(ctx, 920, 190, 260, "rgba(255,238,196,0.75)", 0.5);
    facade(ctx, 0, 190, 330, 420, "#e6d9c0", { sign: "德輔道中", seed: 2 });
    facade(ctx, 330, 150, 300, 460, "#d9cbb0", { seed: 4, sign: "藥材行" });
    facade(ctx, 630, 210, 300, 400, "#ead9bd", { seed: 6 });
    facade(ctx, 930, 170, 270, 440, "#dfcfb2", { seed: 8, sign: "布行" });
    road(ctx, w, h, 600, "#9a978f");
    line(ctx, 0, 720, w, 720, "rgba(58,48,38,0.7)", 5);
    line(ctx, 0, 752, w, 752, "rgba(58,48,38,0.55)", 5);
    for (let i = 0; i < 8; i += 1) {
      line(ctx, 130 + i * 170, 776, 190 + i * 170, 860, "rgba(74,66,58,0.55)", 4);
    }
    ctx.fillStyle = "rgba(40,36,30,0.9)";
    ctx.fillRect(380, 618, 220, 16);
    const tram = { x: 420, y: 350 };
    ctx.save();
    ctx.translate(tram.x, tram.y);
    ctx.fillStyle = "#2f5f50";
    ctx.fillRect(0, 0, 300, 190);
    ctx.fillStyle = "#e8dcc2";
    ctx.fillRect(0, 92, 300, 20);
    ctx.fillStyle = "#244a3e";
    ctx.fillRect(0, 0, 300, 16);
    windowGrid(ctx, 14, 22, 272, 62, 6, 1, "#234a3d", "#cfe2d2", 0.85);
    windowGrid(ctx, 14, 118, 272, 62, 6, 1, "#234a3d", "#dce9da", 0.8);
    ctx.fillStyle = "#203d33";
    ctx.fillRect(0, 176, 300, 14);
    circle(ctx, 52, 190, 14, "#26221e");
    circle(ctx, 248, 190, 14, "#26221e");
    ctx.strokeStyle = "rgba(240,238,228,0.85)";
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 288, 178);
    ctx.fillStyle = "#f3e5c8";
    ctx.fillRect(288, 76, 12, 40);
    ctx.restore();
    silhouettePeople(ctx, 260, 610, 56);
    silhouettePeople(ctx, 920, 620, 60, "rgba(40,34,28,0.9)", true);
    silhouettePeople(ctx, 70, 630, 44, "rgba(46,40,32,0.85)");
    silhouettePeople(ctx, 1080, 612, 50, "rgba(42,36,30,0.88)");
    line(ctx, 430, 180, 430, 620, "#2f3b40", 3);
    line(ctx, 720, 180, 720, 620, "#2f3b40", 3);
    line(ctx, 390, 250, 760, 250, "#2f3b40", 3);
  }

  function sceneFerry(ctx, w, h) {
    sky(ctx, w, h, "#f2d7b2", "#9cb8c6");
    ctx.fillStyle = "#b7c2c2";
    ctx.fillRect(0, 320, w, 90);
    for (let i = 0; i < 10; i += 1) {
      const bw = 90 + (i % 3) * 26;
      const bx = 60 + i * 130;
      ctx.fillStyle = "#b8c3c1";
      ctx.fillRect(bx, 320 - bw, 64, bw);
      ctx.fillStyle = "#98a7a8";
      ctx.fillRect(bx + 20, 320 - bw - 8, 24, 8);
    }
    water(ctx, w, h, 410, "#7fa1ab", "#557583");
    for (let i = 0; i < 14; i += 1) {
      line(ctx, 40 + i * 100, 460 + (i % 3) * 16, 130 + i * 100, 470 + (i % 2) * 12, "rgba(255,255,255,0.28)", 2);
    }
    ctx.fillStyle = "#3f5b63";
    ctx.fillRect(90, 280, 210, 190);
    for (let i = 0; i < 7; i += 1) {
      line(ctx, 105 + i * 30, 290, 105 + i * 30, 450, "rgba(40,58,62,0.7)", 5);
    }
    ctx.fillStyle = "#35515a";
    ctx.fillRect(70, 250, 250, 40);
    ctx.fillStyle = "#d8a04c";
    ctx.fillRect(90, 256, 210, 10);
    text(ctx, "天星小輪", 195, 460, 30, "#f3ecd8", { alpha: 0.95 });
    ctx.save();
    ctx.translate(760, 330);
    ctx.fillStyle = "#e8e4da";
    rr(ctx, 0, 30, 360, 110, 10);
    ctx.fill();
    ctx.fillStyle = "#2e6657";
    ctx.fillRect(0, 76, 360, 34);
    ctx.fillStyle = "#d05a42";
    ctx.fillRect(0, 110, 360, 14);
    ctx.fillStyle = "#23463c";
    ctx.fillRect(20, 44, 34, 52);
    ctx.fillRect(300, 44, 40, 58);
    ctx.fillStyle = "#f4e9d2";
    ctx.fillRect(66, 24, 80, 66);
    ctx.fillStyle = "#b84c38";
    ctx.fillRect(64, 6, 84, 20);
    text(ctx, "STAR FERRY", 108, 56, 15, "#23463c", { weight: "700" });
    ctx.fillStyle = "#26352f";
    ctx.beginPath();
    ctx.arc(320, 20, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cbb487";
    ctx.fillRect(318, -8, 4, 30);
    ctx.strokeStyle = "#b84c38";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(302, 6);
    ctx.lineTo(318, 0);
    ctx.lineTo(302, -6);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 5; i += 1) {
      ctx.save();
      ctx.translate(160 + i * 230, 120 + (i % 2) * 30);
      ctx.strokeStyle = "#43555d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.moveTo(16, 0);
      ctx.lineTo(28, 0);
      ctx.moveTo(-6, -4);
      ctx.lineTo(-6, 4);
      ctx.stroke();
      ctx.restore();
    }
    silhouettePeople(ctx, 330, 430, 42, "rgba(35,42,40,0.8)");
    silhouettePeople(ctx, 395, 432, 46, "rgba(38,46,43,0.82)", true);
  }

  function marketStall(ctx, w, h, opts = {}) {
    const morning = opts.morning !== false;
    sky(ctx, w, h, morning ? "#f6dfb4" : "#d8c3a2", "#aebcc2");
    if (morning) {
      glow(ctx, 150, 90, 300, "rgba(255,241,195,0.8)", 0.55);
      for (let i = 0; i < 7; i += 1) {
        line(ctx, 120 + i * 180, 0, 40 + i * 160, 700, "rgba(255,238,190,0.22)", 34);
      }
    }
    ctx.fillStyle = "#e0d2b6";
    ctx.fillRect(0, 190, w, 320);
    facade(ctx, 40, 200, 220, 300, "#decbb0", { seed: 3 });
    facade(ctx, 940, 210, 260, 290, "#dcc7a8", { seed: 5 });
    road(ctx, w, h, 470, "#99958c");
    for (let i = 0; i < 14; i += 1) {
      line(ctx, -40 + i * 120, 560, 20 + i * 120, 850, "rgba(76,68,58,0.3)", 4);
    }
    for (let i = 0; i < 12; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? "#c2462e" : "#f0e3c6";
      ctx.fillRect(i * 100, 200, 100, 54);
    }
    ctx.fillStyle = "rgba(62,50,38,0.9)";
    ctx.fillRect(0, 252, w, 14);
    ctx.fillStyle = "#6f5238";
    ctx.fillRect(80, 266, 380, 34);
    text(ctx, "菜 檔", 270, 284, 24, "#f4ead2", { weight: "700" });
    ctx.fillStyle = "#8a6b47";
    ctx.fillRect(0, 470, w, 18);
    const crates = [
      [120, 430, "#b98852"],
      [330, 420, "#9c7448"],
      [540, 440, "#c09358"],
      [760, 425, "#a57a4b"]
    ];
    crates.forEach(([cx, cy, color], i) => {
      ctx.fillStyle = color;
      rr(ctx, cx, cy, 150, 70, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(64,46,30,0.6)";
      ctx.lineWidth = 3;
      ctx.strokeRect(cx + 8, cy + 8, 134, 54);
      circle(ctx, cx + 36, cy - 6, 22, i % 2 === 0 ? "#4f7d4c" : "#d0a047");
      circle(ctx, cx + 86, cy - 10, 26, i % 2 === 0 ? "#5c8f55" : "#dcb05a");
      circle(ctx, cx + 126, cy - 4, 18, "#6f9b5e");
      circle(ctx, cx + 36, cy - 6, 8, "rgba(30,70,34,0.5)");
      circle(ctx, cx + 86, cy - 10, 9, "rgba(30,70,34,0.5)");
    });
    ctx.fillStyle = "#7d5b3b";
    ctx.beginPath();
    ctx.moveTo(150, 470);
    ctx.lineTo(195, 390);
    ctx.lineTo(210, 470);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6d4e33";
    ctx.beginPath();
    ctx.moveTo(560, 470);
    ctx.lineTo(620, 380);
    ctx.lineTo(640, 470);
    ctx.closePath();
    ctx.fill();
    line(ctx, 70, 470, 70, 830, "#5d4631", 4);
    line(ctx, 1130, 470, 1130, 830, "#5d4631", 4);
    line(ctx, 70, 830, 1130, 830, "#5d4631", 5);
    ctx.fillStyle = "#5a4a38";
    ctx.beginPath();
    ctx.ellipse(220, 838, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7c6448";
    ctx.beginPath();
    ctx.ellipse(420, 838, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b5740";
    ctx.beginPath();
    ctx.ellipse(900, 838, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(47,70,58,0.9)";
    ctx.beginPath();
    ctx.moveTo(720, 300);
    ctx.lineTo(800, 300);
    ctx.lineTo(760, 560);
    ctx.lineTo(680, 560);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(230,220,195,0.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(700, 330, 120, 90);
    text(ctx, "今日", 760, 375, 24, "#f2e5c8", { alpha: 0.9 });
    silhouettePeople(ctx, 480, 470, 52);
    silhouettePeople(ctx, 960, 475, 58, "rgba(38,44,40,0.85)", true);
  }

  function sceneDaiPaiDong(ctx, w, h) {
    sky(ctx, w, h, "#27445b", "#5b7591");
    ctx.fillStyle = "#263f50";
    ctx.fillRect(0, 0, w, 300);
    for (let i = 0; i < 20; i += 1) {
      line(ctx, 30 + i * 62, 20, 40 + i * 62, 300, "rgba(80,108,124,0.6)", 4);
    }
    ctx.fillStyle = "#1f3a4c";
    ctx.fillRect(0, 300, w, 40);
    ctx.fillStyle = "#2a4250";
    ctx.fillRect(0, 300, w, 16);
    text(ctx, "大排檔", 620, 190, 52, "#f0d7a8", { alpha: 0.9 });
    road(ctx, w, h, 330, "#6f6c66");
    ctx.fillStyle = "#b7a27f";
    ctx.fillRect(0, 330, w, 12);
    ctx.fillStyle = "#8a6a49";
    ctx.fillRect(60, 330, 520, 16);
    ctx.fillStyle = "#6d5439";
    ctx.fillRect(620, 330, 520, 16);
    const fire = (x, y, s) => {
      glow(ctx, x, y, s * 2.6, "rgba(255,150,50,0.75)", 0.5);
      ctx.fillStyle = "#ffd56a";
      ctx.beginPath();
      ctx.moveTo(x - s, y + s);
      ctx.quadraticCurveTo(x - s * 0.7, y - s * 0.4, x - s * 0.2, y - s * 1.1);
      ctx.quadraticCurveTo(x, y - s * 0.6, x + s * 0.25, y - s * 1.3);
      ctx.quadraticCurveTo(x + s * 0.7, y - s * 0.4, x + s, y + s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff0b0";
      ctx.beginPath();
      ctx.moveTo(x - s * 0.45, y + s);
      ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.3, x, y - s * 0.8);
      ctx.quadraticCurveTo(x + s * 0.25, y - s * 0.2, x + s * 0.45, y + s);
      ctx.closePath();
      ctx.fill();
    };
    fire(760, 330, 54);
    ctx.fillStyle = "#222d33";
    ctx.beginPath();
    ctx.arc(760, 295, 34, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#3a454c";
    ctx.beginPath();
    ctx.arc(760, 285, 30, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#59636a";
    ctx.beginPath();
    ctx.ellipse(760, 285, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(760, 330);
    ctx.rotate(-0.15);
    ctx.fillStyle = "#2a2f30";
    ctx.fillRect(30, -58, 240, 12);
    ctx.fillRect(30, 0, 240, 12);
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = "#303739";
      ctx.fillRect(40 + i * 52, -46, 38, 46);
    }
    ctx.restore();
    ctx.save();
    ctx.translate(330, 330);
    ctx.rotate(0.06);
    ctx.fillStyle = "#775b3e";
    ctx.fillRect(-160, 18, 320, 8);
    ctx.fillStyle = "#5f4b34";
    ctx.fillRect(-120, 26, 220, 8);
    ctx.restore();
    silhouettePeople(ctx, 250, 380, 64, "rgba(28,34,36,0.95)");
    silhouettePeople(ctx, 980, 350, 54, "rgba(30,38,40,0.95)", true);
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 9; i += 1) {
      ctx.strokeStyle = "rgba(235,240,240,0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(700 + i * 16, 250);
      ctx.quadraticCurveTo(708 + i * 16, 200 + i * 3, 704 + i * 16, 150);
      ctx.stroke();
    }
    ctx.restore();
  }

  function sceneRooftop(ctx, w, h) {
    sky(ctx, w, h, "#8fc0d2", "#e6d7b8");
    cloud(ctx, 300, 120, 140, "rgba(250,246,235,0.9)");
    cloud(ctx, 880, 180, 180, "rgba(250,246,235,0.85)");
    ctx.fillStyle = "#d9c6a4";
    ctx.fillRect(0, 0, w, 200);
    facade(ctx, 0, 200, 330, 400, "#e0cdab", { seed: 5, sign: "唐樓" });
    facade(ctx, 330, 160, 300, 440, "#e7d6b4", { seed: 7 });
    facade(ctx, 630, 210, 300, 390, "#dcc9a6", { seed: 9 });
    facade(ctx, 930, 170, 270, 430, "#e2cfa9", { seed: 11 });
    ctx.fillStyle = "#c9b28c";
    ctx.fillRect(0, 580, w, 120);
    ctx.fillStyle = "#bda27a";
    ctx.fillRect(0, 580, w, 14);
    ctx.fillStyle = "#8a6a45";
    ctx.fillRect(120, 590, 230, 58);
    ctx.fillRect(520, 590, 200, 58);
    ctx.fillRect(890, 590, 250, 58);
    ctx.fillStyle = "#6f5637";
    ctx.fillRect(135, 604, 200, 30);
    ctx.fillRect(535, 604, 170, 30);
    ctx.fillRect(905, 604, 220, 30);
    ctx.fillStyle = "#4c6474";
    ctx.fillRect(60, 470, 34, 200);
    ctx.fillRect(1090, 500, 30, 170);
    line(ctx, 0, 420, w, 420, "rgba(72,58,42,0.8)", 6);
    const clothes = ["#b84c3a", "#3f6d5a", "#c1904a", "#5b7b94", "#d7c5a5", "#7a5b3f"];
    for (let i = 0; i < 12; i += 1) {
      const cx = 40 + i * 100;
      ctx.save();
      ctx.translate(cx, 420);
      ctx.rotate((i % 2 === 0 ? 1 : -1) * 0.06);
      ctx.fillStyle = clothes[i % clothes.length];
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(20, 0);
      ctx.lineTo(14, 58);
      ctx.lineTo(-14, 58);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fillRect(-3, 4, 6, 44);
      ctx.restore();
    }
    line(ctx, 30, 420, 1170, 420, "#8a7656", 4);
    ctx.fillStyle = "#5b6f5b";
    ctx.beginPath();
    ctx.moveTo(60, 470);
    ctx.lineTo(80, 380);
    ctx.lineTo(100, 470);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#4a5d4c";
    ctx.beginPath();
    ctx.moveTo(1090, 500);
    ctx.lineTo(1110, 420);
    ctx.lineTo(1125, 500);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#46604e";
    ctx.beginPath();
    ctx.moveTo(1010, 590);
    ctx.lineTo(1030, 510);
    ctx.lineTo(1050, 590);
    ctx.closePath();
    ctx.fill();
  }

  function sceneKitchen(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#e3cfae");
    g.addColorStop(1, "#c4a87f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#8f714e";
    ctx.fillRect(0, 690, w, 20);
    ctx.fillStyle = "#a3855e";
    ctx.fillRect(0, 0, w, 14);
    line(ctx, 0, 14, w, 14, "rgba(84,62,40,0.5)", 3);
    ctx.fillStyle = "#d8c09a";
    ctx.fillRect(0, 240, w, 30);
    ctx.fillStyle = "rgba(84,62,40,0.4)";
    ctx.fillRect(0, 262, w, 4);
    const winX = 860;
    const winY = 130;
    ctx.fillStyle = "#b79a70";
    ctx.fillRect(winX - 16, winY - 16, 300, 260);
    const wg = ctx.createLinearGradient(winX, winY, winX + 240, winY + 220);
    wg.addColorStop(0, "#f7e9c4");
    wg.addColorStop(1, "#c9d8cf");
    ctx.fillStyle = wg;
    ctx.fillRect(winX, winY, 240, 220);
    ctx.fillStyle = "rgba(255,248,220,0.4)";
    ctx.fillRect(winX, winY, 240, 30);
    ctx.strokeStyle = "#9b7c53";
    ctx.lineWidth = 8;
    ctx.strokeRect(winX, winY, 240, 220);
    ctx.beginPath();
    ctx.moveTo(winX + 120, winY);
    ctx.lineTo(winX + 120, winY + 220);
    ctx.moveTo(winX, winY + 110);
    ctx.lineTo(winX + 240, winY + 110);
    ctx.stroke();
    ctx.fillStyle = "#8c6f4c";
    ctx.fillRect(760, 120, 70, 260);
    ctx.fillStyle = "#7a5f3e";
    ctx.fillRect(770, 130, 50, 50);
    ctx.fillRect(770, 200, 50, 50);
    ctx.fillRect(770, 270, 50, 50);
    ctx.fillStyle = "#a47f52";
    ctx.fillRect(500, 180, 40, 420);
    ctx.fillRect(500, 360, 260, 24);
    ctx.fillStyle = "#917247";
    ctx.fillRect(500, 600, 260, 12);
    ctx.fillStyle = "#5f4a31";
    ctx.fillRect(520, 600, 220, 90);
    ctx.fillStyle = "#6e573b";
    ctx.fillRect(520, 690, 220, 18);
    ctx.fillStyle = "#2c3a36";
    ctx.beginPath();
    ctx.ellipse(650, 550, 76, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#33433e";
    ctx.beginPath();
    ctx.ellipse(650, 540, 60, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#26312e";
    ctx.fillRect(614, 400, 72, 120);
    ctx.fillStyle = "#d0563c";
    ctx.beginPath();
    ctx.arc(650, 400, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0c26a";
    ctx.beginPath();
    ctx.arc(650, 400, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#20302c";
    ctx.fillRect(626, 430, 48, 90);
    ctx.fillStyle = "#d95f3f";
    ctx.fillRect(626, 430, 48, 16);
    ctx.fillStyle = "#3c4b46";
    ctx.fillRect(622, 512, 56, 8);
    for (let i = 0; i < 4; i += 1) {
      line(ctx, 632 + i * 12, 430, 640 + i * 12, 380, "rgba(230,230,220,0.5)", 3);
    }
    glow(ctx, 650, 390, 90, "rgba(255,180,80,0.4)", 0.5);
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 6; i += 1) {
      ctx.strokeStyle = "rgba(250,250,240,0.7)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(630 + i * 8, 382);
      ctx.quadraticCurveTo(640 + i * 8, 330 + i * 4, 635 + i * 8, 290);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = "#8c6f4c";
    ctx.fillRect(170, 250, 130, 350);
    ctx.fillStyle = "#7d6344";
    ctx.fillRect(185, 270, 100, 100);
    ctx.fillRect(185, 390, 100, 100);
    ctx.fillStyle = "#b8905d";
    ctx.fillRect(190, 470, 90, 90);
    ctx.fillStyle = "#a07a49";
    ctx.fillRect(200, 480, 70, 70);
    ctx.fillStyle = "#5f4a31";
    ctx.fillRect(170, 600, 130, 14);
    line(ctx, 190, 340, 270, 340, "rgba(120,92,60,0.6)", 4);
    ctx.fillStyle = "#c6a26a";
    ctx.fillRect(240, 250, 120, 26);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = "#a9875a";
      ctx.fillRect(252 + i * 30, 190 + i * 10, 24, 60);
    }
    ctx.fillStyle = "#a9875a";
    ctx.fillRect(240, 250, 120, 8);
    ctx.fillStyle = "#d8c19a";
    ctx.fillRect(0, 600, w, 120);
    ctx.fillStyle = "#c9ad84";
    ctx.fillRect(0, 600, w, 8);
    for (let i = 0; i < 14; i += 1) {
      ctx.fillStyle = "#b39167";
      ctx.fillRect(i * 90 + 10, 640, 60, 40);
    }
  }

  function sceneBarber(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#e7d5b8");
    g.addColorStop(1, "#c9ab85");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#8f6f4b";
    ctx.fillRect(0, 0, w, 12);
    ctx.fillStyle = "#b2936a";
    ctx.fillRect(0, 620, w, 20);
    const mirror = { x: 420, y: 130, w: 380, h: 250 };
    ctx.fillStyle = "#a17f56";
    ctx.fillRect(mirror.x - 18, mirror.y - 18, mirror.w + 36, mirror.h + 36);
    const mg = ctx.createLinearGradient(mirror.x, mirror.y, mirror.x + mirror.w, mirror.y + mirror.h);
    mg.addColorStop(0, "#f9f2d8");
    mg.addColorStop(1, "#d9cfb8");
    ctx.fillStyle = mg;
    ctx.fillRect(mirror.x, mirror.y, mirror.w, mirror.h);
    ctx.fillStyle = "rgba(255,255,240,0.35)";
    ctx.fillRect(mirror.x, mirror.y, mirror.w, 46);
    ctx.fillStyle = "#7a5b3b";
    ctx.fillRect(mirror.x - 14, mirror.y + mirror.h + 8, mirror.w + 28, 24);
    text(ctx, "上海理髮", mirror.x + mirror.w / 2, mirror.y + mirror.h + 20, 20, "#f4e5c6");
    ctx.fillStyle = "#c58a4e";
    ctx.fillRect(1050, 120, 34, 300);
    ctx.fillStyle = "#f0e6d2";
    ctx.fillRect(1060, 210, 14, 14);
    ctx.fillStyle = "#d24a3f";
    ctx.fillRect(1060, 246, 14, 14);
    ctx.fillStyle = "#3f5f8c";
    ctx.fillRect(1060, 282, 14, 14);
    ctx.fillStyle = "#d24a3f";
    ctx.fillRect(1060, 318, 14, 14);
    ctx.fillStyle = "#f0e6d2";
    ctx.fillRect(1060, 354, 14, 14);
    const chair = { x: 760, y: 430 };
    ctx.fillStyle = "#8c5d34";
    ctx.fillRect(chair.x + 12, chair.y, 190, 40);
    ctx.fillStyle = "#6e4728";
    ctx.fillRect(chair.x, chair.y + 40, 230, 30);
    ctx.fillStyle = "#9c6a3d";
    ctx.beginPath();
    ctx.moveTo(chair.x + 30, chair.y);
    ctx.quadraticCurveTo(chair.x + 120, chair.y - 130, chair.x + 205, chair.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#b74a38";
    ctx.fillRect(chair.x + 48, chair.y - 84, 92, 34);
    ctx.fillStyle = "#7d4f2c";
    ctx.fillRect(chair.x + 100, chair.y - 4, 16, 64);
    ctx.fillRect(chair.x + 196, chair.y - 4, 16, 64);
    ctx.fillStyle = "#4b3222";
    ctx.fillRect(chair.x + 96, chair.y + 64, 26, 46);
    ctx.fillRect(chair.x + 192, chair.y + 64, 26, 46);
    ctx.fillStyle = "#2b3940";
    ctx.fillRect(chair.x + 22, chair.y + 26, 66, 34);
    circle(ctx, chair.x + 38, chair.y + 20, 17, "#d9b088");
    ctx.fillStyle = "#7a5b3b";
    ctx.fillRect(chair.x + 30, chair.y - 6, 72, 14);
    ctx.fillStyle = "#8c6a44";
    ctx.fillRect(chair.x + 8, chair.y - 20, 40, 14);
    ctx.fillRect(chair.x + 84, chair.y - 20, 40, 14);
    ctx.fillStyle = "#3a2c20";
    ctx.fillRect(chair.x + 292, chair.y + 18, 12, 84);
    ctx.fillStyle = "#6b4c30";
    ctx.fillRect(chair.x + 268, chair.y - 12, 60, 30);
    ctx.fillRect(chair.x + 300, chair.y + 26, 44, 16);
    ctx.fillStyle = "#c94f3c";
    ctx.fillRect(chair.x + 308, chair.y + 42, 8, 60);
    ctx.fillStyle = "#f0e6d2";
    ctx.fillRect(chair.x + 300, chair.y + 96, 24, 20);
    const shelfY = 390;
    ctx.fillStyle = "#8c6a44";
    ctx.fillRect(90, shelfY - 12, 210, 12);
    ctx.fillRect(90, shelfY + 60, 210, 12);
    ctx.fillStyle = "#c49a5f";
    ctx.fillRect(110, shelfY - 80, 24, 68);
    ctx.fillRect(150, shelfY - 58, 18, 46);
    ctx.fillRect(186, shelfY - 90, 22, 78);
    ctx.fillStyle = "#f0e2c4";
    ctx.fillRect(120, shelfY - 66, 34, 52);
    ctx.fillStyle = "#bfe0d0";
    ctx.fillRect(168, shelfY - 46, 28, 34);
    ctx.fillStyle = "#9c6a3d";
    ctx.fillRect(110, shelfY + 8, 60, 52);
    ctx.fillStyle = "#d8c09a";
    ctx.fillRect(180, shelfY + 18, 46, 42);
    ctx.fillStyle = "#4b3c30";
    ctx.fillRect(0, 636, w, 16);
    ctx.fillStyle = "#e2cba6";
    ctx.fillRect(0, 648, w, 14);
    for (let i = 0; i < 10; i += 1) {
      ctx.fillStyle = "#cbb18b";
      ctx.fillRect(i * 130 + 20, 680, 90, 18);
    }
    silhouettePeople(ctx, 300, 470, 40, "rgba(52,40,30,0.85)");
    silhouettePeople(ctx, 1140, 500, 46, "rgba(60,46,34,0.9)", true);
  }

  function sceneCobbler(ctx, w, h) {
    sky(ctx, w, h, "#f4e2c0", "#c9cdc4");
    ctx.fillStyle = "#e0d2b8";
    ctx.fillRect(0, 180, w, 420);
    facade(ctx, 0, 190, 280, 410, "#d9c7ac", { seed: 4, sign: "皮鞋" });
    facade(ctx, 920, 210, 280, 390, "#ddc9aa", { seed: 6 });
    road(ctx, w, h, 520, "#a09a8d");
    for (let i = 0; i < 12; i += 1) {
      line(ctx, 20 + i * 120, 600, 60 + i * 120, 850, "rgba(66,58,50,0.28)", 4);
    }
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(300, 300, 420, 26);
    ctx.fillStyle = "#6b4c31";
    ctx.fillRect(300, 326, 420, 12);
    ctx.fillStyle = "#8a6a48";
    ctx.fillRect(330, 356, 340, 34);
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = "#6e5236";
      ctx.fillRect(350 + i * 70, 366, 46, 10);
    }
    ctx.fillStyle = "#5f442c";
    ctx.fillRect(360, 390, 300, 20);
    const bench = { x: 430, y: 470 };
    ctx.fillStyle = "#6f5236";
    ctx.fillRect(bench.x, bench.y, 260, 26);
    ctx.fillRect(bench.x - 24, bench.y + 26, 22, 110);
    ctx.fillRect(bench.x + 262, bench.y + 26, 22, 110);
    ctx.fillStyle = "#a9875a";
    ctx.fillRect(bench.x - 40, bench.y - 30, 340, 24);
    ctx.fillStyle = "#2d3533";
    ctx.beginPath();
    ctx.ellipse(bench.x + 300, bench.y - 44, 90, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4a3c2c";
    ctx.beginPath();
    ctx.ellipse(bench.x + 300, bench.y - 52, 70, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c9a25f";
    ctx.fillRect(bench.x + 260, bench.y - 54, 44, 10);
    ctx.fillStyle = "#b9925a";
    ctx.fillRect(bench.x + 268, bench.y - 44, 8, 22);
    ctx.fillStyle = "#3a2c20";
    ctx.fillRect(bench.x + 300, bench.y - 44, 10, 22);
    ctx.fillStyle = "#8c5d34";
    ctx.fillRect(bench.x + 70, bench.y - 76, 70, 28);
    ctx.fillStyle = "#c94f3c";
    ctx.fillRect(bench.x + 78, bench.y - 70, 54, 8);
    ctx.fillStyle = "#5c462f";
    ctx.fillRect(bench.x + 340, bench.y - 66, 120, 26);
    ctx.fillStyle = "#6e5236";
    ctx.fillRect(bench.x + 350, bench.y - 40, 100, 12);
    ctx.fillStyle = "#8f5b2f";
    ctx.fillRect(bench.x + 250, bench.y - 90, 26, 60);
    ctx.fillStyle = "#f4e8cc";
    ctx.fillRect(bench.x + 256, bench.y - 84, 14, 22);
    ctx.fillStyle = "#5f442c";
    ctx.fillRect(bench.x + 252, bench.y - 30, 22, 56);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(bench.x + 248, bench.y + 26, 30, 20);
    line(ctx, bench.x + 220, bench.y + 26, bench.x + 220, bench.y + 118, "#8c6a44", 8);
    line(ctx, bench.x + 360, bench.y + 26, bench.x + 360, bench.y + 118, "#8c6a44", 8);
    ctx.fillStyle = "#b88a45";
    circle(ctx, bench.x + 460, bench.y - 100, 30, "#c9a25f");
    circle(ctx, bench.x + 460, bench.y - 100, 18, "#8f5b2f");
    circle(ctx, bench.x + 460, bench.y - 100, 7, "#5c3d22");
    ctx.fillStyle = "#3c4b45";
    ctx.fillRect(bench.x + 100, bench.y + 26, 40, 12);
    ctx.fillRect(bench.x + 108, bench.y + 38, 24, 90);
    ctx.fillStyle = "#6e5236";
    ctx.fillRect(bench.x + 470, bench.y - 20, 170, 10);
    ctx.fillStyle = "#8a6a48";
    ctx.fillRect(bench.x + 480, bench.y - 34, 80, 14);
    ctx.fillStyle = "#c9a25f";
    ctx.fillRect(bench.x + 490, bench.y - 28, 24, 18);
    ctx.fillStyle = "#8a6a48";
    ctx.fillRect(bench.x + 570, bench.y - 28, 52, 12);
    silhouettePeople(ctx, 190, 560, 50, "rgba(48,40,30,0.85)");
    silhouettePeople(ctx, 850, 550, 44, "rgba(52,44,32,0.88)", true);
    silhouettePeople(ctx, 1100, 570, 52, "rgba(56,46,34,0.85)");
  }

  function sceneLanterns(ctx, w, h) {
    sky(ctx, w, h, "#2c4560", "#9d8fae");
    for (let i = 0; i < 80; i += 1) {
      const rnd = mulberry32(i * 91 + 13);
      circle(ctx, rnd() * w, rnd() * 260, 1.6 + rnd() * 1.8, "rgba(255,244,214,0.8)");
    }
    ctx.fillStyle = "#f0d9a8";
    ctx.beginPath();
    ctx.arc(990, 120, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d9b878";
    ctx.beginPath();
    ctx.arc(990, 120, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5e3bc";
    ctx.beginPath();
    ctx.arc(990, 104, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#27405a";
    ctx.fillRect(0, 260, w, 110);
    facade(ctx, 0, 270, 330, 330, "#3b4f66", { seed: 8 });
    facade(ctx, 330, 230, 300, 370, "#42586d", { seed: 10 });
    facade(ctx, 630, 280, 300, 320, "#394e63", { seed: 12 });
    facade(ctx, 930, 250, 270, 350, "#40566b", { seed: 14 });
    road(ctx, w, h, 590, "#7b7f83");
    ctx.fillStyle = "#6d7276";
    ctx.fillRect(0, 590, w, 12);
    const stalls = [
      [150, 600, "#7a5b3f"],
      [640, 600, "#8c6a44"]
    ];
    stalls.forEach(([sx, sy, color]) => {
      ctx.fillStyle = "#a17f56";
      ctx.fillRect(sx - 60, sy - 10, 240, 10);
      ctx.fillStyle = color;
      ctx.fillRect(sx - 46, sy, 212, 96);
      ctx.fillStyle = "#6e5236";
      ctx.fillRect(sx - 30, sy + 16, 180, 52);
      ctx.fillStyle = "#f0d9a8";
      ctx.fillRect(sx - 12, sy + 24, 44, 24);
      ctx.fillRect(sx + 42, sy + 24, 44, 24);
      ctx.fillRect(sx + 96, sy + 24, 44, 24);
      glow(ctx, sx + 10, sy + 34, 56, "rgba(255,214,130,0.7)", 0.35);
      ctx.fillStyle = "#d9b878";
      ctx.fillRect(sx - 46, sy - 34, 44, 24);
      ctx.fillRect(sx + 60, sy - 34, 44, 24);
    });
    const lanterns = [
      [240, 420],
      [360, 380],
      [520, 440],
      [780, 400],
      [900, 460],
      [1080, 410]
    ];
    lanterns.forEach(([lx, ly], i) => {
      ctx.strokeStyle = "rgba(238,220,180,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, 260);
      ctx.lineTo(lx, ly - 44);
      ctx.stroke();
      glow(ctx, lx, ly, 84, i % 2 === 0 ? "rgba(255,190,80,0.65)" : "rgba(255,150,80,0.55)", 0.45);
      ctx.fillStyle = i % 2 === 0 ? "#d95b3e" : "#c93d2e";
      ctx.beginPath();
      ctx.ellipse(lx, ly, 26, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i % 2 === 0 ? "#e8d9a8" : "#f0e0b0";
      ctx.fillRect(lx - 14, ly - 4, 28, 8);
      ctx.strokeStyle = "rgba(255,214,120,0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(lx - 16, ly - 16, 32, 32);
    });
    silhouettePeople(ctx, 290, 610, 42, "rgba(26,34,42,0.95)");
    silhouettePeople(ctx, 480, 605, 36, "rgba(30,38,46,0.9)", true);
    silhouettePeople(ctx, 830, 618, 44, "rgba(28,36,44,0.95)");
    for (let i = 0; i < 6; i += 1) {
      const px = 250 + i * 150;
      ctx.fillStyle = "rgba(40,48,58,0.8)";
      ctx.beginPath();
      ctx.arc(px, 645, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i % 2 === 0 ? "#d95b3e" : "#f0c060";
      ctx.beginPath();
      ctx.ellipse(px, 620, 9, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c9b890";
      ctx.fillRect(px - 2, 630, 4, 16);
    }
  }

  function sceneDragonBoat(ctx, w, h) {
    sky(ctx, w, h, "#f0d5a8", "#9cb3bd");
    glow(ctx, 150, 150, 260, "rgba(255,232,170,0.7)", 0.45);
    ctx.fillStyle = "#bcc5b4";
    ctx.fillRect(0, 220, w, 90);
    for (let i = 0; i < 14; i += 1) {
      ctx.fillStyle = "#9fae9e";
      ctx.beginPath();
      ctx.moveTo(40 + i * 100, 300);
      ctx.lineTo(90 + i * 100, 260);
      ctx.lineTo(140 + i * 100, 300);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#7c8f82";
    ctx.fillRect(0, 300, w, 18);
    water(ctx, w, h, 320, "#6f95a3", "#3e6272");
    for (let i = 0; i < 12; i += 1) {
      line(ctx, 30 + i * 110, 470 + (i % 3) * 16, 120 + i * 110, 480 + (i % 2) * 12, "rgba(255,255,255,0.22)", 2);
    }
    const boatY = 350;
    ctx.save();
    ctx.translate(600, boatY);
    ctx.rotate(-0.035);
    ctx.fillStyle = "#a33c2b";
    ctx.beginPath();
    ctx.moveTo(-560, 0);
    ctx.quadraticCurveTo(-420, 86, 0, 80);
    ctx.quadraticCurveTo(380, 86, 540, 0);
    ctx.quadraticCurveTo(300, -40, 0, -38);
    ctx.quadraticCurveTo(-300, -40, -560, 0);
    ctx.fill();
    ctx.fillStyle = "#7f2c22";
    ctx.fillRect(-540, -4, 1080, 16);
    ctx.fillStyle = "#e6b45c";
    ctx.fillRect(-120, -14, 220, 10);
    ctx.fillStyle = "#c9402e";
    ctx.beginPath();
    ctx.moveTo(500, 0);
    ctx.lineTo(580, -58);
    ctx.lineTo(620, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e6c77e";
    ctx.beginPath();
    ctx.moveTo(560, -54);
    ctx.quadraticCurveTo(620, -118, 700, -96);
    ctx.quadraticCurveTo(640, -58, 600, -30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#7f2c22";
    ctx.lineWidth = 3;
    ctx.strokeRect(620, -116, 80, 56);
    ctx.fillStyle = "#f0e0b8";
    ctx.fillRect(626, -110, 68, 44);
    ctx.fillStyle = "#c9402e";
    ctx.beginPath();
    ctx.moveTo(660, -78);
    ctx.lineTo(676, -92);
    ctx.lineTo(660, -106);
    ctx.lineTo(644, -92);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f0e0b8";
    ctx.fillRect(-92, -30, 34, 28);
    ctx.fillStyle = "#e6b45c";
    ctx.fillRect(-84, -24, 18, 14);
    ctx.fillStyle = "#f5e8c4";
    ctx.fillRect(-72, -58, 18, 26);
    for (let i = 0; i < 18; i += 1) {
      const rx = -480 + i * 58;
      ctx.fillStyle = i % 2 === 0 ? "#c9402e" : "#e6b45c";
      ctx.fillRect(rx, -2, 26, 60);
      ctx.fillStyle = "#f0e0b8";
      ctx.fillRect(rx + 5, 10, 6, 34);
      ctx.fillStyle = "#d96a4c";
      ctx.fillRect(rx + 2, 12, 22, 44);
    }
    const drum = { x: 320, y: 18 };
    ctx.fillStyle = "#2d3a44";
    ctx.beginPath();
    ctx.ellipse(drum.x, drum.y, 44, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b84a38";
    ctx.beginPath();
    ctx.arc(drum.x, drum.y, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f0e0b8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(drum.x, drum.y, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#2d3a44";
    ctx.fillRect(drum.x - 8, drum.y - 58, 16, 20);
    ctx.fillRect(drum.x - 8, drum.y + 38, 16, 20);
    ctx.restore();
    ctx.fillStyle = "#3f5f6c";
    ctx.fillRect(100, 320, 90, 90);
    ctx.fillRect(1000, 320, 90, 90);
    for (let i = 0; i < 9; i += 1) {
      ctx.fillStyle = "rgba(44,74,82,0.9)";
      ctx.fillRect(116 + i * 11, 330, 6, 70);
    }
    ctx.fillStyle = "#4a6772";
    ctx.fillRect(980, 320, 90, 90);
    for (let i = 0; i < 9; i += 1) {
      ctx.fillStyle = "rgba(52,82,90,0.9)";
      ctx.fillRect(996 + i * 11, 330, 6, 70);
    }
    for (let i = 0; i < 5; i += 1) {
      const hx = 150 + i * 230;
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.arc(hx, 330 + (i % 2) * 18, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(38,50,44,0.7)";
    for (let i = 0; i < 10; i += 1) {
      silhouettePeople(ctx, 180 + i * 110, 318, 42, "rgba(30,42,40,0.8)", i % 2 === 1);
    }
  }

  function sceneClassroom(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#d9c9a8");
    g.addColorStop(1, "#b99d78");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(0, 560, w, 18);
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(0, 578, w, 100);
    line(ctx, 0, 560, w, 560, "rgba(88,62,38,0.65)", 4);
    ctx.fillStyle = "#a17f56";
    ctx.fillRect(0, 0, w, 14);
    ctx.fillStyle = "#5f7f8c";
    ctx.fillRect(680, 90, 430, 240);
    ctx.fillStyle = "#cfe0da";
    ctx.fillRect(700, 110, 390, 200);
    ctx.fillStyle = "rgba(255,255,240,0.35)";
    ctx.fillRect(700, 110, 390, 26);
    ctx.strokeStyle = "#486570";
    ctx.lineWidth = 7;
    ctx.strokeRect(694, 102, 400, 216);
    line(ctx, 894, 110, 894, 310, "#486570", 5);
    line(ctx, 700, 210, 1090, 210, "#486570", 5);
    ctx.fillStyle = "#5a4630";
    ctx.fillRect(180, 120, 430, 260);
    ctx.fillStyle = "#2d4438";
    ctx.fillRect(205, 145, 380, 210);
    ctx.strokeStyle = "#b9c6b4";
    ctx.lineWidth = 3;
    ctx.strokeRect(210, 150, 370, 200);
    text(ctx, "人 有 禮 貌", 400, 250, 42, "#f2ecd6", { weight: "400" });
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(180, 380, 430, 14);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(186, 394, 418, 56);
    ctx.fillStyle = "#6e5236";
    ctx.fillRect(200, 406, 380, 10);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(196, 398, 60, 48);
    ctx.fillRect(280, 398, 60, 48);
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(360, 394, 56, 8);
    ctx.fillStyle = "#6e5236";
    ctx.fillRect(360, 402, 56, 34);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(390, 398, 60, 48);
    ctx.fillStyle = "#5f442c";
    ctx.fillRect(460, 394, 44, 8);
    ctx.fillStyle = "#5f442c";
    ctx.fillRect(460, 402, 44, 34);
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(520, 398, 70, 48);
    ctx.fillStyle = "#a9875a";
    ctx.fillRect(520, 406, 70, 12);
    ctx.fillStyle = "#6e5236";
    ctx.fillRect(80, 170, 190, 280);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(92, 190, 166, 240);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(92, 190, 166, 12);
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = "#8f6b45";
      ctx.fillRect(102, 216 + i * 58, 146, 34);
      ctx.fillStyle = "#c9ad84";
      ctx.fillRect(108, 222 + i * 58, 134, 22);
      ctx.fillStyle = "#b39a70";
      ctx.fillRect(112, 226 + i * 58, 40, 14);
      ctx.fillStyle = "#c9ad84";
      ctx.fillRect(160, 226 + i * 58, 70, 14);
    }
    const desks = [
      { x: 70, y: 620, flip: false },
      { x: 330, y: 660, flip: true },
      { x: 590, y: 620, flip: false },
      { x: 850, y: 660, flip: true }
    ];
    desks.forEach(({ x, y, flip }) => {
      ctx.save();
      if (flip) {
        ctx.translate(x * 2 + 220, 0);
        ctx.scale(-1, 1);
      }
      ctx.fillStyle = "#a9875a";
      ctx.fillRect(x, y, 220, 12);
      ctx.fillStyle = "#8f6b45";
      ctx.fillRect(x, y + 12, 220, 40);
      ctx.fillStyle = "#7c5b3c";
      ctx.fillRect(x + 8, y + 52, 16, 42);
      ctx.fillRect(x + 196, y + 52, 16, 42);
      ctx.fillStyle = "#8f6b45";
      ctx.fillRect(x + 46, y + 88, 130, 10);
      ctx.fillStyle = "#b39a70";
      ctx.fillRect(x + 22, y - 24, 60, 24);
      ctx.fillStyle = "#a9875a";
      ctx.fillRect(x + 140, y - 18, 44, 18);
      ctx.restore();
    });
    ctx.fillStyle = "#3a4b45";
    ctx.fillRect(60, 470, 40, 220);
    ctx.fillRect(1100, 480, 36, 210);
    line(ctx, 0, 470, w, 470, "#8c6a44", 5);
    line(ctx, 0, 560, w, 560, "#8c6a44", 5);
    ctx.fillStyle = "#c9402e";
    ctx.fillRect(280, 220, 8, 40);
    ctx.fillStyle = "#3f5d7c";
    ctx.fillRect(280, 260, 8, 40);
    ctx.fillStyle = "#4f7d5c";
    ctx.fillRect(280, 300, 8, 40);
    ctx.fillStyle = "#e6c77e";
    ctx.fillRect(280, 340, 8, 40);
    silhouettePeople(ctx, 160, 490, 40, "rgba(52,38,26,0.85)");
    silhouettePeople(ctx, 1020, 490, 36, "rgba(52,38,26,0.85)", true);
  }

  function scenePlayground(ctx, w, h) {
    sky(ctx, w, h, "#9cc6d4", "#e3d6b6");
    cloud(ctx, 180, 120, 130, "rgba(252,248,238,0.95)");
    cloud(ctx, 880, 160, 160, "rgba(252,248,238,0.9)");
    ctx.fillStyle = "#d9c9a8";
    ctx.fillRect(0, 0, w, 250);
    facade(ctx, 60, 230, 340, 330, "#e0ceb0", { seed: 6, sign: "學校" });
    facade(ctx, 400, 180, 300, 380, "#e8d7b8", { seed: 8 });
    facade(ctx, 700, 240, 320, 320, "#dbc9a8", { seed: 10 });
    facade(ctx, 1020, 200, 260, 360, "#e4d2b0", { seed: 12 });
    line(ctx, 0, 520, w, 520, "rgba(72,58,42,0.8)", 7);
    ctx.fillStyle = "#5f4b34";
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.lineTo(0, 560);
    ctx.lineTo(w, 560);
    ctx.lineTo(w, 520);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#c9b890";
    ctx.fillRect(0, 560, w, 14);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(0, 574, w, 200);
    line(ctx, 0, 640, w, 640, "rgba(140,108,68,0.4)", 3);
    ctx.fillStyle = "#5f7f4f";
    ctx.beginPath();
    ctx.moveTo(90, 560);
    ctx.lineTo(170, 430);
    ctx.lineTo(250, 560);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#4f6d42";
    ctx.beginPath();
    ctx.moveTo(180, 560);
    ctx.lineTo(250, 450);
    ctx.lineTo(320, 560);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6f9159";
    ctx.beginPath();
    ctx.moveTo(880, 560);
    ctx.lineTo(960, 440);
    ctx.lineTo(1040, 560);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5a7c4c";
    ctx.beginPath();
    ctx.moveTo(980, 560);
    ctx.lineTo(1060, 470);
    ctx.lineTo(1140, 560);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6b8f58";
    ctx.beginPath();
    ctx.ellipse(1010, 440, 66, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5a7c4c";
    ctx.beginPath();
    ctx.ellipse(940, 460, 46, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    const poleX = 700;
    ctx.fillStyle = "#6b5a44";
    ctx.fillRect(poleX - 5, 250, 10, 270);
    ctx.fillStyle = "#c9402e";
    ctx.beginPath();
    ctx.moveTo(poleX, 250);
    ctx.lineTo(poleX - 52, 290);
    ctx.lineTo(poleX, 250);
    ctx.lineTo(poleX + 52, 290);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8c6a44";
    ctx.fillRect(poleX - 120, 520, 240, 10);
    ctx.fillStyle = "#8c6a44";
    ctx.fillRect(poleX - 96, 420, 192, 10);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(poleX - 20, 430, 40, 90);
    ctx.fillStyle = "#e8d7b8";
    ctx.fillRect(poleX - 8, 462, 16, 40);
    ctx.fillStyle = "#5f4b34";
    ctx.fillRect(poleX - 34, 430, 14, 90);
    ctx.fillRect(poleX + 20, 430, 14, 90);
    ctx.fillStyle = "#a9875a";
    ctx.fillRect(390, 700, 12, 74);
    ctx.fillRect(560, 700, 12, 74);
    line(ctx, 400, 700, 560, 700, "#8c6a44", 10);
    ctx.fillStyle = "#c9a25f";
    ctx.fillRect(410, 660, 140, 40);
    ctx.fillStyle = "#b88a45";
    ctx.fillRect(440, 620, 90, 40);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(440, 630, 90, 16);
    ctx.fillStyle = "#3a4b45";
    ctx.fillRect(448, 700, 8, 60);
    ctx.fillRect(504, 700, 8, 60);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(230, 700, 80, 10);
    ctx.fillStyle = "#6e5236";
    ctx.fillRect(230, 660, 80, 40);
    ctx.fillStyle = "#b39a70";
    ctx.fillRect(236, 666, 68, 12);
    silhouettePeople(ctx, 330, 620, 44, "rgba(46,40,32,0.9)");
    silhouettePeople(ctx, 620, 610, 40, "rgba(52,44,34,0.9)", true);
    ctx.fillStyle = "#5f4b34";
    ctx.beginPath();
    ctx.arc(680, 620, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a4b45";
    ctx.fillRect(676, 630, 8, 40);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(660, 580, 12, 44);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(690, 590, 12, 40);
    ctx.fillStyle = "#8c6a44";
    ctx.fillRect(648, 672, 62, 8);
    ctx.fillStyle = "#8c6a44";
    ctx.fillRect(700, 672, 62, 8);
    ctx.fillStyle = "#4f6d42";
    ctx.fillRect(600, 700, 10, 60);
    ctx.fillRect(650, 700, 10, 60);
    line(ctx, 602, 700, 650, 700, "#8c6a44", 8);
    ctx.fillStyle = "#6f9159";
    ctx.fillRect(560, 660, 130, 40);
    ctx.fillStyle = "#5a7c4c";
    ctx.fillRect(575, 640, 100, 24);
  }

  function sceneTopCards(ctx, w, h) {
    sky(ctx, w, h, "#f2dfba", "#b9c6c2");
    glow(ctx, 180, 120, 250, "rgba(255,240,190,0.7)", 0.5);
    ctx.fillStyle = "#dfcfb2";
    ctx.fillRect(0, 200, w, 360);
    facade(ctx, 0, 210, 320, 350, "#e0cfae", { seed: 3, sign: "玩具店" });
    facade(ctx, 320, 170, 300, 390, "#e7d5b4", { seed: 5 });
    facade(ctx, 620, 230, 300, 330, "#dcc9a8", { seed: 7 });
    facade(ctx, 920, 190, 280, 370, "#e4d2b0", { seed: 9 });
    road(ctx, w, h, 500, "#99958c");
    for (let i = 0; i < 13; i += 1) {
      line(ctx, 30 + i * 110, 580, 80 + i * 110, 850, "rgba(70,62,52,0.3)", 4);
    }
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(240, 330, 300, 14);
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(250, 344, 280, 34);
    ctx.fillStyle = "#6e5236";
    ctx.fillRect(260, 356, 260, 10);
    ctx.fillStyle = "#b39a70";
    ctx.fillRect(250, 378, 280, 70);
    ctx.fillStyle = "#c9ad84";
    ctx.fillRect(260, 386, 260, 50);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(270, 392, 70, 36);
    ctx.fillRect(360, 392, 70, 36);
    ctx.fillRect(450, 392, 70, 36);
    ctx.fillStyle = "#c9402e";
    ctx.fillRect(280, 398, 50, 22);
    ctx.fillStyle = "#3f6d5a";
    ctx.fillRect(370, 398, 50, 22);
    ctx.fillStyle = "#3a5d77";
    ctx.fillRect(460, 398, 50, 22);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(240, 448, 300, 10);
    ctx.fillStyle = "#5f4b34";
    ctx.fillRect(250, 458, 280, 60);
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(258, 466, 264, 44);
    ctx.fillStyle = "#e0cfae";
    ctx.fillRect(268, 474, 40, 26);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(316, 474, 40, 26);
    ctx.fillStyle = "#e0cfae";
    ctx.fillRect(364, 474, 40, 26);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(412, 474, 40, 26);
    ctx.fillStyle = "#e0cfae";
    ctx.fillRect(460, 474, 40, 26);
    const top = { x: 620, y: 650 };
    ctx.fillStyle = "#8a5b32";
    ctx.beginPath();
    ctx.moveTo(top.x, top.y - 82);
    ctx.lineTo(top.x - 40, top.y);
    ctx.lineTo(top.x + 40, top.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#c9402e";
    ctx.beginPath();
    ctx.arc(top.x, top.y, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0d9a8";
    ctx.beginPath();
    ctx.arc(top.x, top.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a5b32";
    ctx.beginPath();
    ctx.arc(top.x, top.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5f442c";
    ctx.fillRect(top.x - 3, top.y - 96, 6, 16);
    ctx.strokeStyle = "rgba(140,90,50,0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(top.x + 4, top.y - 88);
    ctx.quadraticCurveTo(top.x + 170, top.y - 190, top.x + 330, top.y - 120);
    ctx.stroke();
    ctx.fillStyle = "#7c5b3c";
    ctx.beginPath();
    ctx.ellipse(950, 532, 54, 18, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8f6b45";
    ctx.beginPath();
    ctx.ellipse(950, 528, 34, 12, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5f442c";
    ctx.beginPath();
    ctx.ellipse(950, 525, 14, 7, 0.08, 0, Math.PI * 2);
    ctx.fill();
    const cards = [
      [1010, 600, 0.12],
      [1050, 630, 0.04],
      [1090, 610, -0.1],
      [1120, 640, 0.18]
    ];
    cards.forEach(([cx, cy, rot]) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.fillStyle = "#f0e2c4";
      ctx.fillRect(-26, -36, 52, 72);
      ctx.strokeStyle = "#a17f56";
      ctx.lineWidth = 2;
      ctx.strokeRect(-23, -33, 46, 66);
      ctx.fillStyle = "#c9402e";
      ctx.beginPath();
      ctx.arc(0, -10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3f5d7c";
      ctx.fillRect(-12, 8, 24, 4);
      ctx.fillRect(-8, 16, 16, 4);
      ctx.restore();
    });
    ctx.fillStyle = "#e0d0b0";
    ctx.fillRect(960, 690, 190, 12);
    ctx.fillStyle = "#d0bf9e";
    ctx.fillRect(960, 702, 190, 8);
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(300, 640, 18, 74);
    ctx.fillRect(330, 640, 18, 74);
    line(ctx, 300, 640, 330, 640, "#8c6a44", 8);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(292, 600, 64, 40);
    silhouettePeople(ctx, 520, 560, 44, "rgba(46,40,32,0.9)");
    silhouettePeople(ctx, 700, 565, 40, "rgba(52,44,34,0.9)", true);
    silhouettePeople(ctx, 1100, 570, 46, "rgba(50,42,32,0.88)");
  }

  function sceneTinToy(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#d3b98e");
    g.addColorStop(1, "#b39268");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#a5855c";
    ctx.fillRect(0, 0, w, 12);
    ctx.fillStyle = "#8c6a44";
    ctx.fillRect(0, 600, w, 26);
    ctx.fillStyle = "#a9875a";
    ctx.fillRect(0, 626, w, 70);
    line(ctx, 0, 626, w, 626, "rgba(88,62,38,0.5)", 3);
    for (let i = 0; i < 14; i += 1) {
      ctx.fillStyle = "#9c7a50";
      ctx.fillRect(i * 96 + 12, 646, 66, 8);
    }
    const winX = 850;
    const winY = 110;
    ctx.fillStyle = "#b39268";
    ctx.fillRect(winX - 16, winY - 16, 320, 280);
    const wg = ctx.createLinearGradient(winX, winY, winX + 260, winY + 220);
    wg.addColorStop(0, "#ffe9b8");
    wg.addColorStop(1, "#d7cdb2");
    ctx.fillStyle = wg;
    ctx.fillRect(winX, winY, 260, 230);
    ctx.fillStyle = "rgba(255,248,215,0.45)";
    ctx.fillRect(winX, winY, 260, 34);
    ctx.strokeStyle = "#8f6b45";
    ctx.lineWidth = 8;
    ctx.strokeRect(winX, winY, 260, 230);
    line(ctx, winX + 130, winY, winX + 130, winY + 230, "#8f6b45", 5);
    line(ctx, winX, winY + 115, winX + 260, winY + 115, "#8f6b45", 5);
    ctx.fillStyle = "#8c6a44";
    ctx.fillRect(650, 110, 70, 250);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(660, 124, 50, 44);
    ctx.fillRect(660, 190, 50, 44);
    ctx.fillRect(660, 256, 50, 44);
    ctx.fillStyle = "#a17f56";
    ctx.fillRect(100, 200, 300, 300);
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(112, 212, 276, 276);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(118, 218, 264, 264);
    ctx.strokeStyle = "#8f6b45";
    ctx.lineWidth = 4;
    ctx.strokeRect(124, 224, 252, 252);
    ctx.fillStyle = "#6e5236";
    ctx.fillRect(130, 250, 240, 14);
    ctx.fillStyle = "#a17f56";
    ctx.fillRect(138, 264, 100, 84);
    ctx.fillStyle = "#c9402e";
    ctx.fillRect(138, 270, 100, 16);
    ctx.fillStyle = "#3f6d5a";
    ctx.fillRect(138, 296, 100, 12);
    ctx.fillStyle = "#e6c77e";
    ctx.fillRect(138, 318, 100, 22);
    ctx.fillStyle = "#8c6a44";
    ctx.fillRect(120, 360, 250, 10);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(128, 370, 234, 74);
    ctx.fillStyle = "#f0e2c4";
    ctx.fillRect(136, 378, 218, 58);
    ctx.fillStyle = "#b39a70";
    ctx.fillRect(136, 378, 218, 8);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(142, 390, 66, 38);
    ctx.fillStyle = "#c9ad84";
    ctx.fillRect(222, 390, 66, 38);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(302, 390, 66, 38);
    const car = { x: 560, y: 520 };
    ctx.fillStyle = "#31424c";
    ctx.fillRect(car.x - 130, car.y - 34, 260, 40);
    ctx.fillStyle = "#c9402e";
    ctx.beginPath();
    ctx.arc(car.x - 76, car.y - 34, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a5d77";
    ctx.beginPath();
    ctx.arc(car.x + 76, car.y - 34, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d9c09a";
    ctx.beginPath();
    ctx.arc(car.x - 76, car.y - 34, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(car.x + 76, car.y - 34, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6e5236";
    ctx.beginPath();
    ctx.arc(car.x - 76, car.y - 34, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(car.x + 76, car.y - 34, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a33c2b";
    ctx.beginPath();
    ctx.arc(car.x, car.y - 52, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0d9a8";
    ctx.fillRect(car.x - 70, car.y - 70, 140, 36);
    ctx.fillStyle = "#d9b878";
    ctx.fillRect(car.x - 70, car.y - 34, 140, 12);
    ctx.fillStyle = "#3f5d7c";
    ctx.fillRect(car.x + 96, car.y - 50, 14, 18);
    ctx.fillStyle = "#e6c77e";
    ctx.fillRect(car.x + 100, car.y - 60, 6, 12);
    ctx.fillStyle = "#31424c";
    ctx.fillRect(car.x + 54, car.y - 84, 10, 26);
    ctx.fillStyle = "#3a4b45";
    ctx.beginPath();
    ctx.ellipse(car.x - 10, car.y - 86, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(70,90,80,0.6)";
    ctx.lineWidth = 3;
    ctx.strokeRect(car.x - 130, car.y - 100, 260, 80);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(car.x - 150, car.y + 6, 300, 10);
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(car.x - 132, car.y + 16, 264, 26);
    ctx.fillStyle = "#5f442c";
    ctx.fillRect(car.x - 122, car.y + 42, 244, 10);
    ctx.fillStyle = "#8c6a44";
    ctx.fillRect(car.x - 164, car.y + 52, 328, 12);
    ctx.fillStyle = "#e6c77e";
    ctx.fillRect(car.x - 18, car.y - 6, 36, 12);
    silhouettePeople(ctx, 250, 560, 44, "rgba(52,40,28,0.85)");
    ctx.fillStyle = "#5f442c";
    ctx.fillRect(420, 440, 22, 66);
    ctx.fillStyle = "#3a4b45";
    ctx.fillRect(398, 470, 66, 12);
    ctx.fillStyle = "#c9402e";
    ctx.beginPath();
    ctx.arc(430, 440, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ------------------------------ Covers ------------------------------ */

  function coverMoon(ctx, w, h) {
    sky(ctx, w, h, "#273f58", "#8a7790");
    for (let i = 0; i < 70; i += 1) {
      const rnd = mulberry32(i * 71 + 5);
      circle(ctx, rnd() * w, rnd() * 320, 1.5 + rnd() * 1.8, "rgba(255,242,206,0.75)");
    }
    glow(ctx, 300, 190, 210, "rgba(255,230,170,0.65)", 0.5);
    ctx.fillStyle = "#f4dfb0";
    ctx.beginPath();
    ctx.arc(300, 190, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ead0a0";
    ctx.beginPath();
    ctx.arc(274, 172, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f7e8c4";
    ctx.beginPath();
    ctx.arc(322, 198, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#273f58";
    ctx.beginPath();
    ctx.arc(286, 214, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#314a64";
    ctx.beginPath();
    ctx.arc(318, 190, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#26394e";
    ctx.fillRect(0, 380, w, 120);
    facade(ctx, 40, 390, 280, 270, "#33495f", { seed: 9 });
    facade(ctx, 320, 330, 300, 330, "#3a5065", { seed: 11 });
    facade(ctx, 620, 410, 300, 250, "#30465b", { seed: 13 });
    facade(ctx, 920, 360, 280, 300, "#3a5065", { seed: 15 });
    ctx.fillStyle = "#6c5f74";
    ctx.fillRect(0, 600, w, 130);
    ctx.fillStyle = "#5b5066";
    ctx.fillRect(0, 600, w, 16);
    ctx.fillStyle = "#4a4a5e";
    ctx.fillRect(0, 640, w, 90);
    ctx.fillStyle = "#e6c77e";
    ctx.fillRect(0, 600, w, 5);
    ctx.fillStyle = "#2c2f3e";
    ctx.fillRect(300, 420, 52, 200);
    ctx.fillRect(1100, 460, 44, 160);
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = "#4b566e";
      ctx.fillRect(480 + i * 130, 560, 80, 90);
    }
    ctx.strokeStyle = "rgba(238,220,180,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, 210);
    ctx.quadraticCurveTo(110, 150, 150, 210);
    ctx.moveTo(890, 240);
    ctx.quadraticCurveTo(920, 180, 960, 240);
    ctx.stroke();
  }

  function coverDimSum(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#ead9b6");
    g.addColorStop(1, "#c9ab84");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#a17f56";
    ctx.fillRect(0, 560, w, 20);
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(0, 580, w, 90);
    ctx.fillStyle = "#c9ad84";
    ctx.fillRect(0, 580, w, 8);
    for (let i = 0; i < 11; i += 1) {
      ctx.fillStyle = "#b39a70";
      ctx.fillRect(i * 120 + 16, 610, 90, 12);
    }
    ctx.fillStyle = "#a9875a";
    ctx.beginPath();
    ctx.ellipse(300, 420, 150, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c9ad84";
    ctx.beginPath();
    ctx.ellipse(300, 412, 126, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d9c09a";
    ctx.beginPath();
    ctx.ellipse(300, 405, 112, 54, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8f6b45";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(300, 405, 108, 50, 0, 0, Math.PI * 2);
    ctx.stroke();
    const buns = [
      [262, 392, 24, "#f6ecd8"],
      [312, 398, 26, "#f0e2c8"],
      [340, 380, 21, "#f6ecd8"],
      [288, 430, 22, "#f0e2c8"],
      [244, 430, 20, "#f6ecd8"]
    ];
    buns.forEach(([bx, by, br, color]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d9b878";
      ctx.beginPath();
      ctx.arc(bx, by, br * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c9a25f";
      ctx.beginPath();
      ctx.arc(bx, by, br * 0.18, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(530, 420, 190, 60);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(545, 430, 160, 40);
    ctx.fillStyle = "#b88a45";
    ctx.beginPath();
    ctx.ellipse(620, 434, 62, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6f9159";
    ctx.beginPath();
    ctx.arc(620, 432, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(100, 430, 90, 90);
    ctx.fillStyle = "#d9c09a";
    ctx.fillRect(112, 442, 66, 66);
    ctx.fillStyle = "#b88a45";
    ctx.beginPath();
    ctx.arc(145, 470, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8f6b45";
    ctx.fillRect(780, 400, 110, 30);
    ctx.fillStyle = "#6e5236";
    ctx.fillRect(790, 430, 90, 70);
    ctx.fillStyle = "#f0e2c8";
    ctx.fillRect(800, 440, 70, 50);
    ctx.fillStyle = "#c9ad84";
    ctx.fillRect(810, 452, 22, 14);
    ctx.fillRect(838, 452, 22, 14);
    ctx.fillRect(810, 472, 22, 14);
    ctx.fillRect(838, 472, 22, 14);
    ctx.fillStyle = "#7c5b3c";
    ctx.fillRect(60, 240, 20, 320);
    ctx.fillRect(1120, 260, 18, 300);
    line(ctx, 70, 240, 1130, 240, "#8c6a44", 8);
    const lanterns = [
      [150, 230, "#c9402e"],
      [600, 220, "#d95b3e"],
      [1050, 235, "#c9402e"]
    ];
    lanterns.forEach(([lx, ly, color]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 26, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0d9a8";
      ctx.fillRect(lx - 10, ly - 4, 20, 8);
      ctx.strokeStyle = "rgba(240,210,130,0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(lx - 14, ly - 14, 28, 28);
    });
    silhouettePeople(ctx, 460, 560, 40, "rgba(52,40,28,0.85)");
    silhouettePeople(ctx, 760, 565, 46, "rgba(56,44,30,0.85)", true);
    text(ctx, "一盅兩件", 610, 170, 52, "#7c3d2c", { alpha: 0.9 });
  }

  function coverSunsetSail(ctx, w, h) {
    sky(ctx, w, h, "#efb77c", "#9e7b92");
    glow(ctx, 650, 300, 320, "rgba(255,208,130,0.8)", 0.65);
    ctx.fillStyle = "#f2c88f";
    ctx.beginPath();
    ctx.arc(650, 300, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d95b3e";
    ctx.beginPath();
    ctx.arc(650, 300, 104, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5dcb0";
    ctx.beginPath();
    ctx.arc(650, 300, 82, 0, Math.PI * 2);
    ctx.fill();
    water(ctx, w, h, 420, "#b0616d", "#5b5c7d");
    for (let i = 0; i < 16; i += 1) {
      line(ctx, 30 + i * 90, 470 + (i % 3) * 18, 130 + i * 90, 480 + (i % 2) * 12, "rgba(255,210,170,0.3)", 3);
    }
    ctx.fillStyle = "#3c3a52";
    ctx.fillRect(0, 420, w, 24);
    ctx.fillStyle = "#4b465c";
    ctx.fillRect(0, 444, w, 40);
    const boatX = 470;
    ctx.fillStyle = "#5c4038";
    ctx.beginPath();
    ctx.moveTo(boatX, 470);
    ctx.quadraticCurveTo(boatX + 90, 520, boatX + 220, 470);
    ctx.quadraticCurveTo(boatX + 120, 486, boatX, 470);
    ctx.fill();
    ctx.fillStyle = "#8a5b32";
    ctx.fillRect(boatX + 96, 320, 10, 140);
    ctx.fillStyle = "#f0dcc0";
    ctx.beginPath();
    ctx.moveTo(boatX + 106, 340);
    ctx.lineTo(boatX + 200, 400);
    ctx.lineTo(boatX + 106, 430);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#d95b3e";
    ctx.beginPath();
    ctx.moveTo(boatX + 96, 340);
    ctx.lineTo(boatX + 8, 400);
    ctx.lineTo(boatX + 96, 430);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e6c77e";
    ctx.beginPath();
    ctx.moveTo(boatX + 96, 340);
    ctx.lineTo(boatX + 48, 400);
    ctx.lineTo(boatX + 96, 400);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,220,180,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boatX + 250, 470);
    ctx.quadraticCurveTo(boatX + 330, 500, boatX + 420, 520);
    ctx.stroke();
    ctx.fillStyle = "#3a3a4f";
    ctx.beginPath();
    ctx.moveTo(0, 580);
    ctx.lineTo(90, 520);
    ctx.lineTo(170, 580);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(180, 580);
    ctx.lineTo(260, 530);
    ctx.lineTo(340, 580);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#4b465c";
    ctx.beginPath();
    ctx.moveTo(980, 580);
    ctx.lineTo(1060, 500);
    ctx.lineTo(1140, 580);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3f3d55";
    ctx.beginPath();
    ctx.moveTo(1080, 580);
    ctx.lineTo(1150, 520);
    ctx.lineTo(1200, 580);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(30,30,45,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, 180);
    ctx.quadraticCurveTo(150, 140, 190, 180);
    ctx.moveTo(1080, 160);
    ctx.quadraticCurveTo(1120, 120, 1160, 160);
    ctx.stroke();
  }

  /* ------------------------------ Video scenes ------------------------------ */

  function videoTram(ctx, w, h, t) {
    const dusk = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
    const top = dusk > 0.5 ? "#e9cba0" : "#a0b6c4";
    const bottom = dusk > 0.5 ? "#d19a6b" : "#7e9aa8";
    sky(ctx, w, h, top, bottom);
    const sunX = 980 - dusk * 180;
    glow(ctx, sunX, 170, 210, "rgba(255,228,170,0.8)", 0.55);
    ctx.fillStyle = "rgba(255,236,190,0.85)";
    ctx.beginPath();
    ctx.arc(sunX, 170, 46, 0, Math.PI * 2);
    ctx.fill();
    facade(ctx, 0, 150, 260, 360, "#e2d3b4", { seed: 2, sign: "德輔道中" });
    facade(ctx, 260, 110, 260, 400, "#d6c6a8", { seed: 4 });
    facade(ctx, 520, 170, 260, 340, "#ead9bd", { seed: 6 });
    facade(ctx, 780, 130, 260, 380, "#ddccae", { seed: 8 });
    facade(ctx, 1040, 170, 240, 340, "#e4d4b6", { seed: 10 });
    road(ctx, w, h, 500, "#9a978f");
    line(ctx, 0, 590, w, 590, "rgba(58,48,38,0.7)", 4);
    line(ctx, 0, 620, w, 620, "rgba(58,48,38,0.55)", 4);
    for (let i = 0; i < 6; i += 1) {
      line(ctx, 100 + i * 240, 640, 160 + i * 240, 700, "rgba(74,66,58,0.5)", 3);
    }
    const tramX = 620 + Math.sin(t * Math.PI * 2) * 340;
    ctx.save();
    ctx.translate(tramX - 140, 260);
    ctx.fillStyle = "#2f5f50";
    ctx.fillRect(0, 0, 280, 170);
    ctx.fillStyle = "#e8dcc2";
    ctx.fillRect(0, 82, 280, 18);
    ctx.fillStyle = "#244a3e";
    ctx.fillRect(0, 0, 280, 14);
    windowGrid(ctx, 14, 20, 252, 54, 6, 1, "#234a3d", "#cfe2d2", 0.85);
    windowGrid(ctx, 14, 104, 252, 54, 6, 1, "#234a3d", "#dce9da", 0.8);
    ctx.fillStyle = "#203d33";
    ctx.fillRect(0, 158, 280, 12);
    circle(ctx, 48, 170, 12, "#26221e");
    circle(ctx, 232, 170, 12, "#26221e");
    ctx.strokeStyle = "rgba(240,238,228,0.85)";
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 268, 158);
    ctx.fillStyle = "#f3e5c8";
    ctx.fillRect(268, 68, 12, 36);
    ctx.restore();
    silhouettePeople(ctx, 170, 560, 44);
    silhouettePeople(ctx, 820, 565, 46, "rgba(40,34,28,0.9)", true);
    silhouettePeople(ctx, 60, 570, 38, "rgba(46,40,32,0.85)");
    silhouettePeople(ctx, 1120, 560, 42, "rgba(42,36,30,0.88)");
    if (dusk > 0.3) {
      glow(ctx, 180, 120, 120, "rgba(255,214,130,0.5)", 0.25);
      glow(ctx, 500, 140, 100, "rgba(255,214,130,0.5)", 0.22);
      glow(ctx, 900, 110, 120, "rgba(255,214,130,0.5)", 0.25);
    }
    ctx.strokeStyle = "rgba(35,45,52,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 150);
    ctx.lineTo(0, 500);
    ctx.moveTo(1280, 150);
    ctx.lineTo(1280, 500);
    ctx.stroke();
  }

  function videoMarket(ctx, w, h, t) {
    const morning = Math.sin(t * Math.PI) * 0.5 + 0.5;
    const top = morning > 0.5 ? "#f6dfb4" : "#d9b98f";
    const bottom = morning > 0.5 ? "#b6c3c4" : "#9c93a0";
    sky(ctx, w, h, top, bottom);
    glow(ctx, 180, 90, 250, morning > 0.5 ? "rgba(255,241,195,0.8)" : "rgba(255,190,120,0.55)", 0.55);
    ctx.fillStyle = "#e0d2b6";
    ctx.fillRect(0, 150, w, 260);
    facade(ctx, 20, 160, 180, 250, "#decbb0", { seed: 3 });
    facade(ctx, 1080, 170, 200, 240, "#dcc7a8", { seed: 5 });
    road(ctx, w, h, 410, "#99958c");
    for (let i = 0; i < 10; i += 1) {
      line(ctx, -30 + i * 140, 480, 20 + i * 140, 700, "rgba(76,68,58,0.3)", 3);
    }
    const awningHue = morning > 0.5 ? "#c2462e" : "#7d4b3a";
    for (let i = 0; i < 10; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? awningHue : "#f0e3c6";
      ctx.fillRect(i * 128, 160, 128, 46);
    }
    ctx.fillStyle = "rgba(62,50,38,0.9)";
    ctx.fillRect(0, 206, w, 12);
    ctx.fillStyle = "#6f5238";
    ctx.fillRect(60, 218, 300, 30);
    text(ctx, "菜 檔", 210, 233, 22, "#f4ead2", { weight: "700" });
    ctx.fillStyle = "#8a6b47";
    ctx.fillRect(0, 410, w, 14);
    const sway = Math.sin(t * Math.PI * 2) * 14;
    const crates = [
      [100 + sway, 380, "#b98852"],
      [300 - sway * 0.5, 372, "#9c7448"],
      [500 + sway, 390, "#c09358"],
      [700 - sway, 376, "#a57a4b"]
    ];
    crates.forEach(([cx, cy, color], i) => {
      ctx.fillStyle = color;
      rr(ctx, cx, cy, 130, 60, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(64,46,30,0.6)";
      ctx.lineWidth = 3;
      ctx.strokeRect(cx + 7, cy + 7, 116, 46);
      circle(ctx, cx + 32, cy - 6, 20, i % 2 === 0 ? "#4f7d4c" : "#d0a047");
      circle(ctx, cx + 76, cy - 10, 23, i % 2 === 0 ? "#5c8f55" : "#dcb05a");
      circle(ctx, cx + 110, cy - 4, 16, "#6f9b5e");
      circle(ctx, cx + 32, cy - 6, 7, "rgba(30,70,34,0.5)");
      circle(ctx, cx + 76, cy - 10, 8, "rgba(30,70,34,0.5)");
    });
    ctx.fillStyle = "#7d5b3b";
    ctx.beginPath();
    ctx.moveTo(130, 410);
    ctx.lineTo(168, 340);
    ctx.lineTo(180, 410);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6d4e33";
    ctx.beginPath();
    ctx.moveTo(900, 410);
    ctx.lineTo(950, 335);
    ctx.lineTo(965, 410);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(47,70,58,0.9)";
    ctx.beginPath();
    ctx.moveTo(600, 260);
    ctx.lineTo(660, 260);
    ctx.lineTo(630, 490);
    ctx.lineTo(570, 490);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(230,220,195,0.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(585, 285, 90, 70);
    text(ctx, "今日", 630, 320, 20, "#f2e5c8", { alpha: 0.9 });
    const personOffset = Math.sin(t * Math.PI * 4) * 30;
    silhouettePeople(ctx, 420 + personOffset, 410, 46);
    silhouettePeople(ctx, 1050 - personOffset * 0.6, 415, 50, "rgba(38,44,40,0.85)", true);
  }

  function videoLanterns(ctx, w, h, t) {
    const dark = Math.min(1, t * 2.2);
    const skyTop = 55 - dark * 30;
    const skyBottom = 120 + dark * 55;
    sky(ctx, w, h, `rgb(${skyTop},${70 - dark * 10},${95 - dark * 12})`, `rgb(${skyBottom},${105 + dark * 30},${125 + dark * 28})`);
    for (let i = 0; i < 60; i += 1) {
      const rnd = mulberry32(i * 53 + 9);
      circle(ctx, rnd() * w, rnd() * 240, 1.4 + rnd() * 1.6, `rgba(255,244,214,${0.15 + dark * 0.65})`);
    }
    facade(ctx, 0, 210, 300, 290, `rgb(${58 + dark * 8},${74 + dark * 8},${90 + dark * 8})`, { seed: 8 });
    facade(ctx, 300, 170, 280, 330, `rgb(${62 + dark * 8},${78 + dark * 8},${94 + dark * 8})`, { seed: 10 });
    facade(ctx, 580, 220, 280, 280, `rgb(${55 + dark * 8},${71 + dark * 8},${87 + dark * 8})`, { seed: 12 });
    facade(ctx, 860, 190, 280, 310, `rgb(${60 + dark * 8},${76 + dark * 8},${92 + dark * 8})`, { seed: 14 });
    facade(ctx, 1140, 230, 140, 270, `rgb(${58 + dark * 8},${74 + dark * 8},${90 + dark * 8})`, { seed: 16 });
    road(ctx, w, h, 480, "#7b7f83");
    ctx.fillStyle = "#6d7276";
    ctx.fillRect(0, 480, w, 10);
    const lightLevel = 0.25 + dark * 0.55;
    ctx.fillStyle = "#a17f56";
    ctx.fillRect(90, 470, 190, 8);
    ctx.fillRect(700, 470, 190, 8);
    ctx.fillStyle = "#7a5b3f";
    ctx.fillRect(96, 478, 178, 82);
    ctx.fillRect(706, 478, 178, 82);
    ctx.fillStyle = "#6e5236";
    ctx.fillRect(110, 490, 150, 44);
    ctx.fillRect(720, 490, 150, 44);
    ctx.fillStyle = "#f0d9a8";
    ctx.fillRect(122, 496, 36, 20);
    ctx.fillRect(166, 496, 36, 20);
    ctx.fillRect(732, 496, 36, 20);
    ctx.fillRect(776, 496, 36, 20);
    ctx.fillStyle = "#d9b878";
    ctx.fillRect(96, 452, 36, 20);
    ctx.fillRect(706, 452, 36, 20);
    glow(ctx, 140, 506, 50, "rgba(255,214,130,0.7)", lightLevel * 0.8);
    glow(ctx, 184, 506, 50, "rgba(255,214,130,0.7)", lightLevel * 0.8);
    glow(ctx, 750, 506, 50, "rgba(255,214,130,0.7)", lightLevel * 0.8);
    glow(ctx, 794, 506, 50, "rgba(255,214,130,0.7)", lightLevel * 0.8);
    const lanterns = [
      [240, 380],
      [420, 340],
      [560, 400],
      [880, 360],
      [1080, 410]
    ];
    lanterns.forEach(([lx, ly], i) => {
      const swayX = Math.sin(t * Math.PI * 2 + i * 1.7) * 8;
      ctx.strokeStyle = "rgba(238,220,180,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, 210);
      ctx.lineTo(lx + swayX, ly - 40);
      ctx.stroke();
      glow(ctx, lx + swayX, ly, 66, i % 2 === 0 ? "rgba(255,190,80,0.65)" : "rgba(255,150,80,0.55)", lightLevel * 0.8);
      ctx.fillStyle = i % 2 === 0 ? "#d95b3e" : "#c93d2e";
      ctx.beginPath();
      ctx.ellipse(lx + swayX, ly, 22, 29, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e8d9a8";
      ctx.fillRect(lx + swayX - 12, ly - 3, 24, 6);
      ctx.strokeStyle = "rgba(255,214,120,0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(lx + swayX - 13, ly - 13, 26, 26);
    });
    const walker = (t * 1.8) % 1;
    silhouettePeople(ctx, 60 + walker * 1160, 560, 36, "rgba(26,34,42,0.95)");
    silhouettePeople(ctx, 1040 - walker * 900, 570, 40, "rgba(30,38,46,0.9)", true);
    ctx.fillStyle = "rgba(40,48,58,0.85)";
    ctx.beginPath();
    ctx.arc(140 + walker * 1000, 600, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d95b3e";
    ctx.beginPath();
    ctx.ellipse(140 + walker * 1000, 578, 8, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c9b890";
    ctx.fillRect(138 + walker * 1000, 588, 4, 14);
  }

  /* ------------------------------ Rendering API ------------------------------ */

  const SCENES = {
    "photo-001": sceneTram,
    "photo-002": sceneFerry,
    "photo-003": marketStall,
    "photo-004": sceneDaiPaiDong,
    "photo-005": sceneRooftop,
    "photo-006": sceneKitchen,
    "photo-007": sceneBarber,
    "photo-008": sceneCobbler,
    "photo-009": sceneLanterns,
    "photo-010": sceneDragonBoat,
    "photo-011": sceneClassroom,
    "photo-012": scenePlayground,
    "photo-013": sceneTopCards,
    "photo-014": sceneTinToy
  };

  const COVERS = {
    "song-001": coverMoon,
    "song-002": coverSunsetSail,
    "song-003": (ctx, w, h) => sceneTram(ctx, w, h),
    "song-004": (ctx, w, h) => marketStall(ctx, w, h),
    "song-005": coverDimSum,
    "song-006": (ctx, w, h) => sceneClassroom(ctx, w, h),
    "song-007": (ctx, w, h) => sceneDragonBoat(ctx, w, h),
    "song-008": coverSunsetSail,
    "video-001": (ctx, w, h) => videoTram(ctx, w, h, 0.28),
    "video-002": (ctx, w, h) => videoMarket(ctx, w, h, 0.35),
    "video-003": (ctx, w, h) => videoLanterns(ctx, w, h, 0.65)
  };

  function coverRendererFor(id) {
    if (COVERS[id]) return COVERS[id];
    if (id.startsWith("song-")) {
      const n = Number(id.replace("song-", "")) || 1;
      return [coverMoon, coverSunsetSail, coverDimSum][(n - 1) % 3];
    }
    if (id.startsWith("video-")) {
      const n = Number(id.replace("video-", "")) || 1;
      return [
        (ctx, w, h) => videoTram(ctx, w, h, 0.3),
        (ctx, w, h) => videoMarket(ctx, w, h, 0.36),
        (ctx, w, h) => videoLanterns(ctx, w, h, 0.6)
      ][(n - 1) % 3];
    }
    return coverMoon;
  }

  function photoVariantTint(ctx, w, h, variant) {
    const mode = variant % 3;
    ctx.save();
    if (mode === 0) {
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = "rgba(194,71,46,1)";
      ctx.fillRect(0, 0, w, h);
    } else if (mode === 1) {
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.17;
      ctx.fillStyle = "rgba(74,101,110,1)";
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.globalCompositeOperation = "soft-light";
      ctx.globalAlpha = 0.55;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(200,150,70,0.9)");
      g.addColorStop(1, "rgba(60,80,100,0.9)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  function photoFrame(ctx, w, h, variant) {
    if (variant < 4) return;
    const inset = 18 + (variant % 3) * 7;
    ctx.save();
    ctx.strokeStyle = variant % 2 === 0 ? "#e8dfc9" : "#d8c9a8";
    ctx.lineWidth = 10;
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    ctx.strokeStyle = "rgba(70,54,38,0.55)";
    ctx.lineWidth = 3;
    ctx.strokeRect(inset + 14, inset + 14, w - (inset + 14) * 2, h - (inset + 14) * 2);
    ctx.restore();
  }

  function photoScratches(ctx, w, h, variant) {
    if (variant < 6) return;
    const rnd = mulberry32(500 + variant * 97);
    ctx.save();
    ctx.strokeStyle = "rgba(250,245,232,0.32)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 9; i += 1) {
      const y = rnd() * h;
      const x = rnd() * w;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 40 + rnd() * 130, y + (rnd() - 0.5) * 18);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderSceneToCanvas(sceneId, renderer, target, opts = {}) {
    const { cover = false, photo = false, variant = 0 } = opts;
    const iw = 1200;
    const ih = 900;
    const internal = document.createElement("canvas");
    internal.width = iw;
    internal.height = ih;
    const ictx = internal.getContext("2d");
    renderer(ictx, iw, ih);
    const tw = target.width;
    const th = target.height;
    const ctx = target.getContext("2d");
    if (cover) {
      const cropSize = Math.min(iw, ih);
      const sx = (iw - cropSize) / 2;
      const sy = (ih - cropSize) / 2;
      ctx.drawImage(internal, sx, sy, cropSize, cropSize, 0, 0, tw, th);
    } else if (photo) {
      const zoom = 1 + (variant % 5) * 0.055;
      const cropW = iw / zoom;
      const cropH = ih / zoom;
      const panX = ((variant % 3) - 1) * cropW * 0.07;
      const panY = (((variant * 7) % 5) - 2) * cropH * 0.05;
      const sx = (iw - cropW) / 2 + panX;
      const sy = (ih - cropH) / 2 + panY;
      ctx.save();
      if (variant % 2 === 1) {
        ctx.translate(tw, 0);
        ctx.scale(-1, 1);
      }
      if (variant >= 7) {
        ctx.filter = "saturate(0.72) sepia(0.28) contrast(1.05)";
      } else if (variant >= 4) {
        ctx.filter = "saturate(0.85) brightness(1.03)";
      }
      ctx.drawImage(internal, sx, sy, cropW, cropH, 0, 0, tw, th);
      ctx.restore();
    } else {
      ctx.drawImage(internal, 0, 0, iw, ih, 0, 0, tw, th);
    }
    if (!cover) {
      if (photo) {
        photoVariantTint(ctx, tw, th, variant);
        photoFrame(ctx, tw, th, variant);
        photoScratches(ctx, tw, th, variant);
      }
      grain(ctx, tw, th, photo ? 0.05 : 0.045, 7 + variant * 3);
      vignette(ctx, tw, th, photo ? 0.25 : 0.18);
    }
    return target;
  }

  function drawScene(canvas, sceneId, opts = {}) {
    const renderer = SCENES[sceneId];
    if (!renderer) throw new Error(`Unknown scene: ${sceneId}`);
    return renderSceneToCanvas(sceneId, renderer, canvas, { photo: true, ...opts });
  }

  function drawCover(canvas, coverId) {
    const renderer = coverRendererFor(coverId);
    if (!renderer) throw new Error(`Unknown cover: ${coverId}`);
    return renderSceneToCanvas(coverId, renderer, canvas, { cover: true });
  }

  function drawVideoFrame(canvas, sceneId, t, seconds = 0) {
    let renderer;
    if (sceneId === "video-001") renderer = videoTram;
    else if (sceneId === "video-002") renderer = videoMarket;
    else if (sceneId === "video-003") renderer = videoLanterns;
    else throw new Error(`Unknown video scene: ${sceneId}`);
    const ctx = canvas.getContext("2d");
    renderer(ctx, canvas.width, canvas.height, t, seconds);
    return canvas;
  }

  function drawIcon(canvas, variant = "regular") {
    const size = canvas.width;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, "#d05a3e");
    g.addColorStop(1, "#9e3527");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    if (variant === "maskable") {
      const safe = size * 0.4;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.46, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,246,232,0.12)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, safe * 0.82, 0, Math.PI * 2);
      ctx.fillStyle = "#fbf7ee";
      ctx.fill();
      text(ctx, "憶", size / 2, size / 2 + size * 0.02, safe * 0.72, "#b4402e", { weight: "700" });
    } else {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.36, 0, Math.PI * 2);
      ctx.fillStyle = "#fbf7ee";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = "#f0e4cc";
      ctx.fill();
      text(ctx, "憶", size / 2, size / 2 + size * 0.03, size * 0.34, "#b4402e", { weight: "700" });
    }
    grain(ctx, size, size, 0.025, 3);
    return canvas;
  }

  function recordScene(sceneId, seconds, width, height, mimeType) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const preferred = mimeType || "video/webm;codecs=vp8";
      const supported = MediaRecorder.isTypeSupported(preferred)
        ? preferred
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";
      if (!supported || typeof MediaRecorder === "undefined") {
        reject(new Error("MediaRecorder is not available"));
        return;
      }
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: supported,
        videoBitsPerSecond: 900_000
      });
      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: supported });
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      };
      recorder.onerror = (event) => reject(event.error || new Error("recording failed"));
      const startedAt = performance.now();
      recorder.start(100);
      const draw = (now) => {
        const elapsed = (now - startedAt) / 1000;
        const t = (elapsed / seconds) % 1;
        drawVideoFrame(canvas, sceneId, t, elapsed);
        if (elapsed >= seconds + 0.12) {
          recorder.stop();
          return;
        }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    });
  }

  window.drawScene = drawScene;
  window.drawCover = drawCover;
  window.drawVideoFrame = drawVideoFrame;
  window.drawIcon = drawIcon;
  window.recordScene = recordScene;
  window.renderSceneToCanvas = renderSceneToCanvas;
  window.SCENES = Object.keys(SCENES);
  window.COVERS = Object.keys(COVERS);
})();
