import { createMachineRng } from "../js/rng.js";
import { FREE_SPINS, TARGET_RTP_RANGE } from "../js/config.js";
import {
  evaluateBase,
  evaluateFeature,
  pickExpandingSymbol,
  spinReels,
  totalBet,
} from "../js/engine.js";

function playPaidSpin(rng, lines, betPerLine) {
  const stake = totalBet(lines, betPerLine);
  const grid = spinReels(rng);
  const base = evaluateBase(grid, lines, betPerLine);
  let win = base.total;
  let featureSpins = 0;
  let featureWin = 0;
  if (!base.trigger) {
    return { stake, win, trigger: false, featureSpins, featureWin };
  }
  const expanding = pickExpandingSymbol(rng);
  let left = FREE_SPINS;
  while (left > 0) {
    left -= 1;
    featureSpins += 1;
    const feature = evaluateFeature(spinReels(rng), expanding, lines, betPerLine);
    featureWin += feature.total;
    win += feature.total;
    if (feature.retrigger) left += feature.extraSpins;
  }
  return { stake, win, trigger: true, featureSpins, featureWin };
}

export function simulateRtp({
  spins = 200_000,
  lines = 10,
  betPerLine = 1,
  seed = 0xc0ffee,
} = {}) {
  const machine = createMachineRng({ seed, autoTick: false });
  const rng = () => machine.sample();
  let staked = 0;
  let returned = 0;
  let triggers = 0;
  let featureSpins = 0;
  let featureReturned = 0;
  let hits = 0;

  for (let i = 0; i < spins; i += 1) {
    const result = playPaidSpin(rng, lines, betPerLine);
    staked += result.stake;
    returned += result.win;
    if (result.win > 0) hits += 1;
    if (result.trigger) {
      triggers += 1;
      featureSpins += result.featureSpins;
      featureReturned += result.featureWin;
    }
  }

  const rtp = returned / staked;
  return {
    spins,
    staked,
    returned,
    rtp,
    hitRate: hits / spins,
    featureRate: triggers / spins,
    featureEvery: triggers ? spins / triggers : Infinity,
    featureSpins,
    featureRtp: featureReturned / staked,
    baseRtp: (returned - featureReturned) / staked,
    inTarget: rtp >= TARGET_RTP_RANGE.min && rtp <= TARGET_RTP_RANGE.max,
  };
}

const isMain = process.argv[1] && process.argv[1].endsWith("simulate-rtp.mjs");
if (isMain) {
  const spins = Number(process.argv[2] ?? 200_000);
  const seed = Number(process.argv[3] ?? 0xc0ffee);
  const report = simulateRtp({ spins, seed });
  console.log(JSON.stringify(report, null, 2));
  if (!report.inTarget) {
    console.error(
      `RTP ${report.rtp.toFixed(4)} is outside ${TARGET_RTP_RANGE.min}-${TARGET_RTP_RANGE.max}`
    );
    process.exitCode = 1;
  }
}
