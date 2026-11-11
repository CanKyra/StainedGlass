/* Stained Glass - collection + level generator + solver (pure, runs in browser and Node) */
(function (root) {
  'use strict';

  const W = 400, H = 540, CX = 200;
  const PALETTE = ['r', 'b', 'y', 'g', 'p', 'o', 'k'];

  // ---------- Collections definition ----------
  const COLLECTIONS = [
    {
      id: 'cathedrals',
      num: 1,
      title: 'Gotik Katedraller',
      subtitle: 'Avrupa katedrallerinin gül ve kemer vitrayları',
      badge: 'Katedral Serisi',
      accent: '#F5C542',
      shapes: ['round', 'gothic', 'rose'],
      colors: ['r', 'b', 'y', 'g', 'p', 'o', 'k'],
      pieces: [
        'Chartres', 'Sainte-Chapelle', 'Notre-Dame', 'Köln',
        'York Minster', 'Reims', 'Canterbury', 'Sagrada Família',
        'Strasbourg', 'St. Vitus', 'Milano Duomo', 'Westminster'
      ]
    },
    {
      id: 'iznik',
      num: 2,
      title: 'İznik & Revzen',
      subtitle: 'Osmanlı revzen pencereleri ve Selçuklu madalyonları',
      badge: 'Çini & Revzen',
      accent: '#2CC5B8',
      shapes: ['pointed_arch', 'hex_medallion', 'domed_mihrab'],
      colors: ['b', 'g', 'r', 'y', 'p', 'o', 'k'],
      pieces: [
        'Rüstem Paşa', 'Sultanahmet', 'Süleymaniye', 'Yeşil Türbe',
        'Topkapı Harem', 'Karatay Medresesi', 'Eşrefoğlu', 'İnce Minare',
        'Sokollu Mehmet', 'Yeni Cami', 'Muradiye', 'Çinili Köşk'
      ]
    },
    {
      id: 'artnouveau',
      num: 3,
      title: 'Art Nouveau & Tiffany',
      subtitle: 'Organik oval formlar, kehribar ve zümrüt camlar',
      badge: 'Atölye Serisi',
      accent: '#E879A8',
      shapes: ['oval_medallion', 'tiffany_dome', 'triptych_arch'],
      colors: ['y', 'g', 'p', 'o', 'k', 'b', 'r'],
      pieces: [
        'Casa Batlló', 'Horta Konağı', 'Palau de la Música', 'Tiffany Lotus',
        'Galeries Lafayette', 'Majorelle', 'Secession Viyana', 'Mackintosh Rose',
        'Guimard Metro', 'Klimt Altın', 'Mucha İris', 'Lalique Yusufçuk'
      ]
    },
    {
      id: 'nordic',
      num: 4,
      title: 'Kuzey Prizması',
      subtitle: 'Modern kristal pencereler ve kuzey ışıkları',
      badge: 'Modern Seri',
      accent: '#7CC6FE',
      shapes: ['crystal_diamond', 'tall_lancet', 'octagon_star'],
      colors: ['b', 'p', 'g', 'k', 'y', 'r', 'o'],
      pieces: [
        'Hallgrímskirkja', 'Arktik Katedral', 'Harpa Reykjavik', 'Kamppi Şapeli',
        'Kiasma', 'Buzul Prizması', 'Kuzey Tacı', 'Fiyort Aynası',
        'Aurora Borealis', 'Kristal Kubbe', 'Geceyarısı Güneşi', 'Kutup Yıldızı'
      ]
    }
  ];

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

  // ---------- Geometry (all shapes are strictly convex CCW polygons) ----------
  function shapePoly(type) {
    const pts = [];
    if (type === 'gothic') {
      const L = 72, R = 328, B = 512, w = R - L, apex = 30, S = apex + w * Math.sin(Math.PI / 3);
      pts.push([L, B], [R, B], [R, S]);
      for (let k = 1; k <= 12; k++) { const t = (Math.PI / 3) * k / 12; pts.push([L + w * Math.cos(t), S - w * Math.sin(t)]); }
      for (let k = 11; k >= 0; k--) { const t = (Math.PI / 3) * k / 12; pts.push([R - w * Math.cos(t), S - w * Math.sin(t)]); }
    } else if (type === 'tall_lancet') {
      const L = 84, R = 316, B = 514, w = R - L, apex = 26, S = apex + w * Math.sin(Math.PI / 3);
      pts.push([L, B], [R, B], [R, S]);
      for (let k = 1; k <= 12; k++) { const t = (Math.PI / 3) * k / 12; pts.push([L + w * Math.cos(t), S - w * Math.sin(t)]); }
      for (let k = 11; k >= 0; k--) { const t = (Math.PI / 3) * k / 12; pts.push([R - w * Math.cos(t), S - w * Math.sin(t)]); }
    } else if (type === 'pointed_arch') {
      const L = 60, R = 340, B = 510, w = R - L, apex = 36, S = apex + w * Math.sin(Math.PI / 3);
      pts.push([L, B], [R, B], [R, S]);
      for (let k = 1; k <= 12; k++) { const t = (Math.PI / 3) * k / 12; pts.push([L + w * Math.cos(t), S - w * Math.sin(t)]); }
      for (let k = 11; k >= 0; k--) { const t = (Math.PI / 3) * k / 12; pts.push([R - w * Math.cos(t), S - w * Math.sin(t)]); }
    } else if (type === 'rose') {
      const cx = CX, cy = 272, r = 182;
      for (let k = 0; k < 36; k++) { const t = Math.PI * 2 * k / 36; pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
    } else if (type === 'oval_medallion') {
      const cx = CX, cy = 272, rx = 148, ry = 228;
      for (let k = 0; k < 36; k++) { const t = Math.PI * 2 * k / 36; pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); }
    } else if (type === 'hex_medallion') {
      // Vertically elongated 8-sided Seljuk medallion (CCW in screen coords -> decreasing angle or explicit CCW)
      pts.push(
        [136, 508], [264, 508], [340, 412], [340, 132],
        [264, 36], [136, 36], [60, 132], [60, 412]
      );
    } else if (type === 'crystal_diamond') {
      // Faceted Nordic crystal (8-gon)
      pts.push(
        [156, 512], [244, 512], [336, 396], [336, 148],
        [244, 32], [156, 32], [64, 148], [64, 396]
      );
    } else if (type === 'octagon_star') {
      const cx = CX, cy = 272, rx = 166, ry = 216;
      for (let k = 0; k < 12; k++) {
        const t = Math.PI * 2 * k / 12 + Math.PI / 12;
        pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
      }
    } else if (type === 'triptych_arch') {
      // Art Deco / Secession stepped shoulder arch (strictly convex)
      pts.push(
        [68, 512], [332, 512], [332, 188], [296, 92],
        [238, 36], [162, 36], [104, 92], [68, 188]
      );
    } else if (type === 'tiffany_dome') {
      // Wide domed arch with gently tapered base
      const L = 58, R = 342, B = 510, r = 142, S = 38 + r;
      pts.push([78, B], [322, B], [R, 340], [R, S]);
      for (let k = 1; k < 24; k++) { const t = Math.PI * k / 24; pts.push([CX + r * Math.cos(t), S - r * Math.sin(t)]); }
      pts.push([L, S], [L, 340]);
    } else if (type === 'domed_mihrab') {
      const L = 66, R = 334, B = 512, rx = 134, ry = 168, S = 36 + ry;
      pts.push([L, B], [R, B], [R, S]);
      for (let k = 1; k < 24; k++) { const t = Math.PI * k / 24; pts.push([CX + rx * Math.cos(t), S - ry * Math.sin(t)]); }
      pts.push([L, S]);
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

  // ---------- Per-collection 12-level curve ----------
  const CURVE = [
    { n: 5, c: 2, open: 0, slack: 0, minSave: 0, traps: 0, bias: .35 },
    { n: 6, c: 2, open: .8, sameOnly: true, slack: 1, minSave: 2, traps: 0, bias: .6 },
    { n: 7, c: 2, open: .7, slack: 1, minSave: 2, traps: 1, bias: .5 },
    { n: 8, c: 3, open: .65, slack: 1, minSave: 2, traps: 1, bias: .45 },
    { n: 9, c: 3, open: .65, slack: 1, minSave: 3, traps: 2, bias: .45 },
    { n: 10, c: 3, open: .65, slack: 1, minSave: 3, traps: 2, bias: .45 },
    { n: 11, c: 4, open: .65, slack: 1, minSave: 3, traps: 2, bias: .45 },
    { n: 12, c: 4, open: .7, slack: 1, minSave: 4, traps: 3, bias: .45 },
    { n: 13, c: 4, open: .7, slack: 1, minSave: 4, traps: 3, bias: .45 },
    { n: 14, c: 5, open: .7, slack: 1, minSave: 4, traps: 3, bias: .45 },
    { n: 15, c: 5, open: .72, slack: 1, minSave: 5, traps: 4, bias: .45 },
    { n: 16, c: 5, open: .72, slack: 0, minSave: 5, traps: 4, bias: .45 },
  ];

  function params(idx) {
    const colIdx = Math.min(COLLECTIONS.length - 1, Math.floor((idx - 1) / 12));
    const itemIdx = (idx - 1) % 12;
    const col = COLLECTIONS[colIdx];
    const base = Object.assign({}, CURVE[itemIdx]);
    // Later collections start slightly richer while still having a gentle entry on piece 1-2
    if (colIdx > 0 && itemIdx === 0) {
      base.n = 6 + colIdx; base.c = 2 + (colIdx >= 2 ? 1 : 0); base.open = .65; base.slack = 1; base.minSave = 2; base.traps = 1;
    } else if (colIdx > 0 && itemIdx === 1) {
      base.n = 7 + colIdx; base.c = 3; base.sameOnly = false; base.open = .68; base.slack = 1; base.minSave = 2; base.traps = 1;
    } else if (colIdx > 0) {
      base.n = Math.min(16, base.n + Math.min(2, colIdx));
    }
    base.shape = col.shapes[itemIdx % col.shapes.length];
    base.pool = col.colors;
    return base;
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

    const pool = (P.pool || PALETTE).slice();
    const pal = shuffle(pool, rng).slice(0, P.c);
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
        if (lvl) {
          const colIdx = Math.min(COLLECTIONS.length - 1, Math.floor((idx - 1) / 12));
          const itemIdx = (idx - 1) % 12;
          lvl.idx = idx;
          lvl.colIdx = colIdx;
          lvl.itemIdx = itemIdx;
          lvl.collection = COLLECTIONS[colIdx];
          lvl.pieceName = COLLECTIONS[colIdx].pieces[itemIdx] || ('Vitray ' + idx);
          lvl.limit = lvl.min + P.slack;
          lvl.params = P;
          return lvl;
        }
      }
      P = Object.assign({}, P, { minSave: Math.max(0, P.minSave - 1), traps: Math.max(0, P.traps - 1) });
    }
    throw new Error('Level generation failed for ' + idx);
  }

  const api = { buildLevel, solveFrom, inside, centroid, params, COLLECTIONS, PALETTE, W, H };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SG = api;
})(typeof window !== 'undefined' ? window : globalThis);
