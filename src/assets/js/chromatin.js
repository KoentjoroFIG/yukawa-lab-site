// Hero visual: a chromatin fiber (DNA wrapped around histone beads) above a
// genome-browser style accessibility track. Where the fiber "opens", beads
// slide apart, the central one is evicted, an AP-1 dimer binds the exposed
// DNA, and the track grows a peak. Follows the pointer; wanders on its own
// when idle; draws a single still frame under prefers-reduced-motion.
(() => {
  const figure = document.querySelector("[data-fiber]");
  if (!figure) return;
  const canvas = figure.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const hint = figure.querySelector("[data-fiber-hint]");

  const COLOR = {
    bead: "#5246A8", beadCore: "#8174DD", eosin: "#FF6F9F",
    lilac: "#EDE9F8", lavender: "#B3A9D9",
  };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const touchOnly = matchMedia("(hover: none)");
  if (hint && touchOnly.matches) hint.textContent = "Drag along the fiber to open it, the way T cell activation does.";

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smoothstep = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

  // Geometry, recomputed on resize.
  let W = 0, H = 0, spacing, radius, sigma, fiberY, trackBase, trackH, geneY, beads = [], cov, binW = 5;
  // Opening state: focus x (smoothed toward target) and amplitude 0..1.
  let fx = 0, targetX = 0, amp = 0, targetAmp = 0;
  let lastPointer = -Infinity, waypointAt = 0, running = false, onScreen = true;
  const start = performance.now();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    spacing = clamp(W / 24, 30, 58);
    radius = spacing * 0.36;
    sigma = spacing * 1.9;
    fiberY = H * 0.34;
    trackBase = H * 0.84;
    trackH = H * 0.32;
    geneY = H * 0.93;
    beads = [];
    for (let x = -spacing * 2; x < W + spacing * 3; x += spacing) beads.push(x);
    cov = new Float32Array(Math.ceil(W / binW) + 1);
    if (!fx) { fx = targetX = W * 0.62; }
    if (!running) draw(performance.now());
  }

  // Openness at x: a Gaussian around the focus.
  const openAt = (x, width = sigma) => amp * Math.exp(-0.5 * ((x - fx) / width) ** 2);
  // Beads are pushed away from the focus. Kept gentle (0.5σ) so neighbours
  // only just touch where they bunch up; most of the gap comes from eviction.
  const push = (x) => { const u = (x - fx) / sigma; return amp * 0.5 * sigma * u * Math.exp(0.5 * (1 - u * u)); };
  const fiberAt = (x, t) => {
    const wobble = radius * 0.75 * Math.sin(x * 0.011 + t * 0.55) + radius * 0.35 * Math.sin(x * 0.029 - t * 0.4);
    return fiberY + wobble * (1 - 0.85 * openAt(x));
  };

  // Accessibility the "experiment" would read: background noise, two fixed
  // promoter peaks at gene starts, and the peak where the fiber is open.
  const coverageAt = (x) => {
    const noise = 0.05 + 0.05 * (0.5 + 0.5 * Math.sin(x * 0.13) * Math.sin(x * 0.051 + 1.3));
    const promoters = 0.3 * Math.exp(-0.5 * ((x - W * 0.1) / (spacing * 0.45)) ** 2)
                    + 0.22 * Math.exp(-0.5 * ((x - W * 0.92) / (spacing * 0.45)) ** 2);
    return Math.min(1, noise + promoters + 0.95 * openAt(x, sigma * 0.75));
  };

  function draw(now) {
    const t = reduceMotion.matches ? 0 : (now - start) / 1000;
    ctx.clearRect(0, 0, W, H);

    // DNA: two strands of a helix running the full width.
    const helixK = (Math.PI * 2) / (spacing * 0.42);
    for (const [phase, alpha] of [[0, 1], [Math.PI, 0.5]]) {
      ctx.beginPath();
      for (let x = -4; x <= W + 4; x += 3) {
        const o = openAt(x);
        const y = fiberAt(x, t) + radius * (0.14 + 0.1 * o) * Math.sin(x * helixK + t * 1.2 + phase);
        x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = COLOR.eosin; ctx.globalAlpha = alpha;
      ctx.lineWidth = Math.max(1.4, radius * 0.13); ctx.lineCap = "round";
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Histone beads with DNA wrapped around them.
    for (const base of beads) {
      const x = base + push(base);
      const evicted = smoothstep(0.5, 0.85, openAt(base));
      if (evicted >= 0.99) continue;
      const y = fiberAt(x, t) - evicted * radius * 2.6;
      ctx.globalAlpha = 1 - evicted;
      const g = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.35, radius * 0.1, x, y, radius);
      g.addColorStop(0, COLOR.beadCore); g.addColorStop(1, COLOR.bead);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COLOR.eosin; ctx.lineWidth = Math.max(1.2, radius * 0.1);
      for (const dx of [-0.34, 0.34]) {
        ctx.beginPath();
        ctx.ellipse(x + dx * radius, y, radius * 0.3, radius * 1.02, 0.42, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // AP-1 (a Fos/Jun dimer) binds the exposed DNA once the fiber is open.
    const bound = smoothstep(0.55, 1, amp);
    if (bound > 0) {
      const y = fiberAt(fx, t) - radius * 0.3;
      const rr = radius * 0.5 * bound;
      ctx.fillStyle = COLOR.eosin; ctx.beginPath(); ctx.arc(fx - rr * 0.55, y, rr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COLOR.lilac; ctx.beginPath(); ctx.arc(fx + rr * 0.55, y, rr, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = bound;
      ctx.fillStyle = COLOR.lavender;
      ctx.font = `600 ${Math.round(clamp(radius * 0.8, 11, 14))}px Archivo, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("AP-1", fx, y - radius * 1.25);
      ctx.globalAlpha = 1;
    }

    // Accessibility track: bins ease toward their target, like reads piling up.
    const ease = reduceMotion.matches ? 1 : 0.1;
    const buckets = [[], [], []];
    for (let i = 0; i < cov.length; i++) {
      const x = i * binW;
      cov[i] += (coverageAt(x + binW / 2) - cov[i]) * ease;
      buckets[cov[i] > 0.45 ? 2 : cov[i] > 0.2 ? 1 : 0].push(i);
    }
    const bucketStyle = [[COLOR.bead, 0.9], [COLOR.lavender, 0.55], [COLOR.eosin, 1]];
    buckets.forEach((list, b) => {
      ctx.fillStyle = bucketStyle[b][0]; ctx.globalAlpha = bucketStyle[b][1];
      ctx.beginPath();
      for (const i of list) {
        const h = Math.max(1, cov[i] * trackH);
        ctx.rect(i * binW, trackBase - h, binW - 1.5, h);
      }
      ctx.fill();
    });
    ctx.globalAlpha = 0.2; ctx.fillStyle = COLOR.lilac;
    ctx.fillRect(0, trackBase, W, 1);

    // Gene models under the track (exons as boxes, arrows for direction).
    ctx.globalAlpha = 0.5; ctx.fillStyle = COLOR.lavender; ctx.strokeStyle = COLOR.lavender; ctx.lineWidth = 1;
    const genes = [{ from: 0.1, to: 0.46, dir: 1, exons: [0.1, 0.17, 0.3, 0.44] },
                   { from: 0.6, to: 0.92, dir: -1, exons: [0.61, 0.7, 0.83, 0.91] }];
    for (const gene of genes) {
      const a = gene.from * W, b = gene.to * W;
      ctx.fillRect(a, geneY, b - a, 1);
      for (const e of gene.exons) ctx.fillRect(e * W, geneY - 4, Math.max(6, spacing * 0.3), 9);
      ctx.beginPath();
      for (let x = a + 20; x < b - 14; x += 34) {
        ctx.moveTo(x - 3 * gene.dir, geneY - 3); ctx.lineTo(x, geneY + 0.5); ctx.lineTo(x - 3 * gene.dir, geneY + 4);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function step(now) {
    if (!running) return;
    const idle = now - lastPointer > 3500;
    if (idle && now > waypointAt) {
      // Wander to a new spot along the fiber, pausing between moves.
      targetX = W * (0.18 + Math.random() * 0.64);
      waypointAt = now + 4200 + Math.random() * 2400;
    }
    fx += (targetX - fx) * (idle ? 0.018 : 0.16);
    amp += (targetAmp - amp) * 0.045;
    draw(now);
    requestAnimationFrame(step);
  }

  function setRunning(on) {
    on = on && onScreen && !document.hidden && !reduceMotion.matches;
    if (on === running) return;
    running = on;
    if (on) requestAnimationFrame(step);
  }

  canvas.addEventListener("pointermove", (e) => {
    targetX = e.clientX - canvas.getBoundingClientRect().left;
    targetAmp = 1;
    lastPointer = performance.now();
    if (reduceMotion.matches) { fx = targetX; amp = 1; draw(0); }
  });

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; setRunning(true); }).observe(canvas);
  document.addEventListener("visibilitychange", () => setRunning(true));
  reduceMotion.addEventListener("change", () => { amp = targetAmp = 1; setRunning(true); draw(0); });

  resize();
  if (reduceMotion.matches) {
    amp = targetAmp = 1;
    draw(0);
  } else {
    // The one orchestrated moment: the fiber starts closed, then opens.
    waypointAt = performance.now() + 5000;
    setTimeout(() => { targetAmp = 1; }, 700);
    setRunning(true);
  }
  // Redraw once the web font is ready so the AP-1 label uses Archivo.
  document.fonts?.ready.then(() => draw(performance.now()));
})();
