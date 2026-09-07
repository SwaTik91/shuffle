export const START_BALANCE = 1000;
export const BET_STEPS = [1, 2, 5, 10];
export const DEFAULT_LINES = 10;
export const DEFAULT_BET = 1;
export const MIN_LINES = 1;
export const MAX_LINES = 10;
export const STORAGE_KEY = "dragon-scroll-v1";
export const FREE_SPINS = 10;
export const SCROLL = "scroll";

export const SYMBOLS = [
  "dragon",
  "phoenix",
  "lion",
  "coin",
  "lantern",
  "ace",
  "king",
  "queen",
  "jack",
  "scroll",
];

export const REGULAR_SYMBOLS = SYMBOLS.filter((id) => id !== SCROLL);

export const PAYS = {
  dragon: { 2: 10, 3: 100, 4: 1000, 5: 5000 },
  phoenix: { 2: 5, 3: 40, 4: 400, 5: 2000 },
  lion: { 2: 5, 3: 30, 4: 200, 5: 1000 },
  coin: { 3: 20, 4: 80, 5: 400 },
  lantern: { 3: 15, 4: 50, 5: 200 },
  ace: { 3: 10, 4: 40, 5: 120 },
  king: { 3: 8, 4: 30, 5: 100 },
  queen: { 3: 5, 4: 25, 5: 80 },
  jack: { 3: 5, 4: 20, 5: 60 },
};

export const SCATTER_MULT = { 3: 2, 4: 20, 5: 200 };

/** Target long-run return at 10 lines. Tuned by scripts/simulate-rtp.mjs */
export const TARGET_RTP = 0.95;
export const TARGET_RTP_RANGE = { min: 0.94, max: 0.96 };

export const LINES = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
];

/**
 * Place rarer symbols first with even spacing so a virtual reel
 * behaves like a physical strip, not a clump of identical tiles.
 */
export function buildStrip(counts) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const strip = Array(total).fill(null);
  const entries = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
  for (const [id, n] of entries) {
    const empties = [];
    for (let i = 0; i < total; i += 1) if (strip[i] === null) empties.push(i);
    for (let k = 0; k < n; k += 1) {
      const slot = Math.floor(((k + 0.5) * empties.length) / n);
      strip[empties[slot]] = id;
    }
  }
  return strip;
}

/**
 * Virtual reels. Weights are chosen so a 10-line Monte Carlo lands
 * near 95% RTP (see scripts/simulate-rtp.mjs). Highs and scrolls are rare;
 * lows fill the rest. Do not copy a commercial cabinet's strips.
 */
const LOW_FILL = { coin: 4, lantern: 6, ace: 5, king: 6, queen: 6, jack: 6 };

export const REEL_STRIPS = [
  buildStrip({ dragon: 1, phoenix: 1, lion: 2, ...LOW_FILL, scroll: 1 }),
  buildStrip({ dragon: 1, phoenix: 2, lion: 1, ...LOW_FILL, scroll: 1 }),
  buildStrip({ dragon: 1, phoenix: 1, lion: 1, ...LOW_FILL, scroll: 1 }),
  buildStrip({ dragon: 1, phoenix: 1, lion: 1, ...LOW_FILL, scroll: 1 }),
  buildStrip({ dragon: 1, phoenix: 1, lion: 1, ...LOW_FILL, scroll: 1 }),
];

export const ASSETS = {
  background: "assets/ui-background.jpg",
  logo: "assets/ui-logo.jpg",
  machine: "assets/ui-machine.jpg",
  spin: "assets/ui-spin.jpg",
  bonus: "assets/ui-bonus.jpg",
  meter: "assets/ui-meter.jpg",
};

export const SYMBOL_META = {
  dragon: { mark: "龍", name: "Дракон", image: "assets/symbol-dragon.jpg" },
  phoenix: { mark: "鳳", name: "Феникс", image: "assets/symbol-phoenix.jpg" },
  lion: { mark: "獅", name: "Лев", image: "assets/symbol-lion.jpg" },
  coin: { mark: "錢", name: "Монета", image: "assets/symbol-coin.jpg" },
  lantern: { mark: "燈", name: "Фонарь", image: "assets/symbol-lantern.jpg" },
  ace: { mark: "A", name: "Туз", image: "assets/symbol-ace.jpg" },
  king: { mark: "K", name: "Король", image: "assets/symbol-king.jpg" },
  queen: { mark: "Q", name: "Дама", image: "assets/symbol-queen.jpg" },
  jack: { mark: "J", name: "Валет", image: "assets/symbol-jack.jpg" },
  scroll: { mark: "卷", name: "Свиток", image: "assets/symbol-scroll.jpg" },
};

export const COPY = {
  title: "Свиток Дракона",
  subtitle: "Песочница · фейковые кредиты",
  balance: "Баланс",
  totalBet: "Ставка",
  lines: "Линии",
  bet: "Монета",
  spin: "Крутить",
  paytable: "Таблица выплат",
  restore: "Восстановить 1000",
  win: "Выигрыш",
  freeSpins: "Фриспины",
  expanding: "Расширяющийся символ",
  continue: "Нажмите, чтобы продолжить",
  bonusTitle: "10 фриспинов",
  bonusBody: "Свитки открыли бонус. Этот символ будет расширяться.",
  paytableRules:
    "Выигрыши слева направо по активным линиям. Свиток заменяет любой символ на линии и считает скаттером: 3 и больше в любом месте дают 10 фриспинов. Во фриспинах выбранный символ расширяет барабан и платит по числу таких барабанов на все активные линии.",
  scatterLabel: "Скаттер (к общей ставке)",
  rtpLabel: "Теоретический возврат",
  rtpBody:
    "Около 95% при 10 линиях на длинной дистанции. Каждый спин независим: результат фиксируется в момент нажатия, барабаны только показывают его.",
};
