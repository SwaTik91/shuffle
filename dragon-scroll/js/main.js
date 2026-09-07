import { createStorage } from "./storage.js";
import { createGame } from "./game.js";

const demo = new URLSearchParams(window.location.search).get("demo");

createGame({
  doc: document,
  storage: createStorage(),
  demo,
});
