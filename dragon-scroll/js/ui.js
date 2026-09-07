import { COPY, LINES, PAYS, SCATTER_MULT, SYMBOL_META, SYMBOLS } from "./config.js";

export function symbolTile(id, extraClass = "") {
  const meta = SYMBOL_META[id];
  return `<div class="symbol symbol-${id} ${extraClass}" data-symbol="${id}"><img src="${meta.image}" alt="${meta.name}"></div>`;
}

export function renderReels(root, grid, highlights = []) {
  const lit = new Set(
    highlights.flatMap((win) => win.path.map((row, reel) => `${reel}-${row}`))
  );
  root.innerHTML = grid
    .map((reel, reelIndex) => {
      const cells = reel
        .map((id, row) => {
          const on = lit.has(`${reelIndex}-${row}`) ? "is-win" : "";
          return symbolTile(id, on);
        })
        .join("");
      return `<div class="reel">${cells}</div>`;
    })
    .join("");
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
