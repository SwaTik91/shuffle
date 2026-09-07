import { createStorage } from "./storage.js";
import { createGame } from "./game.js";
import { createMachineRng } from "./rng.js";

const demo = new URLSearchParams(window.location.search).get("demo");
const machine = createMachineRng();

createGame({
  doc: document,
  storage: createStorage(),
  rng: () => machine.sample(),
  demo,
});
