import {
  BET_STEPS,
  DEFAULT_BET,
  DEFAULT_LINES,
  MAX_LINES,
  MIN_LINES,
  START_BALANCE,
  STORAGE_KEY,
} from "./config.js";

export function createMemoryStore() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

export function defaultSession() {
  return {
    balance: START_BALANCE,
    lines: DEFAULT_LINES,
    betPerLine: DEFAULT_BET,
  };
}

function clampSession(raw) {
  const fallback = defaultSession();
  const lines = Number(raw?.lines);
  const betPerLine = Number(raw?.betPerLine);
  const balance = Number(raw?.balance);
  return {
    balance: Number.isFinite(balance) && balance >= 0 ? Math.floor(balance) : fallback.balance,
    lines:
      Number.isInteger(lines) && lines >= MIN_LINES && lines <= MAX_LINES
        ? lines
        : fallback.lines,
    betPerLine: BET_STEPS.includes(betPerLine) ? betPerLine : fallback.betPerLine,
  };
}

export function createStorage(store) {
  const backend = store ?? globalThis.localStorage;
  return {
    load() {
      if (!backend) return defaultSession();
      try {
        const raw = backend.getItem(STORAGE_KEY);
        if (!raw) return defaultSession();
        return clampSession(JSON.parse(raw));
      } catch {
        return defaultSession();
      }
    },
    save(session) {
      if (!backend) return clampSession(session);
      const next = clampSession(session);
      backend.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    },
  };
}
