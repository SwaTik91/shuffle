import { COPY, LINES, PAYS, SCATTER_MULT, SYMBOL_META, SYMBOLS } from "./config.js";

export function symbolTile(id, extraClass = "") {
  const meta = SYMBOL_META[id];
  return `<div class="symbol symbol-${id} ${extraClass}" data-symbol="${id}"><img src="${meta.image}" alt="${meta.name}"></div>`;
}

export function buildSpinStrip(fromCol, toCol, extraCount, pick) {
  const filler = Array.from({ length: extraCount }, pick);
  return [...fromCol, ...filler, ...toCol];
}

function ensureReels(root) {
  if (root.querySelectorAll("[data-reel]").length === 5) return;
  root.innerHTML = [0, 1, 2, 3, 4]
    .map(
      (index) =>
        `<div class="reel" data-reel="${index}"><div class="reel-window"><div class="reel-strip"></div></div></div>`
    )
    .join("");
}

function stripEl(root, reelIndex) {
  return root.querySelector(`[data-reel="${reelIndex}"] .reel-strip`);
}

export function renderReels(root, grid, highlights = []) {
  ensureReels(root);
  const lit = new Set(
    highlights.flatMap((win) => win.path.map((row, reel) => `${reel}-${row}`))
  );
  grid.forEach((col, reelIndex) => {
    const strip = stripEl(root, reelIndex);
    strip.style.transition = "none";
    strip.style.transform = "translate3d(0, 0, 0)";
    strip.innerHTML = col
      .map((id, row) => symbolTile(id, lit.has(`${reelIndex}-${row}`) ? "is-win" : ""))
      .join("");
  });
}

function cellSize(root) {
  const windowEl = root.querySelector(".reel-window");
  const width = windowEl.getBoundingClientRect().width;
  return width * (4 / 3);
}

export function animateReelSpin(root, fromGrid, toGrid, rng) {
  ensureReels(root);
  const height = cellSize(root) || 96;
  const pick = () => SYMBOLS[Math.floor(rng() * SYMBOLS.length)];

  return Promise.all(
    toGrid.map((finalCol, reelIndex) => {
      const extra = 16 + reelIndex * 7;
      const sequence = buildSpinStrip(fromGrid[reelIndex], finalCol, extra, pick);
      const reel = root.querySelector(`[data-reel="${reelIndex}"]`);
      const strip = stripEl(root, reelIndex);
      strip.innerHTML = sequence.map((id) => symbolTile(id)).join("");
      strip.style.transition = "none";
      strip.style.transform = "translate3d(0, 0, 0)";
      reel.classList.add("is-spinning");

      const distance = (sequence.length - 3) * height;
      const duration = 820 + reelIndex * 260;

      return new Promise((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          reel.classList.remove("is-spinning");
          strip.style.transition = "none";
          strip.innerHTML = finalCol.map((id) => symbolTile(id)).join("");
          strip.style.transform = "translate3d(0, 0, 0)";
          resolve();
        };

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            strip.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.7, 0.16, 1)`;
            strip.style.transform = `translate3d(0, ${-distance}px, 0)`;
          });
        });

        strip.addEventListener(
          "transitionend",
          (event) => {
            if (event.propertyName === "transform") finish();
          },
          { once: true }
        );
        window.setTimeout(finish, duration + 120);
      });
    })
  );
}

export function bindChrome(doc) {
  doc.querySelector("[data-title]").textContent = COPY.title;
  doc.querySelector("[data-subtitle]").textContent = COPY.subtitle;
  doc.querySelector("[data-label-balance]").textContent = COPY.balance;
  doc.querySelector("[data-label-bet]").textContent = COPY.totalBet;
  doc.querySelector("[data-label-win]").textContent = COPY.win;
  doc.querySelector("[data-label-lines]").textContent = COPY.lines;
  doc.querySelector("[data-label-coin]").textContent = COPY.bet;
  doc.querySelector("[data-spin-label]").textContent = COPY.spin;
  doc.querySelector("[data-paytable-open]").textContent = COPY.paytable;
  doc.querySelector("[data-restore]").textContent = COPY.restore;
}

export function updateMeters(doc, { balance, totalBet, win, lines, betPerLine, freeSpinsLeft }) {
  doc.querySelector("[data-balance]").textContent = String(balance);
  doc.querySelector("[data-total-bet]").textContent = String(totalBet);
  doc.querySelector("[data-win]").textContent = String(win);
  doc.querySelector("[data-lines]").textContent = String(lines);
  doc.querySelector("[data-coin]").textContent = String(betPerLine);
  const banner = doc.querySelector("[data-feature]");
  if (freeSpinsLeft > 0) {
    banner.hidden = false;
    banner.textContent = `${COPY.freeSpins}: ${freeSpinsLeft}`;
  } else {
    banner.hidden = true;
  }
}

export function setBusy(doc, busy, canAfford) {
  doc.querySelector("[data-spin]").disabled = busy || !canAfford;
  doc.querySelector("[data-lines-minus]").disabled = busy;
  doc.querySelector("[data-lines-plus]").disabled = busy;
  doc.querySelector("[data-coin-minus]").disabled = busy;
  doc.querySelector("[data-coin-plus]").disabled = busy;
  doc.querySelector("[data-restore]").hidden = canAfford || busy;
}

export function paytableHtml() {
  const rows = SYMBOLS.filter((id) => id !== "scroll")
    .map((id) => {
      const pays = PAYS[id];
      const cells = [5, 4, 3, 2]
        .map((n) => `<td>${pays[n] ? `${n}× ${pays[n]}` : "—"}</td>`)
        .join("");
      return `<tr><th>${symbolTile(id)} <span>${SYMBOL_META[id].name}</span></th>${cells}</tr>`;
    })
    .join("");
  return `
    <h2>${COPY.paytable}</h2>
    <p>${COPY.paytableRules}</p>
    <table>
      <thead><tr><th>Символ</th><th>5</th><th>4</th><th>3</th><th>2</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p><strong>${COPY.scatterLabel}:</strong> 3×${SCATTER_MULT[3]}, 4×${SCATTER_MULT[4]}, 5×${SCATTER_MULT[5]}</p>
  `;
}

export function showOverlay(doc, { title, body, symbol, onDone }) {
  const intro = doc.querySelector("[data-bonus-intro]");
  const reels = doc.querySelector("[data-reels]");
  intro.hidden = false;
  reels.hidden = true;
  intro.querySelector("[data-overlay-title]").textContent = title;
  intro.querySelector("[data-overlay-body]").textContent = body;
  intro.querySelector("[data-overlay-symbol]").innerHTML = symbol
    ? `${COPY.expanding}: ${symbolTile(symbol)} <span>${SYMBOL_META[symbol].name}</span>`
    : "";
  intro.querySelector("[data-overlay-continue]").textContent = COPY.continue;
  let settled = false;
  let armed = false;
  window.setTimeout(() => {
    armed = true;
  }, 700);
  const finish = () => {
    if (!armed || settled) return;
    settled = true;
    intro.hidden = true;
    reels.hidden = false;
    onDone();
  };
  intro.querySelector("[data-overlay-continue]").onclick = finish;
  window.setTimeout(finish, 4500);
}

export function tickNumber(el, from, to, ms = 500) {
  if (to <= from) {
    el.textContent = String(to);
    return Promise.resolve();
  }
  const start = performance.now();
  return new Promise((resolve) => {
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      el.textContent = String(Math.round(from + (to - from) * t));
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

export { LINES };
