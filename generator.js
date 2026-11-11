/* Stained Glass – level generator + solver (pure, no DOM; runs in browser and Node) */
(function (root) {
  'use strict';

  const W = 400, H = 540, CX = 200;
  const PALETTE = ['r', 'b', 'y', 'g', 'p', 'o', 'k'];

  // ---------- RNG ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(a, b) {
    let h = (2166136261 ^ a) >>> 0;
    h = Math.imul(h ^ b, 16777619);
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return h >>> 0;
  }
  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ---------- Geometry ----------
  function shapePoly(type) {
    const pts = [];
    if (type === 'gothic') {
      const L = 72, R = 328, B = 512, w = R - L, apex = 30, S = apex + w * Math.sin(Math.PI / 3);
      pts.push([L, B], [R, B], [R, S]);
      for (let k = 1; k <= 12; k++) { const t = (Math.PI / 3) * k / 12; pts.push([L + w * Math.cos(t), S - w * Math.sin(t)]); }
      for (let k = 11; k >= 0; k--) { const t = (Math.PI / 3) * k / 12; pts.push([R - w * Math.cos(t), S - w * Math.sin(t)]); }
    } else if (type === 'rose') {
      const cx = CX, cy = 272, r = 182;
      for (let k = 0; k < 36; k++) { const t = Math.PI * 2 * k / 36; pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
    } else { // round arch
      const L = 62, R = 338, B = 512, r = 138, S = 34 + r;
      pts.push([L, B], [R, B], [R, S]);
      for (let k = 1; k < 24; k++) { const t = Math.PI * k / 24; pts.push([CX + r * Math.cos(t), S - r * Math.sin(t)]); }
      pts.push([L, S]);
    }
    return pts;
  }
  function polyArea(p) {
    let a = 0;
    for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; }
    return Math.abs(a) / 2;
  }
  function centroid(p) {
    let a = 0, x = 0, y = 0;
    for (let i = 0; i < p.length; i++) {
      const q = p[(i + 1) % p.length]; const c = p[i][0] * q[1] - q[0] * p[i][1];
      a += c; x += (p[i][0] + q[0]) * c; y += (p[i][1] + q[1]) * c;
    }
    if (Math.abs(a) < 1e-9) return p[0].slice();
    return [x / (3 * a), y / (3 * a)];
  }
  function segDist(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1]; const l2 = dx * dx + dy * dy;
    let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  function edgeDist(p, poly) {
    let m = Infinity;
    for (let i = 0; i < poly.length; i++) m = Math.min(m, segDist(p, poly[i], poly[(i + 1) % poly.length]));
    return m;
  }
  function inside(p, poly) { // convex polygon
    let sgn = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const cr = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
      if (Math.abs(cr) < 1e-9) continue;
      const s = cr > 0 ? 1 : -1;
      if (!sgn) sgn = s; else if (s !== sgn) return false;
    }
    return true;
  }
  // Sutherland–Hodgman against half-plane (p-m)·d <= 0, tracking which neighbour created each edge
  function clipHalf(poly, lab, m, d, j) {
    const out = [], ol = [], N = poly.length;
    const f = p => (p[0] - m[0]) * d[0] + (p[1] - m[1]) * d[1];
    for (let k = 0; k < N; k++) {
      const A = poly[k], B = poly[(k + 1) % N], L = lab[k];
      const fa = f(A), fb = f(B), inA = fa <= 0, inB = fb <= 0;
      if (inA) {
        out.push(A); ol.push(L);
        if (!inB) { const t = fa / (fa - fb); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); ol.push(j); }
      } else if (inB) {
        const t = fa / (fa - fb); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); ol.push(L);
      }
    }
    return [out, ol];
  }
  function voronoi(sites, shape) {
    return sites.map((s, i) => {
      let poly = shape.map(p => p.slice()), lab = shape.map(() => -1);
      for (let j = 0; j < sites.length; j++) {
        if (j === i) continue;
        const t = sites[j];
        [poly, lab] = clipHalf(poly, lab, [(s[0] + t[0]) / 2, (s[1] + t[1]) / 2], [t[0] - s[0], t[1] - s[1]], j);
        if (poly.length < 3) break;
      }
      return { poly, lab };
    });
  }

  // ---------- Symmetric site placement ----------
  function genSites(shape, n, rng) {
    const A = polyArea(shape);
    const xs = shape.map(p => p[0]), ys = shape.map(p => p[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const nc = n % 2 ? ((n >= 9 && rng() < 0.5) ? 3 : 1) : ((n >= 8 && rng() < 0.6) ? 2 : 0);
    const nl = (n - nc) / 2;
    let md = Math.sqrt(A / n) * 0.85;
    for (let round = 0; round < 30; round++, md *= 0.95) {
      const pts = [], mirror = []; let ok = true;
      const far = p => pts.every(q => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 >= md * md);
      const good = p => inside(p, shape) && edgeDist(p, shape) >= md * 0.32;
      for (let c = 0; c < nc && ok; c++) {
        let placed = false;
        for (let a = 0; a < 200; a++) {
          const p = [CX, minY + rng() * (maxY - minY)];
          if (good(p) && far(p)) { mirror.push(pts.length); pts.push(p); placed = true; break; }
        }
        ok = placed;
      }
      for (let c = 0; c < nl && ok; c++) {
        let placed = false;
        for (let a = 0; a < 300; a++) {
          const p = [minX + rng() * (CX - md * 0.5 - minX), minY + rng() * (maxY - minY)];
          const q = [2 * CX - p[0], p[1]];
          if (good(p) && far(p) && far(q)) { const k = pts.length; pts.push(p, q); mirror.push(k + 1, k); placed = true; break; }
        }
        ok = placed;
      }
      if (ok) return { sites: pts, mirror };
    }
    return null;
  }
  function relax(sites, mirror, cells) {
    const out = sites.map(s => s.slice());
    for (let i = 0; i < sites.length; i++) {
      const m = mirror[i], c = centroid(cells[i].poly);
      if (m === i) out[i] = [CX, c[1]];
      else if (i < m) {
        const cm = centroid(cells[m].poly);
        const x = Math.min((c[0] + (2 * CX - cm[0])) / 2, CX - 5), y = (c[1] + cm[1]) / 2;
        out[i] = [x, y]; out[m] = [2 * CX - x, y];
      }
    }
    return out;
  }

  function assignColors(n, mirror, adj, k, bias, rng, pal) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const col = Array(n).fill(null);
      const order = shuffle([...Array(n).keys()], rng);
      for (const i of order) {
        if (col[i] != null) continue;
        const nb = adj[i].filter(j => col[j] != null);
        const c = (nb.length && rng() < bias) ? col[nb[Math.floor(rng() * nb.length)]] : pal[Math.floor(rng() * k)];
        col[i] = c; col[mirror[i]] = c;
      }
      if (new Set(col).size === k) return col;
    }
    return null;
  }

  // ---------- Solver ----------
  // State = bitmask of correctly filled cells. A pour into empty cell x floods (downward, through open gaps)
  // every reachable empty cell. A move is legal only if the whole flood matches x's target colour.
  function solveFrom(n, down, target, startMask) {
    const size = 1 << n, full = size - 1;
    const dist = new Int8Array(size).fill(-1), first = new Int8Array(size).fill(-1);
    const q = new Int32Array(size); let h = 0, t = 0;
    q[t++] = startMask; dist[startMask] = 0;
    const stack = new Int32Array(n + 1);
    while (h < t) {
      const s = q[h++];
      if (s === full) return { min: dist[s], first: first[s] };
      for (let x = 0; x < n; x++) {
        if ((s >> x) & 1) continue;
        let m = 1 << x, sp = 0, ok = true; const col = target[x];
        stack[sp++] = x;
        while (sp && ok) {
          const c = stack[--sp];
          for (const j of down[c]) {
            if (((s >> j) & 1) || ((m >> j) & 1)) continue;
            if (target[j] !== col) { ok = false; break; }
            m |= 1 << j; stack[sp++] = j;
          }
        }
        if (!ok) continue;
        const ns = s | m;
        if (dist[ns] >= 0) continue;
        dist[ns] = dist[s] + 1; first[ns] = s === startMask ? x : first[s]; q[t++] = ns;
      }
    }
    return null;
  }

  // ---------- Level table ----------
  const TABLE = [
    { n: 5, c: 2, open: 0, slack: 0, shape: 'round', minSave: 0, traps: 0, bias: .3 },
    { n: 6, c: 2, open: .8, sameOnly: true, slack: 1, shape: 'gothic', minSave: 2, traps: 0, bias: .6 },
    { n: 7, c: 2, open: .7, slack: 1, shape: 'round', minSave: 2, traps: 1, bias: .5 },
    { n: 8, c: 3, open: .65, slack: 1, shape: 'rose', minSave: 2, traps: 1, bias: .45 },
    { n: 9, c: 3, open: .65, slack: 1, shape: 'gothic', minSave: 3, traps: 2, bias: .45 },
    { n: 10, c: 3, open: .65, slack: 0, shape: 'round', minSave: 3, traps: 2, bias: .45 },
    { n: 11, c: 4, open: .65, slack: 1, shape: 'rose', minSave: 3, traps: 2, bias: .45 },
    { n: 12, c: 4, open: .7, slack: 0, shape: 'gothic', minSave: 4, traps: 3, bias: .45 },
    { n: 13, c: 4, open: .7, slack: 1, shape: 'round', minSave: 4, traps: 3, bias: .45 },
    { n: 14, c: 5, open: .7, slack: 0, shape: 'rose', minSave: 4, traps: 3, bias: .45 },
    { n: 15, c: 5, open: .72, slack: 1, shape: 'gothic', minSave: 5, traps: 4, bias: .45 },
    { n: 16, c: 5, open: .72, slack: 0, shape: 'round', minSave: 5, traps: 4, bias: .45 },
  ];
  function params(idx) {
    if (idx <= TABLE.length) return TABLE[idx - 1];
    const shapes = ['round', 'gothic', 'rose'];
    return { n: 15 + (idx % 3), c: 5 + (idx % 4 === 0 ? 1 : 0), open: .72, slack: idx % 2, shape: shapes[idx % 3], minSave: 5, traps: 4, bias: .45 };
  }

  function generate(P, seed) {
    const rng = mulberry32(seed);
    const shape = shapePoly(P.shape);
    const S = genSites(shape, P.n, rng);
    if (!S) return null;
    let sites = S.sites; const mirror = S.mirror, n = sites.length;
    for (let it = 0; it < 2; it++) sites = relax(sites, mirror, voronoi(sites, shape));
    const vc = voronoi(sites, shape);
    const minArea = polyArea(shape) / n * 0.35;
    const cells = vc.map(c => ({ poly: c.poly, lab: c.lab, c: centroid(c.poly), area: polyArea(c.poly) }));
    if (cells.some(c => c.poly.length < 3 || c.area < minArea)) return null;

    // edges between cells
    const edges = [], adj = cells.map(() => []);
    cells.forEach((c, i) => c.lab.forEach((j, k) => {
      if (j <= i) return;
      const a = c.poly[k], b = c.poly[(k + 1) % c.poly.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 0.5) return;
      const e = { i, j, a, b, len, open: false, u: -1, d: -1 };
      edges.push(e);
      if (len >= 4) { adj[i].push(j); adj[j].push(i); }
      const dx = Math.abs(b[0] - a[0]), dy = Math.abs(b[1] - a[1]);
      e.cand = len >= 26 && dx > dy * 1.15 && Math.abs(cells[i].c[1] - cells[j].c[1]) > 12;
      if (e.cand) { if (cells[i].c[1] < cells[j].c[1]) { e.u = i; e.d = j; } else { e.u = j; e.d = i; } }
    }));

    const pal = shuffle(PALETTE.slice(), rng).slice(0, P.c);
    const target = assignColors(n, mirror, adj, P.c, P.bias, rng, pal);
    if (!target) return null;

    // open gaps (mirror-symmetric)
    const key = (i, j) => i < j ? i + '-' + j : j + '-' + i;
    const emap = new Map(edges.map(e => [key(e.i, e.j), e]));
    const done = new Set();
    for (const e of edges) {
      if (!e.cand) continue;
      const k = key(e.i, e.j); if (done.has(k)) continue;
      const mk = key(mirror[e.i], mirror[e.j]); done.add(k); done.add(mk);
      const diff = target[e.u] !== target[e.d];
      let p = P.open; if (diff) p = P.sameOnly ? 0 : p * 0.85;
      const open = rng() < p;
      e.open = open;
      const me = emap.get(mk); if (me && me.cand) me.open = open;
    }
    const down = cells.map(() => []);
    edges.forEach(e => { if (e.open) down[e.u].push(e.d); });
    const traps = edges.filter(e => e.open && target[e.u] !== target[e.d]).length;
    if (traps < P.traps) return null;
    if (P.sameOnly && traps > 0) return null;
    if (P.open === 0 && edges.some(e => e.open)) return null;

    const sol = solveFrom(n, down, target, 0);
    if (!sol) return null;
    if (n - sol.min < P.minSave) return null;

    return {
      shapeType: P.shape, shape,
      cells: cells.map(c => ({ poly: c.poly, c: c.c, area: c.area })),
      edges: edges.map(e => ({ i: e.i, j: e.j, a: e.a, b: e.b, len: e.len, open: e.open, u: e.u, d: e.d })),
      target, down, palette: pal.filter(k => target.includes(k)), min: sol.min, traps, mirror,
    };
  }

  function buildLevel(idx) {
    let P = Object.assign({}, params(idx));
    for (let step = 0; step < 5; step++) {
      for (let a = 0; a < 300; a++) {
        const lvl = generate(P, hash(idx * 7919 + 13, a + step * 1000));
        if (lvl) { lvl.idx = idx; lvl.limit = lvl.min + P.slack; lvl.params = P; return lvl; }
      }
      P = Object.assign({}, P, { minSave: Math.max(0, P.minSave - 1), traps: Math.max(0, P.traps - 1) });
    }
    throw new Error('Level generation failed for ' + idx);
  }

  const api = { buildLevel, solveFrom, inside, centroid, params, PALETTE, W, H };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SG = api;
})(typeof window !== 'undefined' ? window : globalThis);
