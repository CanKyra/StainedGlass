/* Stained Glass - Economy, Monetization, Daily Rewards, Boosters & Shop Engine */
(function (root) {
  'use strict';

  const CONFIG = {
    startCoins: 600,
    winBase: 25,
    threeStarBonus: 15,
    firstWinBonus: 20,
    replayCoins: 8,
    replayStarBonus: 15,
    towerUnlockLevel: 10,
    towerBaseCoins: 30,
    towerPerFloor: 2,
    towerFloorCap: 60,
    towerThreeStar: 15,
    towerBossCoins: 300,
    streakBonusPerStep: 5,
    streakBonusCap: 25,
    freePourStreak: 3, // Streak >= 3 -> +1 free pour at level start
    piggyPerWin: 60,
    piggyThreeStar: 90,
    piggyCap: 3000,
    piggyMinBreak: 600,
    colCompleteCoins: 500,
    colMasterCoins: 1000,
    dailyPuzzleBase: 120,
    dailyPuzzlePerStreak: 25,
    dailyPuzzleStreakCap: 7,
    interstitialFromLevel: 10,
    interstitialEvery: 3,
    continuePrices: [450, 900, 1500],
    repairPrice: 350,
    rewardedCoins: 150,
    prices: {
      cool: 350,
      solder: 400,
      plus: 450,
      undo: 150,
      hint: 150,
    },
  };

  const BOOSTERS = {
    cool: { id: 'cool', icon: '❄', name: 'Soğut', desc: 'Sıradaki döküm açıklıklardan taşmaz', price: 350 },
    solder: { id: 'solder', icon: '🔗', name: 'Lehim', desc: 'Seçtiğin bir açıklığı kalıcı olarak kapatır', price: 400 },
    plus: { id: 'plus', icon: '+2', name: 'Döküm', desc: '+2 ekstra döküm hakkı verir', price: 450 },
    undo: { id: 'undo', icon: '↶', name: 'Geri al', desc: 'Son dökümü geri alır', price: 150 },
    hint: { id: 'hint', icon: '?', name: 'İpucu', desc: 'En az dökümlü 3★ sıradaki hamleyi gösterir', price: 150 },
  };

  const DAILY_REWARDS = [
    { day: 1, label: '100 🪙', desc: '100 Altın', coins: 100, icon: '🪙' },
    { day: 2, label: '150 🪙', desc: '150 Altın', coins: 150, icon: '🪙' },
    { day: 3, label: '2x ↶', desc: '2x Geri Al', inv: { undo: 2 }, icon: '↶' },
    { day: 4, label: '250 🪙', desc: '250 Altın', coins: 250, icon: '🪙' },
    { day: 5, label: '❄ + 🔗', desc: '1x Soğut + 1x Lehim', inv: { cool: 1, solder: 1 }, icon: '❄' },
    { day: 6, label: '400 🪙', desc: '400 Altın', coins: 400, icon: '🪙' },
    { day: 7, label: '800 🪙 + Paket', desc: '800 Altın + 1x (+2 Döküm) + 1x İpucu', coins: 800, inv: { plus: 1, hint: 1 }, icon: '🎁', big: true },
  ];

  const STAR_CHESTS = [
    { stars: 12, coins: 200, inv: { undo: 1 }, label: 'Bronz Sandık' },
    { stars: 36, coins: 350, inv: { cool: 1, solder: 1 }, label: 'Gümüş Sandık' },
    { stars: 72, coins: 600, inv: { plus: 1, solder: 1 }, label: 'Altın Sandık' },
    { stars: 108, coins: 900, inv: { cool: 2, solder: 2, plus: 1 }, label: 'Safir Sandık' },
    { stars: 144, coins: 1500, inv: { cool: 3, solder: 3, plus: 3 }, label: 'Katedral Tacı' },
    { stars: 200, coins: 1800, inv: { undo: 3, hint: 3 }, label: 'Prizma Sandığı' },
    { stars: 260, coins: 2200, inv: { cool: 3, solder: 3, plus: 2 }, label: 'Mühür Sandığı' },
    { stars: 320, coins: 2600, inv: { plus: 3, hint: 3 }, label: 'Fener Sandığı' },
    { stars: 380, coins: 3200, inv: { cool: 4, solder: 4, plus: 3 }, label: 'Saray Hazinesi' },
    { stars: 432, coins: 5000, inv: { cool: 5, solder: 5, plus: 5, undo: 5, hint: 5 }, label: 'Ustanın Tacı' },
  ];

  // ---------- Daily missions (three are drawn per day) ----------
  const MISSIONS = [
    { id: 'win3', type: 'win', goal: 3, text: '3 vitray tamamla', coins: 80 },
    { id: 'win5', type: 'win', goal: 5, text: '5 vitray tamamla', coins: 140, inv: { undo: 1 } },
    { id: 'star2', type: 'star3', goal: 2, text: '2 vitrayı 3★ ile bitir', coins: 110 },
    { id: 'star4', type: 'star3', goal: 4, text: '4 vitrayı 3★ ile bitir', coins: 180, inv: { hint: 1 } },
    { id: 'clean1', type: 'clean', goal: 1, text: 'Güçlendirici kullanmadan 1 vitray bitir', coins: 70 },
    { id: 'clean3', type: 'clean', goal: 3, text: 'Güçlendirici kullanmadan 3 vitray bitir', coins: 150, inv: { cool: 1 } },
    { id: 'chain3', type: 'chain', goal: 3, text: 'Tek dökümle 3+ bölmeyi 3 kez doldur', coins: 100 },
    { id: 'cells40', type: 'cells', goal: 40, text: '40 bölme doldur', coins: 80 },
    { id: 'cells80', type: 'cells', goal: 80, text: '80 bölme doldur', coins: 140, inv: { solder: 1 } },
    { id: 'daily1', type: 'daily', goal: 1, text: 'Günün Vitrayı\'nı tamamla', coins: 100 },
    { id: 'tower1', type: 'tower', goal: 1, text: 'Usta Kulesi\'nde 1 kat çık', coins: 90, needsTower: true },
    { id: 'tower3', type: 'tower', goal: 3, text: 'Usta Kulesi\'nde 3 kat çık', coins: 170, inv: { plus: 1 }, needsTower: true },
  ];
  const MISSION_BONUS = { coins: 150, inv: { hint: 1, cool: 1 } };

  // ---------- Achievements (metric values are supplied by the game) ----------
  const ACHIEVEMENTS = [
    { id: 'solved1', metric: 'solved', goal: 1, icon: '🪟', name: 'İlk Işık', desc: 'İlk vitrayını tamamla', coins: 50 },
    { id: 'solved24', metric: 'solved', goal: 24, icon: '🏛', name: 'Çırak Camcı', desc: '24 vitray tamamla', coins: 200 },
    { id: 'solved72', metric: 'solved', goal: 72, icon: '🏰', name: 'Kalfa Camcı', desc: '72 vitray tamamla', coins: 500 },
    { id: 'solved144', metric: 'solved', goal: 144, icon: '👑', name: 'Büyük Usta', desc: '144 vitrayın tamamını bitir', coins: 2000 },
    { id: 'stars100', metric: 'stars', goal: 100, icon: '⭐', name: 'Yıldız Toplayıcı', desc: '100 yıldız kazan', coins: 250 },
    { id: 'stars300', metric: 'stars', goal: 300, icon: '🌟', name: 'Takımyıldız', desc: '300 yıldız kazan', coins: 800 },
    { id: 'stars432', metric: 'stars', goal: 432, icon: '✨', name: 'Kusursuz Gökyüzü', desc: '432 yıldızın tamamını kazan', coins: 3000 },
    { id: 'perfect10', metric: 'perfect', goal: 10, icon: '💎', name: 'Keskin Göz', desc: '10 vitrayı 3★ ile bitir', coins: 150 },
    { id: 'perfect50', metric: 'perfect', goal: 50, icon: '🔷', name: 'Kusursuz Döküm', desc: '50 vitrayı 3★ ile bitir', coins: 600 },
    { id: 'clean10', metric: 'clean', goal: 10, icon: '🧤', name: 'Yalın Usta', desc: 'Güçlendiricisiz 10 vitray bitir', coins: 200 },
    { id: 'clean50', metric: 'clean', goal: 50, icon: '🖐', name: 'Saf Zanaat', desc: 'Güçlendiricisiz 50 vitray bitir', coins: 700 },
    { id: 'chain5', metric: 'chain', goal: 5, icon: '🌊', name: 'Cam Selâlesi', desc: 'Tek dökümle 5 bölme doldur', coins: 200 },
    { id: 'chain8', metric: 'chain', goal: 8, icon: '🌋', name: 'Erimiş Nehir', desc: 'Tek dökümle 8 bölme doldur', coins: 500 },
    { id: 'streak10', metric: 'streak', goal: 10, icon: '🔥', name: 'Söndürülemez', desc: '10 vitraylık kazanma serisi yap', coins: 300 },
    { id: 'daily7', metric: 'daily', goal: 7, icon: '📅', name: 'Sadık Çırak', desc: 'Günün Vitrayı\'nı 7 gün üst üste bitir', coins: 400 },
    { id: 'daily30', metric: 'daily', goal: 30, icon: '🗓', name: 'Atölye Ruhu', desc: 'Günün Vitrayı\'nı 30 gün üst üste bitir', coins: 1500 },
    { id: 'tower10', metric: 'tower', goal: 10, icon: '🗼', name: 'Kule Bekçisi', desc: 'Usta Kulesi\'nde 10. katı geç', coins: 300 },
    { id: 'tower30', metric: 'tower', goal: 30, icon: '🏯', name: 'Bulut Katı', desc: 'Usta Kulesi\'nde 30. katı geç', coins: 900 },
    { id: 'tower75', metric: 'tower', goal: 75, icon: '🌌', name: 'Göğe Değen', desc: 'Usta Kulesi\'nde 75. katı geç', coins: 2500 },
    { id: 'cols3', metric: 'cols', goal: 3, icon: '📚', name: 'Koleksiyoncu', desc: '3 koleksiyonu tamamla', coins: 400 },
    { id: 'cols12', metric: 'cols', goal: 12, icon: '🏆', name: 'Müze Küratörü', desc: '12 koleksiyonun tamamını bitir', coins: 2500 },
    { id: 'masters3', metric: 'masters', goal: 3, icon: '🎖', name: 'Koleksiyon Ustası', desc: '3 koleksiyonu 36★ ile bitir', coins: 1000 },
    { id: 'missions25', metric: 'missions', goal: 25, icon: '📜', name: 'Görev Adamı', desc: '25 günlük görev tamamla', coins: 500 },
    { id: 'cells1000', metric: 'cells', goal: 1000, icon: '🫗', name: 'Bin Bölme', desc: 'Toplam 1.000 bölme doldur', coins: 400 },
  ];

  const IAP_PRODUCTS = [
    {
      id: 'starter',
      product: 'com.cankyra.stainedglass.starterpack',
      type: 'CONSUMABLE',
      name: 'Başlangıç Paketi',
      desc: '1.500 Altın + Her güçlendiriciden 2 adet + Reklamsız',
      usd: 1.99,
      tryPrice: '69,99 ₺',
      coins: 1500,
      boosters: { cool: 2, solder: 2, plus: 2, undo: 2, hint: 2 },
      noAds: true,
      once: true,
      tag: 'TEK SEFERLİK · %70 İNDİRİM',
    },
    {
      id: 'piggy',
      product: 'com.cankyra.stainedglass.piggybank',
      type: 'CONSUMABLE',
      name: 'Vitray Kumbarası',
      desc: 'Her vitrayda biriken altınları kırıp topla (3.000 altına kadar)',
      usd: 2.99,
      tryPrice: '99,99 ₺',
      isPiggy: true,
      tag: 'BİRİKEN HAZİNE',
    },
    {
      id: 'noads',
      product: 'com.cankyra.stainedglass.noads',
      type: 'NON_CONSUMABLE',
      name: 'Reklamsız + 1.000 Altın',
      desc: 'Zorunlu geçiş reklamlarını kalıcı kaldırır ve 1.000 altın verir',
      usd: 4.99,
      tryPrice: '169,99 ₺',
      coins: 1000,
      noAds: true,
      tag: 'KALICI',
    },
    {
      id: 'bundle',
      product: 'com.cankyra.stainedglass.atelierpack',
      type: 'CONSUMABLE',
      name: 'Usta Atölye Paketi',
      desc: '2.000 Altın + Her güçlendiriciden 3 adet',
      usd: 4.99,
      tryPrice: '169,99 ₺',
      coins: 2000,
      boosters: { cool: 3, solder: 3, plus: 3, undo: 3, hint: 3 },
      tag: 'AVANTAJLI',
    },
    {
      id: 'c1',
      product: 'com.cankyra.stainedglass.coins1000',
      type: 'CONSUMABLE',
      name: '1.000 Altın',
      desc: 'Küçük altın kesesi',
      usd: 1.99,
      tryPrice: '69,99 ₺',
      coins: 1000,
    },
    {
      id: 'c2',
      product: 'com.cankyra.stainedglass.coins2800',
      type: 'CONSUMABLE',
      name: '2.800 Altın',
      desc: 'En popüler · %40 daha fazla',
      usd: 4.99,
      tryPrice: '169,99 ₺',
      coins: 2800,
      hot: true,
      tag: 'EN POPÜLER',
    },
    {
      id: 'c3',
      product: 'com.cankyra.stainedglass.coins6000',
      type: 'CONSUMABLE',
      name: '6.000 Altın',
      desc: 'Atölye sandığı · %50 daha fazla',
      usd: 9.99,
      tryPrice: '349,99 ₺',
      coins: 6000,
    },
    {
      id: 'c4',
      product: 'com.cankyra.stainedglass.coins13000',
      type: 'CONSUMABLE',
      name: '13.000 Altın',
      desc: 'Katedral hazinesi · %65 daha fazla',
      usd: 19.99,
      tryPrice: '699,99 ₺',
      coins: 13000,
    },
  ];

  // Calendar day number. Uses the local date directly so DST changes never repeat or skip a day.
  function localToday() {
    const now = new Date();
    return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  }
  function legacyToday() {
    const now = new Date();
    return Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000);
  }

  function createDefaultState() {
    return {
      coins: CONFIG.startCoins,
      streak: 0,
      piggy: 300,
      inv: { cool: 2, solder: 2, plus: 1, undo: 3, hint: 3 },
      noAds: false,
      payer: false,
      starterBought: false,
      usdSpent: 0,
      winsSinceInter: 0,
      claimedCols: {},
      claimedMasterCols: {},
      claimedStarChests: {},
      rewardDay: -1,
      rewardIdx: -1,
      puzzleDay: -1,
      puzzleStreak: 0,
      puzzleBest: 0,
      towerFloor: 1,
      towerBest: 0,
      missions: null,
      claimedAch: {},
      notifiedAch: {},
      stats: { clean: 0, maxChain: 0, maxStreak: 0, cells: 0, missions: 0 },
      events: [],
    };
  }

  class Economy {
    constructor(saved, onSave) {
      this.onSave = onSave || (() => {});
      const def = createDefaultState();
      this.d = Object.assign({}, def, saved || {});
      this.d.inv = Object.assign({}, def.inv, (saved && saved.inv) || {});
      this.d.claimedCols = Object.assign({}, (saved && saved.claimedCols) || {});
      this.d.claimedMasterCols = Object.assign({}, (saved && saved.claimedMasterCols) || {});
      this.d.claimedStarChests = Object.assign({}, (saved && saved.claimedStarChests) || {});
      this.d.claimedAch = Object.assign({}, (saved && saved.claimedAch) || {});
      this.d.notifiedAch = Object.assign({}, (saved && saved.notifiedAch) || {});
      this.d.stats = Object.assign({}, def.stats, (saved && saved.stats) || {});
      // Saves from the old day counter: keep login and puzzle streaks alive across the change
      if (saved && !saved.dayV2) {
        const shift = localToday() - legacyToday();
        if (shift) {
          if (this.d.rewardDay >= 0) this.d.rewardDay += shift;
          if (this.d.puzzleDay >= 0) this.d.puzzleDay += shift;
        }
      }
      this.d.dayV2 = true;
    }

    grant(reward) {
      if (reward.coins) this.d.coins += reward.coins;
      if (reward.inv) for (const k in reward.inv) this.d.inv[k] = (this.d.inv[k] || 0) + reward.inv[k];
    }

    toJSON() {
      return this.d;
    }

    save() {
      this.onSave(this.d);
    }

    track(ev, props) {
      this.d.events = (this.d.events || []).slice(-40);
      this.d.events.push(Object.assign({ ev, t: Date.now() }, props || {}));
    }

    earn(amount, reason) {
      amount = Math.max(0, Math.round(amount));
      this.d.coins += amount;
      this.track('coins_earned', { amount, reason, balance: this.d.coins });
      this.save();
      return this.d.coins;
    }

    spend(amount, item) {
      if (this.d.coins < amount) return false;
      this.d.coins -= amount;
      this.track('coins_spent', { amount, item, balance: this.d.coins });
      this.save();
      return true;
    }

    hasBooster(k) {
      return (this.d.inv[k] || 0) > 0;
    }

    useBooster(k) {
      if ((this.d.inv[k] || 0) <= 0) return false;
      this.d.inv[k]--;
      this.track('booster_used', { id: k, rem: this.d.inv[k] });
      this.save();
      return true;
    }

    addBooster(k, count = 1) {
      this.d.inv[k] = (this.d.inv[k] || 0) + count;
      this.save();
    }

    buyBoosterWithCoins(k) {
      const price = CONFIG.prices[k] || 300;
      if (!this.spend(price, 'booster_' + k)) return false;
      this.addBooster(k, 1);
      return true;
    }

    continuePrice(continuesUsed) {
      const arr = CONFIG.continuePrices;
      return arr[Math.min(continuesUsed, arr.length - 1)];
    }

    extraStartPours() {
      return this.d.streak >= CONFIG.freePourStreak ? 1 : 0;
    }

    onLevelWin({ stars, isFirstWin, newStars }) {
      // Replays pay a small fee plus any newly earned stars, so old levels cannot be farmed
      if (!isFirstWin) {
        const totalEarned = CONFIG.replayCoins + Math.max(0, newStars || 0) * CONFIG.replayStarBonus;
        this.d.winsSinceInter = (this.d.winsSinceInter || 0) + 1;
        this.earn(totalEarned, 'level_replay');
        return { totalEarned, streak: this.d.streak || 0, piggyAdded: 0, piggyTotal: this.d.piggy, isReplay: true };
      }
      this.d.streak = (this.d.streak || 0) + 1;
      this.d.stats.maxStreak = Math.max(this.d.stats.maxStreak || 0, this.d.streak);
      const base = CONFIG.winBase + (stars === 3 ? CONFIG.threeStarBonus : 0);
      const first = isFirstWin ? CONFIG.firstWinBonus : 0;
      const streakBonus = Math.min(CONFIG.streakBonusCap, this.d.streak * CONFIG.streakBonusPerStep);
      const totalEarned = base + first + streakBonus;

      const piggyAdd = stars === 3 ? CONFIG.piggyThreeStar : CONFIG.piggyPerWin;
      const prevPiggy = this.d.piggy;
      this.d.piggy = Math.min(CONFIG.piggyCap, this.d.piggy + piggyAdd);
      const actualPiggyAdded = this.d.piggy - prevPiggy;

      this.d.winsSinceInter = (this.d.winsSinceInter || 0) + 1;
      this.earn(totalEarned, 'level_win');
      return {
        totalEarned,
        base,
        first,
        streakBonus,
        streak: this.d.streak,
        piggyAdded: actualPiggyAdded,
        piggyTotal: this.d.piggy,
      };
    }

    onLevelFailReset() {
      if (this.d.streak > 0) {
        this.track('streak_lost', { streak: this.d.streak });
        this.d.streak = 0;
        this.save();
      }
    }

    // ---------- Daily Login Reward (7-day cycle) ----------
    canClaimDaily(today = localToday()) {
      return this.d.rewardDay !== today;
    }

    currentDailyIndex(today = localToday()) {
      if (!this.canClaimDaily(today)) return Math.max(0, this.d.rewardIdx);
      if (this.d.rewardDay === today - 1) return (this.d.rewardIdx + 1) % DAILY_REWARDS.length;
      return 0;
    }

    claimDaily(today = localToday()) {
      if (!this.canClaimDaily(today)) return null;
      const idx = this.currentDailyIndex(today);
      const r = DAILY_REWARDS[idx];
      this.d.rewardDay = today;
      this.d.rewardIdx = idx;
      if (r.coins) this.d.coins += r.coins;
      if (r.inv) {
        for (const k in r.inv) {
          this.d.inv[k] = (this.d.inv[k] || 0) + r.inv[k];
        }
      }
      this.track('daily_reward_claimed', { day: r.day, coins: r.coins || 0 });
      this.save();
      return r;
    }

    // ---------- Daily Stained Glass Puzzle ----------
    isDailyPuzzleDone(today = localToday()) {
      return this.d.puzzleDay === today;
    }

    dailyPuzzleStreakAlive(today = localToday()) {
      return this.d.puzzleDay >= today - 1 ? (this.d.puzzleStreak || 0) : 0;
    }

    dailyPuzzleStreakIfWon(today = localToday()) {
      if (this.isDailyPuzzleDone(today)) return this.d.puzzleStreak || 1;
      return this.d.puzzleDay === today - 1 ? (this.d.puzzleStreak || 0) + 1 : 1;
    }

    onDailyPuzzleWin(today = localToday()) {
      if (this.isDailyPuzzleDone(today)) {
        return { alreadyDone: true, streak: this.d.puzzleStreak || 1, coins: 0, piggyAdded: 0, piggyTotal: this.d.piggy };
      }
      const s = this.dailyPuzzleStreakIfWon(today);
      this.d.puzzleDay = today;
      this.d.puzzleStreak = s;
      this.d.puzzleBest = Math.max(this.d.puzzleBest || 0, s);
      const coins = CONFIG.dailyPuzzleBase + Math.min(s, CONFIG.dailyPuzzleStreakCap) * CONFIG.dailyPuzzlePerStreak;
      const prevPiggy = this.d.piggy;
      this.d.piggy = Math.min(CONFIG.piggyCap, this.d.piggy + 90);
      this.earn(coins, 'daily_puzzle_win');
      return {
        alreadyDone: false,
        streak: s,
        coins,
        piggyAdded: this.d.piggy - prevPiggy,
        piggyTotal: this.d.piggy,
      };
    }

    // ---------- Master's Tower ----------
    towerFloorReward(floor) {
      const capped = Math.min(floor, CONFIG.towerFloorCap);
      return CONFIG.towerBaseCoins + capped * CONFIG.towerPerFloor;
    }

    onTowerWin({ floor, stars }) {
      const firstClear = floor >= (this.d.towerFloor || 1);
      if (!firstClear) {
        return { totalEarned: 0, floor, streak: this.d.streak || 0, piggyAdded: 0, piggyTotal: this.d.piggy, isReplay: true };
      }
      const isBoss = floor % 10 === 0;
      let totalEarned = this.towerFloorReward(floor) + (stars === 3 ? CONFIG.towerThreeStar : 0);
      if (isBoss) {
        totalEarned += CONFIG.towerBossCoins;
        this.d.inv.cool = (this.d.inv.cool || 0) + 1;
        this.d.inv.solder = (this.d.inv.solder || 0) + 1;
      }
      const prevPiggy = this.d.piggy;
      this.d.piggy = Math.min(CONFIG.piggyCap, this.d.piggy + CONFIG.piggyPerWin);
      this.d.towerFloor = floor + 1;
      this.d.towerBest = Math.max(this.d.towerBest || 0, floor);
      this.d.winsSinceInter = (this.d.winsSinceInter || 0) + 1;
      this.earn(totalEarned, 'tower_floor');
      return { totalEarned, floor, isBoss, streak: this.d.streak || 0, piggyAdded: this.d.piggy - prevPiggy, piggyTotal: this.d.piggy };
    }

    // ---------- Daily Missions ----------
    ensureMissions(towerOpen, today = localToday()) {
      const cur = this.d.missions;
      if (cur && cur.day === today) return cur;
      const pool = MISSIONS.filter(m => towerOpen || !m.needsTower);
      let seed = (today * 2654435761) >>> 0;
      const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      const picked = [], types = new Set();
      for (let guard = 0; picked.length < 3 && guard < 200; guard++) {
        const m = pool[Math.floor(next() * pool.length)];
        if (types.has(m.type)) continue;
        types.add(m.type); picked.push(m.id);
      }
      this.d.missions = { day: today, ids: picked, prog: {}, claimed: {}, bonus: false };
      this.save();
      return this.d.missions;
    }

    // Returns the missions completed by this update
    bumpMission(type, amount = 1, today = localToday()) {
      const cur = this.d.missions;
      if (!cur || cur.day !== today) return [];
      const finished = [];
      cur.ids.forEach(id => {
        const m = MISSIONS.find(x => x.id === id);
        if (!m || m.type !== type) return;
        const before = cur.prog[id] || 0;
        const after = Math.min(m.goal, before + amount);
        cur.prog[id] = after;
        if (before < m.goal && after >= m.goal) finished.push(m);
      });
      if (finished.length) this.save();
      return finished;
    }

    claimMission(id, today = localToday()) {
      const cur = this.d.missions;
      const m = MISSIONS.find(x => x.id === id);
      if (!cur || cur.day !== today || !m || !cur.ids.includes(id)) return null;
      if (cur.claimed[id] || (cur.prog[id] || 0) < m.goal) return null;
      cur.claimed[id] = true;
      this.d.stats.missions = (this.d.stats.missions || 0) + 1;
      this.grant(m);
      this.track('mission_claimed', { id });
      this.save();
      return m;
    }

    claimMissionBonus(today = localToday()) {
      const cur = this.d.missions;
      if (!cur || cur.day !== today || cur.bonus) return null;
      if (!cur.ids.every(id => cur.claimed[id])) return null;
      cur.bonus = true;
      this.grant(MISSION_BONUS);
      this.track('mission_bonus', {});
      this.save();
      return MISSION_BONUS;
    }

    missionClaimableCount(today = localToday()) {
      const cur = this.d.missions;
      if (!cur || cur.day !== today) return 0;
      let n = cur.ids.filter(id => {
        const m = MISSIONS.find(x => x.id === id);
        return m && !cur.claimed[id] && (cur.prog[id] || 0) >= m.goal;
      }).length;
      if (!cur.bonus && cur.ids.every(id => cur.claimed[id])) n++;
      return n;
    }

    // ---------- Achievements ----------
    achievementReady(a, metrics) {
      return !this.d.claimedAch[a.id] && (metrics[a.metric] || 0) >= a.goal;
    }

    claimAchievement(id, metrics) {
      const a = ACHIEVEMENTS.find(x => x.id === id);
      if (!a || !this.achievementReady(a, metrics)) return null;
      this.d.claimedAch[id] = true;
      this.grant(a);
      this.track('achievement_claimed', { id });
      this.save();
      return a;
    }

    // Achievements that became claimable since the player was last told about them
    takeNewAchievements(metrics) {
      const fresh = ACHIEVEMENTS.filter(a => this.achievementReady(a, metrics) && !this.d.notifiedAch[a.id]);
      if (fresh.length) {
        fresh.forEach(a => { this.d.notifiedAch[a.id] = true; });
        this.save();
      }
      return fresh;
    }

    // ---------- Star Chest Milestones ----------
    claimableStarChests(totalStars) {
      return STAR_CHESTS.filter(c => totalStars >= c.stars && !this.d.claimedStarChests[c.stars]);
    }

    claimStarChest(starTarget, totalStars) {
      const chest = STAR_CHESTS.find(c => c.stars === starTarget);
      if (!chest || totalStars < chest.stars || this.d.claimedStarChests[starTarget]) return null;
      this.d.claimedStarChests[starTarget] = true;
      if (chest.coins) this.d.coins += chest.coins;
      if (chest.inv) {
        for (const k in chest.inv) {
          this.d.inv[k] = (this.d.inv[k] || 0) + chest.inv[k];
        }
      }
      this.track('star_chest_claimed', { stars: starTarget, coins: chest.coins });
      this.save();
      return chest;
    }

    shouldShowInterstitial(levelIdx) {
      if (this.d.noAds || this.d.payer) return false;
      if (levelIdx < CONFIG.interstitialFromLevel) return false;
      if (this.d.winsSinceInter >= CONFIG.interstitialEvery) {
        this.d.winsSinceInter = 0;
        this.save();
        return true;
      }
      return false;
    }

    purchaseIAP(packId) {
      const p = IAP_PRODUCTS.find(x => x.id === packId);
      if (!p) return null;
      if (p.once && this.d.starterBought) return null;
      if (p.id === 'noads' && this.d.noAds) return null;

      let coinsAdded = p.coins || 0;
      if (p.isPiggy) {
        if (this.d.piggy < CONFIG.piggyMinBreak) return null;
        coinsAdded = this.d.piggy;
        this.d.piggy = 0;
      }
      if (coinsAdded > 0) this.d.coins += coinsAdded;
      if (p.boosters) {
        for (const k in p.boosters) {
          this.d.inv[k] = (this.d.inv[k] || 0) + p.boosters[k];
        }
      }
      if (p.noAds) this.d.noAds = true;
      if (p.once) this.d.starterBought = true;
      this.d.payer = true;
      this.d.usdSpent = +(this.d.usdSpent + p.usd).toFixed(2);
      this.track('iap_purchased', { id: p.id, usd: p.usd, coinsAdded });
      this.save();
      return { pack: p, coinsAdded };
    }
  }

  const api = { Economy, CONFIG, BOOSTERS, DAILY_REWARDS, STAR_CHESTS, MISSIONS, MISSION_BONUS, ACHIEVEMENTS, IAP_PRODUCTS, localToday, createDefaultState };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SGEcon = api;
})(typeof window !== 'undefined' ? window : globalThis);
