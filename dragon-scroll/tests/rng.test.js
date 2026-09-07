import test from "node:test";
import assert from "node:assert/strict";
import { createMachineRng, mixSeed, mulberry32 } from "../js/rng.js";
import { buildStrip, REEL_STRIPS, SYMBOLS } from "../js/config.js";
import { spinReels } from "../js/engine.js";

test("mulberry32 is deterministic for the same seed", () => {
  const a = mulberry32(0x9e3779b9);
  const b = mulberry32(0x9e3779b9);
  const seqA = Array.from({ length: 8 }, () => a());
  const seqB = Array.from({ length: 8 }, () => b());
  assert.deepEqual(seqA, seqB);
  seqA.forEach((value) => {
    assert.ok(value >= 0 && value < 1);
  });
});

test("mulberry32 changes when the seed changes", () => {
  const a = mulberry32(1);
  const b = mulberry32(2);
  assert.notEqual(a(), b());
});

test("mixSeed is stable and sensitive", () => {
  assert.equal(mixSeed(1, 2, 3), mixSeed(1, 2, 3));
  assert.notEqual(mixSeed(1, 2, 3), mixSeed(1, 2, 4));
});

test("machine rng samples the live stream, not Math.random", () => {
  const machine = createMachineRng({ seed: 42, autoTick: false });
  const expected = mulberry32(42);
  expected(); // constructor already consumed the first value
  assert.equal(machine.sample(), expected());
  assert.equal(machine.sample(), expected());
});

test("background ticks move the stream before a spin is sampled", () => {
  const machine = createMachineRng({ seed: 7, autoTick: false });
  machine.step();
  machine.step();
  const afterTicks = machine.sample();
  const fresh = createMachineRng({ seed: 7, autoTick: false });
  const immediate = fresh.sample();
  assert.notEqual(afterTicks, immediate);
});

test("buildStrip keeps requested counts and spreads repeats", () => {
  const strip = buildStrip({ dragon: 2, jack: 6, scroll: 2, queen: 4 });
  const counts = Object.create(null);
  for (const id of strip) counts[id] = (counts[id] ?? 0) + 1;
  assert.equal(counts.dragon, 2);
  assert.equal(counts.jack, 6);
  assert.equal(counts.scroll, 2);
  assert.equal(strip.length, 14);
  for (let i = 1; i < strip.length; i += 1) {
    if (strip[i] === "scroll") assert.notEqual(strip[i - 1], "scroll");
  }
});

test("virtual reels only contain known symbols and are long enough to weight", () => {
  assert.equal(REEL_STRIPS.length, 5);
  REEL_STRIPS.forEach((strip) => {
    assert.ok(strip.length >= 24);
    strip.forEach((id) => assert.ok(SYMBOLS.includes(id)));
    assert.ok(strip.includes("scroll"));
  });
});

test("spinReels maps a uniform stop onto three consecutive strip cells", () => {
  const strips = [
    ["a", "b", "c", "d"],
    ["e", "f", "g", "h"],
    ["i", "j", "k", "l"],
    ["m", "n", "o", "p"],
    ["q", "r", "s", "t"],
  ];
  const rng = (() => {
    const stops = [0, 0.25, 0.5, 0.75, 0];
    let i = 0;
    return () => stops[i++];
  })();
  assert.deepEqual(spinReels(rng, strips), [
    ["a", "b", "c"],
    ["f", "g", "h"],
    ["k", "l", "i"],
    ["p", "m", "n"],
    ["q", "r", "s"],
  ]);
});
