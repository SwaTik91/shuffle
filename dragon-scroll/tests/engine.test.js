import test from "node:test";
import assert from "node:assert/strict";
import {
  applyExpand,
  canSpin,
  evaluateBase,
  evaluateFeature,
  linePay,
  pickExpandingSymbol,
  shouldTriggerFeature,
  spinReels,
  totalBet,
} from "../js/engine.js";
import { LINES, START_BALANCE } from "../js/config.js";

const dragonLine = () => [
  ["jack", "dragon", "queen"],
  ["ace", "dragon", "king"],
  ["coin", "dragon", "lantern"],
  ["jack", "lion", "ace"],
  ["queen", "phoenix", "king"],
];

test("total bet is lines times coin", () => {
  assert.equal(totalBet(10, 1), 10);
  assert.equal(canSpin(9, 10, 1), false);
  assert.equal(canSpin(START_BALANCE, 10, 1), true);
});

test("AE1: three dragons on line 1 pay 100 times bet", () => {
  const result = evaluateBase(dragonLine(), 10, 1);
  const line1 = result.lineWins.find((win) => win.line === 0);
  assert.ok(line1);
  assert.equal(line1.amount, 100);
  assert.equal(result.trigger, false);
});

test("AE2: inactive line does not pay", () => {
  const grid = [
    ["dragon", "jack", "queen"],
    ["dragon", "ace", "king"],
    ["dragon", "coin", "lantern"],
    ["lion", "jack", "ace"],
    ["phoenix", "queen", "king"],
  ];
  const result = evaluateBase(grid, 1, 1);
  assert.equal(result.lineWins.length, 0);
  assert.equal(result.total, 0);
});

test("scroll wild completes a left-to-right dragon win", () => {
  const grid = [
    ["jack", "dragon", "queen"],
    ["ace", "scroll", "king"],
    ["coin", "dragon", "lantern"],
    ["jack", "lion", "ace"],
    ["queen", "phoenix", "king"],
  ];
  const pay = linePay(grid, LINES[0], 2);
  assert.equal(pay.symbol, "dragon");
  assert.equal(pay.count, 3);
  assert.equal(pay.amount, 200);
});

test("AE3: three scrolls trigger the feature and pay scatter on total bet", () => {
  const grid = [
    ["scroll", "jack", "queen"],
    ["ace", "scroll", "king"],
    ["coin", "lantern", "scroll"],
    ["jack", "lion", "ace"],
    ["queen", "phoenix", "king"],
  ];
  const result = evaluateBase(grid, 10, 1);
  assert.equal(result.scatter.count, 3);
  assert.equal(result.scatter.amount, 20);
  assert.equal(result.trigger, true);
  assert.equal(shouldTriggerFeature(3), true);
});

test("AE4: expanding dragon on reels 1/3/5 pays 3-kind on every active line", () => {
  const grid = [
    ["jack", "dragon", "queen"],
    ["ace", "coin", "king"],
    ["dragon", "lantern", "jack"],
    ["jack", "lion", "ace"],
    ["queen", "phoenix", "dragon"],
  ];
  const result = evaluateFeature(grid, "dragon", 10, 1);
  assert.deepEqual(result.grid[0], ["dragon", "dragon", "dragon"]);
  assert.deepEqual(result.grid[2], ["dragon", "dragon", "dragon"]);
  assert.deepEqual(result.grid[4], ["dragon", "dragon", "dragon"]);
  assert.equal(result.expandWin.count, 3);
  assert.equal(result.expandWin.amount, 100 * 10);
  assert.equal(result.lineWins.some((win) => win.symbol === "dragon"), false);
});

test("retrigger adds ten spins when three scrolls land in the feature", () => {
  const grid = [
    ["scroll", "jack", "queen"],
    ["ace", "scroll", "king"],
    ["lion", "lantern", "scroll"],
    ["jack", "lion", "ace"],
    ["queen", "phoenix", "king"],
  ];
  const result = evaluateFeature(grid, "coin", 10, 1);
  assert.equal(result.retrigger, true);
  assert.equal(result.extraSpins, 10);
});

test("expand does not treat scroll as the expanding symbol", () => {
  const grid = [
    ["scroll", "jack", "queen"],
    ["ace", "coin", "king"],
    ["scroll", "lantern", "jack"],
    ["jack", "lion", "ace"],
    ["queen", "phoenix", "king"],
  ];
  const expanded = applyExpand(grid, "dragon");
  assert.deepEqual(expanded[0], ["scroll", "jack", "queen"]);
});

test("pickExpandingSymbol never returns scroll", () => {
  const seen = new Set();
  const rng = (() => {
    let i = 0;
    return () => {
      const value = (i % 9) / 9;
      i += 1;
      return value;
    };
  })();
  for (let n = 0; n < 9; n += 1) {
    seen.add(pickExpandingSymbol(rng));
  }
  assert.equal(seen.has("scroll"), false);
  assert.equal(seen.size, 9);
});

test("spinReels returns a 5x3 grid from strips", () => {
  const grid = spinReels(() => 0);
  assert.equal(grid.length, 5);
  grid.forEach((reel) => assert.equal(reel.length, 3));
});
