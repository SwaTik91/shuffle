import test from "node:test";
import assert from "node:assert/strict";
import { simulateRtp } from "../scripts/simulate-rtp.mjs";

test("paid spins return a finite RTP including the free-spin loop", () => {
  const report = simulateRtp({ spins: 20_000, seed: 20260907 });
  assert.ok(Number.isFinite(report.rtp));
  assert.ok(report.rtp > 0.4 && report.rtp < 1.8, `unexpected rtp ${report.rtp}`);
  assert.ok(report.featureEvery > 50, `features too common: ${report.featureEvery}`);
  assert.ok(report.baseRtp > 0);
  assert.ok(report.featureRtp > 0);
});
