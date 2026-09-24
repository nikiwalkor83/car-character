import json
import re

# Load shape data
with open('data/shape_data.json') as f:
    shape_data = json.load(f)

shape_json_min = json.dumps(shape_data)

# Read story.qmd
with open('story.qmd', 'r') as f:
    content = f.read()

# Prepare JavaScript replacement
js_replacement = f"""// Shape Dataset (1970 - 2024) derived from engines.csv (16,300+ classified vehicles)
const shapeDataset = {shape_json_min};

let currentBodyType = "Coupe";
let currentDim = "all";
let currentUnit = "mm";

document.addEventListener("DOMContentLoaded", () => {{
  // Color Visuals
  renderLegend();
  renderTimelineStream();

  // Shape Visuals
  renderBodyStyleSelector();
  renderBodyStyleLegend();
  renderBodyStyleStream();
  selectBodyType("Coupe");

  // Sound & Powertrain Visuals
  renderSoundPlayers();
  renderPowertrainChart();
}});

/* ==========================================================================
   SHAPE SECTION INTERACTIVE FUNCTIONS
   ========================================================================== */
function renderBodyStyleSelector() {{
  const container = document.getElementById("bs-selector-bar");
  if (!container) return;
  container.innerHTML = shapeDataset.categories.map(cat => {{
    const info = shapeDataset.by_type[cat];
    const isActive = cat === currentBodyType;
    return `
      <button class="bs-select-btn ${{isActive ? "is-active" : ""}}" id="btn-body-${{cat}}" onclick="selectBodyType('${{cat}}')">
        <span class="bs-btn-dot" style="background-color: ${{info.meta.hex}};"></span>
        <span>${{info.meta.label}}</span>
        <span class="bs-badge-count">${{info.total_n.toLocaleString()}}</span>
      </button>
    `;
  }}).join("");
}}

function renderBodyStyleLegend() {{
  const container = document.getElementById("bs-legend-container");
  if (!container) return;
  container.innerHTML = shapeDataset.categories.map(cat => {{
    const info = shapeDataset.by_type[cat];
    return `
      <div class="bodystyle-legend-chip" onclick="selectBodyType('${{cat}}')" style="cursor: pointer;" title="Click to view ${{info.meta.label}}">
        <span class="bs-dot" style="background-color: ${{info.meta.hex}};"></span>
        <span>${{info.meta.label}}</span>
      </div>
    `;
  }}).join("");
}}

function renderBodyStyleStream() {{
  const container = document.getElementById("bs-stream-container");
  if (!container) return;

  container.innerHTML = shapeDataset.decades_summary.map(dec => {{
    const segsHtml = shapeDataset.categories.map(cat => {{
      const pct = dec[cat] || 0;
      if (pct === 0) return "";
      const isWide = pct >= 8;
      const meta = shapeDataset.category_meta[cat];
      const isCurrent = cat === currentBodyType;
      return `
        <div class="bs-seg" style="width: ${{pct}}%; background-color: ${{meta.hex}}; cursor: pointer; ${{isCurrent ? 'box-shadow: inset 0 0 0 2px #ffffff; font-weight:900;' : ''}}"
          onclick="selectBodyType('${{cat}}')"
          title="${{meta.label}}: ${{pct}}% in ${{dec.decade}} (Click to isolate)">
          ${{isWide ? `${{meta.label.split(" ")[0]}} ${{pct}}%` : ""}}
        </div>
      `;
    }}).join("");

    let topName = "";
    let topPct = 0;
    shapeDataset.categories.forEach(cat => {{
      if ((dec[cat] || 0) > topPct) {{
        topPct = dec[cat];
        topName = shapeDataset.category_meta[cat].label;
      }}
    }});

    return `
      <div class="bs-decade-row">
        <div class="bs-decade-meta">
          <span class="bs-decade-label">${{dec.decade}}</span>
          <span class="bs-decade-top">Dominant: <strong>${{topName}} (${{topPct}}%)</strong> &bull; Total models: ${{dec.n.toLocaleString()}}</span>
        </div>
        <div class="bs-stacked-track">
          ${{segsHtml}}
        </div>
      </div>
    `;
  }}).join("");
}}

function selectBodyType(type) {{
  if (!shapeDataset.by_type[type]) return;
  currentBodyType = type;

  // Update button active state
  shapeDataset.categories.forEach(cat => {{
    const btn = document.getElementById(`btn-body-${{cat}}`);
    if (btn) btn.classList.toggle("is-active", cat === type);
  }});

  const data = shapeDataset.by_type[type];
  const meta = data.meta;
  const labelUpper = meta.label.toUpperCase();

  // Dynamic headings
  const shareHeading = document.getElementById("share-heading");
  if (shareHeading) shareHeading.textContent = `HOW COMMON WAS THE ${{type === "SUV" ? "SUV" : labelUpper}}?`;

  const shareSubheading = document.getElementById("share-subheading");
  if (shareSubheading) shareSubheading.textContent = `Annual percentage share of vehicle introductions and total model counts for ${{meta.label}} from 1970 to 2024`;

  const dimHeading = document.getElementById("dim-heading");
  if (dimHeading) dimHeading.textContent = `${{labelUpper}} PHYSICAL DIMENSIONS (1970 — 2024)`;

  const dimSubheading = document.getElementById("dim-subheading");
  if (dimSubheading) dimSubheading.textContent = `Median exterior dimensions derived exclusively from ${{meta.label}} production models (${{data.total_n.toLocaleString()}} vehicles across ${{data.years_with_data}} distinct years). Insufficient data years are shown honestly with gaps.`;

  const propHeading = document.getElementById("prop-heading");
  if (propHeading) propHeading.textContent = `HOW ${{labelUpper}} PROPORTIONS EVOLVED (1970 — 2024)`;

  const propSubheading = document.getElementById("prop-subheading");
  if (propSubheading) propSubheading.textContent = `Tracking the silhouette stance ratio (Length ÷ Height) and wheelbase efficiency (Wheelbase ÷ Length) specifically for ${{meta.label}} over time`;

  // Re-render all sub-visualizations
  renderBodyStyleStream();
  renderShareChart();
  renderDimensionChart();
  renderDimensionMilestones();
  renderProportionsChart();
  renderProportionsFindings();
}}

/* ==========================================================================
   BODY STYLE PREVALENCE (SHARE) CHART
   ========================================================================== */
function renderShareChart() {{
  const container = document.getElementById("share-svg-container");
  const statsContainer = document.getElementById("share-stats-container");
  if (!container) return;

  const typeData = shapeDataset.by_type[currentBodyType];
  const yearly = typeData.yearly;
  const meta = typeData.meta;

  const width = 900;
  const height = 280;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 40;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xForYear = yr => padLeft + ((yr - 1970) / (2024 - 1970)) * plotW;

  // Max share for scaling
  const maxShareVal = Math.max(...yearly.map(d => d.share_pct), 10);
  const yMax = Math.ceil(maxShareVal / 10) * 10;
  const yForShare = s => padTop + plotH - (s / yMax) * plotH;

  // Y-axis grid
  let gridSvg = "";
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {{
    const val = (i / gridSteps) * yMax;
    const yPos = padTop + plotH - (i / gridSteps) * plotH;
    gridSvg += `
      <line x1="${{padLeft}}" y1="${{yPos}}" x2="${{width - padRight}}" y2="${{yPos}}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="3,3" />
      <text x="${{padLeft - 10}}" y="${{yPos + 4}}" fill="#64748b" font-size="11" font-family="ui-monospace, monospace" text-anchor="end">${{Math.round(val)}}%</text>
    `;
  }}

  // X Axis Decades
  let xAxisSvg = "";
  for (let yr = 1970; yr <= 2024; yr += 10) {{
    const xPos = xForYear(yr);
    xAxisSvg += `
      <line x1="${{xPos}}" y1="${{padTop}}" x2="${{xPos}}" y2="${{padTop + plotH}}" stroke="rgba(255,255,255,0.05)" />
      <text x="${{xPos}}" y="${{padTop + plotH + 20}}" fill="#94a3b8" font-size="12" font-family="ui-monospace, monospace" text-anchor="middle">${{yr}}</text>
    `;
  }}
  xAxisSvg += `<text x="${{xForYear(2024)}}" y="${{padTop + plotH + 20}}" fill="${{meta.hex}}" font-weight="700" font-size="12" font-family="ui-monospace, monospace" text-anchor="middle">2024</text>`;

  // Area & Line Path
  const linePoints = yearly.map(d => `${{xForYear(d.year).toFixed(1)}},${{yForShare(d.share_pct).toFixed(1)}}`).join(" ");
  const areaPoints = `${{xForYear(1970).toFixed(1)}},${{padTop + plotH}} ` + linePoints + ` ${{xForYear(2024).toFixed(1)}},${{padTop + plotH}}`;

  // Hover columns
  const colW = plotW / yearly.length;
  const colsSvg = yearly.map(d => `
    <rect x="${{xForYear(d.year) - colW / 2}}" y="${{padTop}}" width="${{colW}}" height="${{plotH}}" fill="transparent" class="dim-hover-col" style="cursor: pointer;"
      onmouseenter="showShareReadout(${{d.year}})" onclick="showShareReadout(${{d.year}})" />
  `).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${{width}} ${{height}}" class="dim-chart-svg">
      <defs>
        <linearGradient id="shareGradient-${{currentBodyType}}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${{meta.hex}}" stop-opacity="0.35" />
          <stop offset="100%" stop-color="${{meta.hex}}" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      ${{gridSvg}}
      ${{xAxisSvg}}
      <polygon points="${{areaPoints}}" fill="url(#shareGradient-${{currentBodyType}})" />
      <polyline points="${{linePoints}}" fill="none" stroke="${{meta.hex}}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
      ${{colsSvg}}
      <line id="share-guideline" x1="0" y1="${{padTop}}" x2="0" y2="${{padTop + plotH}}" stroke="${{meta.hex}}" stroke-width="1.5" stroke-dasharray="2,2" style="display:none;" />
    </svg>
  `;

  // Stats cards
  if (statsContainer) {{
    const descMap = {{
      Coupe: "Peaked as an iconic sports and personal luxury format in the early 1970s before gradually consolidating into a dedicated enthusiast niche.",
      Sedan: "Formed the foundational backbone of passenger mobility through the 1980s and 1990s before facing strong competition from crossover utility vehicles.",
      SUV: "Rose from specialized 4x4 off-roaders in the 1970s into the dominant passenger vehicle format of the modern era, capturing unprecedented market share.",
      Wagon: "Long-roof estate utility maintained strong family transport demand for decades, celebrated for cargo volume without elevated ride heights.",
      Hatchback: "Dominated international commuter markets with unbeatable packaging efficiency, two-box practicality, and nimble urban footprints.",
      Convertible: "Experienced iconic booms during open-air roadster renaissances before stabilizing as specialized weekend drivers.",
      Pickup: "Expanded steadily from purely utilitarian workhorse roots into high-volume, multi-role personal passenger trucks.",
      Van: "Revolutionized spacious family and cargo transit during the minivan revolution of the 1980s and 1990s."
    }};

    statsContainer.innerHTML = `
      <div class="share-stat-card">
        <span class="share-stat-label">Peak Market Share</span>
        <div class="share-stat-val" style="color:${{meta.hex}};">${{typeData.peak_share}}%</div>
        <div class="share-stat-sub">Achieved peak representation in <strong>${{typeData.peak_year}}</strong></div>
      </div>
      <div class="share-stat-card">
        <span class="share-stat-label">Total Models in Dataset</span>
        <div class="share-stat-val">${{typeData.total_n.toLocaleString()}}</div>
        <div class="share-stat-sub">Classified production variants across ${{typeData.years_with_data}} distinct years</div>
      </div>
      <div class="share-stat-card">
        <span class="share-stat-label">Historical Trajectory</span>
        <div class="share-stat-sub" style="margin-top:0.35rem; color:#cbd5e1; font-size:0.82rem;">${{descMap[currentBodyType] || ""}}</div>
      </div>
    `;
  }}
}}

function showShareReadout(year) {{
  const typeData = shapeDataset.by_type[currentBodyType];
  const d = typeData.yearly.find(item => item.year === year);
  const readout = document.getElementById("share-hover-readout");
  if (!d || !readout) return;

  readout.innerHTML = `
    <div class="dim-readout-content">
      <span class="dim-readout-year">${{d.year}} SHARE:</span>
      <span class="dim-readout-val"><strong>${{d.share_pct}}%</strong> of all classified vehicles (${{d.n}} models recorded)</span>
      <span class="dim-readout-sample">[Category: ${{typeData.meta.label}}]</span>
    </div>
  `;

  const line = document.getElementById("share-guideline");
  if (line) {{
    const width = 900;
    const padLeft = 65;
    const padRight = 30;
    const plotW = width - padLeft - padRight;
    const xPos = padLeft + ((year - 1970) / (2024 - 1970)) * plotW;
    line.setAttribute("x1", xPos);
    line.setAttribute("x2", xPos);
    line.style.display = "block";
  }}
}}

/* ==========================================================================
   BODY-TYPE SPECIFIC PHYSICAL DIMENSION CHART
   ========================================================================== */
function switchDimension(dim) {{
  currentDim = dim;
  document.querySelectorAll(".dim-tab-btn").forEach(btn => {{
    btn.classList.toggle("is-active", btn.id === `dim-btn-${{dim}}`);
  }});
  renderDimensionChart();
}}

function toggleUnit(unit) {{
  currentUnit = unit;
  document.getElementById("unit-mm").classList.toggle("is-active", unit === "mm");
  document.getElementById("unit-in").classList.toggle("is-active", unit === "in");
  renderDimensionChart();
  renderDimensionMilestones();
}}

function renderDimensionChart() {{
  const container = document.getElementById("dim-svg-container");
  if (!container) return;

  const typeData = shapeDataset.by_type[currentBodyType];
  const yearly = typeData.yearly;

  const width = 900;
  const height = 350;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 40;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xForYear = yr => padLeft + ((yr - 1970) / (2024 - 1970)) * plotW;

  const isInch = currentUnit === "in";
  const unitLabel = isInch ? "in" : "mm";
  const factor = isInch ? 1 / 25.4 : 1;

  // Compute dynamic min/max bounds based on actual data
  const valid = yearly.filter(d => d.length_mm !== null);
  if (valid.length === 0) {{
    container.innerHTML = `<div style="padding:4rem; text-align:center; color:#64748b;">No dimensional data recorded for this body type.</div>`;
    return;
  }}

  let yMin = 1000;
  let yMax = 5200;

  if (currentDim === "all") {{
    yMin = isInch ? 40 : 1000;
    yMax = isInch ? 220 : 5400;
  }} else if (currentDim === "length") {{
    const minL = Math.min(...valid.map(d => d.length_mm));
    const maxL = Math.max(...valid.map(d => d.length_mm));
    yMin = Math.floor((minL - 150) / 100) * 100;
    yMax = Math.ceil((maxL + 150) / 100) * 100;
    if (isInch) {{ yMin = Math.floor(yMin / 25.4); yMax = Math.ceil(yMax / 25.4); }}
  }} else if (currentDim === "width") {{
    const minW = Math.min(...valid.map(d => d.width_mm));
    const maxW = Math.max(...valid.map(d => d.width_mm));
    yMin = Math.floor((minW - 100) / 50) * 50;
    yMax = Math.ceil((maxW + 100) / 50) * 50;
    if (isInch) {{ yMin = Math.floor(yMin / 25.4); yMax = Math.ceil(yMax / 25.4); }}
  }} else if (currentDim === "height") {{
    const minH = Math.min(...valid.map(d => d.height_mm));
    const maxH = Math.max(...valid.map(d => d.height_mm));
    yMin = Math.floor((minH - 100) / 50) * 50;
    yMax = Math.ceil((maxH + 100) / 50) * 50;
    if (isInch) {{ yMin = Math.floor(yMin / 25.4); yMax = Math.ceil(yMax / 25.4); }}
  }} else if (currentDim === "wheelbase") {{
    const minWB = Math.min(...valid.map(d => d.wheelbase_mm));
    const maxWB = Math.max(...valid.map(d => d.wheelbase_mm));
    yMin = Math.floor((minWB - 150) / 100) * 100;
    yMax = Math.ceil((maxWB + 150) / 100) * 100;
    if (isInch) {{ yMin = Math.floor(yMin / 25.4); yMax = Math.ceil(yMax / 25.4); }}
  }}

  const yForVal = val => padTop + plotH - ((val * factor - yMin) / (yMax - yMin)) * plotH;

  // Grid lines
  const numGridLines = 5;
  let gridSvg = "";
  for (let i = 0; i <= numGridLines; i++) {{
    const v = yMin + (i / numGridLines) * (yMax - yMin);
    const yPos = padTop + plotH - (i / numGridLines) * plotH;
    gridSvg += `
      <line x1="${{padLeft}}" y1="${{yPos}}" x2="${{width - padRight}}" y2="${{yPos}}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="3,3" />
      <text x="${{padLeft - 10}}" y="${{yPos + 4}}" fill="#64748b" font-size="11" font-family="ui-monospace, monospace" text-anchor="end">${{Math.round(v)}} ${{unitLabel}}</text>
    `;
  }}

  // X Axis Decades
  let xAxisSvg = "";
  for (let yr = 1970; yr <= 2024; yr += 10) {{
    const xPos = xForYear(yr);
    xAxisSvg += `
      <line x1="${{xPos}}" y1="${{padTop}}" x2="${{xPos}}" y2="${{padTop + plotH}}" stroke="rgba(255,255,255,0.05)" />
      <text x="${{xPos}}" y="${{padTop + plotH + 20}}" fill="#94a3b8" font-size="12" font-family="ui-monospace, monospace" text-anchor="middle">${{yr}}</text>
    `;
  }}
  xAxisSvg += `<text x="${{xForYear(2024)}}" y="${{padTop + plotH + 20}}" fill="#38bdf8" font-weight="700" font-size="12" font-family="ui-monospace, monospace" text-anchor="middle">2024</text>`;

  // Break paths on missing data (honest presentation: no fake lines across gaps)
  const makeSegmentedPaths = (key, strokeColor, strokeWidth, dash = "") => {{
    let pathD = "";
    let isDrawing = false;
    let circlesSvg = "";

    yearly.forEach(d => {{
      const val = d[key];
      if (val !== null && val !== undefined) {{
        const x = xForYear(d.year);
        const y = yForVal(val);
        if (!isDrawing) {{
          pathD += ` M ${{x.toFixed(1)}} ${{y.toFixed(1)}}`;
          isDrawing = true;
        }} else {{
          pathD += ` L ${{x.toFixed(1)}} ${{y.toFixed(1)}}`;
        }}
        circlesSvg += `<circle cx="${{x.toFixed(1)}}" cy="${{y.toFixed(1)}}" r="2.5" fill="${{strokeColor}}" opacity="0.85" />`;
      }} else {{
        isDrawing = false;
      }}
    }});

    return `
      <path d="${{pathD}}" fill="none" stroke="${{strokeColor}}" stroke-width="${{strokeWidth}}" ${{dash ? `stroke-dasharray="${{dash}}"` : ""}} stroke-linecap="round" stroke-linejoin="round" />
      ${{circlesSvg}}
    `;
  }};

  let pathsSvg = "";
  if (currentDim === "all" || currentDim === "length") {{
    pathsSvg += makeSegmentedPaths("length_mm", "#38bdf8", 2.6);
  }}
  if (currentDim === "all" || currentDim === "width") {{
    pathsSvg += makeSegmentedPaths("width_mm", "#10b981", 2.6);
  }}
  if (currentDim === "all" || currentDim === "height") {{
    pathsSvg += makeSegmentedPaths("height_mm", "#f59e0b", 2.6);
  }}
  if (currentDim === "all" || currentDim === "wheelbase") {{
    pathsSvg += makeSegmentedPaths("wheelbase_mm", "#818cf8", 2.2, "4,3");
  }}

  // Hover overlay columns
  const colW = plotW / yearly.length;
  const colsSvg = yearly.map(d => `
    <rect x="${{xForYear(d.year) - colW / 2}}" y="${{padTop}}" width="${{colW}}" height="${{plotH}}" fill="transparent" class="dim-hover-col" style="cursor: pointer;"
      onmouseenter="showDimensionReadout(${{d.year}})" onclick="showDimensionReadout(${{d.year}})" />
  `).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${{width}} ${{height}}" class="dim-chart-svg">
      ${{gridSvg}}
      ${{xAxisSvg}}
      ${{pathsSvg}}
      ${{colsSvg}}
      <line id="dim-guideline" x1="0" y1="${{padTop}}" x2="0" y2="${{padTop + plotH}}" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2,2" style="display:none;" />
    </svg>
  `;
}}

function showDimensionReadout(year) {{
  const typeData = shapeDataset.by_type[currentBodyType];
  const d = typeData.yearly.find(item => item.year === year);
  const readout = document.getElementById("dim-hover-readout");
  if (!d || !readout) return;

  const isInch = currentUnit === "in";
  const u = isInch ? "in" : "mm";

  if (d.length_mm === null) {{
    readout.innerHTML = `
      <div class="dim-readout-content">
        <span class="dim-readout-year">${{d.year}} RECORD:</span>
        <span class="dim-readout-val" style="color:#94a3b8; font-style:italic;">Insufficient production records for ${{typeData.meta.label}} in ${{d.year}} (n = ${{d.n}} models)</span>
        <span class="dim-readout-sample">[Honest gap &mdash; not estimated]</span>
      </div>
    `;
  }} else {{
    const len = isInch ? d.length_in : d.length_mm;
    const wid = isInch ? d.width_in : d.width_mm;
    const hgt = isInch ? d.height_in : d.height_mm;
    const wb = isInch ? d.wheelbase_in : d.wheelbase_mm;

    const firstRec = typeData.first_dimensions;
    const deltaLen = Math.round(d.length_mm - firstRec.length_mm);
    const deltaHgt = Math.round(d.height_mm - firstRec.height_mm);
    const deltaLenStr = isInch ? `${{(deltaLen / 25.4).toFixed(1)}} in` : `${{deltaLen > 0 ? "+" : ""}}${{deltaLen}} mm`;
    const deltaHgtStr = isInch ? `${{(deltaHgt / 25.4).toFixed(1)}} in` : `${{deltaHgt > 0 ? "+" : ""}}${{deltaHgt}} mm`;

    readout.innerHTML = `
      <div class="dim-readout-content">
        <span class="dim-readout-year">${{d.year}} ${{typeData.meta.label.toUpperCase()}}:</span>
        <span class="dim-readout-val">Length ${{len}} ${{u}} &bull; Width ${{wid}} ${{u}} &bull; Height ${{hgt}} ${{u}} &bull; Wheelbase ${{wb}} ${{u}}</span>
        <span class="dim-readout-delta">(${{deltaLenStr}} len, ${{deltaHgtStr}} hgt since ${{firstRec.year}})</span>
        <span class="dim-readout-sample">[n = ${{d.n}} models]</span>
      </div>
    `;
  }}

  const line = document.getElementById("dim-guideline");
  if (line) {{
    const width = 900;
    const padLeft = 65;
    const padRight = 30;
    const plotW = width - padLeft - padRight;
    const xPos = padLeft + ((year - 1970) / (2024 - 1970)) * plotW;
    line.setAttribute("x1", xPos);
    line.setAttribute("x2", xPos);
    line.style.display = "block";
  }}
}}

function renderDimensionMilestones() {{
  const grid = document.getElementById("dim-stats-summary-grid");
  if (!grid) return;

  const typeData = shapeDataset.by_type[currentBodyType];
  const first = typeData.first_dimensions;
  const latest = typeData.latest_dimensions;
  if (!first || !latest) return;

  const isInch = currentUnit === "in";
  const u = isInch ? "in" : "mm";
  const conv = val => isInch ? (val / 25.4).toFixed(1) : `${{val > 0 ? "+" : ""}}${{val}}`;

  const dLen = conv(typeData.delta_length_mm);
  const dWid = conv(typeData.delta_width_mm);
  const dHgt = conv(typeData.delta_height_mm);
  const dWb = conv(typeData.delta_wheelbase_mm);

  const lenStart = isInch ? first.length_in : first.length_mm;
  const lenEnd = isInch ? latest.length_in : latest.length_mm;
  const widStart = isInch ? first.width_in : first.width_mm;
  const widEnd = isInch ? latest.width_in : latest.width_mm;
  const hgtStart = isInch ? first.height_in : first.height_mm;
  const hgtEnd = isInch ? latest.height_in : latest.height_mm;
  const wbStart = isInch ? first.wheelbase_in : first.wheelbase_mm;
  const wbEnd = isInch ? latest.wheelbase_in : latest.wheelbase_mm;

  grid.innerHTML = `
    <div class="dim-stat-card">
      <span class="dim-stat-dimension">LENGTH (MEDIAN)</span>
      <div class="dim-stat-number" style="color:#38bdf8;">${{dLen}} ${{u}}</div>
      <div class="dim-stat-caption">Measured from ${{lenStart}} ${{u}} (${{first.year}}) to ${{lenEnd}} ${{u}} (${{latest.year}}) for ${{typeData.meta.label}}.</div>
    </div>
    <div class="dim-stat-card">
      <span class="dim-stat-dimension">WIDTH (MEDIAN)</span>
      <div class="dim-stat-number" style="color:#10b981;">${{dWid}} ${{u}}</div>
      <div class="dim-stat-caption">Widened from ${{widStart}} ${{u}} to ${{widEnd}} ${{u}} for stability and passenger safety.</div>
    </div>
    <div class="dim-stat-card">
      <span class="dim-stat-dimension">HEIGHT (MEDIAN)</span>
      <div class="dim-stat-number" style="color:#f59e0b;">${{dHgt}} ${{u}}</div>
      <div class="dim-stat-caption">Profile shifted from ${{hgtStart}} ${{u}} to ${{hgtEnd}} ${{u}} across five decades of production.</div>
    </div>
    <div class="dim-stat-card">
      <span class="dim-stat-dimension">WHEELBASE (MEDIAN)</span>
      <div class="dim-stat-number" style="color:#818cf8;">${{dWb}} ${{u}}</div>
      <div class="dim-stat-caption">Axle span evolved from ${{wbStart}} ${{u}} to ${{wbEnd}} ${{u}} to optimize cabin space.</div>
    </div>
  `;
}}

/* ==========================================================================
   BODY-TYPE SPECIFIC PROPORTIONS CHART
   ========================================================================== */
function renderProportionsChart() {{
  const container = document.getElementById("prop-svg-container");
  if (!container) return;

  const typeData = shapeDataset.by_type[currentBodyType];
  const yearly = typeData.yearly;

  const width = 900;
  const height = 350;
  const padLeft = 60;
  const padRight = 60;
  const padTop = 25;
  const padBottom = 40;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xForYear = yr => padLeft + ((yr - 1970) / (2024 - 1970)) * plotW;

  const valid = yearly.filter(d => d.lh_ratio !== null);
  if (valid.length === 0) {{
    container.innerHTML = `<div style="padding:4rem; text-align:center; color:#64748b;">No proportion records for this body type.</div>`;
    return;
  }}

  // Left axis: Length / Height ratio (range ~ 2.2 to 4.2)
  const rMin = 2.2;
  const rMax = 4.0;
  const yForRatio = r => padTop + plotH - ((r - rMin) / (rMax - rMin)) * plotH;

  // Grid lines
  let gridSvg = "";
  for (let r = 2.4; r <= 3.8; r += 0.3) {{
    const yPos = yForRatio(r);
    gridSvg += `
      <line x1="${{padLeft}}" y1="${{yPos}}" x2="${{width - padRight}}" y2="${{yPos}}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="3,3" />
      <text x="${{padLeft - 10}}" y="${{yPos + 4}}" fill="#64748b" font-size="11" font-family="ui-monospace, monospace" text-anchor="end">${{r.toFixed(1)}}</text>
    `;
  }}

  // Right axis: Wheelbase / Length ratio (range 0.50 to 0.68)
  for (let wb = 0.52; wb <= 0.66; wb += 0.04) {{
    const scaledR = rMin + ((wb - 0.50) / (0.68 - 0.50)) * (rMax - rMin);
    const yPos = yForRatio(scaledR);
    gridSvg += `
      <text x="${{width - padRight + 10}}" y="${{yPos + 4}}" fill="#f59e0b" font-size="11" font-family="ui-monospace, monospace" text-anchor="start">${{wb.toFixed(2)}}</text>
    `;
  }}

  // X Axis Decades
  let xAxisSvg = "";
  for (let yr = 1970; yr <= 2024; yr += 10) {{
    const xPos = xForYear(yr);
    xAxisSvg += `
      <line x1="${{xPos}}" y1="${{padTop}}" x2="${{xPos}}" y2="${{padTop + plotH}}" stroke="rgba(255,255,255,0.05)" />
      <text x="${{xPos}}" y="${{padTop + plotH + 20}}" fill="#94a3b8" font-size="12" font-family="ui-monospace, monospace" text-anchor="middle">${{yr}}</text>
    `;
  }}
  xAxisSvg += `<text x="${{xForYear(2024)}}" y="${{padTop + plotH + 20}}" fill="#38bdf8" font-weight="700" font-size="12" font-family="ui-monospace, monospace" text-anchor="middle">2024</text>`;

  // Build segmented paths for L/H ratio
  let lhPathD = "";
  let wbPathD = "";
  let isLhDrawing = false;
  let isWbDrawing = false;
  let circlesSvg = "";

  yearly.forEach(d => {{
    if (d.lh_ratio !== null) {{
      const x = xForYear(d.year);
      const yLh = yForRatio(d.lh_ratio);
      const scaledWbR = rMin + ((d.wl_ratio - 0.50) / (0.68 - 0.50)) * (rMax - rMin);
      const yWb = yForRatio(scaledWbR);

      if (!isLhDrawing) {{
        lhPathD += ` M ${{x.toFixed(1)}} ${{yLh.toFixed(1)}}`;
        isLhDrawing = true;
      }} else {{
        lhPathD += ` L ${{x.toFixed(1)}} ${{yLh.toFixed(1)}}`;
      }}

      if (!isWbDrawing) {{
        wbPathD += ` M ${{x.toFixed(1)}} ${{yWb.toFixed(1)}}`;
        isWbDrawing = true;
      }} else {{
        wbPathD += ` L ${{x.toFixed(1)}} ${{yWb.toFixed(1)}}`;
      }}

      circlesSvg += `<circle cx="${{x.toFixed(1)}}" cy="${{yLh.toFixed(1)}}" r="2.8" fill="#38bdf8" />`;
      circlesSvg += `<circle cx="${{x.toFixed(1)}}" cy="${{yWb.toFixed(1)}}" r="2.5" fill="#f59e0b" />`;
    }} else {{
      isLhDrawing = false;
      isWbDrawing = false;
    }}
  }});

  // First and latest callout labels
  const first = valid[0];
  const latest = valid[valid.length - 1];

  const firstCallout = `
    <circle cx="${{xForYear(first.year)}}" cy="${{yForRatio(first.lh_ratio)}}" r="5" fill="#38bdf8" stroke="#000" stroke-width="1.5" />
    <text x="${{xForYear(first.year) + 8}}" y="${{yForRatio(first.lh_ratio) - 8}}" fill="#38bdf8" font-size="11" font-weight="700" font-family="ui-monospace, monospace">${{first.year}}: ${{first.lh_ratio}}</text>
  `;

  const latestCallout = `
    <circle cx="${{xForYear(latest.year)}}" cy="${{yForRatio(latest.lh_ratio)}}" r="5" fill="#38bdf8" stroke="#000" stroke-width="1.5" />
    <text x="${{xForYear(latest.year) - 8}}" y="${{yForRatio(latest.lh_ratio) - 8}}" fill="#38bdf8" font-size="11" font-weight="700" font-family="ui-monospace, monospace" text-anchor="end">${{latest.year}}: ${{latest.lh_ratio}}</text>
  `;

  container.innerHTML = `
    <svg viewBox="0 0 ${{width}} ${{height}}" class="dim-chart-svg">
      ${{gridSvg}}
      ${{xAxisSvg}}
      <path d="${{wbPathD}}" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-dasharray="4,3" stroke-linecap="round" />
      <path d="${{lhPathD}}" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ${{circlesSvg}}
      ${{firstCallout}}
      ${{latestCallout}}
    </svg>
  `;
}}

function renderProportionsFindings() {{
  const grid = document.getElementById("prop-findings-grid");
  if (!grid) return;

  const typeData = shapeDataset.by_type[currentBodyType];
  const first = typeData.first_dimensions;
  const latest = typeData.latest_dimensions;
  if (!first || !latest) return;

  const findingsMap = {{
    Coupe: [
      {{ tag: "Stance Identity", title: "Resilient Low-Profile Stance", p: `Coupes retained an average Length ÷ Height ratio around ${{latest.lh_ratio}}, remaining the sleekest, lowest-slung architecture in the fleet throughout 55 years of production.` }},
      {{ tag: "Packaging Evolution", title: "Wheelbase Stretching", p: `Wheelbase share expanded from ${{Math.round(first.wl_ratio * 100)}}% to ${{Math.round(latest.wl_ratio * 100)}}% of total length, eliminating extreme 1970s front and rear overhangs in favor of planted high-speed stability.` }}
    ],
    SUV: [
      {{ tag: "Aerodynamic Convergence", title: "From Tall Truck to Crossover", p: `Early utility vehicles had compact, upright ratios. Modern SUVs grew longer and more raked, bringing their silhouette ratio closer to passenger sedans.` }},
      {{ tag: "Packaging Efficiency", title: "Expanded Passenger Cell", p: `Wheelbase proportions expanded significantly, pushing the wheels out to the vehicle corners to deliver interior legroom and electric skateboard battery packaging.` }}
    ],
    Sedan: [
      {{ tag: "Three-Box Geometry", title: "Balanced Classic Proportions", p: `Sedans consistently maintained a balanced Length ÷ Height ratio of ~${{latest.lh_ratio}}, preserving aerodynamic greenhouse clearance and passenger headroom.` }},
      {{ tag: "Axle Optimization", title: "Minimal Overhang Design", p: `Front and rear overhangs were drastically shortened over the decades, pushing the wheelbase from ${{Math.round(first.wl_ratio * 100)}}% to ${{Math.round(latest.wl_ratio * 100)}}% of total vehicle length.` }}
    ],
    Wagon: [
      {{ tag: "Volumetric Architecture", title: "Extended Two-Box Silhouette", p: `Station wagons maintained long, horizontal roof profiles (ratio ~${{latest.lh_ratio}}), maximizing cargo capacity while keeping a low car-like center of gravity.` }},
      {{ tag: "Platform Stretch", title: "High Wheelbase Ratio", p: `Wagon wheelbases stretched outward, enabling stable highway towing and vast flat loading floors.` }}
    ],
    Hatchback: [
      {{ tag: "Urban Efficiency", title: "Compact Packaging Champion", p: `Hatchbacks kept the shortest overall length in the fleet while maximizing vertical cabin space, maintaining agile city proportions.` }},
      {{ tag: "Wheels to the Corners", title: "Near-Zero Overhangs", p: `Hatchback wheelbases represent the highest ratio of total length (up to 65%), creating spacious subcompact interiors.` }}
    ],
    Convertible: [
      {{ tag: "Low Greenhouse", title: "Extreme Open-Air Stance", p: `Without a fixed steel roof, convertibles maintained aggressive silhouette ratios with minimal waistline heights.` }},
      {{ tag: "Roadster Dynamics", title: "Classic Sports Proportions", p: `Preserved sports car driving dynamics with balanced axle distributions and compact overhangs.` }}
    ],
    Pickup: [
      {{ tag: "Utility Scale", title: "Massive Dimensional Expansion", p: `Pickups grew substantially in length and ride height, evolving from compact utilitarian runabouts into full-size multi-crew haulers.` }},
      {{ tag: "Bed and Cab Balance", title: "Extended Wheelbase Platforms", p: `Wheelbases lengthened dramatically to accommodate dual-row crew cabs while preserving 6-to-8 foot cargo beds.` }}
    ],
    Van: [
      {{ tag: "Mono-Volume Cabin", title: "Maximized Interior Volume", p: `Vans maintain the most upright silhouette ratio in the dataset (~2.6), prioritizing vertical passenger head room and multi-row seating.` }},
      {{ tag: "Forward Cab Design", title: "Flat-Floor Packaging", p: `Wheelbases and cabin floorplans were pushed outward to deliver unmatched volumetric storage efficiency.` }}
    ]
  }};

  const findings = findingsMap[currentBodyType] || findingsMap["Coupe"];
  grid.innerHTML = findings.map((f, i) => `
    <div class="finding-card">
      <div class="finding-tag convergence">Finding 0${{i + 1}} &bull; ${{f.tag}}</div>
      <h4 class="finding-title">${{f.title}}</h4>
      <p class="finding-p">${{f.p}}</p>
    </div>
  `).join("");
}}
"""

# Find the start of Shape script and replace it
pattern = r"// Shape Dataset.*?/\* ==========================================================================\s+SOUND & POWERTRAIN SCRIPT"
replacement = js_replacement + "\n\n/* ==========================================================================\n   SOUND & POWERTRAIN SCRIPT"

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
if new_content == content:
    print("WARNING: Pattern did not match!")
else:
    with open('story.qmd', 'w') as f:
        f.write(new_content)
    print("Updated story.qmd successfully!")

