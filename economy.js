/* Stained Glass - Economy, Monetization, Boosters & Shop Engine */
(function (root) {
  'use strict';

  const CONFIG = {
    startCoins: 600,
    winBase: 25,
    threeStarBonus: 15,
    firstWinBonus: 20,
    streakBonusPerStep: 5,
    streakBonusCap: 25,
    freePourStreak: 3, // Streak >= 3 -> +1 free pour at level start
    piggyPerWin: 60,
    piggyThreeStar: 90,
    piggyCap: 3000,
    piggyMinBreak: 600,
    colCompleteCoins: 500,
    colMasterCoins: 1000,
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

    onLevelWin({ stars, isFirstWin }) {
      this.d.streak = (this.d.streak || 0) + 1;
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

  const api = { Economy, CONFIG, BOOSTERS, IAP_PRODUCTS, createDefaultState };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SGEcon = api;
})(typeof window !== 'undefined' ? window : globalThis);
