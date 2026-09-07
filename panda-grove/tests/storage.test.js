import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore, createStorage, defaultSession } from "../js/storage.js";
import { START_BALANCE, STORAGE_KEY } from "../js/config.js";

test("missing storage returns defaults", () => {
  const storage = createStorage(createMemoryStore());
  assert.deepEqual(storage.load(), defaultSession());
});

test("AE6: balance, lines, and bet survive a reload", () => {
  const store = createMemoryStore();
  const first = createStorage(store);
  first.save({ balance: 740, lines: 5, betPerLine: 2 });
  const second = createStorage(store);
  assert.deepEqual(second.load(), { balance: 740, lines: 5, betPerLine: 2 });
});

test("corrupt JSON falls back to defaults", () => {
  const store = createMemoryStore();
  store.setItem(STORAGE_KEY, "{nope");
  const storage = createStorage(store);
  assert.deepEqual(storage.load(), defaultSession());
});

test("restore writes starting balance and clamps bad fields", () => {
  const storage = createStorage(createMemoryStore());
  const saved = storage.save({ balance: 1000, lines: 99, betPerLine: 7 });
  assert.equal(saved.balance, START_BALANCE);
  assert.equal(saved.lines, 10);
  assert.equal(saved.betPerLine, 1);
});
