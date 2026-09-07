/**
 * Certified-style client PRNG for the slot.
 * A 32-bit mulberry32 stream ticks in the background (like a machine clock).
 * A spin latches the next values from wherever the stream currently sits.
 */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mixSeed(...parts) {
  let hash = 0x811c9dc5;
  for (const part of parts) {
    hash = Math.imul(hash ^ (part >>> 0), 0x01000193);
  }
  return hash >>> 0;
}

export function entropySeed() {
  const buf = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(buf);
  } else {
    buf[0] = Math.floor(Math.random() * 0xffffffff) >>> 0;
    buf[1] = Date.now() >>> 0;
  }
  const perf = typeof performance !== "undefined" ? Math.floor(performance.now() * 1000) : 0;
  return mixSeed(buf[0], buf[1], Date.now(), perf);
}

function defaultSchedule(callback) {
  if (typeof requestAnimationFrame === "function") {
    return requestAnimationFrame(callback);
  }
  return setTimeout(callback, 4);
}

function defaultCancel(handle) {
  if (typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(handle);
  }
  clearTimeout(handle);
}

/**
 * @param {object} [options]
 * @param {number} [options.seed]
 * @param {boolean} [options.autoTick]  background clock; default true in browsers
 * @param {(cb: Function) => any} [options.schedule]
 * @param {(handle: any) => void} [options.cancel]
 */
export function createMachineRng(options = {}) {
  const seed = options.seed ?? entropySeed();
  const next = mulberry32(seed);
  const autoTick = options.autoTick ?? typeof requestAnimationFrame === "function";
  const schedule = options.schedule ?? defaultSchedule;
  const cancel = options.cancel ?? defaultCancel;

  let current = next();
  let ticks = 1;
  let running = false;
  let handle = 0;

  function step() {
    current = next();
    ticks += 1;
    return current;
  }

  function loop() {
    if (!running) return;
    step();
    handle = schedule(loop);
  }

  function start() {
    if (running || !autoTick) return;
    running = true;
    handle = schedule(loop);
  }

  function stop() {
    running = false;
    cancel(handle);
  }

  /** Latch the next stream value — the "button press" sample. */
  function sample() {
    return step();
  }

  start();

  return {
    seed,
    sample,
    step,
    start,
    stop,
    get ticks() {
      return ticks;
    },
  };
}
