import {
  FREE_SPINS,
  LINES,
  PAYS,
  REGULAR_SYMBOLS,
  REEL_STRIPS,
  SCATTER_MULT,
  SCROLL,
} from "./config.js";

export function randomInt(rng, n) {
  return Math.floor(rng() * n);
}

export function spinReels(rng, strips = REEL_STRIPS) {
  return strips.map((strip) => {
    const start = randomInt(rng, strip.length);
    return [0, 1, 2].map((offset) => strip[(start + offset) % strip.length]);
  });
}

export function totalBet(lines, betPerLine) {
  return lines * betPerLine;
}

export function canSpin(balance, lines, betPerLine) {
  return balance >= totalBet(lines, betPerLine);
}

export function countScatters(grid) {
  return grid.reduce(
    (sum, reel) => sum + reel.filter((symbol) => symbol === SCROLL).length,
    0
  );
}

export function shouldTriggerFeature(scatterCount) {
  return scatterCount >= 3;
}

export function pickExpandingSymbol(rng, symbols = REGULAR_SYMBOLS) {
  return symbols[randomInt(rng, symbols.length)];
}

export function linePay(grid, line, betPerLine) {
  const cells = line.map((row, reel) => grid[reel][row]);
  const target = cells.find((symbol) => symbol !== SCROLL);
  if (!target) {
    return { symbol: SCROLL, count: cells.length, amount: 0 };
  }
  let count = 0;
  for (const symbol of cells) {
    if (symbol === target || symbol === SCROLL) count += 1;
    else break;
  }
  const pay = PAYS[target]?.[count] ?? 0;
  return { symbol: target, count, amount: pay * betPerLine };
}

export function evaluateLines(grid, activeLineCount, betPerLine, skipSymbol = null) {
  const wins = [];
  for (let index = 0; index < activeLineCount; index += 1) {
    const result = linePay(grid, LINES[index], betPerLine);
    if (skipSymbol && result.symbol === skipSymbol) continue;
    if (result.amount > 0) {
      wins.push({ line: index, path: LINES[index], ...result });
    }
  }
  return wins;
}

export function scatterWin(count, betTotal) {
  const multiplier = SCATTER_MULT[count] ?? 0;
  return { count, amount: multiplier * betTotal };
}

export function evaluateBase(grid, lines, betPerLine) {
  const betTotal = totalBet(lines, betPerLine);
  const lineWins = evaluateLines(grid, lines, betPerLine);
  const scatters = countScatters(grid);
  const scatter = scatterWin(scatters, betTotal);
  const lineTotal = lineWins.reduce((sum, win) => sum + win.amount, 0);
  return {
    lineWins,
    scatter,
    total: lineTotal + scatter.amount,
    trigger: shouldTriggerFeature(scatters),
  };
}

export function applyExpand(grid, symbol) {
  return grid.map((reel) => (reel.includes(symbol) ? [symbol, symbol, symbol] : [...reel]));
}

export function expandingPay(grid, symbol, lines, betPerLine) {
  const reels = grid.flatMap((reel, index) => (reel.includes(symbol) ? [index] : []));
  const pay = PAYS[symbol]?.[reels.length] ?? 0;
  return { symbol, count: reels.length, reels, amount: pay * betPerLine * lines };
}

export function evaluateFeature(grid, expandingSymbol, lines, betPerLine) {
  const expanded = applyExpand(grid, expandingSymbol);
  const expandWin = expandingPay(grid, expandingSymbol, lines, betPerLine);
  const lineWins = evaluateLines(expanded, lines, betPerLine, expandingSymbol);
  const scatters = countScatters(expanded);
  const scatter = scatterWin(scatters, totalBet(lines, betPerLine));
  const lineTotal = lineWins.reduce((sum, win) => sum + win.amount, 0);
  return {
    grid: expanded,
    expandWin,
    lineWins,
    scatter,
    total: expandWin.amount + lineTotal + scatter.amount,
    retrigger: shouldTriggerFeature(scatters),
    extraSpins: shouldTriggerFeature(scatters) ? FREE_SPINS : 0,
  };
}
