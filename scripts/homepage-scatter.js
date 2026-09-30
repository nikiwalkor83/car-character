// ==========================================================================
// HOMEPAGE EDITORIAL SCATTER VISUALIZATION: "HOW CARS HAVE CHANGED SHAPE"
// Real classified body-dimension data: 16,334 usable records (1970-2024)
// British Motoring Editorial Style: restrained, warm, responsive HTML5 Canvas
// ==========================================================================

(function() {
  'use strict';

  let canvas, ctx;
  let activeDecade = 'all'; // 'all', '1970s', '1980s', etc.
  let currentUnit = 'in';    // 'in' or 'mm'
  let hoveredPoint = null;
  let containerRect = null;
  let cachedData = [];
  let metadata = null;
  let tooltipEl, readoutEl;

  // Decade colors: restrained British motoring palette
  const DECADE_COLORS = {
    '1970s': { hex: '#c26e38', rgb: '194, 110, 56', name: 'Warm Cognac' },
    '1980s': { hex: '#967444', rgb: '150, 116, 68', name: 'Antique Brass' },
    '1990s': { hex: '#1c3d2e', rgb: '28, 61, 46', name: 'Racing Green' },
    '2000s': { hex: '#742d33', rgb: '116, 45, 51', name: 'Burgundy' },
    '2010s': { hex: '#2c4c5e', rgb: '44, 76, 94', name: 'Steel Blue' },
    '2020s': { hex: '#475569', rgb: '71, 85, 105', name: 'Slate Charcoal' }
  };

  const DECADE_LIST = ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

  // Dimension plot boundaries (in mm)
  // Length: 2,600 mm (102 in) to 6,650 mm (262 in)
  // Width:  1,350 mm (53 in) to 2,450 mm (96.5 in)
  const BOUNDS = {
    minL: 2600,
    maxL: 6650,
    minW: 1350,
    maxW: 2450
  };

  function mmToIn(mm) {
    return mm / 25.4;
  }

  function formatDim(mm, unit) {
    if (unit === 'in') {
      return (mm / 25.4).toFixed(1) + ' in';
    }
    return Math.round(mm).toLocaleString() + ' mm';
  }

  function initScatter() {
    canvas = document.getElementById('shape-scatter-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    tooltipEl = document.getElementById('scatter-tooltip');
    readoutEl = document.getElementById('scatter-readout');

    if (window.SHAPE_SCATTER_METADATA && window.SHAPE_SCATTER_DATA) {
      metadata = window.SHAPE_SCATTER_METADATA;
      cachedData = window.SHAPE_SCATTER_DATA;
    } else {
      console.warn('Shape scatter data not yet loaded.');
      return;
    }

    setupControls();
    resizeAndDraw();

    window.addEventListener('resize', debounce(resizeAndDraw, 120));

    // Canvas interaction
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseleave', handlePointerLeave);
    canvas.addEventListener('touchstart', handleTouch, { passive: true });
    canvas.addEventListener('touchmove', handleTouch, { passive: true });
  }

  function setupControls() {
    // Decade filter buttons
    const filterContainer = document.getElementById('scatter-decade-filters');
    if (filterContainer) {
      filterContainer.addEventListener('click', function(e) {
        const btn = e.target.closest('.scatter-pill');
        if (!btn) return;

        filterContainer.querySelectorAll('.scatter-pill').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        activeDecade = btn.dataset.decade;
        updateReadoutHeader();
        draw();
      });
    }

    // Unit toggle buttons
    const unitInBtn = document.getElementById('scatter-unit-in');
    const unitMmBtn = document.getElementById('scatter-unit-mm');

    if (unitInBtn && unitMmBtn) {
      unitInBtn.addEventListener('click', function() {
        if (currentUnit === 'in') return;
        currentUnit = 'in';
        unitInBtn.classList.add('is-active');
        unitMmBtn.classList.remove('is-active');
        updateReadoutHeader();
        draw();
      });

      unitMmBtn.addEventListener('click', function() {
        if (currentUnit === 'mm') return;
        currentUnit = 'mm';
        unitMmBtn.classList.add('is-active');
        unitInBtn.classList.remove('is-active');
        updateReadoutHeader();
        draw();
      });
    }

    updateReadoutHeader();
  }

  function updateReadoutHeader() {
    if (!readoutEl) return;

    if (hoveredPoint) {
      // Hovered point takes precedence
      renderReadoutPoint(hoveredPoint);
      return;
    }

    if (activeDecade === 'all') {
      readoutEl.innerHTML = `
        <div class="scatter-readout-item">
          <span class="readout-label">Dataset:</span>
          <span class="readout-value"><strong>16,334</strong> verified vehicle records (1970–2024) across <strong>2,841</strong> model dimensions</span>
        </div>
        <div class="scatter-readout-item">
          <span class="readout-label">Range:</span>
          <span class="readout-value">Length: ${formatDim(BOUNDS.minL, currentUnit)} &ndash; ${formatDim(BOUNDS.maxL, currentUnit)} &bull; Width: ${formatDim(BOUNDS.minW, currentUnit)} &ndash; ${formatDim(BOUNDS.maxW, currentUnit)}</span>
        </div>
      `;
    } else {
      const stats = metadata && metadata.decade_stats ? metadata.decade_stats[activeDecade] : null;
      if (stats) {
        const medL = currentUnit === 'in' ? stats.median_length_in + ' in' : stats.median_length_mm + ' mm';
        const medW = currentUnit === 'in' ? stats.median_width_in + ' in' : stats.median_width_mm + ' mm';
        readoutEl.innerHTML = `
          <div class="scatter-readout-item">
            <span class="readout-label">${activeDecade} Fleet:</span>
            <span class="readout-value"><strong>${stats.records.toLocaleString()}</strong> vehicle records</span>
          </div>
          <div class="scatter-readout-item">
            <span class="readout-label">Decade Medians:</span>
            <span class="readout-value">Length: <strong>${medL}</strong> &bull; Width: <strong>${medW}</strong></span>
          </div>
        `;
      }
    }
  }

  function renderReadoutPoint(pt) {
    if (!readoutEl) return;
    const [l, w, yr, decIdx, make, model, bt, trims] = pt;
    const decName = DECADE_LIST[decIdx] || '';
    const lStr = `${(l / 25.4).toFixed(1)} in (${Math.round(l)} mm)`;
    const wStr = `${(w / 25.4).toFixed(1)} in (${Math.round(w)} mm)`;
    const trimsNote = trims > 1 ? ` &bull; ${trims} engine variants` : '';

    readoutEl.innerHTML = `
      <div class="scatter-readout-item">
        <span class="readout-label">Selected:</span>
        <span class="readout-value highlight-car"><strong>${yr} ${make} ${model}</strong> (${bt})</span>
      </div>
      <div class="scatter-readout-item">
        <span class="readout-label">Dimensions:</span>
        <span class="readout-value">Length: <strong>${lStr}</strong> &bull; Width: <strong>${wStr}</strong>${trimsNote}</span>
      </div>
    `;
  }

  function resizeAndDraw() {
    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    // Editorial aspect ratio: comfortable rectangular stage
    const height = Math.min(Math.max(Math.round(width * 0.52), 340), 500);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    containerRect = {
      width: width,
      height: height,
      padding: {
        top: 24,
        right: width < 600 ? 16 : 36,
        bottom: 46,
        left: width < 600 ? 46 : 64
      }
    };

    draw();
  }

  function getPlotArea() {
    const p = containerRect.padding;
    return {
      x: p.left,
      y: p.top,
      width: containerRect.width - p.left - p.right,
      height: containerRect.height - p.top - p.bottom
    };
  }

  function toScreenX(lengthMm, plot) {
    return plot.x + ((lengthMm - BOUNDS.minL) / (BOUNDS.maxL - BOUNDS.minL)) * plot.width;
  }

  function toScreenY(widthMm, plot) {
    // Invert Y so wider cars appear near top
    return plot.y + plot.height - ((widthMm - BOUNDS.minW) / (BOUNDS.maxW - BOUNDS.minW)) * plot.height;
  }

  function draw() {
    if (!ctx || !containerRect) return;

    const w = containerRect.width;
    const h = containerRect.height;
    const plot = getPlotArea();

    // 1. Clear background
    ctx.clearRect(0, 0, w, h);

    // Warm paper card background
    ctx.fillStyle = '#faf8f4';
    ctx.fillRect(plot.x, plot.y, plot.width, plot.height);

    // 2. Grid lines & Axis labels
    drawAxesAndGrid(plot);

    // 3. Vehicle Scatter observations
    drawPoints(plot);

    // 4. Hover reticle
    if (hoveredPoint) {
      drawHoverFocus(plot, hoveredPoint);
    }
  }

  function drawAxesAndGrid(plot) {
    const isMobile = containerRect.width < 600;

    ctx.save();
    ctx.strokeStyle = '#e6e0d4';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#7a838a';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // X-Axis (Vehicle Length)
    let xTicks;
    if (currentUnit === 'in') {
      // In inches: 120, 140, 160, 180, 200, 220, 240, 260
      const inTicks = isMobile ? [120, 160, 200, 240] : [120, 140, 160, 180, 200, 220, 240, 260];
      xTicks = inTicks.map(val => ({
        valMm: val * 25.4,
        label: val + ' in'
      }));
    } else {
      // In mm: 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500
      const mmTicks = isMobile ? [3000, 4000, 5000, 6000] : [3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500];
      xTicks = mmTicks.map(val => ({
        valMm: val,
        label: (val / 1000).toFixed(1) + ' m'
      }));
    }

    xTicks.forEach(tick => {
      if (tick.valMm >= BOUNDS.minL && tick.valMm <= BOUNDS.maxL) {
        const sx = toScreenX(tick.valMm, plot);

        // Grid line
        ctx.beginPath();
        ctx.setLineDash([3, 4]);
        ctx.moveTo(sx, plot.y);
        ctx.lineTo(sx, plot.y + plot.height);
        ctx.stroke();

        // Tick mark & label
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(sx, plot.y + plot.height);
        ctx.lineTo(sx, plot.y + plot.height + 4);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillText(tick.label, sx, plot.y + plot.height + 18);
      }
    });

    // Y-Axis (Vehicle Width)
    let yTicks;
    if (currentUnit === 'in') {
      const inTicks = isMobile ? [60, 70, 80, 90] : [55, 60, 65, 70, 75, 80, 85, 90, 95];
      yTicks = inTicks.map(val => ({
        valMm: val * 25.4,
        label: val + ' in'
      }));
    } else {
      const mmTicks = isMobile ? [1400, 1700, 2000, 2300] : [1400, 1600, 1800, 2000, 2200, 2400];
      yTicks = mmTicks.map(val => ({
        valMm: val,
        label: (val / 1000).toFixed(2) + ' m'
      }));
    }

    yTicks.forEach(tick => {
      if (tick.valMm >= BOUNDS.minW && tick.valMm <= BOUNDS.maxW) {
        const sy = toScreenY(tick.valMm, plot);

        // Grid line
        ctx.beginPath();
        ctx.setLineDash([3, 4]);
        ctx.moveTo(plot.x, sy);
        ctx.lineTo(plot.x + plot.width, sy);
        ctx.stroke();

        // Tick mark & label
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(plot.x - 4, sy);
        ctx.lineTo(plot.x, sy);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillText(tick.label, plot.x - 8, sy + 4);
      }
    });

    // Axis frame borders
    ctx.strokeStyle = '#d9d2c5';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(plot.x, plot.y, plot.width, plot.height);

    // Axis Titles (Editorial Understated)
    ctx.fillStyle = '#42494e';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // X-Axis title
    ctx.textAlign = 'center';
    const xUnitText = currentUnit === 'in' ? 'Length in inches (bumper-to-bumper)' : 'Length in millimeters';
    ctx.fillText('VEHICLE LENGTH &rarr; ' + xUnitText, plot.x + plot.width / 2, plot.y + plot.height + 36);

    // Y-Axis title (rotated)
    ctx.save();
    ctx.translate(isMobile ? 12 : 18, plot.y + plot.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    const yUnitText = currentUnit === 'in' ? 'Width in inches (excluding mirrors)' : 'Width in millimeters';
    ctx.fillText('&larr; VEHICLE WIDTH &bull; ' + yUnitText, 0, 0);
    ctx.restore();

    ctx.restore();
  }

  function drawPoints(plot) {
    if (!cachedData || cachedData.length === 0) return;

    const isMobile = containerRect.width < 600;
    const baseRadius = isMobile ? 2.0 : 2.5;

    // To ensure clean rendering and separation:
    // When a decade is selected:
    // First pass: Inactive points drawn as faint ghost dots (opacity 0.12)
    // Second pass: Active points drawn in their decade color with full presence
    const activeIsAll = activeDecade === 'all';

    // Inactive pass (only when a specific decade is filtered)
    if (!activeIsAll) {
      ctx.fillStyle = 'rgba(180, 175, 165, 0.18)';
      for (let i = 0; i < cachedData.length; i++) {
        const pt = cachedData[i];
        const decName = DECADE_LIST[pt[3]];
        if (decName === activeDecade) continue;

        const sx = toScreenX(pt[0], plot);
        const sy = toScreenY(pt[1], plot);

        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Active pass (or all points if 'all' is selected)
    for (let i = 0; i < cachedData.length; i++) {
      const pt = cachedData[i];
      const decName = DECADE_LIST[pt[3]];
      if (!activeIsAll && decName !== activeDecade) continue;

      const decInfo = DECADE_COLORS[decName] || { rgb: '100, 116, 139', hex: '#64748b' };
      const sx = toScreenX(pt[0], plot);
      const sy = toScreenY(pt[1], plot);

      // Trims density: points with multiple trims get subtle additional saturation
      const alpha = activeIsAll ? 0.38 : 0.65;
      ctx.fillStyle = `rgba(${decInfo.rgb}, ${alpha})`;

      ctx.beginPath();
      ctx.arc(sx, sy, baseRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHoverFocus(plot, pt) {
    const sx = toScreenX(pt[0], plot);
    const sy = toScreenY(pt[1], plot);
    const decName = DECADE_LIST[pt[3]];
    const decInfo = DECADE_COLORS[decName] || { hex: '#1c3d2e' };

    ctx.save();

    // Hairline crosshair guidelines to axes
    ctx.strokeStyle = 'rgba(28, 61, 46, 0.25)';
    ctx.setLineDash([2, 3]);
    ctx.lineWidth = 1;

    // Guideline down to X axis
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, plot.y + plot.height);
    ctx.stroke();

    // Guideline left to Y axis
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(plot.x, sy);
    ctx.stroke();

    // Subtle outer halo ring
    ctx.setLineDash([]);
    ctx.strokeStyle = decInfo.hex;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.stroke();

    // Inner center dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = decInfo.hex;
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function findNearestPoint(clientX, clientY) {
    if (!cachedData || !containerRect) return null;

    const canvasBox = canvas.getBoundingClientRect();
    const mouseX = clientX - canvasBox.left;
    const mouseY = clientY - canvasBox.top;
    const plot = getPlotArea();

    // Check if within plot boundaries
    if (mouseX < plot.x - 10 || mouseX > plot.x + plot.width + 10 ||
        mouseY < plot.y - 10 || mouseY > plot.y + plot.height + 10) {
      return null;
    }

    let nearest = null;
    let minDistSq = 14 * 14; // Hit radius of 14px

    for (let i = 0; i < cachedData.length; i++) {
      const pt = cachedData[i];
      const decName = DECADE_LIST[pt[3]];

      // If a single decade is filtered, only match that decade
      if (activeDecade !== 'all' && decName !== activeDecade) continue;

      const sx = toScreenX(pt[0], plot);
      const sy = toScreenY(pt[1], plot);

      const dx = sx - mouseX;
      const dy = sy - mouseY;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        nearest = pt;
      }
    }

    return nearest;
  }

  function handlePointerMove(e) {
    const pt = findNearestPoint(e.clientX, e.clientY);

    if (pt !== hoveredPoint) {
      hoveredPoint = pt;
      draw();
      updateReadoutHeader();
    }

    if (hoveredPoint && tooltipEl) {
      updateTooltipPosition(e.clientX, e.clientY, hoveredPoint);
    } else if (tooltipEl) {
      tooltipEl.style.opacity = '0';
    }
  }

  function handlePointerLeave() {
    if (hoveredPoint) {
      hoveredPoint = null;
      draw();
      updateReadoutHeader();
    }
    if (tooltipEl) {
      tooltipEl.style.opacity = '0';
    }
  }

  function handleTouch(e) {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const pt = findNearestPoint(touch.clientX, touch.clientY);

    if (pt) {
      hoveredPoint = pt;
      draw();
      updateReadoutHeader();
      if (tooltipEl) {
        updateTooltipPosition(touch.clientX, touch.clientY, hoveredPoint);
      }
    }
  }

  function updateTooltipPosition(clientX, clientY, pt) {
    if (!tooltipEl || !canvas) return;

    const [l, w, yr, decIdx, make, model, bt, trims] = pt;
    const decName = DECADE_LIST[decIdx] || '';
    const decInfo = DECADE_COLORS[decName] || { hex: '#1c3d2e' };

    const lIn = (l / 25.4).toFixed(1);
    const wIn = (w / 25.4).toFixed(1);
    const lMm = Math.round(l);
    const wMm = Math.round(w);

    const trimsText = trims > 1 ? `<span class="tip-sub">&bull; ${trims} engine configurations</span>` : '';

    tooltipEl.innerHTML = `
      <div class="tip-header">
        <span class="tip-pill" style="background-color: ${decInfo.hex};">${decName}</span>
        <span class="tip-body">${bt}</span>
      </div>
      <div class="tip-title">${yr} ${make} ${model}</div>
      <div class="tip-specs-grid">
        <div class="tip-spec">
          <span class="tip-label">LENGTH</span>
          <span class="tip-val">${lIn} in <small>(${lMm} mm)</small></span>
        </div>
        <div class="tip-spec">
          <span class="tip-label">WIDTH</span>
          <span class="tip-val">${wIn} in <small>(${wMm} mm)</small></span>
        </div>
      </div>
      ${trimsText ? `<div class="tip-footer">${trimsText}</div>` : ''}
    `;

    const canvasBox = canvas.getBoundingClientRect();
    const tipWidth = 230;
    const tipHeight = 110;

    let left = clientX - canvasBox.left + 14;
    let top = clientY - canvasBox.top - tipHeight - 12;

    // Boundary flipping
    if (left + tipWidth > canvasBox.width - 10) {
      left = clientX - canvasBox.left - tipWidth - 14;
    }
    if (left < 10) left = 10;
    if (top < 10) {
      top = clientY - canvasBox.top + 18;
    }

    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.opacity = '1';
  }

  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScatter);
  } else {
    initScatter();
  }
})();
