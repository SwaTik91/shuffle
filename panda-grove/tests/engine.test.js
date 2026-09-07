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
import { buildSpinStrip, lineCenters, litCells, polylineFromCenters } from "../js/ui.js";

const pandaLine = () => [
  ["jack", "panda", "queen"],
  ["ace", "panda", "king"],
  ["coin", "panda", "lantern"],
  ["jack", "peach", "ace"],
  ["queen", "bamboo", "king"],
];

test("total bet is lines times coin", () => {
  assert.equal(totalBet(10, 1), 10);
  assert.equal(canSpin(9, 10, 1), false);
  assert.equal(canSpin(START_BALANCE, 10, 1), true);
});

test("AE1: three pandas on line 1 pay 100 times bet", () => {
  const result = evaluateBase(pandaLine(), 10, 1);
  const line1 = result.lineWins.find((win) => win.line === 0);
  assert.ok(line1);
  assert.equal(line1.amount, 100);
  assert.equal(result.trigger, false);
});

test("AE2: inactive line does not pay", () => {
  const grid = [
    ["panda", "jack", "queen"],
    ["panda", "ace", "king"],
    ["panda", "coin", "lantern"],
    ["peach", "jack", "ace"],
    ["bamboo", "queen", "king"],
  ];
  const result = evaluateBase(grid, 1, 1);
  assert.equal(result.lineWins.length, 0);
  assert.equal(result.total, 0);
});

test("fan wild completes a left-to-right panda win", () => {
  const grid = [
    ["jack", "panda", "queen"],
    ["ace", "fan", "king"],
    ["coin", "panda", "lantern"],
    ["jack", "peach", "ace"],
    ["queen", "bamboo", "king"],
  ];
  const pay = linePay(grid, LINES[0], 2);
  assert.equal(pay.symbol, "panda");
  assert.equal(pay.count, 3);
  assert.equal(pay.amount, 200);
});

test("AE3: three fans trigger the feature and pay scatter on total bet", () => {
  const grid = [
    ["fan", "jack", "queen"],
    ["ace", "fan", "king"],
    ["coin", "lantern", "fan"],
    ["jack", "peach", "ace"],
    ["queen", "bamboo", "king"],
  ];
  const result = evaluateBase(grid, 10, 1);
  assert.equal(result.scatter.count, 3);
  assert.equal(result.scatter.amount, 20);
  assert.equal(result.trigger, true);
  assert.equal(shouldTriggerFeature(3), true);
});

test("AE4: expanding panda on reels 1/3/5 pays 3-kind on every active line", () => {
  const grid = [
    ["jack", "panda", "queen"],
    ["ace", "coin", "king"],
    ["panda", "lantern", "jack"],
    ["jack", "peach", "ace"],
    ["queen", "bamboo", "panda"],
  ];
  const result = evaluateFeature(grid, "panda", 10, 1);
  assert.deepEqual(result.grid[0], ["panda", "panda", "panda"]);
  assert.deepEqual(result.grid[2], ["panda", "panda", "panda"]);
  assert.deepEqual(result.grid[4], ["panda", "panda", "panda"]);
  assert.equal(result.expandWin.count, 3);
  assert.deepEqual(result.expandWin.reels, [0, 2, 4]);
  assert.equal(result.expandWin.amount, 100 * 10);
  assert.equal(result.lineWins.some((win) => win.symbol === "panda"), false);
});

test("retrigger adds ten spins when three fans land in the feature", () => {
  const grid = [
    ["fan", "jack", "queen"],
    ["ace", "fan", "king"],
    ["peach", "lantern", "fan"],
    ["jack", "peach", "ace"],
    ["queen", "bamboo", "king"],
  ];
  const result = evaluateFeature(grid, "coin", 10, 1);
  assert.equal(result.retrigger, true);
  assert.equal(result.extraSpins, 10);
});

test("expand does not treat fan as the expanding symbol", () => {
  const grid = [
    ["fan", "jack", "queen"],
    ["ace", "coin", "king"],
    ["fan", "lantern", "jack"],
    ["jack", "peach", "ace"],
    ["queen", "bamboo", "king"],
  ];
  const expanded = applyExpand(grid, "panda");
  assert.deepEqual(expanded[0], ["fan", "jack", "queen"]);
});

test("pickExpandingSymbol never returns fan", () => {
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
  assert.equal(seen.has("fan"), false);
  assert.equal(seen.size, 9);
});

test("spin strip puts the result above the current view so the reel can fall down", () => {
  const from = ["panda", "ace", "jack"];
  const to = ["fan", "peach", "coin"];
  let n = 0;
  const strip = buildSpinStrip(from, to, 4, () => {
    n += 1;
    return "bamboo";
  });
  assert.deepEqual(strip.slice(0, 3), to);
  assert.deepEqual(strip.slice(-3), from);
  assert.equal(strip.length, 10);
  assert.equal(n, 4);
});

test("line centers follow the payline through reel and row", () => {
  const points = lineCenters([0, 1, 2, 1, 0], { reelWidth: 40, gap: 10, cellHeight: 30 });
  assert.deepEqual(points, [
    { x: 20, y: 15 },
    { x: 70, y: 45 },
    { x: 120, y: 75 },
    { x: 170, y: 45 },
    { x: 220, y: 15 },
  ]);
  assert.equal(polylineFromCenters(points), "20,15 70,45 120,75 170,45 220,15");
});

test("lit cells cover line paths, expanded reels, and scatter positions", () => {
  const cells = litCells([
    { path: [1, 1, 1, 1, 1], count: 3 },
    { reels: [0, 4] },
    { cells: [[2, 0], [2, 2]] },
  ]);
  assert.ok(cells.has("0-1"));
  assert.ok(cells.has("2-1"));
  assert.equal(cells.has("3-1"), false);
  assert.ok(cells.has("0-0"));
  assert.ok(cells.has("0-2"));
  assert.ok(cells.has("4-0"));
  assert.ok(cells.has("2-0"));
  assert.ok(cells.has("2-2"));
});

test("spinReels returns a 5x3 grid from strips", () => {
  const grid = spinReels(() => 0);
  assert.equal(grid.length, 5);
  grid.forEach((reel) => assert.equal(reel.length, 3));
});
