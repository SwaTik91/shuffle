import { COPY, LINES, PAYS, SCATTER_MULT, SCROLL, SYMBOL_META, SYMBOLS } from "./config.js";

export const LINE_COLORS = [
  "#f5d76e",
  "#ff5b5b",
  "#4aa3ff",
  "#c084fc",
  "#3ddc97",
  "#ff9f43",
  "#20c9c9",
  "#ff7eb6",
  "#7aa2ff",
  "#ffeaa7",
];

export function symbolTile(id, extraClass = "") {
  const meta = SYMBOL_META[id];
  return `<div class="symbol symbol-${id} ${extraClass}" data-symbol="${id}"><img src="${meta.image}" alt="${meta.name}"></div>`;
}

/** Result sits above the current view so the strip can fall top → bottom. */
export function buildSpinStrip(fromCol, toCol, extraCount, pick) {
  const filler = Array.from({ length: extraCount }, pick);
  return [...toCol, ...filler, ...fromCol];
}

export function lineCenters(path, { reelWidth, gap, cellHeight }) {
  return path.map((row, reel) => ({
    x: reel * (reelWidth + gap) + reelWidth / 2,
    y: row * cellHeight + cellHeight / 2,
  }));
}

export function polylineFromCenters(centers) {
  return centers.map((point) => `${point.x},${point.y}`).join(" ");
}

export function litCells(highlights) {
  const lit = new Set();
  for (const win of highlights) {
    win.path?.forEach((row, reel) => {
      if (win.count == null || reel < win.count) lit.add(`${reel}-${row}`);
    });
    win.reels?.forEach((reel) => {
      for (let row = 0; row < 3; row += 1) lit.add(`${reel}-${row}`);
    });
    win.cells?.forEach(([reel, row]) => lit.add(`${reel}-${row}`));
  }
  return lit;
}

export function scatterCells(grid) {
  const cells = [];
  grid.forEach((col, reel) => {
    col.forEach((id, row) => {
      if (id === SCROLL) cells.push([reel, row]);
    });
  });
  return cells;
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
  const lit = litCells(highlights);
  root.classList.toggle("has-win", lit.size > 0);
  grid.forEach((col, reelIndex) => {
    const strip = stripEl(root, reelIndex);
    strip.style.transition = "none";
    strip.style.transform = "translate3d(0, 0, 0)";
    strip.innerHTML = col
      .map((id, row) => symbolTile(id, lit.has(`${reelIndex}-${row}`) ? "is-win" : ""))
      .join("");
  });
  renderWinLines(root, highlights);
}

function overlayEl(root) {
  return root.parentElement?.querySelector("[data-win-lines]") ?? null;
}

export function renderWinLines(root, highlights = []) {
  const svg = overlayEl(root);
  if (!svg) return;
  const stage = svg.parentElement;
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));

  const stageRect = stage.getBoundingClientRect();
  const lines = highlights.filter((win) => Array.isArray(win.path) && win.line >= 0);
  svg.innerHTML = lines
    .map((win) => {
      const end = win.count > 1 ? win.count : win.path.length;
      const centers = win.path.slice(0, end).map((row, reel) => {
        const cell = root.querySelector(`[data-reel="${reel}"] .symbol:nth-child(${row + 1})`);
        if (!cell) return null;
        const box = cell.getBoundingClientRect();
        return {
          x: +(box.left + box.width / 2 - stageRect.left).toFixed(1),
          y: +(box.top + box.height / 2 - stageRect.top).toFixed(1),
        };
      });
      if (centers.some((point) => !point)) return "";
      const color = LINE_COLORS[win.line % LINE_COLORS.length];
      return `<polyline points="${polylineFromCenters(centers)}" stroke="${color}" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
    })
    .join("");
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
      const distance = (sequence.length - 3) * height;
      const duration = 820 + reelIndex * 260;
      strip.style.transition = "none";
      strip.style.transform = `translate3d(0, ${-distance}px, 0)`;
      reel.classList.add("is-spinning");

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
            strip.style.transform = "translate3d(0, 0, 0)";
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
  const sister = doc.querySelector("[data-sister]");
  if (sister) {
    sister.textContent = COPY.sister;
    sister.setAttribute("href", COPY.sisterHref);
  }
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
  const rows = SYMBOLS.filter((id) => id !== SCROLL)
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
    <p><strong>${COPY.rtpLabel}:</strong> ${COPY.rtpBody}</p>
  `;
}

export function showOverlay(doc, { title, body, symbol, onDone }) {
  const intro = doc.querySelector("[data-bonus-intro]");
  const reels = doc.querySelector("[data-reels]");
  const stage = reels.closest(".reels-stage");
  intro.hidden = false;
  reels.hidden = true;
  if (stage) stage.hidden = true;
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
    if (stage) stage.hidden = false;
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
