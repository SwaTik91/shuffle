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

function strip(counts) {
  return Object.entries(counts).flatMap(([id, n]) => Array(n).fill(id));
}

export const REEL_STRIPS = [
  strip({ dragon: 2, phoenix: 3, lion: 3, coin: 4, lantern: 4, ace: 5, king: 5, queen: 6, jack: 6, scroll: 3 }),
  strip({ dragon: 2, phoenix: 3, lion: 3, coin: 4, lantern: 4, ace: 5, king: 5, queen: 6, jack: 6, scroll: 2 }),
  strip({ dragon: 2, phoenix: 3, lion: 3, coin: 4, lantern: 4, ace: 5, king: 5, queen: 6, jack: 6, scroll: 2 }),
  strip({ dragon: 2, phoenix: 3, lion: 3, coin: 4, lantern: 4, ace: 5, king: 5, queen: 6, jack: 6, scroll: 2 }),
  strip({ dragon: 2, phoenix: 3, lion: 3, coin: 4, lantern: 4, ace: 5, king: 5, queen: 6, jack: 6, scroll: 1 }),
];

export const SYMBOL_META = {
  dragon: { mark: "龍", name: "Дракон" },
  phoenix: { mark: "鳳", name: "Феникс" },
  lion: { mark: "獅", name: "Лев" },
  coin: { mark: "錢", name: "Монета" },
  lantern: { mark: "燈", name: "Фонарь" },
  ace: { mark: "A", name: "Туз" },
  king: { mark: "K", name: "Король" },
  queen: { mark: "Q", name: "Дама" },
  jack: { mark: "J", name: "Валет" },
  scroll: { mark: "卷", name: "Свиток" },
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
};
