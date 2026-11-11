/* Stained Glass - Complete UI (Home Screen, Collection Gallery, Daily Rewards & Puzzle, Economy & Multi-Tap Gameplay) */
(() => {
  'use strict';
  const G = window.SG;
  const EMod = window.SGEcon;
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
  const SHAPE_NAMES = {
    round: 'Yuvarlak kemer',
    gothic: 'Sivri kemer',
    rose: 'Gül pencere',
    pointed_arch: 'Osmanlı kemeri',
    hex_medallion: 'Selçuklu madalyonu',
    domed_mihrab: 'Mihrap kemeri',
    oval_medallion: 'Oval madalyon',
    tiffany_dome: 'Tiffany kubbe',
    triptych_arch: 'Secession kemeri',
    crystal_diamond: 'Kristal prizma',
    tall_lancet: 'Kuzey kemeri',
    octagon_star: 'Kutup yıldızı',
  };
  const TIPS = {
    1: 'Potadan renk seçili! Aynı renk ipucunu taşıyan bölmelere peş peşe (veya aynı anda iki parmakla) dokun.',
    2: 'Altın oklu açıklıklardan cam <b>aşağıdaki</b> bölmeye akar. Üstten dökerek birkaç bölmeyi tek dökümde doldur.',
    3: 'Cam farklı renkli bölmeye de akar! Önce alttakini doldur (<b>dolu bölme akışı keser</b>) ya da <b>🔗 Lehim</b> ile açıklığı kapat.',
    4: 'Üst üste 3 vitray kazandığında <b>🔥 Ateş Serisi</b> açılır ve her seviyeye <b>+1 ekstra döküm</b> hakkıyla başlarsın!',
  };

  // ---------- persistence ----------
  const KEY = 'sg_proto_v3';
  const store = (() => {
    let s = {};
    try {
      s = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('sg_proto_v2') || localStorage.getItem('sg_proto_v1') || '{}');
    } catch (e) { /* ignore */ }
    return {
      unlocked: s.unlocked || 1,
      stars: s.stars || {},
      thumbs: s.thumbs || {},
      best: s.best || {},
      econ: s.econ || null,
      settings: Object.assign({ cb: false, sound: true, preview: true }, s.settings || {}),
    };
  })();
  const save = () => {
    try {
      store.econ = econ.toJSON();
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) { /* ignore */ }
  };
  const econ = new EMod.Economy(store.econ, () => {
    try {
      store.econ = econ.toJSON();
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) { /* ignore */ }
  });

  // ---------- DOM helpers ----------
  const $ = s => document.querySelector(s);
  const E = {
    app: $('#app'),
    homeScreen: $('#homeScreen'),
    colScreen: $('#colScreen'),
    gameScreen: $('#gameScreen'),
    btnHome: $('#btnHome'),
    btnStars: $('#btnStars'),
    starsTotalN: $('#starsTotalN'),
    starBadge: $('#starBadge'),
    btnMenu: $('#btnMenu'),
    hudSpacer: $('#hudSpacer'),
    colDot: $('#colDot'),
    colEyebrow: $('#colEyebrow'),
    colTitle: $('#colTitle'),
    btnStreak: $('#btnStreak'),
    streakN: $('#streakN'),
    btnShop: $('#btnShop'),
    coinsN: $('#coinsN'),
    btnSettings: $('#btnSettings'),
    // Home elements
    homeColCard: $('#homeColCard'),
    homeColThumb: $('#homeColThumb'),
    homeColTag: $('#homeColTag'),
    homeColStat: $('#homeColStat'),
    homeColName: $('#homeColName'),
    homeColNext: $('#homeColNext'),
    homeColFill: $('#homeColFill'),
    homeStreakStrip: $('#homeStreakStrip'),
    homeStreakTxt: $('#homeStreakTxt'),
    btnHomePlay: $('#btnHomePlay'),
    homePlayMain: $('#homePlayMain'),
    homePlaySub: $('#homePlaySub'),
    btnDailyReward: $('#btnDailyReward'),
    badgeDailyReward: $('#badgeDailyReward'),
    btnDailyPuzzle: $('#btnDailyPuzzle'),
    badgeDailyPuzzle: $('#badgeDailyPuzzle'),
    lblDailyPuzzle: $('#lblDailyPuzzle'),
    btnHomeGallery: $('#btnHomeGallery'),
    badgeGallery: $('#badgeGallery'),
    btnHomePiggy: $('#btnHomePiggy'),
    badgePiggy: $('#badgePiggy'),
    lblHomePiggy: $('#lblHomePiggy'),
    // Collection Gallery elements
    starRoadCard: $('#starRoadCard'),
    colScreenGrid: $('#colScreenGrid'),
    colActiveHeader: $('#colActiveHeader'),
    colScreenAlbum: $('#colScreenAlbum'),
    btnColPlay: $('#btnColPlay'),
    colPlayMain: $('#colPlayMain'),
    // Gameplay elements
    board: $('#board'),
    pots: $('#pots'),
    pours: $('#pours'),
    poursN: $('#poursN'),
    goalN: $('#goalN'),
    lvlName: $('#lvlName'),
    lvlMeta: $('#lvlMeta'),
    btnPrev: $('#btnPrev'),
    btnNext: $('#btnNext'),
    tip: $('#tip'),
    sheet: $('#sheet'),
    modal: $('#modal'),
    adModal: $('#adModal'),
    toast: $('#toast'),
    rays: $('#rays'),
    bCool: $('#bCool'),
    bSolder: $('#bSolder'),
    bPlus: $('#bPlus'),
    bUndo: $('#bUndo'),
    bHint: $('#bHint'),
    bRestart: $('#bRestart'),
    cCool: $('#cCool'),
    cSolder: $('#cSolder'),
    cPlus: $('#cPlus'),
    cUndo: $('#cUndo'),
    cHint: $('#cHint'),
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
  let toastT = 0;
  function toast(msg) {
    E.toast.textContent = msg; E.toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => E.toast.classList.remove('show'), 2100);
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
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.04);
    },
    noise(dur, freq, vol) {
      const c = this.ctx, b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      const s = c.createBufferSource(); s.buffer = b;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.7;
      const g = c.createGain(); g.gain.value = vol;
      s.connect(f).connect(g).connect(c.destination); s.start();
    },
    click() { if (this.ok()) this.tone(720, this.ctx.currentTime, 0.055, 'triangle', 0.05); },
    pour() { if (this.ok()) this.noise(0.28, 1250, 0.25); },
    solder() {
      if (!this.ok()) return; const t = this.ctx.currentTime;
      this.noise(0.18, 2400, 0.22);
      this.tone(980, t, 0.16, 'triangle', 0.08);
      this.tone(1420, t + 0.04, 0.22, 'sine', 0.07);
    },
    coin() {
      if (!this.ok()) return; const t = this.ctx.currentTime;
      [1046.5, 1318.5, 1567.98].forEach((f, i) => this.tone(f, t + i * 0.055, 0.35, 'sine', 0.08));
    },
    chime(d) {
      if (!this.ok()) return;
      const sc = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5], f = sc[Math.min(d, 7)], t = this.ctx.currentTime;
      this.tone(f, t, 0.85, 'sine', 0.09); this.tone(f * 2.01, t, 0.4, 'sine', 0.03);
    },
    wrong() {
      if (!this.ok()) return; const t = this.ctx.currentTime;
      this.tone(150, t, 0.28, 'sawtooth', 0.06); this.tone(106, t + 0.07, 0.35, 'sawtooth', 0.06); this.noise(0.2, 3000, 0.15);
    },
    win() {
      if (!this.ok()) return; const t = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, k) => {
        this.tone(f, t + k * 0.08, 1.3, 'sine', 0.08);
        this.tone(f * 2, t + k * 0.08, 0.45, 'sine', 0.02);
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
  const MAX_LEVEL = G.COLLECTIONS.length * 12;
  const MAX_STARS = MAX_LEVEL * 3;
  const levelCache = new Map();
  let currentScreen = 'home';
  let activeGalleryCol = 0;

  function getLevel(idx) {
    if (!levelCache.has(idx)) {
      const lvl = G.buildLevel(idx);
      lvl.gap = {};
      lvl.edges.forEach(e => { if (e.open) lvl.gap[e.u + '>' + e.d] = e; });
      levelCache.set(idx, lvl);
    }
    return levelCache.get(idx);
  }

  let L = null, S = null;
  const R = { cells: [], preview: null, fx: null, solderG: null };
  const anims = []; let rafOn = false;
  let evalTimers = [];

  function clearEvalTimers() {
    evalTimers.forEach(t => clearTimeout(t));
    evalTimers = [];
  }

  function activeDown() {
    return L.down.map((arr, u) => arr.filter(d => !S.soldered.has(u + '>' + d)));
  }

  function totalStars() {
    let t = 0;
    for (const k in store.stars) t += (store.stars[k] || 0);
    return t;
  }

  function colStats(colIdx) {
    const start = colIdx * 12 + 1;
    let done = 0, stars = 0;
    for (let i = start; i < start + 12; i++) {
      if (store.thumbs[i]) done++;
      stars += (store.stars[i] || 0);
    }
    return { done, stars, total: 12 };
  }

  function thumbSVG(lvl) {
    return `<svg viewBox="-24 -10 448 560" aria-hidden="true"><polygon points="${P(lvl.shape)}" fill="#120f1c" stroke="#463f62" stroke-width="28" stroke-linejoin="round"/>` +
      lvl.cells.map((c, i) => `<polygon points="${P(c.poly)}" fill="${COLORS[lvl.target[i]].hex}" stroke="#0b0910" stroke-width="7" stroke-linejoin="round"/>`).join('') +
      `<polygon points="${P(lvl.shape)}" fill="none" stroke="#0b0910" stroke-width="10" stroke-linejoin="round"/></svg>`;
  }

  function silhouetteSVG(lvl) {
    return `<svg viewBox="-24 -10 448 560" aria-hidden="true"><polygon points="${P(lvl.shape)}" fill="#1f1933" stroke="#3a3357" stroke-width="26" stroke-linejoin="round"/>` +
      lvl.cells.map(c => `<polygon points="${P(c.poly)}" fill="#261f3d" stroke="#120f1c" stroke-width="7" stroke-linejoin="round"/>`).join('') +
      `<polygon points="${P(lvl.shape)}" fill="none" stroke="#120f1c" stroke-width="10" stroke-linejoin="round"/></svg>`;
  }

  // ---------- Screen Navigation ----------
  function setScreen(scr) {
    currentScreen = scr;
    E.homeScreen.hidden = scr !== 'home';
    E.colScreen.hidden = scr !== 'collections';
    E.gameScreen.hidden = scr !== 'game';

    const inGame = scr === 'game';
    E.btnHome.hidden = scr === 'home';
    E.btnHome.classList.toggle('icon-only', inGame);
    E.btnStars.hidden = inGame;
    E.btnMenu.hidden = !inGame;
    E.hudSpacer.hidden = inGame;

    if (!inGame) {
      clearEvalTimers();
      E.rays.innerHTML = '';
      hideSheet();
    }
    updateTopBar();
  }

  function updateTopBar() {
    const tot = totalStars();
    const claimableChests = econ.claimableStarChests(tot);
    E.starsTotalN.textContent = `${tot}/${MAX_STARS}`;
    E.starBadge.hidden = claimableChests.length === 0;
    E.streakN.textContent = econ.d.streak || 0;
    E.btnStreak.classList.toggle('hot', (econ.d.streak || 0) >= 1);
    E.coinsN.textContent = econ.d.coins.toLocaleString('tr-TR');
  }

  function goHome() {
    closeModal();
    setScreen('home');
    refreshHome();
    try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }
  }

  function refreshHome() {
    updateTopBar();
    const curIdx = Math.min(MAX_LEVEL, Math.max(1, store.unlocked));
    const curLvl = getLevel(curIdx);
    const col = curLvl.collection;
    const st = colStats(curLvl.colIdx);
    const pct = Math.round((st.done / 12) * 100);

    document.documentElement.style.setProperty('--accent', col.accent);
    E.homeColThumb.innerHTML = store.thumbs[curIdx] || silhouetteSVG(curLvl);
    E.homeColTag.textContent = `KOLEKSİYON ${col.num} · ${st.done}/12 TAMAMLANDI`;
    E.homeColTag.style.color = col.accent;
    E.homeColStat.textContent = `★ ${st.stars}/36`;
    E.homeColName.textContent = col.title;
    E.homeColNext.textContent = `Sıradaki: ${curLvl.itemIdx + 1}. ${curLvl.pieceName} · ${SHAPE_NAMES[curLvl.shapeType] || 'Vitray'}`;
    E.homeColFill.style.width = pct + '%';
    E.homeColFill.style.background = col.accent;

    const streak = econ.d.streak || 0;
    E.homeStreakStrip.classList.toggle('hot', streak >= 3);
    E.homeStreakTxt.textContent = streak >= 3
      ? `${streak} Kazanma Serisi Aktif · Her bölüme +1 ekstra dökümle başlıyorsun!`
      : `Usta Ateşi Serisi: ${streak}/3 · 3 seride +1 ekstra döküm hakkı bedava!`;

    E.homePlayMain.textContent = `▶ OYNA · SEVİYE ${curIdx}`;
    E.homePlaySub.textContent = `${curLvl.pieceName} · ${col.title}`;

    // Dock badges
    const today = EMod.localToday();
    E.badgeDailyReward.hidden = !econ.canClaimDaily(today);
    const puzzleDone = econ.isDailyPuzzleDone(today);
    E.badgeDailyPuzzle.hidden = puzzleDone;
    E.lblDailyPuzzle.textContent = puzzleDone ? 'Günün Vitrayı ✓' : 'Günün Vitrayı';

    const tot = totalStars();
    E.badgeGallery.hidden = econ.claimableStarChests(tot).length === 0;

    const piggyReady = econ.d.piggy >= EMod.CONFIG.piggyMinBreak;
    E.badgePiggy.hidden = !piggyReady;
    E.lblHomePiggy.textContent = `Kumbara (${econ.d.piggy})`;
  }

  // ---------- Collection Gallery Screen ----------
  function goCollections(colIdx) {
    closeModal();
    if (typeof colIdx !== 'number') {
      const curIdx = Math.min(MAX_LEVEL, Math.max(1, store.unlocked));
      colIdx = Math.min(G.COLLECTIONS.length - 1, Math.floor((curIdx - 1) / 12));
    }
    activeGalleryCol = colIdx;
    setScreen('collections');
    renderCollectionScreen();
    try { history.replaceState(null, '', '?collections=1'); } catch (e) { /* ignore */ }
  }

  function renderCollectionScreen() {
    updateTopBar();
    const tot = totalStars();
    const activeCol = G.COLLECTIONS[activeGalleryCol];
    document.documentElement.style.setProperty('--accent', activeCol.accent);

    // 1. Star Road & Milestone Chests
    const chestNodes = EMod.STAR_CHESTS.map(c => {
      const claimed = !!econ.d.claimedStarChests[c.stars];
      const ready = !claimed && tot >= c.stars;
      const cls = claimed ? 'claimed' : (ready ? 'ready' : '');
      const ico = claimed ? '✓' : (ready ? '🎁' : '🔒');
      return `<button class="chest-node ${cls}" data-chest="${c.stars}" title="${c.label}: +${c.coins} Altın">
        <i>${ico}</i>
        <span>★${c.stars}</span>
      </button>`;
    }).join('');

    E.starRoadCard.innerHTML = `
      <div class="star-road-top">
        <strong>★ Yıldız Yolu (${tot} / ${MAX_STARS})</strong>
        <small>Yıldız topla, sandıkları aç!</small>
      </div>
      <div class="chest-row">${chestNodes}</div>`;

    E.starRoadCard.querySelectorAll('[data-chest]').forEach(btn => {
      btn.onclick = () => {
        const target = +btn.dataset.chest;
        const chest = econ.claimStarChest(target, tot);
        if (chest) {
          Snd.init(); Snd.coin();
          toast(`🎉 ${chest.label} Açıldı: +${chest.coins} 🪙 ve Güçlendiriciler!`);
          renderCollectionScreen();
        } else if (econ.d.claimedStarChests[target]) {
          toast('Bu yıldız sandığı zaten toplandı');
        } else {
          const info = EMod.STAR_CHESTS.find(x => x.stars === target);
          toast(`🔒 ${info.label} için ${target} yıldız gerekiyor (${tot}/${target}) — Ödül: +${info.coins} 🪙`);
        }
      };
    });

    // 2. Collection Cards
    E.colScreenGrid.innerHTML = G.COLLECTIONS.map((c, idx) => {
      const st = colStats(idx);
      const pct = Math.round((st.done / 12) * 100);
      return `<button class="col-card ${idx === activeGalleryCol ? 'active' : ''}" data-c="${idx}">
        <div class="col-card-top">
          <span class="col-card-tag" style="color:${c.accent}">Koleksiyon ${c.num}</span>
          <span class="col-card-cnt">${st.done}/12 · ★${st.stars}</span>
        </div>
        <strong>${c.title}</strong>
        <div class="col-card-bar"><span style="width:${pct}%;background:${c.accent}"></span></div>
      </button>`;
    }).join('');

    E.colScreenGrid.querySelectorAll('[data-c]').forEach(b => {
      b.onclick = () => {
        Snd.init(); Snd.click();
        activeGalleryCol = +b.dataset.c;
        renderCollectionScreen();
      };
    });

    // 3. Active Collection 12-Piece Showcase
    const activeSt = colStats(activeGalleryCol);
    E.colActiveHeader.innerHTML = `
      <h2 style="color:${activeCol.accent}">${activeCol.num}. ${activeCol.title} (${activeSt.done}/12 · ★${activeSt.stars}/36)</h2>
      <small>${activeCol.subtitle}</small>`;

    const startIdx = activeGalleryCol * 12 + 1;
    let nextInCol = startIdx;
    let slots = '';
    for (let k = 0; k < 12; k++) {
      const lvIdx = startIdx + k;
      if (!store.thumbs[lvIdx] && nextInCol === startIdx && k > 0 && store.thumbs[lvIdx - 1]) {
        nextInCol = lvIdx;
      }
      const isCur = lvIdx === Math.min(MAX_LEVEL, store.unlocked);
      const curCls = isCur ? ' cur' : '';
      const pieceName = activeCol.pieces[k];
      if (store.thumbs[lvIdx]) {
        const st = store.stars[lvIdx] || 0;
        slots += `<button class="slot${curCls}" data-l="${lvIdx}" aria-label="${pieceName}">
          ${store.thumbs[lvIdx]}
          <span class="s">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>
          <span class="n">${k + 1}. ${pieceName}</span>
        </button>`;
      } else {
        const lvlObj = getLevel(lvIdx);
        slots += `<button class="slot todo${curCls}" data-l="${lvIdx}" aria-label="${pieceName}">
          ${silhouetteSVG(lvlObj)}
          <span class="s">☆☆☆</span>
          <span class="n">${k + 1}. ${pieceName}</span>
        </button>`;
      }
    }
    E.colScreenAlbum.innerHTML = slots;
    E.colScreenAlbum.querySelectorAll('[data-l]').forEach(b => {
      b.onclick = () => {
        const lv = +b.dataset.l;
        store.unlocked = Math.max(store.unlocked, lv); save();
        Snd.init(); Snd.click();
        startLevel(lv);
      };
    });

    // Find first unsolved in this collection (or first level of collection if all solved)
    let targetLv = startIdx;
    for (let k = 0; k < 12; k++) {
      if (!store.thumbs[startIdx + k]) { targetLv = startIdx + k; break; }
    }
    const targetObj = getLevel(targetLv);
    E.colPlayMain.textContent = `▶ SEVİYE ${targetLv} · ${targetObj.pieceName.toUpperCase()}`;
    E.btnColPlay.onclick = () => {
      Snd.init(); Snd.click();
      startLevel(targetLv);
    };
  }

  // ---------- Start Campaign Level or Daily Puzzle ----------
  function startLevel(idx) {
    idx = Math.max(1, Math.min(MAX_LEVEL, idx));
    clearEvalTimers();
    L = getLevel(idx);
    initPlaySession(L, false);
    try { history.replaceState(null, '', '?level=' + idx); } catch (e) { /* ignore */ }
  }

  function startDailyPuzzle() {
    clearEvalTimers();
    const today = EMod.localToday();
    const dl = G.buildDailyLevel(today);
    dl.gap = {};
    dl.edges.forEach(e => { if (e.open) dl.gap[e.u + '>' + e.d] = e; });
    L = dl;
    initPlaySession(L, true);
    try { history.replaceState(null, '', '?puzzle=1'); } catch (e) { /* ignore */ }
  }

  function initPlaySession(lvl, isDaily) {
    const bonusPours = econ.extraStartPours();
    S = {
      idx: lvl.idx || 0,
      isDaily: !!isDaily,
      fill: Array(lvl.cells.length).fill(null),
      pours: lvl.limit + bonusPours,
      bonusPours,
      used: 0,
      selected: null,
      history: [],
      soldered: new Set(),
      cooling: false,
      soldering: false,
      continues: 0,
      status: 'play',
      hover: -1,
      hintRing: null,
      chimePitch: 0,
      lastLeakedGap: null,
    };
    anims.length = 0;
    document.documentElement.style.setProperty('--accent', lvl.collection.accent);
    setScreen('game');
    buildBoard();
    buildPots();
    selectPot(lvl.palette[0], true);
    updateHUD();
    updateBoosters();
    hideSheet();
    closeModal();
    E.rays.innerHTML = '';
    if (!isDaily && TIPS[S.idx]) { E.tip.innerHTML = TIPS[S.idx]; E.tip.hidden = false; } else E.tip.hidden = true;
  }

  // ---------- board ----------
  function buildBoard() {
    const svg = E.board;
    svg.innerHTML = '';
    svg.classList.remove('lit', 'cooling', 'soldering', 'shake');
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
    const noSill = ['rose', 'oval_medallion', 'hex_medallion', 'crystal_diamond', 'octagon_star'];
    if (!noSill.includes(L.shapeType)) {
      const xs = L.shape.map(p => p[0]), by = Math.max(...L.shape.map(p => p[1]));
      el('rect', { x: Math.min(...xs) - 26, y: by + 10, width: Math.max(...xs) - Math.min(...xs) + 52, height: 14, rx: 3, class: 'sill' }, svg);
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
    R.solderG = el('g', { id: 'solders' }, lg);
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
    R.solderG.innerHTML = '';
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const seg = (a, b) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    let sd = '';
    L.edges.forEach(e => {
      if (!e.open || !e.marker) return;
      const key = e.u + '>' + e.d;
      const isSoldered = S.soldered.has(key);
      e.marker.classList.toggle('soldered', isSoldered);
      e.marker.classList.toggle('sealed', !isSoldered && (S.fill[e.d] != null || S.fill[e.u] != null));
      if (isSoldered) sd += seg(lerp(e.a, e.b, 0.26), lerp(e.a, e.b, 0.74));
    });
    if (sd) {
      el('path', { d: sd, class: 'solder-bar-o' }, R.solderG);
      el('path', { d: sd, class: 'solder-bar-i' }, R.solderG);
    }
  }

  function floodInfo(i, pt) {
    const res = [{ c: i, d: 0, from: pt || L.cells[i].c, via: null }];
    if (S.cooling) return res;
    const seen = new Set([i]);
    const down = activeDown();
    for (let q = 0; q < res.length; q++) {
      const f = res[q];
      for (const j of down[f.c]) {
        if (seen.has(j) || S.fill[j] != null) continue;
        seen.add(j);
        const e = L.gap[f.c + '>' + j];
        res.push({ c: j, d: f.d + 1, from: e.mid, via: e });
      }
    }
    return res;
  }

  function setHover(i, force) {
    if (!S || (i === S.hover && !force)) return;
    S.hover = i;
    R.preview.innerHTML = '';
    L.edges.forEach(e => e.marker && e.marker.classList.remove('pv-flow'));
    if (i < 0 || !S.selected || S.soldering || S.status !== 'play' || S.fill[i] != null) return;
    const fl = store.settings.preview ? floodInfo(i) : [{ c: i }];
    fl.forEach(f => {
      el('polygon', { points: P(L.cells[f.c].poly), class: 'pv' + (S.cooling ? ' single' : ''), fill: COLORS[S.selected].hex }, R.preview);
      if (f.via) f.via.marker.classList.add('pv-flow');
    });
  }
  const refreshHover = () => { if (S) setHover(S.hover, true); };

  // ---------- Fast, non-blocking, multi-touch input ----------
  function cellAt(ev) {
    const t = ev.target && ev.target.closest && ev.target.closest('[data-hit]');
    if (t) return +t.getAttribute('data-hit');
    const elAt = document.elementFromPoint(ev.clientX, ev.clientY);
    const h = elAt && elAt.closest && elAt.closest('[data-hit]');
    return h ? +h.getAttribute('data-hit') : -1;
  }
  function svgPoint(ev) {
    const ctm = E.board.getScreenCTM();
    if (!ctm) return null;
    const p = E.board.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    const q = p.matrixTransform(ctm.inverse());
    return [q.x, q.y];
  }

  E.board.addEventListener('pointerdown', ev => {
    if (!S || (ev.button && ev.button !== 0)) return;
    Snd.init();
    if (ev.target.hasPointerCapture && ev.target.hasPointerCapture(ev.pointerId)) {
      ev.target.releasePointerCapture(ev.pointerId);
    }
    const pt = svgPoint(ev);
    if (S.soldering && pt) {
      if (trySolderAt(pt)) return;
    }
    const i = cellAt(ev);
    if (i >= 0) tapCell(i, pt);
  });
  E.board.addEventListener('pointermove', ev => {
    if (ev.pointerType === 'mouse') setHover(cellAt(ev));
  });
  E.board.addEventListener('pointerleave', ev => {
    if (ev.pointerType === 'mouse') setHover(-1);
  });

  function trySolderAt(pt) {
    let best = null, bestD = 48;
    L.edges.forEach(e => {
      if (!e.open) return;
      const key = e.u + '>' + e.d;
      if (S.soldered.has(key)) return;
      if (S.fill[e.d] != null || S.fill[e.u] != null) return;
      const d = Math.hypot(e.mid[0] - pt[0], e.mid[1] - pt[1]);
      if (d < bestD) { bestD = d; best = key; }
    });
    if (!best) {
      toast('Kapatmak istediğin altın oklu açıklığa dokun');
      return true;
    }
    S.history.push(snapshot());
    S.soldered.add(best);
    S.soldering = false;
    E.board.classList.remove('soldering');
    Snd.solder(); vibrate(15);
    updateGaps(); updateBoosters(); refreshHover();
    toast('🔗 Açıklık lehimlendi ve kapatıldı');
    return true;
  }

  function tapCell(i, pt) {
    if (S.status !== 'play') return;
    if (S.fill[i] != null) return;
    if (!S.selected) {
      toast('Önce aşağıdan bir pota seç');
      E.pots.classList.remove('nudge'); void E.pots.offsetWidth; E.pots.classList.add('nudge');
      return;
    }
    if (S.pours <= 0) { showSheet('out'); return; }
    pour(i, pt);
  }

  function snapshot() {
    return {
      fill: S.fill.slice(),
      pours: S.pours,
      used: S.used,
      cooling: S.cooling,
      soldered: Array.from(S.soldered),
    };
  }

  function pour(i, pt) {
    S.history.push(snapshot());
    const fl = floodInfo(i, pt);
    const col = S.selected;
    if (S.cooling) { S.cooling = false; E.board.classList.remove('cooling'); }
    S.pours--; S.used++;
    fl.forEach(f => { S.fill[f.c] = col; });
    clearHintRing();
    updateGaps();
    updateHUD();
    updateBoosters();
    refreshHover();

    E.pours.classList.add('bump');
    setTimeout(() => E.pours.classList.remove('bump'), 130);
    Snd.pour();
    vibrate(10);

    let maxEnd = 0;
    fl.forEach(f => {
      const delay = f.d * 105, dur = 210;
      animateFill(f, col, delay, dur, S.chimePitch++);
      maxEnd = Math.max(maxEnd, delay + dur);
    });
    evaluateAfterPour(fl, maxEnd);
  }

  function animateFill(f, color, delay, dur, pitchIdx) {
    const rc = R.cells[f.c], poly = L.cells[f.c].poly;
    const origin = f.from || L.cells[f.c].c;
    const Rm = Math.max(...poly.map(v => Math.hypot(v[0] - origin[0], v[1] - origin[1]))) + 3;
    rc.molten.setAttribute('cx', origin[0].toFixed(1));
    rc.molten.setAttribute('cy', origin[1].toFixed(1));
    rc.molten.setAttribute('r', 0);
    rc.molten.setAttribute('fill', mix(COLORS[color].hex, HOT, 1));
    for (let k = anims.length - 1; k >= 0; k--) {
      if (anims[k].f.c === f.c) anims.splice(k, 1);
    }
    anims.push({ f, rc, hex: COLORS[color].hex, start: performance.now() + delay, dur, Rm, started: false, chimed: false, pitchIdx });
    if (!rafOn) { rafOn = true; requestAnimationFrame(tick); }
  }

  function tick(now) {
    for (let k = anims.length - 1; k >= 0; k--) {
      const a = anims[k], t = (now - a.start) / a.dur;
      if (t < 0) continue;
      if (!a.started) {
        a.started = true; a.rc.g.classList.add('filled');
        if (a.f.via && a.f.via.marker) {
          const m = a.f.via.marker; m.classList.remove('flow'); void m.getBoundingClientRect(); m.classList.add('flow');
        }
      }
      a.rc.molten.setAttribute('r', (a.Rm * easeOut(Math.min(1, t))).toFixed(1));
      const cool = Math.min(1, (now - a.start) / (a.dur + 320));
      a.rc.molten.setAttribute('fill', mix(a.hex, HOT, Math.pow(1 - cool, 1.5)));
      if (t >= 0.85 && !a.chimed) { a.chimed = true; Snd.chime(a.pitchIdx % 8); }
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

  function evaluateAfterPour(fl, maxEnd) {
    const wrongEntries = fl.filter(f => S.fill[f.c] !== L.target[f.c]);
    if (wrongEntries.length) {
      S.status = 'wrong';
      const firstVia = wrongEntries.find(f => f.via);
      S.lastLeakedGap = firstVia && firstVia.via ? (firstVia.via.u + '>' + firstVia.via.d) : null;
      updateBoosters();
      const t = setTimeout(() => {
        markWrong(wrongEntries.map(f => f.c));
        Snd.wrong(); vibrate([30, 40, 30]);
        E.board.classList.remove('shake'); void E.board.getBoundingClientRect(); E.board.classList.add('shake');
        showSheet('wrong');
      }, Math.min(maxEnd, 210));
      evalTimers.push(t);
      return;
    }
    if (S.fill.every(v => v != null)) {
      S.status = 'win';
      updateBoosters();
      const t = setTimeout(() => win(), maxEnd + 60);
      evalTimers.push(t);
      return;
    }
    if (S.pours <= 0) {
      S.status = 'out';
      updateBoosters();
      const t = setTimeout(() => showSheet('out'), maxEnd + 80);
      evalTimers.push(t);
    }
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
      b.addEventListener('pointerdown', ev => { ev.preventDefault(); Snd.init(); selectPot(k); });
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
    updateTopBar();
    if (!L || !S) return;
    const col = L.collection;
    const st = colStats(L.colIdx);
    E.colDot.style.background = col.accent;
    E.colDot.style.boxShadow = `0 0 10px ${col.accent}`;
    E.colEyebrow.textContent = S.isDaily ? 'GÜNLÜK ÖZEL VİTRAY' : `KOLEKSİYON ${col.num} · ${st.done}/12`;
    E.colTitle.textContent = `${col.title} ▾`;
    E.lvlName.textContent = S.isDaily ? `📅 ${L.pieceName}` : `${L.itemIdx + 1}. ${L.pieceName}`;
    E.lvlMeta.textContent = `${SHAPE_NAMES[L.shapeType] || 'Vitray'} · ${L.cells.length} bölme` + (S.bonusPours ? ' · 🔥+1 Döküm' : '');
    E.poursN.textContent = S.pours;
    E.goalN.textContent = L.min;
    E.pours.classList.toggle('low', S.pours <= 2);
    E.pours.classList.toggle('bonus', S.bonusPours > 0 && S.pours > 2);
    E.btnPrev.hidden = S.isDaily;
    E.btnNext.hidden = S.isDaily;
    E.btnPrev.disabled = S.idx <= 1;
    E.btnNext.disabled = S.idx >= MAX_LEVEL;
  }

  function setBadge(elEm, k) {
    const cnt = econ.d.inv[k] || 0;
    if (cnt > 0) {
      elEm.textContent = cnt;
      elEm.classList.remove('price');
    } else {
      elEm.textContent = '🪙' + EMod.CONFIG.prices[k];
      elEm.classList.add('price');
    }
  }

  function updateBoosters() {
    setBadge(E.cCool, 'cool');
    setBadge(E.cSolder, 'solder');
    setBadge(E.cPlus, 'plus');
    setBadge(E.cUndo, 'undo');
    setBadge(E.cHint, 'hint');
    if (!S) return;
    E.bCool.classList.toggle('active', S.cooling);
    E.bSolder.classList.toggle('active', S.soldering);
    E.bCool.disabled = S.status !== 'play';
    E.bSolder.disabled = S.status !== 'play';
    E.bPlus.disabled = S.status === 'win' || S.status === 'wrong';
    E.bUndo.disabled = !S.history.length || S.status === 'win';
    E.bHint.disabled = S.status === 'win';
  }

  function ensureBoosterOrPrompt(k, onReady) {
    if (econ.hasBooster(k)) {
      econ.useBooster(k);
      updateBoosters();
      onReady();
      return;
    }
    showBoosterBuySheet(k, onReady);
  }

  function showBoosterBuySheet(k, onReady) {
    const b = EMod.BOOSTERS[k];
    const canAfford = econ.d.coins >= b.price;
    E.sheet.innerHTML = `
      <h2>${b.icon} ${b.name} Güçlendiricisi</h2>
      <p>${b.desc}. Stokta kalmadı — altınla alabilir ya da reklam izleyerek 1 adet ücretsiz kazanabilirsin.</p>
      <div class="row">
        <button class="btn primary" data-a="buy">${canAfford ? `🪙 ${b.price} Al & Kullan` : `🪙 ${b.price} (Mağaza)`}</button>
        <button class="btn ad" data-a="ad">🎬 Reklam (+1)</button>
        <button class="btn" data-a="close" style="flex:0 0 46px">✕</button>
      </div>`;
    E.sheet.hidden = false;
    E.sheet.querySelector('[data-a=close]').onclick = () => hideSheet();
    E.sheet.querySelector('[data-a=buy]').onclick = () => {
      if (!econ.buyBoosterWithCoins(k)) {
        hideSheet();
        openShop();
        toast('Altın yetersiz — mağazadan altın alabilirsin');
        return;
      }
      econ.useBooster(k);
      hideSheet();
      updateHUD();
      updateBoosters();
      onReady();
    };
    E.sheet.querySelector('[data-a=ad]').onclick = () => {
      hideSheet();
      playAd('Ödüllü Reklam · +1 ' + b.name, () => {
        econ.addBooster(k, 1);
        econ.useBooster(k);
        updateHUD();
        updateBoosters();
        onReady();
      });
    };
  }

  // ---------- Event Listeners (HUD & Home & Boosters) ----------
  E.btnHome.addEventListener('click', () => { Snd.init(); Snd.click(); goHome(); });
  E.btnStars.addEventListener('click', () => { Snd.init(); Snd.click(); goCollections(); });
  E.btnMenu.addEventListener('click', () => { Snd.init(); Snd.click(); goCollections(L ? L.colIdx : 0); });
  E.btnSettings.addEventListener('click', () => { Snd.init(); Snd.click(); openSettings(); });
  E.btnShop.addEventListener('click', () => { Snd.init(); Snd.click(); openShop(); });
  E.btnStreak.addEventListener('click', () => {
    Snd.init(); Snd.click();
    const s = econ.d.streak || 0;
    toast(s >= 3
      ? `🔥 ${s} Kazanma Serisi aktif! Her seviyeye +1 ekstra dökümle başlıyorsun.`
      : `🔥 Kazanma Serisi: ${s}/3. Üst üste 3 vitray tamamlayınca +1 ekstra döküm açılır!`);
  });

  // Home Screen actions
  E.homeColCard.addEventListener('click', () => { Snd.init(); Snd.click(); goCollections(); });
  E.btnHomePlay.addEventListener('click', () => {
    Snd.init(); Snd.click();
    const curIdx = Math.min(MAX_LEVEL, Math.max(1, store.unlocked));
    startLevel(curIdx);
  });
  E.btnDailyReward.addEventListener('click', () => { Snd.init(); Snd.click(); openDailyReward(); });
  E.btnDailyPuzzle.addEventListener('click', () => { Snd.init(); Snd.click(); startDailyPuzzle(); });
  E.btnHomeGallery.addEventListener('click', () => { Snd.init(); Snd.click(); goCollections(); });
  E.btnHomePiggy.addEventListener('click', () => { Snd.init(); Snd.click(); openShop(); });

  // Gameplay controls
  E.btnPrev.addEventListener('click', () => { if (S && !S.isDaily && S.idx > 1) { Snd.init(); Snd.click(); startLevel(S.idx - 1); } });
  E.btnNext.addEventListener('click', () => {
    if (S && !S.isDaily && S.idx < MAX_LEVEL) {
      Snd.init(); Snd.click();
      store.unlocked = Math.max(store.unlocked, S.idx + 1); save();
      startLevel(S.idx + 1);
    }
  });

  E.bCool.addEventListener('click', () => {
    if (!S || S.status !== 'play') return;
    Snd.init();
    if (S.cooling) {
      S.cooling = false;
      econ.addBooster('cool', 1);
      E.board.classList.remove('cooling');
      updateBoosters(); refreshHover(); Snd.click();
      return;
    }
    ensureBoosterOrPrompt('cool', () => {
      S.cooling = true;
      S.soldering = false;
      E.board.classList.add('cooling');
      E.board.classList.remove('soldering');
      updateBoosters(); refreshHover(); Snd.click();
      toast('❄ Sıradaki döküm taşmayacak');
    });
  });

  E.bSolder.addEventListener('click', () => {
    if (!S || S.status !== 'play') return;
    Snd.init();
    if (S.soldering) {
      S.soldering = false;
      econ.addBooster('solder', 1);
      E.board.classList.remove('soldering');
      updateBoosters(); Snd.click();
      return;
    }
    const openAvailable = L.edges.some(e => e.open && !S.soldered.has(e.u + '>' + e.d) && S.fill[e.d] == null && S.fill[e.u] == null);
    if (!openAvailable) {
      toast('Kapatılabilecek açık kurşun hattı yok');
      return;
    }
    ensureBoosterOrPrompt('solder', () => {
      S.soldering = true;
      S.cooling = false;
      E.board.classList.add('soldering');
      E.board.classList.remove('cooling');
      updateBoosters(); refreshHover(); Snd.click();
      toast('🔗 Kapatmak istediğin altın açıklığa dokun');
    });
  });

  E.bPlus.addEventListener('click', () => {
    if (!S || S.status === 'win' || S.status === 'wrong') return;
    Snd.init();
    ensureBoosterOrPrompt('plus', () => {
      clearEvalTimers();
      S.pours += 2;
      if (S.status === 'out') { S.status = 'play'; hideSheet(); }
      updateHUD(); updateBoosters(); toast('+2 döküm eklendi'); Snd.click();
    });
  });

  E.bUndo.addEventListener('click', () => {
    if (!S || !S.history.length || S.status === 'win') return;
    Snd.init();
    ensureBoosterOrPrompt('undo', () => undoStep(false));
  });

  E.bHint.addEventListener('click', () => {
    if (!S || S.status === 'win') return;
    Snd.init();
    if (S.status === 'wrong') { toast('Önce geri al ya da onar'); return; }
    ensureBoosterOrPrompt('hint', () => applyHint());
  });

  E.bRestart.addEventListener('click', () => {
    if (!S) return;
    Snd.init(); Snd.click();
    if (!S.isDaily && S.used > 0 && econ.d.streak > 0) econ.onLevelFailReset();
    if (S.isDaily) startDailyPuzzle(); else startLevel(S.idx);
  });
  E.tip.addEventListener('click', () => { E.tip.hidden = true; });

  function undoStep(autoSolderLeak) {
    if (!S.history.length) return;
    clearEvalTimers();
    const leakGap = S.lastLeakedGap;
    const s = S.history.pop();
    S.fill = s.fill;
    S.pours = s.pours;
    S.used = s.used;
    S.cooling = s.cooling;
    S.soldered = new Set(s.soldered || []);
    if (autoSolderLeak && leakGap) {
      S.soldered.add(leakGap);
      Snd.solder();
    } else {
      Snd.click();
    }
    E.board.classList.toggle('cooling', S.cooling);
    S.status = 'play';
    hideSheet();
    renderStatic();
    updateHUD();
    updateBoosters();
    refreshHover();
  }

  function clearHintRing() { if (S && S.hintRing) { S.hintRing.remove(); S.hintRing = null; } }
  function applyHint() {
    let mask = 0; S.fill.forEach((v, i) => { if (v != null) mask |= 1 << i; });
    const r = G.solveFrom(L.cells.length, activeDown(), L.target, mask);
    if (!r) { toast('Bu durumdan çözüm yok, geri al'); return; }
    if (r.min > S.pours) toast(`Kalan hakla yetişmez: ${r.min} döküm gerekli`);
    const c = r.first;
    selectPot(L.target[c]);
    clearHintRing();
    const cc = L.cells[c].c;
    S.hintRing = el('circle', { cx: cc[0], cy: cc[1], r: 22, class: 'hint-target' }, R.fx);
  }

  // ---------- Simulated Ad Overlay ----------
  function playAd(title, onComplete) {
    let rem = 3;
    E.adModal.innerHTML = `<div class="ad-card">
      <div class="eyebrow">SPONSORLU VİDEO</div>
      <h2 style="margin-top:4px">${title}</h2>
      <div class="ad-timer" id="adTimer">3s</div>
      <div class="ad-bar"><div id="adBarFill" style="width:0%"></div></div>
      <p class="sub">Ödül hazırlanıyor…</p>
    </div>`;
    E.adModal.hidden = false;
    const timerEl = $('#adTimer'), barEl = $('#adBarFill');
    setTimeout(() => { if (barEl) barEl.style.width = '100%'; }, 30);
    const iv = setInterval(() => {
      rem--;
      if (rem > 0) {
        if (timerEl) timerEl.textContent = rem + 's';
      } else {
        clearInterval(iv);
        E.adModal.hidden = true;
        E.adModal.innerHTML = '';
        if (onComplete) onComplete();
      }
    }, 850);
  }

  // ---------- Pinch-Point Sheets (wrong / out) ----------
  function showSheet(kind) {
    const streak = econ.d.streak || 0;
    const streakBanner = (!S.isDaily && streak > 0)
      ? `<div class="streak-warn"><span>🔥</span><span><b>${streak} Kazanma Serin</b> tehlikede! Devam edersen serin korunur.</span></div>`
      : '';

    if (kind === 'wrong') {
      const hasUndo = econ.hasBooster('undo');
      const repPrice = EMod.CONFIG.repairPrice;
      const primaryLabel = hasUndo
        ? `↶ Geri Al (${econ.d.inv.undo})`
        : `🔧 Onar & Lehimle (🪙 ${repPrice})`;
      E.sheet.innerHTML = `
        <h2>Cam yanlış bölmeye taştı</h2>
        <p>Farklı renkli bölmeye akan cam çatladı. Hatayı onarıp taşan açıklığı lehimleyebilirsin.</p>
        ${streakBanner}
        <div class="row">
          <button class="btn primary" data-a="repair">${primaryLabel}</button>
          <button class="btn ad" data-a="ad_repair">🎬 Ücretsiz Onar</button>
          <button class="btn" data-a="restart" style="flex:0 0 82px">⟳ Baştan</button>
        </div>`;
    } else if (kind === 'out') {
      const contPrice = econ.continuePrice(S.continues);
      const emptyCnt = S.fill.filter(v => v == null).length;
      E.sheet.innerHTML = `
        <h2>Döküm hakkın bitti</h2>
        <p>${emptyCnt} bölme boş kaldı! Devam paketiyle <b>+2 Döküm + 1 Soğutucu</b> alıp vitrayı tamamla.</p>
        ${streakBanner}
        <div class="row">
          <button class="btn primary" data-a="cont">+2 Döküm + ❄ (🪙 ${contPrice})</button>
          <button class="btn ad" data-a="ad_cont">🎬 +1 Döküm</button>
          <button class="btn" data-a="restart" style="flex:0 0 82px">⟳ Baştan</button>
        </div>`;
    }
    E.sheet.hidden = false;
    updateBoosters();

    E.sheet.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.a;
      Snd.init();
      if (a === 'repair') {
        if (econ.hasBooster('undo')) {
          econ.useBooster('undo');
          undoStep(false);
        } else if (econ.spend(EMod.CONFIG.repairPrice, 'repair_and_solder')) {
          S.pours++;
          undoStep(true);
          toast('🔧 Çatlak onarıldı ve açıklık lehimlendi!');
        } else {
          openShop();
          toast('Altın yetersiz — mağazadan altın alabilirsin');
        }
      } else if (a === 'ad_repair') {
        playAd('Cam Onarımı & Lehim', () => {
          undoStep(true);
          toast('🔧 Çatlak onarıldı ve açıklık lehimlendi!');
        });
      } else if (a === 'cont') {
        const price = econ.continuePrice(S.continues);
        if (econ.spend(price, 'continue_pours')) {
          S.continues++;
          clearEvalTimers();
          S.pours += 2;
          econ.addBooster('cool', 1);
          S.status = 'play';
          hideSheet();
          updateHUD();
          updateBoosters();
          Snd.coin();
          toast('+2 Döküm ve +1 ❄ Soğut eklendi!');
        } else {
          openShop();
          toast('Altın yetersiz — mağazadan altın alabilirsin');
        }
      } else if (a === 'ad_cont') {
        playAd('Son Şans · +1 Döküm', () => {
          clearEvalTimers();
          S.pours += 1;
          S.status = 'play';
          hideSheet();
          updateHUD();
          updateBoosters();
          toast('+1 Döküm eklendi!');
        });
      } else if (a === 'restart') {
        if (!S.isDaily) econ.onLevelFailReset();
        if (S.isDaily) startDailyPuzzle(); else startLevel(S.idx);
      }
    }));
  }
  function hideSheet() { E.sheet.hidden = true; E.sheet.innerHTML = ''; }
  function closeModal() { E.modal.hidden = true; E.modal.innerHTML = ''; }

  // ---------- win ----------
  function win() {
    S.status = 'win';
    const stars = S.used <= L.min ? 3 : S.used <= L.min + 1 ? 2 : 1;
    let winInfo = null;
    let colChestBonus = 0;

    if (S.isDaily) {
      const dRes = econ.onDailyPuzzleWin(EMod.localToday());
      winInfo = {
        totalEarned: dRes.coins,
        streak: dRes.streak,
        piggyAdded: dRes.piggyAdded,
        piggyTotal: dRes.piggyTotal,
        isDaily: true,
      };
    } else {
      const isFirstWin = !store.thumbs[S.idx];
      store.stars[S.idx] = Math.max(store.stars[S.idx] || 0, stars);
      store.best[S.idx] = Math.min(store.best[S.idx] || 99, S.used);
      store.unlocked = Math.max(store.unlocked, S.idx + 1);
      store.thumbs[S.idx] = thumbSVG(L);

      winInfo = econ.onLevelWin({ stars, isFirstWin });

      const st = colStats(L.colIdx);
      if (st.done === 12 && !econ.d.claimedCols[L.colIdx]) {
        econ.d.claimedCols[L.colIdx] = true;
        colChestBonus = EMod.CONFIG.colCompleteCoins;
        econ.earn(colChestBonus, 'collection_complete_' + L.colIdx);
        econ.addBooster('cool', 1);
        econ.addBooster('solder', 1);
      }
      if (st.stars === 36 && !econ.d.claimedMasterCols[L.colIdx]) {
        econ.d.claimedMasterCols[L.colIdx] = true;
        colChestBonus += EMod.CONFIG.colMasterCoins;
        econ.earn(EMod.CONFIG.colMasterCoins, 'collection_master_' + L.colIdx);
      }
    }

    save();
    updateHUD();
    updateBoosters();

    E.board.classList.add('lit');
    el('rect', { x: -320, y: 0, width: 260, height: 540, fill: 'url(#sweepG)', class: 'sweep', transform: 'skewX(-18)' }, R.fx);
    for (let k = 0; k < 14; k++) {
      const c = L.cells[k % L.cells.length].c;
      const s = el('path', { d: 'M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z', class: 'spark', transform: `translate(${(c[0] + (Math.random() - .5) * 50).toFixed(1)} ${(c[1] + (Math.random() - .5) * 50).toFixed(1)})` }, R.fx);
      s.style.animationDelay = (0.15 + Math.random() * 0.9).toFixed(2) + 's';
    }
    castRays();
    Snd.win(); vibrate([18, 45, 18, 45]);
    const t = setTimeout(() => showWin(stars, winInfo, colChestBonus), 680);
    evalTimers.push(t);
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
        clipPath: 'polygon(36% 0, 64% 0, 100% 100%, 0 100%)', animationDelay: (0.08 + k * 0.04) + 's',
      });
      E.rays.appendChild(div);
    }
  }

  function showWin(stars, winInfo, colChestBonus) {
    if (!S || S.status !== 'win') return;
    winInfo = winInfo || { totalEarned: 25, streak: econ.d.streak || 1, piggyAdded: 60, piggyTotal: econ.d.piggy };
    const col = L.collection;
    const st = colStats(L.colIdx);
    const pct = Math.round((st.done / 12) * 100);
    const isLastInCol = !S.isDaily && L.itemIdx === 11;
    const nextIdx = S.isDaily ? Math.min(MAX_LEVEL, Math.max(1, store.unlocked)) : Math.min(MAX_LEVEL, S.idx + 1);
    const nextLabel = S.isDaily ? 'Ana Ekrana Dön' : (isLastInCol && S.idx < MAX_LEVEL ? 'Sonraki Koleksiyon ▶' : 'Sonraki ▶');

    E.modal.innerHTML = `<div class="card win">
      <div class="eyebrow">${S.isDaily ? 'GÜNLÜK ÖZEL BULMACA TAMAMLANDI' : `Koleksiyon ${col.num} · ${col.title}`}</div>
      <h2>${S.isDaily ? L.pieceName : `${L.itemIdx + 1}. ${L.pieceName}`}</h2>
      <div class="thumb">${thumbSVG(L)}</div>
      <div class="stars">${[1, 2, 3].map(k => k <= stars ? `<span class="on" style="animation-delay:${0.1 * k}s">★</span>` : '★').join('')}</div>
      <div class="stat">${S.used} döküm · 3★ hedefi ${L.min} · 🔥 ${winInfo.streak} ${S.isDaily ? 'Günlük Seri' : 'Seri'}</div>
      <div class="reward-box">
        <div>
          <b id="winCoinTxt">+${winInfo.totalEarned} 🪙 Kazanıldı</b>
          <small>🏺 Kumbara +${winInfo.piggyAdded} (${winInfo.piggyTotal}/3.000)</small>
        </div>
        <button class="btn ad" id="btnDoubleCoin" style="flex:0 0 auto;padding:8px 11px;font-size:12.5px">🎬 2x (+${winInfo.totalEarned} 🪙)</button>
      </div>
      ${colChestBonus ? `<div class="streak-warn" style="background:rgba(70,212,134,.15);border-color:rgba(70,212,134,.5);color:#9ef7c2">🏆 <b>Koleksiyon Hazinesi Açıldı: +${colChestBonus} 🪙 + Booster!</b></div>` : ''}
      <div class="col-prog">
        <div class="col-prog-top">
          <span>${col.title}</span>
          <span style="color:${col.accent}">${st.done} / 12 Vitray · ★${st.stars}/36</span>
        </div>
        <div class="col-prog-bar"><div class="col-prog-fill" style="width:${pct}%;background:${col.accent}"></div></div>
      </div>
      <div class="row">
        <button class="btn" data-a="home">⌂ Ana Ekran</button>
        <button class="btn" data-a="album">🏛 Galeri</button>
        <button class="btn primary" data-a="next">${nextLabel}</button>
      </div>
    </div>`;
    E.modal.hidden = false;

    const dblBtn = $('#btnDoubleCoin');
    if (dblBtn) {
      dblBtn.onclick = () => {
        dblBtn.disabled = true;
        playAd('2x Altın Ödülü', () => {
          econ.earn(winInfo.totalEarned, 'win_double_ad');
          Snd.coin();
          updateHUD();
          const txt = $('#winCoinTxt');
          if (txt) txt.textContent = `+${winInfo.totalEarned * 2} 🪙 Kazanıldı (2x!)`;
          dblBtn.textContent = '✓ 2x Alındı';
        });
      };
    }
    const advanceNext = () => {
      if (S.isDaily) {
        goHome();
        return;
      }
      if (econ.shouldShowInterstitial(S.idx)) {
        playAd('Geçiş Reklamı', () => startLevel(nextIdx));
      } else {
        startLevel(nextIdx);
      }
    };
    E.modal.querySelector('[data-a=next]').onclick = advanceNext;
    E.modal.querySelector('[data-a=home]').onclick = () => goHome();
    E.modal.querySelector('[data-a=album]').onclick = () => goCollections(L.colIdx);
  }

  // ---------- 7-Day Daily Reward Modal ----------
  function openDailyReward() {
    const today = EMod.localToday();
    const canClaim = econ.canClaimDaily(today);
    const curIdx = econ.currentDailyIndex(today);

    const slots = EMod.DAILY_REWARDS.map((r, idx) => {
      const isDone = idx < curIdx || (!canClaim && idx === curIdx);
      const isToday = canClaim && idx === curIdx;
      const cls = [r.big ? 'big' : '', isToday ? 'today' : '', isDone ? 'done' : ''].filter(Boolean).join(' ');
      if (r.big) {
        return `<div class="daily-slot ${cls}">
          <div>
            <small>7. GÜN · BÜYÜK ATÖLYE SANDIĞI</small>
            <strong style="display:block;margin-top:2px">${r.desc}</strong>
          </div>
          <i>${isDone ? '✓' : r.icon}</i>
        </div>`;
      }
      return `<div class="daily-slot ${cls}">
        <small>${r.day}. Gün</small>
        <i>${isDone ? '✓' : r.icon}</i>
        <strong>${r.label}</strong>
      </div>`;
    }).join('');

    E.modal.innerHTML = `<div class="card">
      <div class="row" style="align-items:center">
        <div style="flex:1">
          <div class="eyebrow">7 GÜNLÜK ATÖLYE TAKVİMİ</div>
          <h2>🎁 Günlük Ödül</h2>
        </div>
        <button class="icon-btn" data-a="close" aria-label="Kapat">✕</button>
      </div>
      <p class="sub">Her gün atölyeye uğra, art arda giriş yaparak 7. gün büyük hazineyi kazan!</p>
      <div class="daily-grid">${slots}</div>
      <div class="row">
        <button class="btn primary" id="btnClaimDaily" ${canClaim ? '' : 'disabled'}>
          ${canClaim ? `🎁 ${curIdx + 1}. Gün Ödülünü Topla` : '✓ Bugünkü Ödül Alındı'}
        </button>
      </div>
    </div>`;
    E.modal.hidden = false;

    E.modal.querySelector('[data-a=close]').onclick = () => closeModal();
    const claimBtn = $('#btnClaimDaily');
    if (claimBtn && canClaim) {
      claimBtn.onclick = () => {
        const reward = econ.claimDaily(today);
        if (!reward) return;
        Snd.coin();
        updateTopBar();
        if (currentScreen === 'home') refreshHome();
        openDailyReward();
        toast(`🎁 ${reward.day}. Gün Ödülü: ${reward.desc} eklendi!`);
      };
    }
  }

  // ---------- Atelier Shop Modal ----------
  function openShop() {
    const piggyPct = Math.round((econ.d.piggy / EMod.CONFIG.piggyCap) * 100);
    const canBreakPiggy = econ.d.piggy >= EMod.CONFIG.piggyMinBreak;

    const specialPacks = EMod.IAP_PRODUCTS.filter(p => !p.id.startsWith('c')).map(p => {
      if (p.once && econ.d.starterBought) return '';
      if (p.id === 'noads' && econ.d.noAds) return '';
      if (p.isPiggy) {
        return `<div class="pack-card featured">
          <div class="pack-info">
            <span class="pack-tag">🏺 BİRİKEN HAZİNE · ${econ.d.piggy} / 3.000 🪙</span>
            <strong>${p.name}</strong>
            <small>${canBreakPiggy ? `Şu an kırıp <b>${econ.d.piggy.toLocaleString('tr-TR')} 🪙</b> alabilirsin!` : `Kırmak için en az ${EMod.CONFIG.piggyMinBreak} 🪙 birikmeli`}</small>
            <div class="col-prog-bar" style="margin-top:6px"><div class="col-prog-fill" style="width:${piggyPct}%"></div></div>
          </div>
          <button class="buy-btn" data-iap="piggy" ${canBreakPiggy ? '' : 'disabled'}>${p.tryPrice}</button>
        </div>`;
      }
      return `<div class="pack-card ${p.once ? 'featured' : ''}">
        <div class="pack-info">
          ${p.tag ? `<span class="pack-tag">${p.tag}</span>` : ''}
          <strong>${p.name}</strong>
          <small>${p.desc}</small>
        </div>
        <button class="buy-btn" data-iap="${p.id}">${p.tryPrice}</button>
      </div>`;
    }).join('');

    const coinPacks = EMod.IAP_PRODUCTS.filter(p => p.id.startsWith('c')).map(p => `
      <div class="coin-card ${p.hot ? 'hot' : ''}">
        <div>
          ${p.tag ? `<span class="pack-tag">${p.tag}</span>` : ''}
          <strong style="display:block;font:800 15px var(--f-display);color:var(--gold)">🪙 ${p.coins.toLocaleString('tr-TR')}</strong>
          <small style="color:var(--muted);font-size:11.5px">${p.desc}</small>
        </div>
        <button class="buy-btn" data-iap="${p.id}" style="width:100%">${p.tryPrice}</button>
      </div>`).join('');

    const boosterRows = Object.values(EMod.BOOSTERS).map(b => `
      <div class="pack-card" style="padding:8px 11px">
        <div class="pack-info">
          <strong style="font-size:13px">${b.icon} ${b.name} <span style="color:var(--muted);font-weight:600">(Stok: ${econ.d.inv[b.id] || 0})</span></strong>
          <small>${b.desc}</small>
        </div>
        <button class="buy-btn coin-buy" data-b="${b.id}">🪙 ${b.price}</button>
      </div>`).join('');

    E.modal.innerHTML = `<div class="card">
      <div class="row" style="align-items:center">
        <div style="flex:1">
          <div class="eyebrow">Atölye Mağazası · Bakiye: 🪙 ${econ.d.coins.toLocaleString('tr-TR')}</div>
          <h2>Mağaza & Hazine</h2>
        </div>
        <button class="icon-btn" data-a="close" aria-label="Kapat">✕</button>
      </div>

      <h3>Özel Paketler & Kumbara</h3>
      <div class="shop-list">${specialPacks}</div>

      <h3>Altın Keseleri</h3>
      <div class="pack-card" style="margin-bottom:8px;border-color:rgba(70,212,134,.45)">
        <div class="pack-info">
          <strong style="color:#7ef2b0">🎬 Ücretsiz Altın</strong>
          <small>Kısa bir reklam izle ve anında +${EMod.CONFIG.rewardedCoins} 🪙 kazan</small>
        </div>
        <button class="buy-btn" id="btnFreeCoins" style="background:#46D486;color:#0e291b">+${EMod.CONFIG.rewardedCoins} 🪙</button>
      </div>
      <div class="coin-grid">${coinPacks}</div>

      <h3>Tekli Güçlendiriciler (Altınla)</h3>
      <div class="shop-list">${boosterRows}</div>
    </div>`;
    E.modal.hidden = false;

    E.modal.querySelector('[data-a=close]').onclick = () => {
      if (currentScreen === 'game' && S && S.status === 'win') showWin(store.stars[S.idx] || 1);
      else closeModal();
    };
    const freeBtn = $('#btnFreeCoins');
    if (freeBtn) {
      freeBtn.onclick = () => {
        playAd('Ücretsiz Altın Ödülü', () => {
          econ.earn(EMod.CONFIG.rewardedCoins, 'shop_rewarded_ad');
          Snd.coin();
          updateHUD();
          if (currentScreen === 'home') refreshHome();
          openShop();
          toast(`+${EMod.CONFIG.rewardedCoins} 🪙 eklendi!`);
        });
      };
    }
    E.modal.querySelectorAll('[data-iap]').forEach(btn => btn.onclick = () => {
      const id = btn.dataset.iap;
      const res = econ.purchaseIAP(id);
      if (!res) return;
      Snd.coin();
      updateHUD();
      updateBoosters();
      if (currentScreen === 'home') refreshHome();
      openShop();
      toast(`✓ ${res.pack.name} satın alındı!` + (res.coinsAdded ? ` (+${res.coinsAdded} 🪙)` : ''));
    });
    E.modal.querySelectorAll('[data-b]').forEach(btn => btn.onclick = () => {
      const k = btn.dataset.b;
      if (!econ.buyBoosterWithCoins(k)) {
        toast('Altın yetersiz — yukarıdan altın paketi seçebilirsin');
        return;
      }
      Snd.coin();
      updateHUD();
      updateBoosters();
      if (currentScreen === 'home') refreshHome();
      openShop();
      toast(`+1 ${EMod.BOOSTERS[k].name} envantere eklendi!`);
    });
  }

  // ---------- Settings Modal ----------
  function openSettings() {
    const tg = (k, label, sub) => `<div class="toggle ${store.settings[k] ? 'on' : ''}" data-t="${k}" role="switch" aria-checked="${store.settings[k]}" tabindex="0"><div>${label}<small>${sub}</small></div><span class="sw"></span></div>`;
    const solvedCount = Object.keys(store.thumbs).length;
    const totStars = totalStars();
    const pStreak = econ.dailyPuzzleStreakAlive(EMod.localToday());

    E.modal.innerHTML = `<div class="card">
      <div class="row" style="align-items:center">
        <div style="flex:1">
          <div class="eyebrow">ATÖLYE TERCİHLERİ</div>
          <h2>⚙ Ayarlar & Profil</h2>
        </div>
        <button class="icon-btn" data-a="close" aria-label="Kapat">✕</button>
      </div>

      <h3>Atölye İstatistikleri</h3>
      <div class="col-grid" style="margin-bottom:6px">
        <div class="col-card" style="cursor:default">
          <span class="col-card-tag">Tamamlanan Vitray</span>
          <strong style="color:var(--gold)">${solvedCount} / ${MAX_LEVEL}</strong>
        </div>
        <div class="col-card" style="cursor:default">
          <span class="col-card-tag">Toplam Yıldız</span>
          <strong style="color:var(--gold)">★ ${totStars} / ${MAX_STARS}</strong>
        </div>
        <div class="col-card" style="cursor:default">
          <span class="col-card-tag">Usta Ateşi Serisi</span>
          <strong style="color:#ffd7aa">🔥 ${econ.d.streak || 0}</strong>
        </div>
        <div class="col-card" style="cursor:default">
          <span class="col-card-tag">Günlük Vitray Serisi</span>
          <strong style="color:#c084fc">📅 ${pStreak} Gün</strong>
        </div>
      </div>

      <h3>Oynanış & Erişilebilirlik</h3>
      ${tg('preview', 'Akış önizleme', 'Üzerine gelince camın nereye akacağını gösterir')}
      ${tg('cb', 'Renk körü modu', 'Dolu bölmelerde de sembolleri gösterir')}
      ${tg('sound', 'Ses efektleri', 'Döküm, lehim ve kristal çan sesleri')}

      <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center">
        <button class="linkbtn" data-a="reset">İlerlemeyi sıfırla</button>
        <small style="color:var(--muted);font:600 11px var(--f-mono)">v1.2 · Stained Glass</small>
      </div>
    </div>`;
    E.modal.hidden = false;

    E.modal.querySelector('[data-a=close]').onclick = () => closeModal();
    E.modal.querySelector('[data-a=reset]').onclick = () => {
      if (!confirm('Tüm koleksiyon ve altın ilerlemesi silinsin mi?')) return;
      localStorage.removeItem(KEY);
      location.reload();
    };
    E.modal.querySelectorAll('[data-t]').forEach(t => t.onclick = () => {
      const k = t.dataset.t; store.settings[k] = !store.settings[k]; save();
      t.classList.toggle('on', store.settings[k]); t.setAttribute('aria-checked', store.settings[k]);
      if (k === 'cb') E.board.classList.toggle('cb', store.settings.cb);
      if (k === 'sound' && store.settings.sound) { Snd.init(); Snd.click(); }
    });
  }

  E.modal.addEventListener('click', ev => { if (ev.target === E.modal && !(currentScreen === 'game' && S && S.status === 'win')) closeModal(); });

  // keyboard shortcuts for desktop testing
  window.addEventListener('keydown', ev => {
    if (!E.modal.hidden) {
      if (ev.key === 'Escape') closeModal();
      else if ((ev.key === 'Enter' || ev.key === ' ') && currentScreen === 'game' && S && S.status === 'win') {
        ev.preventDefault();
        if (S.isDaily) goHome(); else startLevel(Math.min(MAX_LEVEL, S.idx + 1));
      }
      return;
    }
    if (currentScreen !== 'game' || !S) return;
    const n = parseInt(ev.key, 10);
    if (n >= 1 && n <= L.palette.length) selectPot(L.palette[n - 1]);
    else if (ev.key === 'z' || ev.key === 'Z') E.bUndo.click();
    else if (ev.key === 'r' || ev.key === 'R') E.bRestart.click();
    else if (ev.key === 'h' || ev.key === 'H') E.bHint.click();
    else if (ev.key === 'ArrowLeft' && !S.isDaily && S.idx > 1) startLevel(S.idx - 1);
    else if (ev.key === 'ArrowRight' && !S.isDaily && S.idx < MAX_LEVEL) startLevel(S.idx + 1);
  });
  window.addEventListener('resize', () => { if (currentScreen === 'game' && S && S.status === 'win') castRays(); });

  // ---------- boot ----------
  const qs = new URLSearchParams(location.search);
  const qLevel = parseInt(qs.get('level'), 10);

  if (qLevel >= 1) {
    startLevel(qLevel);
  } else if (qs.get('puzzle') === '1') {
    startDailyPuzzle();
  } else if (qs.get('collections') === '1' || qs.get('map') === '1') {
    goCollections();
  } else {
    goHome();
  }

  if (qs.get('shop') === '1') openShop();
  if (qs.get('daily') === '1') openDailyReward();
  if (qs.get('settings') === '1') openSettings();

  // ?demo=1 -> auto-plays the optimal solution
  if (qs.get('demo') === '1') {
    if (currentScreen !== 'game') startLevel(Math.min(MAX_LEVEL, Math.max(1, store.unlocked)));
    const step = () => {
      if (S.status === 'win') {
        setTimeout(() => { if (qs.get('chain') === '1') { startLevel(S.idx + 1); setTimeout(step, 500); } }, 1800);
        return;
      }
      if (S.status === 'play') {
        let mask = 0; S.fill.forEach((v, i) => { if (v != null) mask |= 1 << i; });
        const r = G.solveFrom(L.cells.length, activeDown(), L.target, mask);
        if (r) { selectPot(L.target[r.first], true); pour(r.first, L.cells[r.first].c); }
      }
      setTimeout(step, 550);
    };
    setTimeout(step, 450);
  }
})();
