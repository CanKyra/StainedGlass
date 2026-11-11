/* Stained Glass - playable prototype UI */
(() => {
  'use strict';
  const G = window.SG;
  const NS = 'http://www.w3.org/2000/svg';

  const COLORS = {
    r: { hex: '#E23D3D', name: 'Kırmızı', sym: '▲' },
    b: { hex: '#2F6FE4', name: 'Mavi', sym: '■' },
    y: { hex: '#F6C21C', name: 'Sarı', sym: '★' },
    g: { hex: '#1EAA5C', name: 'Yeşil', sym: '◆' },
    p: { hex: '#9A4DE0', name: 'Mor', sym: '●' },
    o: { hex: '#F2771A', name: 'Turuncu', sym: '✖' },
    k: { hex: '#E8489A', name: 'Pembe', sym: '♥' },
  };
  const HOT = [255, 238, 196];
  const NAMES = [
    'Chartres', 'Sainte-Chapelle', 'Notre-Dame', 'Köln', 'York Minster', 'Reims',
    'Canterbury', 'Sagrada Família', 'Strasbourg', 'St. Vitus', 'Milano Duomo', 'Westminster',
    'Amiens', 'Burgos', 'Ulm', 'Siena', 'Toledo', 'Lincoln',
    'Bourges', 'Laon', 'Metz', 'Wells', 'Exeter', 'Rouen'
  ];
  const SHAPE_NAMES = { round: 'Yuvarlak kemer', gothic: 'Sivri kemer', rose: 'Gül pencere' };
  const SEASON = 24;
  const TIPS = {
    1: 'Bir pota seç, sonra aynı renk ipucunu taşıyan boş bölmeye dokun.',
    2: 'Altın oklu açıklıklardan erimiş cam <b>aşağıdaki</b> bölmeye akar. Üstten dökerek birkaç bölmeyi tek dökümde doldur.',
    3: 'Cam farklı renkli bölmeye de akar! Önce alttakini doldur: <b>dolu bölme akışı keser.</b>',
    4: 'Döküm hakkın sınırlı. ★★★ için sağ üstteki hedef kadar dökümle bitir.',
    5: 'Sıkışırsan <b>❄ Soğut</b>: bir sonraki döküm hiç taşmaz, sadece dokunduğun bölmeyi doldurur.',
  };

  // ---------- persistence ----------
  const KEY = 'sg_proto_v1';
  const store = (() => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { /* ignore */ }
    return {
      unlocked: s.unlocked || 1,
      stars: s.stars || {},
      thumbs: s.thumbs || {},
      best: s.best || {},
      settings: Object.assign({ cb: false, sound: true, preview: true }, s.settings || {}),
    };
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } };

  // ---------- helpers ----------
  const $ = s => document.querySelector(s);
  const E = {
    app: $('#app'), board: $('#board'), pots: $('#pots'), pours: $('#pours'), poursN: $('#poursN'), goalN: $('#goalN'),
    lvlName: $('#lvlName'), lvlEyebrow: $('#lvlEyebrow'), btnPrev: $('#btnPrev'), btnNext: $('#btnNext'),
    tip: $('#tip'), sheet: $('#sheet'), modal: $('#modal'), toast: $('#toast'), rays: $('#rays'),
    bCool: $('#bCool'), bPlus: $('#bPlus'), bUndo: $('#bUndo'), bHint: $('#bHint'), bRestart: $('#bRestart'),
    cCool: $('#cCool'), cPlus: $('#cPlus'), cUndo: $('#cUndo'),
  };
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const P = p => p.map(v => v[0].toFixed(1) + ',' + v[1].toFixed(1)).join(' ');
  const hexRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (hex, hot, t) => { const c = hexRgb(hex); return `rgb(${c.map((v, i) => Math.round(v + (hot[i] - v) * t)).join(',')})`; };
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const levelName = idx => NAMES[(idx - 1) % NAMES.length] + (idx > NAMES.length ? ' ' + toRoman(Math.ceil(idx / NAMES.length)) : '');
  function toRoman(n) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n); }
  let toastT = 0;
  function toast(msg) {
    E.toast.textContent = msg; E.toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => E.toast.classList.remove('show'), 2200);
  }
  const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* ignore */ } };

  // ---------- sound ----------
  const Snd = {
    ctx: null,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ }
    },
    ok() { return store.settings.sound && this.ctx; },
    tone(f, t0, dur, type, vol) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
    },
    noise(dur, freq, vol) {
      const c = this.ctx, b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      const s = c.createBufferSource(); s.buffer = b;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.7;
      const g = c.createGain(); g.gain.value = vol;
      s.connect(f).connect(g).connect(c.destination); s.start();
    },
    click() { if (this.ok()) this.tone(700, this.ctx.currentTime, 0.07, 'triangle', 0.05); },
    pour() { if (this.ok()) this.noise(0.55, 1100, 0.3); },
    chime(d) {
      if (!this.ok()) return;
      const sc = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5], f = sc[Math.min(d, 7)], t = this.ctx.currentTime;
      this.tone(f, t, 1.3, 'sine', 0.1); this.tone(f * 2.01, t, 0.6, 'sine', 0.035); this.tone(f * 3.98, t, 0.25, 'sine', 0.015);
    },
    wrong() {
      if (!this.ok()) return; const t = this.ctx.currentTime;
      this.tone(150, t, 0.35, 'sawtooth', 0.06); this.tone(106, t + 0.09, 0.45, 'sawtooth', 0.06); this.noise(0.25, 3000, 0.15);
    },
    win() {
      if (!this.ok()) return; const t = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, k) => {
        this.tone(f, t + k * 0.11, 1.8, 'sine', 0.08);
        this.tone(f * 2, t + k * 0.11, 0.6, 'sine', 0.02);
      });
    },
  };

  // ---------- noise texture (once) ----------
  const NOISE = (() => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 540;
    const x = c.getContext('2d'), s = document.createElement('canvas'); s.width = 80; s.height = 108;
    const sx = s.getContext('2d'), id = sx.createImageData(80, 108);
    for (let i = 0; i < 80 * 108; i++) {
      const v = 90 + Math.random() * 90;
      id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255;
    }
    sx.putImageData(id, 0, 0); x.imageSmoothingEnabled = true; x.drawImage(s, 0, 0, 400, 540);
    const g = x.getImageData(0, 0, 400, 540);
    for (let i = 0; i < g.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 46;
      g.data[i] += n; g.data[i + 1] += n; g.data[i + 2] += n;
    }
    x.putImageData(g, 0, 0);
    return c.toDataURL('image/jpeg', 0.8);
  })();

  // ---------- state ----------
  const levelCache = new Map();
  function getLevel(idx) {
    if (!levelCache.has(idx)) {
      const L = G.buildLevel(idx);
      L.gap = {};
      L.edges.forEach(e => { if (e.open) L.gap[e.u + '>' + e.d] = e; });
      levelCache.set(idx, L);
    }
    return levelCache.get(idx);
  }
  let L = null, S = null;
  const R = { cells: [], preview: null, fx: null };
  const anims = []; let rafOn = false;

  function startLevel(idx) {
    idx = Math.max(1, idx);
    L = getLevel(idx);
    S = {
      idx, fill: Array(L.cells.length).fill(null), pours: L.limit, used: 0, selected: null, history: [],
      boosters: { cool: 2, plus: 1, undo: 3 }, cooling: false, busy: false, status: 'play', hover: -1, hintRing: null,
    };
    anims.length = 0;
    buildBoard(); buildPots(); updateHUD(); updateBoosters(); hideSheet(); closeModal(); E.rays.innerHTML = '';
    if (TIPS[idx]) { E.tip.innerHTML = TIPS[idx]; E.tip.hidden = false; } else E.tip.hidden = true;
    if (L.palette.length === 1) selectPot(L.palette[0], true);
    try { history.replaceState(null, '', '?level=' + idx); } catch (e) { /* file:// may block */ }
  }

  // ---------- board ----------
  function buildBoard() {
    const svg = E.board;
    svg.innerHTML = '';
    svg.classList.remove('lit', 'cooling', 'shake');
    svg.classList.toggle('cb', store.settings.cb);
    const defs = el('defs', null, svg);
    el('polygon', { points: P(L.shape) }, el('clipPath', { id: 'winClip' }, defs));
    L.cells.forEach((c, i) => el('polygon', { points: P(c.poly) }, el('clipPath', { id: 'cc' + i }, defs)));
    defs.insertAdjacentHTML('beforeend',
      '<linearGradient id="sheenG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>' +
      '<radialGradient id="emptyG" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="#3a3158"/><stop offset="1" stop-color="#1f1933"/></radialGradient>' +
      '<linearGradient id="sweepG" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff6dc" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="haloG"><stop offset="0" stop-color="#ffe6a8" stop-opacity=".5"/><stop offset=".6" stop-color="#ffd27a" stop-opacity=".12"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>');

    el('ellipse', { cx: 200, cy: 280, rx: 300, ry: 340, fill: 'url(#haloG)', class: 'halo-bg' }, svg);
    el('polygon', { points: P(L.shape), class: 'frame1' }, svg);
    el('polygon', { points: P(L.shape), class: 'frame2' }, svg);
    el('polygon', { points: P(L.shape), class: 'frame3' }, svg);
    if (L.shapeType !== 'rose') {
      const xs = L.shape.map(p => p[0]), by = Math.max(...L.shape.map(p => p[1]));
      el('rect', { x: Math.min(...xs) - 30, y: by + 10, width: Math.max(...xs) - Math.min(...xs) + 60, height: 14, rx: 3, class: 'sill' }, svg);
    }

    const cg = el('g', { id: 'cells' }, svg);
    R.cells = L.cells.map((c, i) => {
      const g = el('g', { class: 'cell' }, cg);
      el('polygon', { points: P(c.poly), fill: 'url(#emptyG)' }, g);
      const clip = el('g', { 'clip-path': `url(#cc${i})`, class: 'molten-c' }, g);
      const molten = el('circle', { cx: c.c[0], cy: c.c[1], r: 0 }, clip);
      el('polygon', { points: P(c.poly), fill: 'url(#sheenG)', class: 'sheen' }, g);
      const col = COLORS[L.target[i]];
      const fsym = el('text', { x: c.c[0], y: c.c[1] + 1, class: 'fill-sym', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g);
      fsym.textContent = col.sym;
      const hint = el('g', { class: 'hint', transform: `translate(${c.c[0].toFixed(1)} ${c.c[1].toFixed(1)})` }, g);
      el('circle', { r: 13, class: 'hint-ring' }, hint);
      el('circle', { r: 9, fill: col.hex }, hint);
      const hs = el('text', { y: 0.5, class: 'hint-sym', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, hint);
      hs.textContent = col.sym;
      const crack = el('g', { class: 'crack' }, g);
      return { g, molten, hint, crack };
    });

    el('image', { href: NOISE, x: 0, y: 0, width: 400, height: 540, preserveAspectRatio: 'none', 'clip-path': 'url(#winClip)', class: 'tex' }, svg);
    R.preview = el('g', { id: 'preview' }, svg);

    // lead cames
    const lg = el('g', { id: 'leads' }, svg);
    let d = '';
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const seg = (a, b) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    L.edges.forEach(e => {
      if (!e.open) { d += seg(e.a, e.b); return; }
      d += seg(e.a, lerp(e.a, e.b, 0.3)) + seg(lerp(e.a, e.b, 0.7), e.b);
    });
    el('path', { d, class: 'lead-o' }, lg);
    el('path', { d, class: 'lead-i' }, lg);
    el('polygon', { points: P(L.shape), class: 'lead-border-o' }, lg);
    el('polygon', { points: P(L.shape), class: 'lead-border-i' }, lg);
    L.edges.forEach(e => {
      if (!e.open) return;
      const mid = lerp(e.a, e.b, 0.5); e.mid = mid;
      let nx = -(e.b[1] - e.a[1]), ny = e.b[0] - e.a[0]; const ln = Math.hypot(nx, ny); nx /= ln; ny /= ln;
      const lc = L.cells[e.d].c;
      if (nx * (lc[0] - mid[0]) + ny * (lc[1] - mid[1]) < 0) { nx = -nx; ny = -ny; }
      const ang = Math.atan2(ny, nx) * 180 / Math.PI - 90;
      const gg = el('g', { transform: `translate(${mid[0].toFixed(1)} ${mid[1].toFixed(1)})` }, lg);
      const g = el('g', { class: 'gap', transform: `rotate(${ang.toFixed(1)})` }, gg);
      el('circle', { r: 8, class: 'gh' }, g);
      el('path', { d: 'M-4.5 -2.5 L0 2.5 L4.5 -2.5' }, g);
      e.marker = g;
    });

    R.fx = el('g', { id: 'fx', 'clip-path': 'url(#winClip)' }, svg);
    const hg = el('g', { id: 'hit' }, svg);
    L.cells.forEach((c, i) => el('polygon', { points: P(c.poly), 'data-hit': i, fill: 'transparent' }, hg));
    updateGaps();
  }

  function updateGaps() {
    L.edges.forEach(e => { if (e.marker) e.marker.classList.toggle('sealed', S.fill[e.d] != null || S.fill[e.u] != null); });
  }

  function floodInfo(i, pt) {
    const res = [{ c: i, d: 0, from: pt || L.cells[i].c, via: null }];
    if (S.cooling) return res;
    const seen = new Set([i]);
    for (let q = 0; q < res.length; q++) {
      const f = res[q];
      for (const j of L.down[f.c]) {
        if (seen.has(j) || S.fill[j] != null) continue;
        seen.add(j);
        const e = L.gap[f.c + '>' + j];
        res.push({ c: j, d: f.d + 1, from: e.mid, via: e });
      }
    }
    return res;
  }

  function setHover(i, force) {
    if (i === S.hover && !force) return;
    S.hover = i;
    R.preview.innerHTML = '';
    L.edges.forEach(e => e.marker && e.marker.classList.remove('pv-flow'));
    if (i < 0 || !S.selected || S.busy || S.status !== 'play' || S.fill[i] != null) return;
    const fl = store.settings.preview ? floodInfo(i) : [{ c: i }];
    fl.forEach(f => {
      el('polygon', { points: P(L.cells[f.c].poly), class: 'pv' + (S.cooling ? ' single' : ''), fill: COLORS[S.selected].hex }, R.preview);
      if (f.via) f.via.marker.classList.add('pv-flow');
    });
  }
  const refreshHover = () => setHover(S.hover, true);

  // ---------- input ----------
  let downOnBoard = false;
  function cellAt(ev) {
    const t = document.elementFromPoint(ev.clientX, ev.clientY);
    const h = t && t.closest && t.closest('[data-hit]');
    return h ? +h.getAttribute('data-hit') : -1;
  }
  function svgPoint(ev) {
    const p = E.board.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    const q = p.matrixTransform(E.board.getScreenCTM().inverse());
    return [q.x, q.y];
  }
  E.board.addEventListener('pointerdown', ev => {
    Snd.init();
    if (ev.target.hasPointerCapture && ev.target.hasPointerCapture(ev.pointerId)) ev.target.releasePointerCapture(ev.pointerId);
    downOnBoard = true; setHover(cellAt(ev));
  });
  E.board.addEventListener('pointermove', ev => setHover(cellAt(ev)));
  E.board.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') setHover(-1); });
  E.board.addEventListener('pointercancel', () => { downOnBoard = false; setHover(-1); });
  window.addEventListener('pointerup', ev => {
    if (!downOnBoard) return;
    downOnBoard = false;
    const i = cellAt(ev);
    if (ev.pointerType !== 'mouse') setHover(-1);
    if (i >= 0) tapCell(i, svgPoint(ev));
  });

  function tapCell(i, pt) {
    if (S.busy || S.status !== 'play') return;
    if (S.fill[i] != null) { toast('Bu bölme zaten dolu'); return; }
    if (!S.selected) {
      toast('Önce aşağıdan bir pota seç');
      E.pots.classList.remove('nudge'); void E.pots.offsetWidth; E.pots.classList.add('nudge');
      return;
    }
    if (S.pours <= 0) { showSheet('out'); return; }
    pour(i, pt);
  }

  // ---------- pouring ----------
  function snapshot() { return { fill: S.fill.slice(), pours: S.pours, used: S.used, cooling: S.cooling }; }

  function pour(i, pt) {
    S.history.push(snapshot());
    const fl = floodInfo(i, pt);
    const col = S.selected;
    if (S.cooling) { S.cooling = false; E.board.classList.remove('cooling'); }
    S.pours--; S.used++;
    fl.forEach(f => { S.fill[f.c] = col; });
    clearHintRing();
    S.busy = true; setHover(-1, true);
    updateHUD(); updateBoosters();
    E.pours.classList.add('bump'); setTimeout(() => E.pours.classList.remove('bump'), 180);
    Snd.pour(); vibrate(12);
    let end = 0;
    fl.forEach(f => {
      const delay = f.d * 380, dur = 560;
      animateFill(f, col, delay, dur);
      end = Math.max(end, delay + dur);
    });
    setTimeout(() => { S.busy = false; updateGaps(); evaluate(fl); }, end + 140);
  }

  function animateFill(f, color, delay, dur) {
    const rc = R.cells[f.c], poly = L.cells[f.c].poly;
    const Rm = Math.max(...poly.map(v => Math.hypot(v[0] - f.from[0], v[1] - f.from[1]))) + 3;
    rc.molten.setAttribute('cx', f.from[0].toFixed(1)); rc.molten.setAttribute('cy', f.from[1].toFixed(1));
    rc.molten.setAttribute('r', 0); rc.molten.setAttribute('fill', mix(COLORS[color].hex, HOT, 1));
    anims.push({ f, rc, hex: COLORS[color].hex, start: performance.now() + delay, dur, Rm, started: false, chimed: false });
    if (!rafOn) { rafOn = true; requestAnimationFrame(tick); }
  }
  function tick(now) {
    for (let k = anims.length - 1; k >= 0; k--) {
      const a = anims[k], t = (now - a.start) / a.dur;
      if (t < 0) continue;
      if (!a.started) {
        a.started = true; a.rc.g.classList.add('filled');
        if (a.f.via) { const m = a.f.via.marker; m.classList.remove('flow'); void m.getBoundingClientRect(); m.classList.add('flow'); }
      }
      a.rc.molten.setAttribute('r', (a.Rm * easeOut(Math.min(1, t))).toFixed(1));
      const cool = Math.min(1, (now - a.start) / (a.dur + 1000));
      a.rc.molten.setAttribute('fill', mix(a.hex, HOT, Math.pow(1 - cool, 1.6)));
      if (t >= 1 && !a.chimed) { a.chimed = true; Snd.chime(a.f.d); }
      if (cool >= 1) anims.splice(k, 1);
    }
    if (anims.length) requestAnimationFrame(tick); else rafOn = false;
  }

  function renderStatic() {
    anims.length = 0;
    L.cells.forEach((c, i) => {
      const rc = R.cells[i], v = S.fill[i];
      rc.crack.innerHTML = ''; rc.g.classList.remove('wrong');
      if (v) {
        rc.molten.setAttribute('cx', c.c[0]); rc.molten.setAttribute('cy', c.c[1]);
        rc.molten.setAttribute('r', 400); rc.molten.setAttribute('fill', COLORS[v].hex);
        rc.g.classList.add('filled');
        if (v !== L.target[i]) markWrong([i]);
      } else {
        rc.molten.setAttribute('r', 0); rc.g.classList.remove('filled');
      }
    });
    updateGaps();
  }

  function markWrong(list) {
    list.forEach(i => {
      const rc = R.cells[i], c = L.cells[i];
      rc.g.classList.add('wrong');
      el('polygon', { points: P(c.poly), class: 'crack-fill' }, rc.crack);
      let d = '';
      const r = Math.sqrt(c.area) * 0.7;
      for (let k = 0; k < 5; k++) {
        const a = k * 1.3 + i; let x = c.c[0], y = c.c[1];
        d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
        for (let s = 1; s <= 3; s++) {
          const ang = a + (Math.sin(i * 7 + k * 3 + s) * 0.5);
          x += Math.cos(ang) * r / 3; y += Math.sin(ang) * r / 3; d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      }
      el('path', { d }, el('g', { 'clip-path': `url(#cc${i})` }, rc.crack));
    });
  }

  function evaluate(fl) {
    const wrong = fl.filter(f => S.fill[f.c] !== L.target[f.c]).map(f => f.c);
    if (wrong.length) {
      markWrong(wrong);
      S.status = 'wrong'; Snd.wrong(); vibrate([30, 40, 30]);
      E.board.classList.remove('shake'); void E.board.getBoundingClientRect(); E.board.classList.add('shake');
      showSheet('wrong');
      return;
    }
    if (S.fill.every(v => v != null)) { win(); return; }
    if (S.pours <= 0) { S.status = 'out'; showSheet('out'); return; }
    refreshHover();
  }

  // ---------- pots ----------
  function buildPots() {
    E.pots.innerHTML = '';
    L.palette.forEach(k => {
      const c = COLORS[k];
      const b = document.createElement('button');
      b.className = 'pot'; b.dataset.c = k; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', c.name + ' cam potası');
      b.innerHTML = `<svg viewBox="0 0 64 60" aria-hidden="true">
        <ellipse class="pot-glow" cx="32" cy="18" rx="28" ry="11" fill="${c.hex}"/>
        <path d="M8 18 H56 L50 46 Q32 58 14 46 Z" fill="#34303f" stroke="#7a768c" stroke-width="2"/>
        <path d="M12 26 H52" stroke="#4a4658" stroke-width="2"/>
        <ellipse cx="32" cy="19" rx="21" ry="6.5" fill="${c.hex}"/>
        <ellipse class="shine" cx="26" cy="17.6" rx="8" ry="2" fill="#fff" opacity=".55"/>
        <text x="32" y="37" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="700" fill="${c.hex}">${c.sym}</text>
      </svg><span>${c.name}</span>`;
      b.addEventListener('click', () => { Snd.init(); selectPot(k); });
      E.pots.appendChild(b);
    });
  }
  function selectPot(k, silent) {
    S.selected = k;
    E.pots.querySelectorAll('.pot').forEach(b => {
      const on = b.dataset.c === k; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on);
    });
    if (!silent) Snd.click();
    refreshHover();
  }

  // ---------- HUD & boosters ----------
  function updateHUD() {
    E.lvlEyebrow.textContent = `Seviye ${S.idx} · ${SHAPE_NAMES[L.shapeType]} · ${L.cells.length} bölme`;
    E.lvlName.textContent = levelName(S.idx);
    E.poursN.textContent = S.pours;
    E.goalN.textContent = L.min;
    E.pours.classList.toggle('low', S.pours <= 2);
    E.btnPrev.disabled = S.idx <= 1;
  }
  function updateBoosters() {
    const b = S.boosters;
    E.cCool.textContent = b.cool; E.cPlus.textContent = b.plus; E.cUndo.textContent = b.undo;
    E.bCool.disabled = (b.cool <= 0 && !S.cooling) || S.status !== 'play';
    E.bCool.classList.toggle('active', S.cooling);
    E.bPlus.disabled = b.plus <= 0 || S.status === 'win' || S.status === 'wrong';
    E.bUndo.disabled = b.undo <= 0 || !S.history.length || S.status === 'win';
    E.bHint.disabled = S.status === 'win';
  }

  E.btnPrev.addEventListener('click', () => { if (!S.busy && S.idx > 1) { Snd.init(); Snd.click(); startLevel(S.idx - 1); } });
  E.btnNext.addEventListener('click', () => {
    if (!S.busy) {
      Snd.init(); Snd.click();
      store.unlocked = Math.max(store.unlocked, S.idx + 1); save();
      startLevel(S.idx + 1);
    }
  });
  E.bCool.addEventListener('click', () => {
    if (S.busy || S.status !== 'play') return;
    if (S.cooling) { S.cooling = false; S.boosters.cool++; }
    else if (S.boosters.cool > 0) { S.cooling = true; S.boosters.cool--; toast('❄ Sıradaki döküm taşmayacak'); }
    E.board.classList.toggle('cooling', S.cooling);
    updateBoosters(); refreshHover(); Snd.click();
  });
  E.bPlus.addEventListener('click', () => {
    if (S.busy || S.boosters.plus <= 0) return;
    S.boosters.plus--; S.pours += 2;
    if (S.status === 'out') { S.status = 'play'; hideSheet(); }
    updateHUD(); updateBoosters(); toast('+2 döküm eklendi'); Snd.click();
  });
  E.bUndo.addEventListener('click', undo);
  E.bHint.addEventListener('click', hint);
  E.bRestart.addEventListener('click', () => { if (!S.busy) startLevel(S.idx); });
  E.tip.addEventListener('click', () => { E.tip.hidden = true; });

  function undo() {
    if (S.busy || S.boosters.undo <= 0 || !S.history.length || S.status === 'win') return;
    const s = S.history.pop();
    S.fill = s.fill; S.pours = s.pours; S.used = s.used; S.cooling = s.cooling;
    E.board.classList.toggle('cooling', S.cooling);
    S.boosters.undo--; S.status = 'play';
    hideSheet(); renderStatic(); updateHUD(); updateBoosters(); refreshHover(); Snd.click();
  }

  function clearHintRing() { if (S.hintRing) { S.hintRing.remove(); S.hintRing = null; } }
  function hint() {
    if (S.busy || S.status === 'win') return;
    if (S.status === 'wrong') { toast('Önce geri al ya da baştan başla'); return; }
    let mask = 0; S.fill.forEach((v, i) => { if (v != null) mask |= 1 << i; });
    const r = G.solveFrom(L.cells.length, L.down, L.target, mask);
    if (!r) { toast('Bu durumdan çözüm yok, geri al'); return; }
    if (r.min > S.pours) toast(`Kalan hakla yetişmez: ${r.min} döküm gerekli`);
    const c = r.first;
    selectPot(L.target[c]);
    clearHintRing();
    const cc = L.cells[c].c;
    S.hintRing = el('circle', { cx: cc[0], cy: cc[1], r: 22, class: 'hint-target' }, R.fx);
  }

  // ---------- sheets / modals ----------
  function showSheet(kind) {
    let h = '';
    if (kind === 'wrong') {
      h = `<h2>Cam yanlış bölmeye taştı</h2><p>Farklı renkli bölmeye akan cam çatladı. Son dökümü geri alabilir ya da baştan başlayabilirsin.</p>
        <div class="row"><button class="btn primary" data-a="undo" ${S.boosters.undo > 0 ? '' : 'disabled'}>↶ Geri al (${S.boosters.undo})</button><button class="btn" data-a="restart">⟳ Baştan</button></div>`;
    } else if (kind === 'out') {
      h = `<h2>Döküm hakkın bitti</h2><p>${S.fill.filter(v => v == null).length} bölme boş kaldı. İpucu: üstteki bölmelerden dökersen cam aşağı akar.</p>
        <div class="row"><button class="btn primary" data-a="plus" ${S.boosters.plus > 0 ? '' : 'disabled'}>+2 Döküm (${S.boosters.plus})</button><button class="btn" data-a="undo" ${S.boosters.undo > 0 ? '' : 'disabled'}>↶ Geri al</button><button class="btn" data-a="restart">⟳ Baştan</button></div>`;
    }
    E.sheet.innerHTML = h; E.sheet.hidden = false; updateBoosters();
    E.sheet.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.a;
      if (a === 'undo') undo(); else if (a === 'restart') startLevel(S.idx); else if (a === 'plus') E.bPlus.click();
    }));
  }
  function hideSheet() { E.sheet.hidden = true; E.sheet.innerHTML = ''; }
  function closeModal() { E.modal.hidden = true; E.modal.innerHTML = ''; }

  function thumbSVG(lvl) {
    return `<svg viewBox="-24 -10 448 560" aria-hidden="true"><polygon points="${P(lvl.shape)}" fill="#120f1c" stroke="#463f62" stroke-width="28" stroke-linejoin="round"/>` +
      lvl.cells.map((c, i) => `<polygon points="${P(c.poly)}" fill="${COLORS[lvl.target[i]].hex}" stroke="#0b0910" stroke-width="7" stroke-linejoin="round"/>`).join('') +
      `<polygon points="${P(lvl.shape)}" fill="none" stroke="#0b0910" stroke-width="10" stroke-linejoin="round"/></svg>`;
  }

  // ---------- win ----------
  function win() {
    S.status = 'win'; updateBoosters();
    const stars = S.used <= L.min ? 3 : S.used <= L.min + 1 ? 2 : 1;
    store.stars[S.idx] = Math.max(store.stars[S.idx] || 0, stars);
    store.best[S.idx] = Math.min(store.best[S.idx] || 99, S.used);
    store.unlocked = Math.max(store.unlocked, S.idx + 1);
    store.thumbs[S.idx] = thumbSVG(L);
    save();
    E.board.classList.add('lit');
    el('rect', { x: -320, y: 0, width: 260, height: 540, fill: 'url(#sweepG)', class: 'sweep', transform: 'skewX(-18)' }, R.fx);
    for (let k = 0; k < 16; k++) {
      const c = L.cells[k % L.cells.length].c;
      const s = el('path', { d: 'M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z', class: 'spark', transform: `translate(${(c[0] + (Math.random() - .5) * 50).toFixed(1)} ${(c[1] + (Math.random() - .5) * 50).toFixed(1)})` }, R.fx);
      s.style.animationDelay = (0.4 + Math.random() * 1.6).toFixed(2) + 's';
    }
    castRays();
    Snd.win(); vibrate([20, 60, 20, 60, 40]);
    setTimeout(() => showWin(stars), 1900);
  }

  function castRays() {
    E.rays.innerHTML = '';
    const app = E.app.getBoundingClientRect(), ctm = E.board.getScreenCTM();
    if (!ctm) return;
    const toClient = (x, y) => { const p = E.board.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(ctm); return [q.x - app.left, q.y - app.top]; };
    const xs = L.shape.map(p => p[0]), minX = Math.min(...xs), maxX = Math.max(...xs);
    const by = Math.max(...L.shape.map(p => p[1]));
    const N = 7, scale = ctm.a;
    for (let k = 0; k < N; k++) {
      const x = minX + (k + 0.5) * (maxX - minX) / N, y = by - 30;
      let ci = L.cells.findIndex(c => G.inside([x, y], c.poly));
      if (ci < 0) { let bd = 1e9; L.cells.forEach((c, i) => { const d = Math.hypot(c.c[0] - x, c.c[1] - y); if (d < bd) { bd = d; ci = i; } }); }
      const hex = COLORS[L.target[ci]].hex;
      const [cx, cy] = toClient(x, by - 20);
      const w = (maxX - minX) / N * scale * 2.4;
      const div = document.createElement('div');
      div.className = 'ray';
      Object.assign(div.style, {
        left: (cx - w / 2) + 'px', top: cy + 'px', width: w + 'px', height: Math.max(80, app.height - cy) + 'px',
        background: `linear-gradient(to bottom, ${hex} 0%, ${hex}55 45%, transparent 92%)`,
        clipPath: 'polygon(36% 0, 64% 0, 100% 100%, 0 100%)', animationDelay: (0.25 + k * 0.07) + 's',
      });
      E.rays.appendChild(div);
    }
  }

  function showWin(stars) {
    if (S.status !== 'win') return;
    const next = S.idx + 1;
    E.modal.innerHTML = `<div class="card win">
      <div class="eyebrow">Seviye ${S.idx} · ${SHAPE_NAMES[L.shapeType]}</div>
      <h2>${levelName(S.idx)}</h2>
      <div class="thumb">${thumbSVG(L)}</div>
      <div class="stars">${[1, 2, 3].map(k => k <= stars ? `<span class="on" style="animation-delay:${0.15 * k}s">★</span>` : '★').join('')}</div>
      <div class="stat">${S.used} döküm · en iyi çözüm ${L.min}</div>
      <div class="saved">✓ Albüme eklendi</div>
      <div class="row"><button class="btn" data-a="album">Albüm</button><button class="btn" data-a="replay" title="Tekrar oyna">⟳</button><button class="btn primary" data-a="next">Sonraki ▶</button></div>
    </div>`;
    E.modal.hidden = false;
    E.modal.querySelector('[data-a=next]').onclick = () => startLevel(next);
    E.modal.querySelector('[data-a=replay]').onclick = () => startLevel(S.idx);
    E.modal.querySelector('[data-a=album]').onclick = () => openMenu();
  }

  // ---------- menu: album + settings ----------
  function openMenu() {
    const total = Math.max(SEASON, store.unlocked);
    let slots = '';
    for (let i = 1; i <= total; i++) {
      const cur = S && S.idx === i ? ' cur' : '';
      if (store.thumbs[i]) {
        const st = store.stars[i] || 0;
        slots += `<button class="slot${cur}" data-l="${i}" aria-label="Seviye ${i}">${store.thumbs[i]}<span class="s">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span><span class="n">${i}</span></button>`;
      } else if (i <= store.unlocked) {
        slots += `<button class="slot next${cur}" data-l="${i}" aria-label="Seviye ${i}"><b>${i}</b><span class="n">OYNA</span></button>`;
      } else {
        slots += `<button class="slot locked${cur}" data-l="${i}" aria-label="Seviye ${i} (dokun ve aç)">🔒<span class="n">${i}</span></button>`;
      }
    }
    const tg = (k, label, sub) => `<div class="toggle ${store.settings[k] ? 'on' : ''}" data-t="${k}" role="switch" aria-checked="${store.settings[k]}" tabindex="0"><div>${label}<small>${sub}</small></div><span class="sw"></span></div>`;
    const done = Object.keys(store.thumbs).length;
    E.modal.innerHTML = `<div class="card">
      <div class="row" style="align-items:center"><div style="flex:1"><div class="eyebrow">Koleksiyon Albümü</div><h2>Katedraller</h2><p class="sub">${done}/${SEASON} vitray tamamlandı · istediğin seviyeye dokunup geçebilirsin</p></div>
      <button class="icon-btn" data-a="close" aria-label="Kapat">✕</button></div>
      <div class="seasons">
        <div class="season-pill active">Sezon 1 · Katedraller<small>${done}/${SEASON} aktif</small></div>
        <div class="season-pill">Sezon 2 · İznik Çinisi<small>Yakında</small></div>
        <div class="season-pill">Sezon 3 · Art Nouveau<small>Yakında</small></div>
      </div>
      <h3>Seviyeler</h3><div class="album">${slots}</div>
      <h3>Nasıl oynanır</h3>
      <ul class="rules">
        <li>Potadan renk seç, boş bölmeye dokun: erimiş cam bölmeyi doldurur.</li>
        <li>Altın oklu açıklıklardan cam <b>aşağıdaki</b> boş bölmeye akar; zincirleme devam eder.</li>
        <li>Dolu bölmeler akışı keser. Yanlış renge taşan cam çatlar.</li>
        <li>Tüm bölmeleri doğru renkle, döküm hakkın bitmeden doldur. ★★★ = en az döküm.</li>
      </ul>
      <h3>Ayarlar</h3>
      ${tg('preview', 'Akış önizleme', 'Dokunmadan önce camın nereye akacağını gösterir')}
      ${tg('cb', 'Renk körü modu', 'Dolu bölmelerde de sembolleri gösterir')}
      ${tg('sound', 'Ses', 'Döküm ve çan sesleri')}
      <button class="linkbtn" data-a="reset">İlerlemeyi sıfırla</button>
    </div>`;
    E.modal.hidden = false;
    E.modal.querySelector('[data-a=close]').onclick = () => { if (S && S.status === 'win') showWin(store.stars[S.idx] || 1); else closeModal(); };
    E.modal.querySelector('[data-a=reset]').onclick = () => {
      if (!confirm('Tüm ilerleme silinsin mi?')) return;
      store.unlocked = 1; store.stars = {}; store.thumbs = {}; store.best = {}; save(); startLevel(1);
    };
    E.modal.querySelectorAll('[data-l]').forEach(b => b.onclick = () => {
      const lv = +b.dataset.l;
      store.unlocked = Math.max(store.unlocked, lv); save();
      startLevel(lv);
    });
    E.modal.querySelectorAll('[data-t]').forEach(t => t.onclick = () => {
      const k = t.dataset.t; store.settings[k] = !store.settings[k]; save();
      t.classList.toggle('on', store.settings[k]); t.setAttribute('aria-checked', store.settings[k]);
      if (k === 'cb') E.board.classList.toggle('cb', store.settings.cb);
      if (k === 'sound' && store.settings.sound) { Snd.init(); Snd.click(); }
    });
  }
  $('#btnMenu').addEventListener('click', () => { Snd.init(); openMenu(); });
  E.modal.addEventListener('click', ev => { if (ev.target === E.modal && !(S && S.status === 'win')) closeModal(); });

  // keyboard shortcuts for desktop testing
  window.addEventListener('keydown', ev => {
    if (!S || !E.modal.hidden) return;
    const n = parseInt(ev.key, 10);
    if (n >= 1 && n <= L.palette.length) selectPot(L.palette[n - 1]);
    else if (ev.key === 'z' || ev.key === 'Z') undo();
    else if (ev.key === 'r' || ev.key === 'R') startLevel(S.idx);
    else if (ev.key === 'h' || ev.key === 'H') hint();
    else if (ev.key === 'ArrowLeft' && S.idx > 1) startLevel(S.idx - 1);
    else if (ev.key === 'ArrowRight') startLevel(S.idx + 1);
  });
  window.addEventListener('resize', () => { if (S && S.status === 'win') castRays(); });

  // ---------- boot ----------
  const qs = new URLSearchParams(location.search);
  if (qs.get('all') === '1') { store.unlocked = Math.max(store.unlocked, SEASON); save(); }
  let startIdx = parseInt(qs.get('level'), 10);
  if (!(startIdx >= 1)) startIdx = Math.min(store.unlocked, Math.max(1, store.unlocked));
  if (startIdx > store.unlocked) { store.unlocked = startIdx; save(); }
  startLevel(startIdx);

  // ?demo=1 -> auto-plays the optimal solution (useful for ad captures / QA)
  if (qs.get('demo') === '1') {
    const step = () => {
      if (S.status === 'win') {
        setTimeout(() => { if (qs.get('chain') === '1') { startLevel(S.idx + 1); setTimeout(step, 900); } }, 3500);
        return;
      }
      if (!S.busy && S.status === 'play') {
        let mask = 0; S.fill.forEach((v, i) => { if (v != null) mask |= 1 << i; });
        const r = G.solveFrom(L.cells.length, L.down, L.target, mask);
        if (r) { selectPot(L.target[r.first], true); pour(r.first, L.cells[r.first].c); }
      }
      setTimeout(step, 1100);
    };
    setTimeout(step, 800);
  }
})();
