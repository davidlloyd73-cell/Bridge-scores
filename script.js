const colours = {
  Caroline: "#c95f50",
  David: "#2f6f9f",
  Hamish: "#3f8f70",
  Vivienne: "#7463a8",
  Clubs: "#3f8f70",
  Diamonds: "#c95f50",
  Hearts: "#c8942e",
  Spades: "#2f6f9f",
  "No Trumps": "#7463a8"
};

const state = {
  records: [],
  search: "",
  dateFilter: "all",
  playerFilter: "all",
  suitFilter: "all",
  efficiencyYear: "all",
  efficiencySession: "all"
};

const fmt = new Intl.NumberFormat("en-GB");
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit" });

fetch("data.json")
  .then((response) => response.json())
  .then((payload) => {
    state.records = payload.records;
    initialiseControls();
    render();
  })
  .catch((error) => {
    document.querySelector("main").innerHTML = `<section class="panel"><h2>Dashboard data could not be loaded</h2><p>${error.message}</p></section>`;
  });

function initialiseControls() {
  const dates = unique(state.records.map((row) => row.date)).sort();
  const players = unique(state.records.map((row) => row.player)).sort();
  const suits = unique(state.records.map((row) => row.suit).filter(Boolean)).sort();
  const years = unique(dates.map((date) => date.slice(0, 4))).sort();

  document.getElementById("recordCount").textContent = `${fmt.format(state.records.length)} score entries`;
  document.getElementById("dateRange").textContent = `${formatDate(dates[0])} to ${formatDate(dates.at(-1))}`;

  fillSelect("playerFilter", players);
  fillSelect("suitFilter", suits);
  fillSelect("efficiencyYear", years);
  fillSelect("efficiencySession", dates, formatDate);

  ["dateFilter", "playerFilter", "suitFilter"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (event) => {
      state[id] = event.target.value;
      render();
    });
  });

  document.getElementById("efficiencyYear").addEventListener("change", (event) => {
    state.efficiencyYear = event.target.value;
    state.efficiencySession = "all";
    syncEfficiencySessions();
    renderEfficiencyIndex();
  });

  document.getElementById("efficiencySession").addEventListener("change", (event) => {
    state.efficiencySession = event.target.value;
    renderEfficiencyIndex();
  });

  document.getElementById("handSearch").addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderHandTable(filteredRecords());
  });
}

function fillSelect(id, values, labelFormatter = (value) => value) {
  const select = document.getElementById(id);
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = labelFormatter(value);
    select.appendChild(option);
  });
}

function render() {
  const records = filteredRecords();
  renderKpis(records);
  renderYearSummary(state.records);
  renderEfficiencyIndex();
  renderLeaderboard(records);
  renderContractBars(records);
  renderCumulativeChart(records);
  renderSessionChart(records);
  renderSuitMix(records);
  renderLatestHand(records);
  renderHandTable(records);
}

function filteredRecords() {
  let records = [...state.records];
  const dates = unique(records.map((row) => row.date)).sort();
  const dateSets = {
    latest: dates.slice(-1),
    last5: dates.slice(-5),
    last10: dates.slice(-10),
    all: dates
  };

  records = records.filter((row) => dateSets[state.dateFilter].includes(row.date));
  if (state.playerFilter !== "all") records = records.filter((row) => row.player === state.playerFilter);
  if (state.suitFilter !== "all") records = records.filter((row) => row.suit === state.suitFilter);
  return records;
}

function renderKpis(records) {
  const totals = playerTotals(records);
  const leaders = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const grouped = groupHands(records);
  const best = grouped.sort((a, b) => b.score - a.score)[0];
  const total = records.reduce((sum, row) => sum + row.score, 0);

  document.getElementById("totalPoints").textContent = fmt.format(total);
  document.getElementById("handsRecorded").textContent = fmt.format(grouped.length);
  document.getElementById("topScorer").textContent = leaders[0] ? `${leaders[0][0]} ${fmt.format(leaders[0][1])}` : "-";
  document.getElementById("bestHand").textContent = best ? `${fmt.format(best.score)} on ${formatDate(best.date)}` : "-";
}

function syncEfficiencySessions() {
  const select = document.getElementById("efficiencySession");
  const dates = unique(state.records
    .map((row) => row.date)
    .filter((date) => state.efficiencyYear === "all" || date.startsWith(state.efficiencyYear)))
    .sort();

  select.innerHTML = '<option value="all">All sessions</option>';
  fillSelect("efficiencySession", dates, formatDate);
  select.value = state.efficiencySession;
}

function efficiencyRecords() {
  return state.records.filter((row) => {
    const yearMatch = state.efficiencyYear === "all" || row.date.startsWith(state.efficiencyYear);
    const sessionMatch = state.efficiencySession === "all" || row.date === state.efficiencySession;
    return yearMatch && sessionMatch;
  });
}

function renderEfficiencyIndex() {
  const el = document.getElementById("efficiencyIndex");
  const rows = Object.entries(efficiencyByPlayer(efficiencyRecords()))
    .map(([player, item]) => ({ player, ...item, index: item.hcp ? item.score / item.hcp : 0 }))
    .sort((a, b) => b.index - a.index);
  const max = Math.max(...rows.map((row) => row.index), 1);

  el.innerHTML = rows.map((row, index) => `
    <article class="efficiency-card">
      <div class="efficiency-card__rank">${index + 1}</div>
      <div class="efficiency-card__body">
        <div class="efficiency-card__top">
          <strong>${row.player}</strong>
          <span>${row.index.toFixed(2)}</span>
        </div>
        <div class="leader__bar"><div class="leader__fill" style="width:${row.index / max * 100}%;background:${colours[row.player] || "#60717d"}"></div></div>
        <div class="efficiency-card__meta">
          <span>${fmt.format(row.score)} score</span>
          <span>${fmt.format(row.hcp)} HCP</span>
          <span>${fmt.format(row.hands)} hands</span>
        </div>
      </div>
    </article>
  `).join("") || emptyMessage("No efficiency data for this period.");
}

function renderYearSummary(records) {
  const el = document.getElementById("yearSummary");
  const groupedHands = groupHands(records);
  const years = unique(records.map((row) => row.date.slice(0, 4))).sort();
  const latestYear = years.at(-1);

  el.innerHTML = years.map((year) => {
    const yearRecords = records.filter((row) => row.date.startsWith(year));
    const yearHands = groupedHands.filter((hand) => hand.date.startsWith(year));
    const dates = unique(yearRecords.map((row) => row.date));
    const totals = Object.entries(playerTotals(yearRecords)).sort((a, b) => b[1] - a[1]);
    const leader = totals[0];
    const totalScore = yearRecords.reduce((sum, row) => sum + row.score, 0);
    const maxScore = Math.max(...totals.map((item) => item[1]), 1);
    const badge = year === latestYear ? "to date" : "complete";

    return `
      <article class="year-card">
        <div class="year-card__top">
          <div>
            <span class="year-card__badge">${badge}</span>
            <h3>${year}</h3>
          </div>
          <strong>${fmt.format(totalScore)}</strong>
        </div>
        <div class="year-stats">
          <span><b>${fmt.format(dates.length)}</b> sessions</span>
          <span><b>${fmt.format(yearHands.length)}</b> hands</span>
          <span><b>${leader ? leader[0] : "-"}</b> leader</span>
        </div>
        <div class="year-players">
          ${totals.map(([player, score]) => `
            <div class="year-player">
              <div class="year-player__label"><span>${player}</span><strong>${fmt.format(score)}</strong></div>
              <div class="leader__bar"><div class="leader__fill" style="width:${score / maxScore * 100}%;background:${colours[player] || "#60717d"}"></div></div>
            </div>
          `).join("")}
        </div>
      </article>`;
  }).join("") || emptyMessage("No annual data available.");
}

function renderLeaderboard(records) {
  const el = document.getElementById("leaderboard");
  const totals = Object.entries(playerTotals(records)).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...totals.map((item) => item[1]), 1);
  el.innerHTML = totals.map(([player, total], index) => {
    const hands = records.filter((row) => row.player === player).length || 1;
    return `
      <div class="leader">
        <div class="rank">${index + 1}</div>
        <div>
          <div class="leader__name"><strong>${player}</strong><span>${fmt.format(Math.round(total / hands))} avg</span></div>
          <div class="leader__bar"><div class="leader__fill" style="width:${total / max * 100}%;background:${colours[player] || "#60717d"}"></div></div>
        </div>
        <div class="leader__score">${fmt.format(total)}</div>
      </div>`;
  }).join("") || emptyMessage("No player data for this filter.");
}

function renderContractBars(records) {
  const el = document.getElementById("contractBars");
  const contracts = records.filter((row) => row.auction === "Yes" && row.contract && row.tricks !== null);
  const byPlayer = {};
  contracts.forEach((row) => {
    const target = row.contract + 6;
    const made = row.tricks >= target;
    byPlayer[row.player] ||= { made: 0, total: 0 };
    byPlayer[row.player].made += made ? 1 : 0;
    byPlayer[row.player].total += 1;
  });

  el.innerHTML = Object.entries(byPlayer).sort((a, b) => b[1].total - a[1].total).map(([player, item]) => {
    const pct = item.total ? Math.round(item.made / item.total * 100) : 0;
    return `
      <div class="bar">
        <div class="bar__label"><strong>${player}</strong><span>${pct}% made (${item.made}/${item.total})</span></div>
        <div class="bar__track"><div class="bar__fill" style="width:${pct}%;background:${colours[player] || "#60717d"}"></div></div>
      </div>`;
  }).join("") || emptyMessage("No contract data for this filter.");
}

function renderCumulativeChart(records) {
  const dates = unique(records.map((row) => row.date)).sort();
  const players = unique(records.map((row) => row.player)).sort();
  const series = players.map((player) => {
    let running = 0;
    const points = dates.map((date) => {
      running += records.filter((row) => row.date === date && row.player === player).reduce((sum, row) => sum + row.score, 0);
      return { x: date, y: running };
    });
    return { name: player, points };
  });
  document.getElementById("cumulativeChart").innerHTML = lineChart(series, 880, 330);
}

function renderSessionChart(records) {
  const dates = unique(records.map((row) => row.date)).sort();
  const players = unique(records.map((row) => row.player)).sort();
  const series = players.map((player) => ({
    name: player,
    points: dates.map((date) => ({
      x: date,
      y: records.filter((row) => row.date === date && row.player === player).reduce((sum, row) => sum + row.score, 0)
    }))
  }));
  document.getElementById("sessionChart").innerHTML = lineChart(series, 880, 275);
}

function lineChart(series, width, height) {
  const pad = { top: 18, right: 18, bottom: 34, left: 58 };
  const all = series.flatMap((item) => item.points);
  if (!all.length) return emptyMessage("No chart data for this filter.");
  const minY = Math.min(0, ...all.map((point) => point.y));
  const maxY = Math.max(...all.map((point) => point.y), 1);
  const count = Math.max(...series.map((item) => item.points.length), 1);
  const x = (i) => pad.left + (count === 1 ? 0 : i / (count - 1)) * (width - pad.left - pad.right);
  const y = (value) => height - pad.bottom - ((value - minY) / (maxY - minY || 1)) * (height - pad.top - pad.bottom);
  const grid = [0, 0.25, 0.5, 0.75, 1].map((tick) => {
    const value = minY + (maxY - minY) * tick;
    return `<line class="grid" x1="${pad.left}" x2="${width - pad.right}" y1="${y(value)}" y2="${y(value)}"></line><text class="tick" x="8" y="${y(value) + 4}">${fmt.format(Math.round(value))}</text>`;
  }).join("");
  const paths = series.map((item) => {
    const d = item.points.map((point, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(point.y).toFixed(1)}`).join(" ");
    return `<path class="line-path" d="${d}" stroke="${colours[item.name] || "#60717d"}"></path>`;
  }).join("");
  const labels = all.length ? `<text class="tick" x="${pad.left}" y="${height - 8}">${formatDate(all[0].x)}</text><text class="tick" text-anchor="end" x="${width - pad.right}" y="${height - 8}">${formatDate(all.at(-1).x)}</text>` : "";
  const legend = `<div class="legend">${series.map((item) => `<span><i class="swatch" style="background:${colours[item.name] || "#60717d"}"></i>${item.name}</span>`).join("")}</div>`;
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Line chart">${grid}<line class="axis" x1="${pad.left}" x2="${width - pad.right}" y1="${height - pad.bottom}" y2="${height - pad.bottom}"></line>${paths}${labels}</svg>${legend}`;
}

function renderSuitMix(records) {
  const contracts = records.filter((row) => row.suit);
  const counts = {};
  contracts.forEach((row) => counts[row.suit] = (counts[row.suit] || 0) + 1);
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  if (!total) {
    document.getElementById("suitMix").innerHTML = emptyMessage("No suit data for this filter.");
    return;
  }
  let offset = 25;
  const slices = Object.entries(counts).map(([suit, count]) => {
    const pct = count / total * 100;
    const dash = `${pct} ${100 - pct}`;
    const circle = `<circle r="70" cx="100" cy="100" fill="transparent" stroke="${colours[suit] || "#60717d"}" stroke-width="24" stroke-dasharray="${dash}" stroke-dashoffset="${offset}" pathLength="100"></circle>`;
    offset -= pct;
    return circle;
  }).join("");
  const legend = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([suit, count]) => `<span><i class="swatch" style="background:${colours[suit] || "#60717d"}"></i>${suit} ${Math.round(count / total * 100)}%</span>`).join("");
  document.getElementById("suitMix").innerHTML = `<svg viewBox="0 0 200 200" role="img" aria-label="Suit mix donut">${slices}<circle r="49" cx="100" cy="100" fill="#fff"></circle><text x="100" y="96" text-anchor="middle" font-size="24" font-weight="800">${fmt.format(total)}</text><text x="100" y="118" text-anchor="middle" class="tick">contracts</text></svg><div class="legend">${legend}</div>`;
}

function renderLatestHand(records) {
  const grouped = groupHands(records).sort((a, b) => a.date.localeCompare(b.date) || a.hand - b.hand);
  const hand = grouped.at(-1);
  const el = document.getElementById("latestHand");
  if (!hand) {
    el.innerHTML = emptyMessage("No hands for this filter.");
    return;
  }
  el.innerHTML = `
    <div class="latest__line"><span>Date</span><strong>${formatDate(hand.date)}</strong></div>
    <div class="latest__line"><span>Hand</span><strong>${hand.hand}</strong></div>
    <div class="latest__line"><span>Contract</span><strong>${contractLabel(hand)}</strong></div>
    <div class="latest__line"><span>Declarer</span><strong>${hand.declarer || "-"}</strong></div>
    <div class="latest__line"><span>Score</span><strong>${fmt.format(hand.score)}</strong></div>`;
}

function renderHandTable(records) {
  const rows = groupHands(records)
    .filter((hand) => {
      if (!state.search) return true;
      return [hand.date, hand.hand, hand.declarer, hand.suit, hand.players.join(" ")].join(" ").toLowerCase().includes(state.search);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.hand - a.hand)
    .slice(0, 80);

  document.getElementById("handRows").innerHTML = rows.map((hand) => `
    <tr>
      <td>${formatDate(hand.date)}</td>
      <td>${hand.hand}</td>
      <td><span class="pill">${contractLabel(hand)}</span></td>
      <td>${hand.declarer || "-"}</td>
      <td>${resultLabel(hand)}</td>
      <td>${fmt.format(hand.score)}</td>
      <td>${hand.players.join(", ")}</td>
    </tr>`).join("") || `<tr><td colspan="7">${emptyMessage("No matching hands.")}</td></tr>`;
}

function groupHands(records) {
  const map = new Map();
  records.forEach((row) => {
    const key = `${row.date}|${row.hand}`;
    if (!map.has(key)) map.set(key, { date: row.date, hand: row.hand, rows: [], players: [], score: 0 });
    const item = map.get(key);
    item.rows.push(row);
    item.players.push(row.player);
    item.score = Math.max(item.score, row.score);
    const contractRow = row.contract ? row : null;
    if (contractRow && !item.contract) Object.assign(item, contractRow);
  });
  return [...map.values()];
}

function contractLabel(hand) {
  if (!hand.contract) return "Passed out";
  return `${hand.contract} ${hand.suit || ""}`.trim();
}

function resultLabel(hand) {
  if (!hand.contract || hand.tricks === null) return "-";
  const diff = hand.tricks - (hand.contract + 6);
  if (diff === 0) return "Made";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function playerTotals(records) {
  return records.reduce((totals, row) => {
    totals[row.player] = (totals[row.player] || 0) + row.score;
    return totals;
  }, {});
}

function efficiencyByPlayer(records) {
  return records.reduce((totals, row) => {
    totals[row.player] ||= { score: 0, hcp: 0, hands: 0 };
    totals[row.player].score += row.score;
    totals[row.player].hcp += row.hcp;
    totals[row.player].hands += 1;
    return totals;
  }, {});
}

function unique(values) {
  return [...new Set(values)];
}

function formatDate(value) {
  return shortDate.format(new Date(`${value}T00:00:00`));
}

function emptyMessage(text) {
  return `<p class="empty">${text}</p>`;
}
