const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const defaultInput = path.resolve(__dirname, "Report Global.xlsx");
const defaultOutput = path.resolve(__dirname, "dashboard_global_summit_codex.html");

const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultInput;
const outputPath = process.argv[3] ? path.resolve(process.argv[3]) : defaultOutput;

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCompany(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function toFlag(value) {
  if (value === 1 || value === true) return 1;
  if (value === 0 || value === false || value == null) return 0;
  if (typeof value === "number") return value > 0 ? 1 : 0;
  const text = normalizeText(value);
  if (!text) return 0;
  if (text === "1" || text === "x" || text === "si" || text === "yes") return 1;
  const num = Number(text.replace(",", "."));
  return Number.isFinite(num) && num > 0 ? 1 : 0;
}

function parseSheetName(name) {
  const match = String(name).match(/(GSL[MS])\s*([01]?\d)\s*[-/]\s*(\d{4})/i);
  if (!match) return null;
  const eventCode = match[1].toUpperCase();
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return {
    eventCode,
    month,
    year,
    dateKey: `${year}-${String(month).padStart(2, "0")}-01`,
    edition: `${eventCode} ${String(month).padStart(2, "0")}-${year}`,
  };
}

function findCompanyColumn(keys) {
  return keys.find((key) => normalizeText(key).startsWith("societa"));
}

function findFlagColumn(keys, type) {
  return keys.find((key) => {
    const k = normalizeText(key);
    if (k.includes("somma") || k.includes("conteggio")) return false;
    if (type === "wms") return k === "wms";
    if (type === "selected") return k.includes("selezionata");
    if (type === "met") return k.includes("incontrata");
    if (type === "call") return k.includes("call") && k.includes("visita");
    return false;
  });
}

function parseUnionePresence(rows) {
  if (!rows.length) return new Map();
  const keys = Object.keys(rows[0]);
  const leftNameKey = keys.find((k) => normalizeText(k).startsWith("societa"));
  const leftCountKey = keys.find((k) => {
    const n = normalizeText(k);
    return n.includes("n presenze") && !n.includes("conteggio");
  });
  const rightNameKey = keys.find((k) => normalizeText(k).includes("etichette di riga"));
  const rightCountKey = keys.find((k) => normalizeText(k).includes("conteggio di n presenze"));

  const map = new Map();
  const addPair = (nameValue, countValue) => {
    const name = cleanCompany(nameValue);
    const count = Number(countValue);
    if (!name || !Number.isFinite(count) || count <= 0) return;
    const key = normalizeText(name);
    const previous = map.get(key) || 0;
    map.set(key, Math.max(previous, Math.round(count)));
  };

  for (const row of rows) {
    if (leftNameKey && leftCountKey) addPair(row[leftNameKey], row[leftCountKey]);
    if (rightNameKey && rightCountKey) addPair(row[rightNameKey], row[rightCountKey]);
  }
  return map;
}

function parseWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath);
  const eventRows = [];
  const fallbackPresence = new Map();
  let unioneRows = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    if (normalizeText(sheetName) === "unione") {
      unioneRows = rows;
      continue;
    }

    const sheetMeta = parseSheetName(sheetName);
    if (!sheetMeta || !rows.length) continue;

    const keys = Object.keys(rows[0]);
    const companyKey = findCompanyColumn(keys);
    const wmsKey = findFlagColumn(keys, "wms");
    const selectedKey = findFlagColumn(keys, "selected");
    const metKey = findFlagColumn(keys, "met");
    const callKey = findFlagColumn(keys, "call");
    if (!companyKey) continue;

    for (const row of rows) {
      const company = cleanCompany(row[companyKey]);
      if (!company) continue;
      const companyNorm = normalizeText(company);
      if (!companyNorm || companyNorm === "totale complessivo") continue;

      const record = {
        company,
        companyNorm,
        wms: toFlag(row[wmsKey]),
        selected: toFlag(row[selectedKey]),
        met: toFlag(row[metKey]),
        callVisit: toFlag(row[callKey]),
        eventCode: sheetMeta.eventCode,
        edition: sheetMeta.edition,
        month: sheetMeta.month,
        year: sheetMeta.year,
        dateKey: sheetMeta.dateKey,
      };

      eventRows.push(record);
      const key = `${companyNorm}|${sheetMeta.edition}`;
      fallbackPresence.set(key, 1);
    }
  }

  const fallbackCompanyPresence = new Map();
  for (const key of fallbackPresence.keys()) {
    const [companyNorm] = key.split("|");
    fallbackCompanyPresence.set(companyNorm, (fallbackCompanyPresence.get(companyNorm) || 0) + 1);
  }

  const unionePresence = parseUnionePresence(unioneRows);
  for (const row of eventRows) {
    const fromUnione = unionePresence.get(row.companyNorm);
    row.presenze = Number.isFinite(fromUnione)
      ? fromUnione
      : (fallbackCompanyPresence.get(row.companyNorm) || 1);
  }

  return eventRows;
}

function buildHtml(data) {
  const jsonData = JSON.stringify(data);
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dashboard ROI Fiere Global Summit</title>
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
  <style>
    :root {
      --bg: #f5f7f4;
      --ink: #1f2a22;
      --ink-soft: #506257;
      --brand: #0f5f44;
      --brand-2: #d4a017;
      --panel: #ffffff;
      --line: #d9dfda;
      --danger: #b3261e;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "Trebuchet MS", sans-serif;
      background:
        radial-gradient(circle at 10% 10%, rgba(212, 160, 23, 0.12), transparent 40%),
        radial-gradient(circle at 90% 20%, rgba(15, 95, 68, 0.12), transparent 45%),
        var(--bg);
      color: var(--ink);
    }
    .wrap {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 34px;
      letter-spacing: 0.3px;
    }
    .subtitle {
      margin: 0 0 20px;
      color: var(--ink-soft);
      font-size: 15px;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 6px 20px rgba(15, 37, 27, 0.05);
    }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }
    .filter label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
      color: var(--ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .filter select, .filter input[type="text"], .filter input[type="number"] {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px 10px;
      background: #fff;
      font-size: 14px;
      color: var(--ink);
    }
    .filter .checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 26px;
      font-size: 14px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }
    button {
      border: 0;
      background: var(--brand);
      color: #fff;
      padding: 9px 12px;
      border-radius: 9px;
      cursor: pointer;
      font-weight: 600;
    }
    .kpis {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(5, minmax(160px, 1fr));
      gap: 12px;
    }
    .kpi {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px;
    }
    .kpi.clickable {
      cursor: pointer;
      transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
    }
    .kpi.clickable:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(15, 37, 27, 0.08);
      border-color: #b8c8be;
    }
    .kpi.active {
      border-color: var(--brand);
      box-shadow: inset 0 0 0 1px var(--brand);
      background: #f0f7f4;
    }
    .kpi .name {
      font-size: 11px;
      color: var(--ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
    }
    .kpi .value {
      margin-top: 6px;
      font-size: 29px;
      font-weight: 800;
      line-height: 1;
    }
    .kpi .meta {
      margin-top: 6px;
      font-size: 12px;
      color: var(--ink-soft);
    }
    .charts {
      margin-top: 14px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .chart {
      min-height: 360px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 8px;
    }
    .wide {
      grid-column: 1 / -1;
      min-height: 430px;
    }
    .insights {
      margin-top: 14px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .insights h3 {
      margin: 0 0 10px;
      font-size: 16px;
    }
    .insights ul {
      margin: 0;
      padding-left: 18px;
      color: var(--ink);
      font-size: 14px;
      line-height: 1.45;
    }
    .table-wrap {
      margin-top: 14px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: auto;
      max-height: 430px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead th {
      position: sticky;
      top: 0;
      background: #eff4f1;
      color: #2e4538;
      text-align: left;
      border-bottom: 1px solid var(--line);
      padding: 8px;
      white-space: nowrap;
    }
    tbody td {
      border-bottom: 1px solid #edf1ee;
      padding: 8px;
      white-space: nowrap;
    }
    tbody tr:hover {
      background: #f8fbf9;
    }
    .danger {
      color: var(--danger);
      font-weight: 700;
    }
    .table-tools {
      margin-top: 14px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      align-items: center;
    }
    .table-tools .left {
      font-size: 14px;
      color: var(--ink-soft);
      font-weight: 600;
    }
    .table-tools .right {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: flex-end;
    }
    .table-tools label {
      font-size: 12px;
      font-weight: 700;
      color: var(--ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .table-tools select {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px 10px;
      min-width: 240px;
      background: #fff;
      font-size: 14px;
    }
    @media (max-width: 980px) {
      .filter-grid { grid-template-columns: 1fr 1fr; }
      .kpis { grid-template-columns: 1fr 1fr; }
      .charts { grid-template-columns: 1fr; }
      .insights { grid-template-columns: 1fr; }
      .table-tools { grid-template-columns: 1fr; }
      .table-tools .right { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Global Summit ROI Dashboard</h1>
    <p class="subtitle">Misura conversioni da fiera a opportunita (call/visita) con focus WMS. Nota: ROI economico completo richiede costi fiera e ricavi effettivi.</p>

    <div class="panel">
      <div class="filter-grid">
        <div class="filter">
          <label for="yearFilter">Anni</label>
          <select id="yearFilter" multiple size="4"></select>
        </div>
        <div class="filter">
          <label for="eventFilter">Evento</label>
          <select id="eventFilter" multiple size="4"></select>
        </div>
        <div class="filter">
          <label for="minPresence">Presenze min</label>
          <input id="minPresence" type="number" min="1" value="1" />
        </div>
        <div class="filter">
          <label for="searchCompany">Cerca azienda</label>
          <input id="searchCompany" type="text" placeholder="es. Ducati" />
        </div>
        <div class="filter">
          <div class="checkbox">
            <input id="wmsOnly" type="checkbox" />
            <label for="wmsOnly">Solo lead WMS</label>
          </div>
        </div>
      </div>
      <div class="actions">
        <button id="resetBtn" type="button">Reset filtri</button>
      </div>
    </div>

    <div class="kpis" id="kpis"></div>

    <div class="charts">
      <div class="chart" id="funnelChart"></div>
      <div class="chart" id="conversionChart"></div>
      <div class="chart" id="editionBarChart"></div>
      <div class="chart" id="eventTypeChart"></div>
      <div class="chart wide" id="companyScatter"></div>
    </div>

    <div class="insights">
      <div class="panel">
        <h3>Lettura ROI/Conversione</h3>
        <ul id="insightList"></ul>
      </div>
      <div class="panel">
        <h3>Analisi da fare (prossimo livello)</h3>
        <ul>
          <li>Aggiungi costo per singola edizione (stand, trasferta, persone) per ottenere ROI economico reale.</li>
          <li>Classifica lead per ICP (settore, dimensione, urgenza) e confronta i tassi di conversione per segmento.</li>
          <li>Traccia tempo medio da fiera a call/visita per misurare velocita commerciale post-evento.</li>
          <li>Separa outcome di call/visita: qualificata, preventivo, trattativa, persa.</li>
          <li>Confronta aziende con molte presenze ma zero avanzamento: riduci effort su contatti turistici.</li>
        </ul>
      </div>
    </div>

    <div class="panel table-tools">
      <div class="left" id="companyFilterInfo">Elenco aziende: tutte</div>
      <div class="right">
        <label for="tableSort">Ordina per</label>
        <select id="tableSort">
          <option value="company_asc">Azienda (A-Z)</option>
          <option value="company_desc">Azienda (Z-A)</option>
          <option value="call_desc" selected>Call/Visita (desc)</option>
          <option value="call_asc">Call/Visita (asc)</option>
          <option value="presence_desc">Presenze (desc)</option>
          <option value="presence_asc">Presenze (asc)</option>
        </select>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Azienda</th>
            <th>Presenze</th>
            <th>WMS</th>
            <th>Selezionata</th>
            <th>Incontrata</th>
            <th>Call/Visita</th>
            <th>Call/Incontrata</th>
          </tr>
        </thead>
        <tbody id="companyTableBody"></tbody>
      </table>
    </div>
  </div>

  <script>
    const rawData = ${jsonData};
    const monthNames = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
    const eventMap = {
      GSLM: "Global Summit Logistics & Manufacturing",
      GSLS: "Global Summit Logistics & Supply Chain"
    };

    const yearFilter = document.getElementById("yearFilter");
    const eventFilter = document.getElementById("eventFilter");
    const minPresenceInput = document.getElementById("minPresence");
    const searchCompanyInput = document.getElementById("searchCompany");
    const wmsOnlyInput = document.getElementById("wmsOnly");
    const resetBtn = document.getElementById("resetBtn");
    const tableSortSelect = document.getElementById("tableSort");
    const companyFilterInfo = document.getElementById("companyFilterInfo");

    let activeCompanyFilter = "all";
    const companyFilterLabels = {
      all: "tutte",
      wms: "con interesse WMS",
      selected: "selezionate",
      met: "incontrate",
      call: "con Call/Visita"
    };

    function pct(num, den) {
      if (!den) return "0.0%";
      return (100 * num / den).toFixed(1) + "%";
    }

    function numericPct(num, den) {
      if (!den) return 0;
      return 100 * num / den;
    }

    function toInt(v) {
      return Number(v) || 0;
    }

    function sum(items, key) {
      return items.reduce((acc, item) => acc + toInt(item[key]), 0);
    }

    function uniqueSorted(items) {
      return Array.from(new Set(items)).sort((a, b) => (a > b ? 1 : -1));
    }

    function optionList(selectEl, values, formatter) {
      selectEl.innerHTML = "";
      values.forEach((value) => {
        const option = document.createElement("option");
        option.value = String(value);
        option.selected = true;
        option.textContent = formatter ? formatter(value) : String(value);
        selectEl.appendChild(option);
      });
    }

    function getSelectedValues(selectEl) {
      return Array.from(selectEl.selectedOptions).map((opt) => opt.value);
    }

    const years = uniqueSorted(rawData.map((d) => d.year));
    const events = uniqueSorted(rawData.map((d) => d.eventCode));
    optionList(yearFilter, years, (v) => String(v));
    optionList(eventFilter, events, (v) => eventMap[v] || v);

    function filterData() {
      const selectedYears = getSelectedValues(yearFilter).map(Number);
      const selectedEvents = getSelectedValues(eventFilter);
      const minPresence = Math.max(1, Number(minPresenceInput.value) || 1);
      const onlyWms = wmsOnlyInput.checked;
      const search = searchCompanyInput.value.trim().toLowerCase();

      return rawData.filter((row) => {
        if (!selectedYears.includes(row.year)) return false;
        if (!selectedEvents.includes(row.eventCode)) return false;
        if ((row.presenze || 1) < minPresence) return false;
        if (onlyWms && row.wms !== 1) return false;
        if (search && !String(row.company).toLowerCase().includes(search)) return false;
        return true;
      });
    }

    function aggregateByEdition(rows) {
      const map = new Map();
      rows.forEach((row) => {
        const key = row.edition;
        if (!map.has(key)) {
          map.set(key, {
            edition: row.edition,
            eventCode: row.eventCode,
            year: row.year,
            month: row.month,
            dateKey: row.dateKey,
            total: 0,
            wms: 0,
            selected: 0,
            met: 0,
            call: 0
          });
        }
        const item = map.get(key);
        item.total += 1;
        item.wms += row.wms;
        item.selected += row.selected;
        item.met += row.met;
        item.call += row.callVisit;
      });
      return Array.from(map.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    }

    function aggregateByCompany(rows) {
      const map = new Map();
      rows.forEach((row) => {
        const key = row.companyNorm;
        if (!map.has(key)) {
          map.set(key, {
            company: row.company,
            presenze: row.presenze || 1,
            leads: 0,
            wms: 0,
            selected: 0,
            met: 0,
            call: 0
          });
        }
        const item = map.get(key);
        item.leads += 1;
        item.wms += row.wms;
        item.selected += row.selected;
        item.met += row.met;
        item.call += row.callVisit;
      });
      return Array.from(map.values());
    }

    function renderKpis(rows) {
      const total = rows.length;
      const wms = sum(rows, "wms");
      const selected = sum(rows, "selected");
      const met = sum(rows, "met");
      const call = sum(rows, "callVisit");

      const cards = [
        { name: "Lead Totali", value: total, meta: "Base analizzata", filter: "all", clickable: true },
        { name: "Lead WMS", value: wms, meta: pct(wms, total) + " sui lead", filter: "wms", clickable: true },
        { name: "Selezionate", value: selected, meta: pct(selected, total) + " dei lead", filter: "selected", clickable: true },
        { name: "Incontrate", value: met, meta: pct(met, selected) + " su selezionate", filter: "met", clickable: true },
        { name: "Call/Visita", value: call, meta: pct(call, met) + " su incontrate", filter: "call", clickable: true },
        { name: "Opportunity Rate", value: pct(call, total), meta: "Call/Visita su lead", filter: null, clickable: false },
        { name: "WMS to Opportunity", value: pct(call, wms), meta: "Call/Visita su WMS", filter: null, clickable: false },
        { name: "Meeting Rate", value: pct(met, total), meta: "Incontrate su lead", filter: null, clickable: false },
        { name: "Selection to Meeting", value: pct(met, selected), meta: "Fase critica post targeting", filter: null, clickable: false },
        { name: "ROI Operativo", value: (met ? (call / met).toFixed(2) : "0.00"), meta: "Opportunita per incontro", filter: null, clickable: false }
      ];

      const container = document.getElementById("kpis");
      container.innerHTML = cards.map((card) =>
        '<div class="kpi ' +
        (card.clickable ? "clickable " : "") +
        ((card.filter && activeCompanyFilter === card.filter) ? "active" : "") +
        '"' +
        (card.filter ? ' data-kpi-filter="' + card.filter + '"' : "") +
        '><div class="name">' + card.name + '</div><div class="value">' + card.value + '</div><div class="meta">' + card.meta + '</div></div>'
      ).join("");

      container.querySelectorAll("[data-kpi-filter]").forEach((el) => {
        el.addEventListener("click", () => {
          const chosen = el.getAttribute("data-kpi-filter");
          activeCompanyFilter = (activeCompanyFilter === chosen) ? "all" : chosen;
          refresh();
        });
      });
    }

    function renderFunnel(rows) {
      const total = rows.length;
      const wms = sum(rows, "wms");
      const selected = sum(rows, "selected");
      const met = sum(rows, "met");
      const call = sum(rows, "callVisit");

      Plotly.newPlot("funnelChart", [{
        type: "funnel",
        orientation: "h",
        y: ["Lead Totali", "Lead WMS", "Selezionate", "Incontrate", "Call/Visita"],
        x: [total, wms, selected, met, call],
        textinfo: "value+percent previous",
        marker: { color: ["#335c4a", "#4f7e66", "#6f9c7f", "#97b49a", "#d4a017"] }
      }], {
        title: { text: "Funnel Opportunita", font: { size: 16 } },
        margin: { l: 90, r: 20, t: 40, b: 30 },
        paper_bgcolor: "white",
        plot_bgcolor: "white"
      }, { responsive: true, displayModeBar: false });
    }

    function renderConversionTrend(editionRows) {
      const labels = editionRows.map((d) => monthNames[d.month - 1] + " " + d.year + " " + d.eventCode);
      const meetOnSel = editionRows.map((d) => numericPct(d.met, d.selected));
      const callOnMeet = editionRows.map((d) => numericPct(d.call, d.met));
      const callOnTotal = editionRows.map((d) => numericPct(d.call, d.total));

      Plotly.newPlot("conversionChart", [
        { type: "scatter", mode: "lines+markers", name: "Incontrate/Selezionate", x: labels, y: meetOnSel, line: { color: "#0f5f44", width: 3 } },
        { type: "scatter", mode: "lines+markers", name: "Call/Incontrate", x: labels, y: callOnMeet, line: { color: "#d4a017", width: 3 } },
        { type: "scatter", mode: "lines+markers", name: "Call/Lead", x: labels, y: callOnTotal, line: { color: "#3b7f9c", width: 3 } }
      ], {
        title: { text: "Trend Conversioni per Edizione (%)", font: { size: 16 } },
        yaxis: { title: "%", rangemode: "tozero" },
        xaxis: { tickangle: -25, automargin: true },
        margin: { l: 55, r: 20, t: 60, b: 120 },
        legend: { orientation: "h", x: 0, y: -0.25 }
      }, { responsive: true, displayModeBar: false });
    }

    function renderEditionBars(editionRows) {
      const labels = editionRows.map((d) => monthNames[d.month - 1] + " " + d.year + " " + d.eventCode);
      Plotly.newPlot("editionBarChart", [
        { type: "bar", name: "Lead", x: labels, y: editionRows.map((d) => d.total), marker: { color: "#cfd8d2" } },
        { type: "bar", name: "Selezionate", x: labels, y: editionRows.map((d) => d.selected), marker: { color: "#6f9c7f" } },
        { type: "bar", name: "Incontrate", x: labels, y: editionRows.map((d) => d.met), marker: { color: "#3d7a5f" } },
        { type: "bar", name: "Call/Visita", x: labels, y: editionRows.map((d) => d.call), marker: { color: "#d4a017" } }
      ], {
        title: { text: "Volumi per Edizione", font: { size: 16 } },
        barmode: "group",
        margin: { l: 50, r: 20, t: 40, b: 90 }
      }, { responsive: true, displayModeBar: false });
    }

    function renderEventTypeChart(rows) {
      const byType = {};
      rows.forEach((row) => {
        if (!byType[row.eventCode]) byType[row.eventCode] = { total: 0, wms: 0, selected: 0, met: 0, call: 0 };
        byType[row.eventCode].total += 1;
        byType[row.eventCode].wms += row.wms;
        byType[row.eventCode].selected += row.selected;
        byType[row.eventCode].met += row.met;
        byType[row.eventCode].call += row.callVisit;
      });
      const types = Object.keys(byType).sort();
      const labels = types.map((t) => t + " - " + (eventMap[t] || t));
      Plotly.newPlot("eventTypeChart", [
        {
          type: "bar",
          name: "Call/Lead %",
          x: labels,
          y: types.map((t) => numericPct(byType[t].call, byType[t].total)),
          marker: { color: "#0f5f44" }
        },
        {
          type: "bar",
          name: "Call/WMS %",
          x: labels,
          y: types.map((t) => numericPct(byType[t].call, byType[t].wms)),
          marker: { color: "#d4a017" }
        },
        {
          type: "bar",
          name: "Incontro/Selezionata %",
          x: labels,
          y: types.map((t) => numericPct(byType[t].met, byType[t].selected)),
          marker: { color: "#3b7f9c" }
        }
      ], {
        title: { text: "Confronto Conversione per Tipo Evento", font: { size: 16 } },
        barmode: "group",
        yaxis: { title: "%" },
        margin: { l: 50, r: 20, t: 40, b: 80 }
      }, { responsive: true, displayModeBar: false });
    }

    function renderCompanyScatter(companyRows) {
      const x = companyRows.map((d) => d.presenze || 1);
      const y = companyRows.map((d) => numericPct(d.call, d.leads));
      const size = companyRows.map((d) => Math.max(9, 7 + d.met * 2));
      const color = companyRows.map((d) => numericPct(d.wms, d.leads));
      const text = companyRows.map((d) =>
        d.company +
        "<br>Presenze: " + (d.presenze || 1) +
        "<br>Lead: " + d.leads +
        "<br>WMS: " + d.wms +
        "<br>Call: " + d.call
      );

      Plotly.newPlot("companyScatter", [{
        type: "scatter",
        mode: "markers",
        x,
        y,
        text,
        hovertemplate: "%{text}<extra></extra>",
        marker: {
          size,
          color,
          colorscale: "YlGnBu",
          showscale: true,
          colorbar: { title: "WMS %" },
          opacity: 0.82,
          line: { color: "#1f2a22", width: 0.4 }
        }
      }], {
        title: { text: "Aziende Ricorrenti: Presenze vs Conversione a Opportunita", font: { size: 16 } },
        xaxis: { title: "N presenze in fiera", dtick: 1 },
        yaxis: { title: "Call/Visita su lead (%)", rangemode: "tozero" },
        margin: { l: 60, r: 20, t: 40, b: 50 }
      }, { responsive: true, displayModeBar: false });
    }

    function applyCompanyFilter(companyRows) {
      if (activeCompanyFilter === "wms") return companyRows.filter((r) => r.wms > 0);
      if (activeCompanyFilter === "selected") return companyRows.filter((r) => r.selected > 0);
      if (activeCompanyFilter === "met") return companyRows.filter((r) => r.met > 0);
      if (activeCompanyFilter === "call") return companyRows.filter((r) => r.call > 0);
      return companyRows;
    }

    function sortCompanyRows(rows) {
      const mode = tableSortSelect.value;
      const sorted = rows.slice();
      if (mode === "company_asc") sorted.sort((a, b) => a.company.localeCompare(b.company));
      else if (mode === "company_desc") sorted.sort((a, b) => b.company.localeCompare(a.company));
      else if (mode === "call_asc") sorted.sort((a, b) => (a.call - b.call) || a.company.localeCompare(b.company));
      else if (mode === "call_desc") sorted.sort((a, b) => (b.call - a.call) || a.company.localeCompare(b.company));
      else if (mode === "presence_asc") sorted.sort((a, b) => (a.presenze - b.presenze) || a.company.localeCompare(b.company));
      else if (mode === "presence_desc") sorted.sort((a, b) => (b.presenze - a.presenze) || a.company.localeCompare(b.company));
      return sorted;
    }

    function renderCompanyTable(companyRows) {
      const body = document.getElementById("companyTableBody");
      const filtered = applyCompanyFilter(companyRows);
      const sorted = sortCompanyRows(filtered).slice(0, 300);

      companyFilterInfo.textContent = "Elenco aziende: " + companyFilterLabels[activeCompanyFilter] + " (" + filtered.length + ")";

      if (!sorted.length) {
        body.innerHTML = "<tr><td colspan='7'>Nessuna azienda trovata con i filtri correnti.</td></tr>";
        return;
      }

      body.innerHTML = sorted.map((row) => {
        const ratio = pct(row.call, row.met);
        const warnClass = row.presenze >= 3 && row.call === 0 ? "danger" : "";
        return "<tr>" +
          "<td>" + row.company + "</td>" +
          "<td class='" + warnClass + "'>" + row.presenze + "</td>" +
          "<td>" + row.wms + "</td>" +
          "<td>" + row.selected + "</td>" +
          "<td>" + row.met + "</td>" +
          "<td>" + row.call + "</td>" +
          "<td>" + ratio + "</td>" +
          "</tr>";
      }).join("");
    }

    function renderInsights(rows, companyRows, editionRows) {
      const list = document.getElementById("insightList");
      const total = rows.length;
      const selected = sum(rows, "selected");
      const met = sum(rows, "met");
      const call = sum(rows, "callVisit");
      const wmsRows = rows.filter((r) => r.wms === 1);
      const nonWmsRows = rows.filter((r) => r.wms !== 1);
      const wmsCallRate = numericPct(sum(wmsRows, "callVisit"), wmsRows.length);
      const nonWmsCallRate = numericPct(sum(nonWmsRows, "callVisit"), nonWmsRows.length);

      const drops = [
        { name: "Lead -> Selezionata", value: 100 - numericPct(selected, total) },
        { name: "Selezionata -> Incontrata", value: 100 - numericPct(met, selected) },
        { name: "Incontrata -> Call/Visita", value: 100 - numericPct(call, met) }
      ].sort((a, b) => b.value - a.value);

      const bestEdition = editionRows
        .filter((e) => e.total >= 20)
        .slice()
        .sort((a, b) => numericPct(b.call, b.total) - numericPct(a.call, a.total))[0];

      const frequentNoOutcome = companyRows
        .filter((c) => c.presenze >= 3 && c.call === 0)
        .sort((a, b) => b.presenze - a.presenze)
        .slice(0, 5)
        .map((c) => c.company + " (" + c.presenze + " presenze)")
        .join(", ");

      const items = [
        "Il collo di bottiglia principale e <strong>" + drops[0].name + "</strong> con dispersione " + drops[0].value.toFixed(1) + "%.",
        "Tasso opportunita globale (Call/Lead): <strong>" + pct(call, total) + "</strong>.",
        "Lead WMS convertono meglio dei non-WMS: <strong>" + wmsCallRate.toFixed(1) + "%</strong> vs <strong>" + nonWmsCallRate.toFixed(1) + "%</strong>.",
        bestEdition
          ? "Migliore edizione per opportunita/lead: <strong>" + bestEdition.edition + "</strong> (" + pct(bestEdition.call, bestEdition.total) + ")."
          : "Nessuna edizione con campione sufficiente (>=20 lead) per confronto robusto.",
        frequentNoOutcome
          ? "Aziende ricorrenti con molte presenze ma zero call: <span class='danger'>" + frequentNoOutcome + "</span>."
          : "Nessuna azienda ricorrente critica (>=3 presenze e zero call) nei filtri attuali."
      ];

      list.innerHTML = items.map((item) => "<li>" + item + "</li>").join("");
    }

    function refresh() {
      const rows = filterData();
      const editionRows = aggregateByEdition(rows);
      const companyRows = aggregateByCompany(rows);
      renderKpis(rows);
      renderFunnel(rows);
      renderConversionTrend(editionRows);
      renderEditionBars(editionRows);
      renderEventTypeChart(rows);
      renderCompanyScatter(companyRows);
      renderCompanyTable(companyRows);
      renderInsights(rows, companyRows, editionRows);
    }

    [yearFilter, eventFilter, minPresenceInput, searchCompanyInput, wmsOnlyInput].forEach((el) => {
      el.addEventListener("change", refresh);
      el.addEventListener("input", refresh);
    });
    tableSortSelect.addEventListener("change", refresh);

    resetBtn.addEventListener("click", () => {
      Array.from(yearFilter.options).forEach((o) => { o.selected = true; });
      Array.from(eventFilter.options).forEach((o) => { o.selected = true; });
      minPresenceInput.value = 1;
      searchCompanyInput.value = "";
      wmsOnlyInput.checked = false;
      tableSortSelect.value = "call_desc";
      activeCompanyFilter = "all";
      refresh();
    });

    refresh();
  </script>
</body>
</html>`;
}

function main() {
  const rows = parseWorkbook(inputPath);
  fs.writeFileSync(outputPath, buildHtml(rows), "utf8");
  console.log(`Dashboard generata: ${outputPath}`);
  console.log(`Righe lead analizzate: ${rows.length}`);
}

main();
