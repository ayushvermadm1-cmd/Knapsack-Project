/* ═══════════════════════════════════════════
   ui.js — Frontend: calls Flask /api/run
   ═══════════════════════════════════════════ */

// ── State ──────────────────────────────────
let items = [];

// ── Sample Data ─────────────────────────────
const SAMPLE_ITEMS = [
  { name: "Laptop",     weight: 10, profit: 60 },
  { name: "Smartphone", weight: 4,  profit: 40 },
  { name: "Tablet",     weight: 6,  profit: 30 },
  { name: "Headphones", weight: 3,  profit: 50 },
  { name: "Camera",     weight: 7,  profit: 70 },
  { name: "Smartwatch", weight: 2,  profit: 20 },
  { name: "Speaker",    weight: 5,  profit: 35 },
  { name: "Keyboard",   weight: 4,  profit: 25 },
];
const SAMPLE_CAPACITY = 15;

// ── Helpers ─────────────────────────────────
function adjustCapacity(delta) {
  const el = document.getElementById("capacity");
  el.value = Math.max(1, parseInt(el.value || 1) + delta);
}

function fmt(n, d = 2) { return Number(n).toFixed(d); }

function fmtTime(ms) {
  if (ms < 0.0001) return "< 0.0001 ms";
  return fmt(ms, 6) + " ms";
}

function flash(el, msg) {
  el.style.borderColor = "#f87171";
  const prev = el.placeholder;
  el.placeholder = msg; el.value = "";
  setTimeout(() => { el.style.borderColor = ""; el.placeholder = prev; }, 1600);
}

// ── Add / Remove Items ───────────────────────
function addItem() {
  const nameEl   = document.getElementById("itemName");
  const weightEl = document.getElementById("itemWeight");
  const profitEl = document.getElementById("itemProfit");

  const name   = nameEl.value.trim();
  const weight = parseFloat(weightEl.value);
  const profit = parseFloat(profitEl.value);

  if (!name)              return flash(nameEl,   "Name required!");
  if (!weight || weight <= 0) return flash(weightEl, "Invalid weight!");
  if (!profit || profit <= 0) return flash(profitEl, "Invalid profit!");

  items.push({ name, weight, profit });
  nameEl.value = ""; weightEl.value = ""; profitEl.value = "";
  nameEl.focus();
  renderTable();
}

function removeItem(idx) {
  items.splice(idx, 1);
  renderTable();
  hideResults();
}

function loadSample() {
  items = SAMPLE_ITEMS.map(i => ({ ...i }));
  document.getElementById("capacity").value = SAMPLE_CAPACITY;
  renderTable();
  hideResults();
}

function clearAll() {
  items = [];
  renderTable();
  hideResults();
}

function hideResults() {
  ["resultsSection", "comparisonSection", "dpTableSection"]
    .forEach(id => document.getElementById(id).style.display = "none");
}

// ── Product Table ────────────────────────────
function renderTable() {
  const section = document.getElementById("productSection");
  const tbody   = document.getElementById("productBody");

  if (items.length === 0) { section.style.display = "none"; return; }
  section.style.display = "block";
  tbody.innerHTML = "";

  items.forEach((item, idx) => {
    const ratio = (item.profit / item.weight).toFixed(2);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="color:var(--muted);font-family:'JetBrains Mono',monospace">${idx + 1}</td>
      <td style="font-weight:600;color:#fff">${item.name}</td>
      <td>${item.weight} kg</td>
      <td>₹${item.profit}</td>
      <td class="ratio-cell">${ratio}</td>
      <td><button class="del-btn" onclick="removeItem(${idx})">✕ Remove</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Run Algorithms — calls Python Flask API ──
async function runAlgorithms() {
  if (items.length === 0) {
    alert("Please add at least one item, or load sample data.");
    return;
  }

  const capacity = parseInt(document.getElementById("capacity").value) || 50;
  const runBtn   = document.getElementById("runBtn");
  const loader   = document.getElementById("loader");

  // Show loader
  runBtn.disabled = true;
  runBtn.textContent = "⏳ Running...";
  loader.style.display = "flex";
  hideResults();

  try {
    // POST to Flask Python backend
    const response = await fetch("/api/run", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ items, capacity })
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();

    loader.style.display = "none";
    renderResults(data.greedy, data.dp, capacity);
    renderComparison(data.greedy, data.dp);
    renderDPTable(data.dp.table, data.dp.tracedCells, data.dp.tableCols, data.dp.capacity);

    document.getElementById("resultsSection")
      .scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (err) {
    loader.style.display = "none";
    alert("Error communicating with server: " + err.message);
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = "▶ Run Algorithms";
  }
}

// ── Render Results ───────────────────────────
function renderResults(greedy, dp, capacity) {
  document.getElementById("resultsSection").style.display = "block";

  document.getElementById("greedyProfit").textContent = `₹${fmt(greedy.totalProfit)}`;
  document.getElementById("greedyWeight").textContent = `${fmt(greedy.weightUsed)} / ${capacity} kg`;
  document.getElementById("greedyTime").textContent   = fmtTime(greedy.timeMs);

  document.getElementById("dpProfit").textContent = `₹${dp.totalProfit}`;
  document.getElementById("dpWeight").textContent = `${dp.weightUsed} / ${capacity} kg`;
  document.getElementById("dpTime").textContent   = fmtTime(dp.timeMs);

  renderChips("greedyItems", greedy.selected, true);
  renderChips("dpItems",     dp.selected,     false);
}

function renderChips(containerId, selected, showFraction) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  if (!selected || selected.length === 0) {
    el.innerHTML = `<p style="color:var(--muted);font-size:0.85rem">No items selected.</p>`;
    return;
  }
  selected.forEach((item, i) => {
    const chip = document.createElement("div");
    chip.className = "item-chip";
    chip.style.animationDelay = `${i * 0.06}s`;

    let badge;
    if (showFraction && !item.isFull) {
      badge = `<span class="chip-fraction">${(item.fraction * 100).toFixed(1)}% taken</span>`;
    } else {
      badge = `<span class="chip-full">✓ Full</span>`;
    }

    chip.innerHTML = `
      <span class="chip-name">${item.name}</span>
      <span class="chip-info">${item.taken} kg | ₹${item.profit} &nbsp;${badge}</span>
    `;
    el.appendChild(chip);
  });
}

// ── Comparison Chart + Table ─────────────────
function renderComparison(greedy, dp) {
  document.getElementById("comparisonSection").style.display = "block";
  drawChart(greedy, dp);
  renderComparisonTable(greedy, dp);
}

function drawChart(greedy, dp) {
  const canvas = document.getElementById("comparisonChart");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0f1320";
  ctx.fillRect(0, 0, W, H);

  const metrics = [
    { label: "Total Profit (₹)",    greedy: greedy.totalProfit, dp: dp.totalProfit },
    { label: "Weight Used (kg)",     greedy: greedy.weightUsed,  dp: dp.weightUsed  },
    { label: "Time (µs × 1000)",     greedy: greedy.timeMs * 1000, dp: dp.timeMs * 1000 },
  ];

  const allVals = metrics.flatMap(m => [m.greedy, m.dp]);
  const maxVal  = Math.max(...allVals) * 1.2 || 1;
  const barW = 60, groupGap = 100, padL = 90, padT = 40, padB = 70;
  const chartH = H - padT - padB;

  // Grid + Y labels
  for (let j = 0; j <= 5; j++) {
    const y = padT + chartH - (j / 5) * chartH;
    ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - 20, y); ctx.stroke();
    ctx.fillStyle = "#8892a4"; ctx.font = "11px Inter"; ctx.textAlign = "right";
    ctx.fillText(fmt(maxVal * j / 5, 1), padL - 8, y + 4);
  }

  metrics.forEach((m, gi) => {
    const gx = padL + gi * (2 * barW + groupGap) + 40;

    // Greedy bar
    const gH = (m.greedy / maxVal) * chartH;
    const gy = padT + chartH - gH;
    const gGrad = ctx.createLinearGradient(0, gy, 0, gy + gH);
    gGrad.addColorStop(0, "#34d399"); gGrad.addColorStop(1, "#059669");
    ctx.fillStyle = gGrad;
    roundRect(ctx, gx, gy, barW, gH, 6); ctx.fill();
    ctx.fillStyle = "#34d399"; ctx.font = "bold 11px JetBrains Mono"; ctx.textAlign = "center";
    ctx.fillText(fmt(m.greedy, 1), gx + barW / 2, gy - 6);

    // DP bar
    const dH = (m.dp / maxVal) * chartH;
    const dy = padT + chartH - dH;
    const dGrad = ctx.createLinearGradient(0, dy, 0, dy + dH);
    dGrad.addColorStop(0, "#a78bfa"); dGrad.addColorStop(1, "#6d28d9");
    ctx.fillStyle = dGrad;
    roundRect(ctx, gx + barW + 8, dy, barW, dH, 6); ctx.fill();
    ctx.fillStyle = "#a78bfa"; ctx.font = "bold 11px JetBrains Mono"; ctx.textAlign = "center";
    ctx.fillText(fmt(m.dp, 1), gx + barW + 8 + barW / 2, dy - 6);

    // X label
    ctx.fillStyle = "#e2e8f0"; ctx.font = "12px Inter"; ctx.textAlign = "center";
    ctx.fillText(m.label, gx + barW + 4, H - padB + 22);
  });

  // Legend
  const lx = W - 180, ly = padT;
  ctx.fillStyle = "rgba(52,211,153,0.8)"; ctx.fillRect(lx, ly, 14, 14);
  ctx.fillStyle = "#e2e8f0"; ctx.font = "12px Inter"; ctx.textAlign = "left";
  ctx.fillText("Greedy", lx + 20, ly + 11);
  ctx.fillStyle = "rgba(167,139,250,0.8)"; ctx.fillRect(lx, ly + 24, 14, 14);
  ctx.fillText("DP (0/1)", lx + 20, ly + 35);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

function renderComparisonTable(greedy, dp) {
  const tbody = document.getElementById("comparisonBody");
  tbody.innerHTML = "";

  const rows = [
    { metric: "Total Profit (₹)",    gVal: `₹${fmt(greedy.totalProfit)}`,  dVal: `₹${dp.totalProfit}`,        winner: greedy.totalProfit >= dp.totalProfit ? "🟢 Greedy" : "🟣 DP" },
    { metric: "Weight Used (kg)",     gVal: `${fmt(greedy.weightUsed)} kg`, dVal: `${dp.weightUsed} kg`,       winner: "— Equal" },
    { metric: "Execution Time",       gVal: fmtTime(greedy.timeMs),         dVal: fmtTime(dp.timeMs),          winner: greedy.timeMs <= dp.timeMs ? "🟢 Greedy" : "🟣 DP" },
    { metric: "Allows Fractions",     gVal: "✅ Yes",                        dVal: "❌ No (integers only)",     winner: "Use-case dependent" },
    { metric: "Optimal for 0/1?",     gVal: "❌ Not always",                dVal: "✅ Always",                 winner: "🟣 DP" },
    { metric: "Time Complexity",      gVal: "O(n log n)",                   dVal: "O(n × W)",                  winner: "🟢 Greedy (large W)" },
    { metric: "Space Complexity",     gVal: "O(n)",                         dVal: "O(n × W)",                  winner: "🟢 Greedy" },
  ];

  rows.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:600;color:#e2e8f0">${row.metric}</td>
      <td class="greedy-col" style="font-family:'JetBrains Mono',monospace">${row.gVal}</td>
      <td class="dp-col"     style="font-family:'JetBrains Mono',monospace">${row.dVal}</td>
      <td class="winner-cell">${row.winner}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── DP Table ─────────────────────────────────
function renderDPTable(table, tracedCells, maxCols, capacity) {
  document.getElementById("dpTableSection").style.display = "block";
  const wrap = document.getElementById("dpTableWrap");
  wrap.innerHTML = "";

  const tracedSet = new Set(tracedCells);
  const n = table.length - 1;
  const W = maxCols;

  const tbl = document.createElement("table");
  tbl.className = "dp-tbl";

  // Header
  const thead = document.createElement("thead");
  const hRow  = document.createElement("tr");
  hRow.innerHTML = `<th>i \\ w</th>`;
  for (let w = 0; w <= W; w++) hRow.innerHTML += `<th>${w}</th>`;
  thead.appendChild(hRow);
  tbl.appendChild(thead);

  // Body
  const tbody = document.createElement("tbody");
  for (let i = 0; i <= n; i++) {
    const tr = document.createElement("tr");
    const lbl = i === 0 ? "—" : `${i}`;
    tr.innerHTML = `<th>${lbl}</th>`;
    for (let w = 0; w <= W; w++) {
      const val     = table[i][w];
      const isTrace = tracedSet.has(`${i},${w}`);
      const isChng  = i > 0 && table[i][w] !== table[i-1][w];
      let cls = "";
      if (isTrace)      cls = "dp-cell-traced";
      else if (isChng)  cls = "dp-cell-active";
      else if (val === 0) cls = "dp-cell-zero";
      tr.innerHTML += `<td class="${cls}">${val}</td>`;
    }
    tbody.appendChild(tr);
  }
  tbl.appendChild(tbody);
  wrap.appendChild(tbl);

  if (capacity > 50) {
    const note = document.createElement("p");
    note.style.cssText = "color:var(--muted);font-size:0.8rem;margin-top:10px;padding:0 4px";
    note.textContent = `Showing first 50 of ${capacity} capacity columns.`;
    wrap.appendChild(note);
  }
}

// ── Keyboard shortcut ────────────────────────
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && ["itemName","itemWeight","itemProfit"].includes(e.target.id)) {
    addItem();
  }
});
