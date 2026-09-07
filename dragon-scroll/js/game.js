import { BET_STEPS, COPY, FREE_SPINS, MAX_LINES, MIN_LINES, START_BALANCE } from "./config.js";
import {
  canSpin,
  evaluateBase,
  evaluateFeature,
  pickExpandingSymbol,
  spinReels,
  totalBet,
} from "./engine.js";
import {
  animateReelSpin,
  bindChrome,
  paytableHtml,
  renderReels,
  scatterCells,
  setBusy,
  showOverlay,
  tickNumber,
  updateMeters,
} from "./ui.js";

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function randomGrid(rng) {
  return spinReels(rng);
}

const DEMO_BONUS_GRID = [
  ["scroll", "jack", "queen"],
  ["ace", "scroll", "king"],
  ["coin", "lantern", "scroll"],
  ["jack", "lion", "ace"],
  ["queen", "phoenix", "king"],
];

const DEMO_LINE_GRID = [
  ["jack", "dragon", "queen"],
  ["ace", "dragon", "king"],
  ["coin", "dragon", "lantern"],
  ["jack", "lion", "ace"],
  ["queen", "phoenix", "king"],
];

function extraHighlights(grid, scatter, expandWin) {
  const extras = [];
  if (expandWin?.amount && expandWin.reels?.length) {
    extras.push({ kind: "expand", reels: expandWin.reels });
  }
  if (scatter?.amount) {
    extras.push({ kind: "scatter", cells: scatterCells(grid) });
  }
  return extras;
}

export function createGame({ doc, storage, rng = Math.random, demo = null }) {
  const session = storage.load();
  if (demo === "broke") session.balance = 3;
  let state = {
    ...session,
    win: 0,
    busy: false,
    freeSpinsLeft: 0,
    expandingSymbol: null,
    lastGrid: randomGrid(rng),
  };

  const reelsEl = doc.querySelector("[data-reels]");
  const winEl = doc.querySelector("[data-win]");

  function persist() {
    storage.save({
      balance: state.balance,
      lines: state.lines,
      betPerLine: state.betPerLine,
    });
  }

  function refresh(highlights = []) {
    renderReels(reelsEl, state.lastGrid, highlights);
    updateMeters(doc, {
      balance: state.balance,
      totalBet: totalBet(state.lines, state.betPerLine),
      win: state.win,
      lines: state.lines,
      betPerLine: state.betPerLine,
      freeSpinsLeft: state.freeSpinsLeft,
    });
    setBusy(doc, state.busy, canSpin(state.balance, state.lines, state.betPerLine) || state.freeSpinsLeft > 0);
  }

  async function animateLand(grid) {
    await animateReelSpin(reelsEl, state.lastGrid, grid, rng);
    state.lastGrid = grid;
    renderReels(reelsEl, grid);
  }

  async function presentWins(lineWins, extraAmount, beforeBalance, extras = []) {
    const lineTotal = lineWins.reduce((sum, win) => sum + win.amount, 0);
    const total = lineTotal + extraAmount;
    if (total <= 0) {
      state.win = 0;
      refresh();
      return;
    }
    for (const win of lineWins) {
      refresh([win]);
      await delay(800);
    }
    const all = [...lineWins, ...extras];
    refresh(all);
    await tickNumber(winEl, 0, total, 450);
    state.win = total;
    state.balance = beforeBalance + total;
    persist();
    refresh(all);
  }

  async function runFeature() {
    state.expandingSymbol = pickExpandingSymbol(rng);
    state.freeSpinsLeft = FREE_SPINS;
    refresh();
    await new Promise((resolve) => {
      showOverlay(doc, {
        title: COPY.bonusTitle,
        body: COPY.bonusBody,
        symbol: state.expandingSymbol,
        onDone: resolve,
      });
    });
    while (state.freeSpinsLeft > 0) {
      state.freeSpinsLeft -= 1;
      const grid = randomGrid(rng);
      await animateLand(grid);
      const feature = evaluateFeature(grid, state.expandingSymbol, state.lines, state.betPerLine);
      state.lastGrid = feature.grid;
      const extra = feature.expandWin.amount + feature.scatter.amount;
      await presentWins(
        feature.lineWins,
        extra,
        state.balance,
        extraHighlights(feature.grid, feature.scatter, feature.expandWin)
      );
      if (feature.retrigger) state.freeSpinsLeft += feature.extraSpins;
      refresh();
      await delay(350);
    }
    state.expandingSymbol = null;
  }

  async function spin() {
    if (state.busy) return;
    const free = state.freeSpinsLeft > 0;
    if (!free && !canSpin(state.balance, state.lines, state.betPerLine)) return;
    state.busy = true;
    state.win = 0;
    if (!free) {
      state.balance -= totalBet(state.lines, state.betPerLine);
      persist();
    }
    refresh();
    const grid =
      demo === "bonus" && !free
        ? DEMO_BONUS_GRID
        : demo === "line" && !free
          ? DEMO_LINE_GRID
          : randomGrid(rng);
    await animateLand(grid);
    const result = evaluateBase(grid, state.lines, state.betPerLine);
    await presentWins(
      result.lineWins,
      result.scatter.amount,
      state.balance,
      extraHighlights(grid, result.scatter, null)
    );
    if (result.trigger) await runFeature();
    state.busy = false;
    refresh();
  }

  function changeLines(delta) {
    if (state.busy || state.freeSpinsLeft) return;
    state.lines = Math.min(MAX_LINES, Math.max(MIN_LINES, state.lines + delta));
    persist();
    refresh();
  }

  function changeBet(delta) {
    if (state.busy || state.freeSpinsLeft) return;
    const index = BET_STEPS.indexOf(state.betPerLine);
    const next = BET_STEPS[index + delta];
    if (next) state.betPerLine = next;
    persist();
    refresh();
  }

  function restore() {
    if (state.busy) return;
    state.balance = START_BALANCE;
    persist();
    refresh();
  }

  bindChrome(doc);
  doc.querySelector("[data-paytable-body]").innerHTML = paytableHtml();
  doc.querySelector("[data-spin]").addEventListener("click", () => spin());
  doc.querySelector("[data-lines-minus]").addEventListener("click", () => changeLines(-1));
  doc.querySelector("[data-lines-plus]").addEventListener("click", () => changeLines(1));
  doc.querySelector("[data-coin-minus]").addEventListener("click", () => changeBet(-1));
  doc.querySelector("[data-coin-plus]").addEventListener("click", () => changeBet(1));
  doc.querySelector("[data-restore]").addEventListener("click", restore);
  doc.querySelector("[data-paytable-open]").addEventListener("click", () => {
    const panel = doc.querySelector("[data-paytable]");
    panel.hidden = false;
    panel.classList.add("is-open");
  });
  doc.querySelector("[data-paytable-close]").addEventListener("click", () => {
    const panel = doc.querySelector("[data-paytable]");
    panel.hidden = true;
    panel.classList.remove("is-open");
  });
  refresh();
  return { spin, restore, getState: () => ({ ...state }) };
}
