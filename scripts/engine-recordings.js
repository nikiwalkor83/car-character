/* Dropdown engine-category selector & real interactive audio waveform for the Sound section. */
(function () {
  const engineCategories = [
    { key: "2-cylinder", label: "2-Cylinder", count: 51, file: "2-cylinder.ogg" },
    { key: "3-cylinder", label: "3-Cylinder", count: 1260, file: "3-cylinder.ogg" },
    { key: "4-cylinder", label: "4-Cylinder", count: 18955, file: "4-cylinder.wav" },
    { key: "5-cylinder", label: "5-Cylinder", count: 684, file: "5-cylinder.ogg" },
    { key: "inline-6", label: "Inline-6", count: 2504, file: "inline-6.ogg" },
    { key: "flat-6", label: "Flat-6", count: 346, file: "flat-6.wav" },
    { key: "v6", label: "V6", count: 2596, file: "v6.ogg" },
    { key: "v8", label: "V8", count: 1996, file: "v8.ogg" },
    { key: "v10", label: "V10", count: 80, file: "v10.ogg" },
    { key: "v12", label: "V12", count: 235, file: "v12.ogg" },
    { key: "w16", label: "W16", count: 12, file: "w16.ogg" },
    { key: "diesel", label: "Diesel", count: 8320, file: "diesel.ogg" },
    { key: "hybrid", label: "Hybrid", count: 1319, file: "hybrid.ogg" },
    { key: "electric", label: "Electric", count: 705, file: "electric-imiev.ogg" }
  ];

  let recordingsByFilename = new Map();
  let activeAudio = null;
  let activeRafId = null;
  let activeResizeObserver = null;
  let activeRecordingFile = null;
  let audioContextInstance = null;
  let analyserNode = null;
  let freqArray = null;
  let timeArray = null;

  const bandBinRanges = [
    [0, 1],   [1, 2],   [2, 3],   [3, 4],
    [4, 5],   [5, 6],   [6, 7],   [7, 9],
    [8, 11],  [10, 13], [12, 16], [15, 20],
    [19, 25], [23, 30], [28, 36], [34, 43],
    [41, 51], [49, 60], [58, 70], [68, 81],
    [79, 93], [90, 105], [102, 116], [113, 127]
  ];

  // In-memory cache of extracted audio waveform peaks: Map<filename, { peaks: number[], duration: number }>
  const waveformCache = new Map();

  // Seed cache with pre-extracted real audio buffer peaks for uncompressed WAV specimens
  waveformCache.set("flat-6.wav", {
    duration: 33.08,
    peaks: [0.4128, 0.3488, 0.2933, 0.2008, 0.1755, 0.1712, 0.5111, 0.6903, 0.6491, 0.658, 0.8222, 0.7241, 0.7321, 0.6594, 0.755, 0.9267, 0.7972, 0.6827, 0.7226, 0.7512, 0.6524, 0.661, 0.6814, 0.8322, 0.849, 0.8936, 0.7706, 0.8551, 0.8154, 0.7796, 0.7231, 0.7539, 0.7339, 0.8183, 0.8339, 0.7836, 0.5662, 0.8202, 0.9388, 1.0, 0.8926, 0.8612, 0.8141, 0.8196, 0.7933, 0.8607, 0.8314, 0.8154, 0.7943, 0.7636, 0.7446, 0.6671, 0.7145, 0.7959, 0.7444, 0.7847, 0.7325, 0.7765, 0.8788, 0.8011, 0.859, 0.806, 0.7179, 0.6523, 0.6504, 0.6778, 0.9016, 0.8535, 0.861, 0.9237, 0.8736, 0.8521, 0.7959, 0.8158, 0.7896, 0.8327, 0.7792, 0.8017, 0.7783, 0.8007, 0.7646, 0.6256, 0.8886, 0.9513, 0.96, 0.8335, 0.77, 0.7667, 0.6852, 0.8176, 0.7589, 0.7244, 0.7239, 0.7446, 0.8419, 0.7624, 0.8767, 0.7995, 0.9145, 0.8953, 0.8104, 0.7935, 0.8995, 0.8055, 0.7949, 0.935, 0.7723, 0.8101, 0.8914, 0.8098, 0.9979, 0.7378, 0.8337, 0.8529, 0.8186, 0.9357, 0.7877, 0.8081, 0.7989, 0.8326, 0.9421, 0.8184, 0.8348, 0.9136, 0.8858, 0.7429, 0.8008, 0.8393, 0.7745, 0.7054, 0.84, 0.7986, 0.7538, 0.816, 0.8802, 0.9547, 0.9008, 0.7972, 0.7414, 0.7233, 0.736, 0.7396, 0.8084, 0.7101, 0.8344, 0.9428, 0.7895, 0.7923, 0.8446, 0.7244, 0.8555, 0.8311, 0.759, 0.7344, 0.7184, 0.7305, 0.8124, 0.7844, 0.8016, 0.8041]
  });
  waveformCache.set("4-cylinder.wav", {
    duration: 42.86,
    peaks: [0.0515, 0.1471, 0.0888, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.1155, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.1425, 0.0834, 0.1977, 0.2455, 0.1246, 0.1323, 0.091, 0.0584, 0.0608, 0.0515, 0.0515, 0.0515, 0.0515, 0.0647, 0.073, 0.06, 0.0515, 0.0815, 0.1443, 0.0974, 0.0529, 0.0524, 0.0943, 0.0995, 0.1263, 0.1509, 0.2047, 0.2698, 0.3952, 0.3819, 0.4983, 0.7208, 0.581, 0.9587, 0.9181, 1.0, 0.7146, 0.688, 0.6343, 0.4145, 0.2667, 0.207, 0.2924, 0.2913, 0.2655, 0.234, 0.2278, 0.224, 0.2227, 0.2168, 0.2173, 0.2389, 0.218, 0.2022, 0.2018, 0.1434, 0.1808, 0.1075, 0.1458, 0.1363, 0.126, 0.152, 0.1554, 0.1451, 0.1447, 0.1574, 0.1205, 0.1355, 0.1249, 0.1165, 0.1251, 0.1052, 0.1339, 0.1249, 0.1388, 0.1173, 0.1097, 0.1153, 0.1628, 0.1336, 0.1128, 0.1093, 0.0964, 0.0875, 0.0808, 0.0729, 0.083, 0.0821, 0.0829, 0.0922, 0.0824, 0.0955, 0.0792, 0.0819, 0.0799, 0.0768, 0.072, 0.0645, 0.0515, 0.0515, 0.0515, 0.0752, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515, 0.0515]
  });

  function getAudioContext() {
    if (!audioContextInstance) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContextInstance = new AudioCtx();
      }
    }
    return audioContextInstance;
  }

  function getAnalyser() {
    const ctx = getAudioContext();
    if (!ctx) return null;
    if (!analyserNode) {
      analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.55;
      analyserNode.minDecibels = -90;
      analyserNode.maxDecibels = -15;
      freqArray = new Uint8Array(analyserNode.frequencyBinCount);
      timeArray = new Uint8Array(analyserNode.fftSize);
    }
    return analyserNode;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  function formatPreciseTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00.0";
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1).padStart(4, "0");
    return `${minutes}:${secs}`;
  }

  function recordingFor(category) {
    return category.file ? recordingsByFilename.get(category.file) : null;
  }

  // Synthetic acoustic envelope fallback for offline / restricted environments
  function generateFallbackProfile(filename, buckets = 160) {
    const peaks = new Array(buckets);
    let hash = 0;
    for (let i = 0; i < filename.length; i++) {
      hash = (hash * 31 + filename.charCodeAt(i)) & 0xffffff;
    }
    const isElectric = filename.includes("electric");
    const isIdle = !isElectric;

    for (let i = 0; i < buckets; i++) {
      const t = i / buckets;
      let amp = 0.2;
      if (isElectric) {
        // Rising whine during motor acceleration into pass-by
        const rise = Math.sin(t * Math.PI * 0.95);
        const flutter = 0.08 * Math.sin(i * 1.8 + hash);
        amp = Math.max(0.04, rise * 0.9 + flutter);
      } else {
        // Starter cranking, engine firing peak, steady idle harmonics, shutoff
        if (t < 0.12) {
          amp = 0.25 + 0.18 * Math.sin(i * 4.2);
        } else if (t < 0.25) {
          amp = 0.85 + 0.12 * Math.sin(i * 2.5);
        } else if (t < 0.88) {
          amp = 0.52 + 0.15 * Math.sin(i * 1.4) + 0.08 * Math.cos(i * 3.7 + hash);
        } else {
          amp = Math.max(0.04, 0.45 * Math.exp(-(t - 0.88) * 12));
        }
      }
      peaks[i] = Math.max(0.04, Math.min(1.0, amp));
    }
    return { peaks, duration: 12.0 };
  }

  // Web Audio API: Extract amplitude samples from real audio buffer
  async function extractWaveformFromAudio(filename, buckets = 160) {
    if (waveformCache.has(filename)) {
      return waveformCache.get(filename);
    }

    const ctx = getAudioContext();
    if (!ctx) {
      const fallback = generateFallbackProfile(filename, buckets);
      waveformCache.set(filename, fallback);
      return fallback;
    }

    try {
      const response = await fetch(`audio/engines/${filename}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);

      const totalSamples = channelData.length;
      const blockSize = Math.floor(totalSamples / buckets);
      const peaks = new Array(buckets);
      let maxMetric = 0.001;

      for (let i = 0; i < buckets; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, totalSamples);
        let peak = 0;
        let sumSq = 0;
        for (let j = start; j < end; j++) {
          const val = Math.abs(channelData[j]);
          if (val > peak) peak = val;
          sumSq += val * val;
        }
        const rms = Math.sqrt(sumSq / Math.max(1, end - start));
        // Acoustic profile: blend peak and RMS for sharp percussive idle and motor whine
        const metric = peak * 0.7 + rms * 0.3;
        peaks[i] = metric;
        if (metric > maxMetric) maxMetric = metric;
      }

      // Normalize so loudest peak reaches full visual amplitude, minimum baseline is 0.04
      for (let i = 0; i < buckets; i++) {
        peaks[i] = Math.max(0.04, Math.min(1.0, peaks[i] / maxMetric));
      }

      const data = {
        peaks,
        duration: audioBuffer.duration
      };
      waveformCache.set(filename, data);
      return data;
    } catch (err) {
      console.warn(`Web Audio decoding fallback for ${filename}:`, err);
      const fallback = generateFallbackProfile(filename, buckets);
      waveformCache.set(filename, fallback);
      return fallback;
    }
  }

  function selectorHtml() {
    return `
      <div class="sound-dropdown-wrap">
        <label for="engine-type-select" class="sound-dropdown-label">SELECT AN ENGINE TYPE</label>
        <div class="sound-select-box">
          <select id="engine-type-select" class="sound-engine-select" aria-label="Select an engine type">
            ${engineCategories.map(cat => `
              <option value="${cat.key}">${escapeHtml(cat.label)}</option>
            `).join("")}
          </select>
        </div>
      </div>
      <audio id="selected-engine-audio" preload="metadata" style="display: none;"></audio>
      <div class="engine-recording-detail" id="engine-recording-detail" aria-live="polite"></div>
    `;
  }

  function availableDetail(category, recording) {
    const extension = recording.filename.split(".").pop().toUpperCase();
    const attributionHtml = recording.attribution
      ? ` &bull; Attribution: ${escapeHtml(recording.attribution)}`
      : "";
    const powertrainDesc = recording.engine_description || recording.engine_type;

    return `
      <div class="sound-specimen-meta">
        <div class="sound-specimen-heading-row">
          <h4 class="sound-specimen-title">${escapeHtml(category.label)}</h4>
          <span class="sound-specimen-count">${category.count.toLocaleString()} cataloged models in dataset</span>
        </div>
        <div class="sound-specimen-vehicle">${escapeHtml(recording.vehicle)}</div>
        <div class="sound-specimen-engine-desc">${escapeHtml(powertrainDesc)}</div>
      </div>

      <div class="engine-detail-player">
        <div class="sound-waveform-container sound-rev-container">
          <div class="sound-waveform-header">
            <div class="sound-waveform-header-left">
              <span class="sound-waveform-indicator-dot sound-rev-dot" id="selected-rev-dot"></span>
              <span class="sound-waveform-label">ENGINE ACOUSTIC INTENSITY // DYNAMIC REV PROFILE</span>
            </div>
            <div class="sound-waveform-header-right">
              <span class="sound-rev-intensity-badge" id="selected-rev-badge">RESTING</span>
              <span class="sound-waveform-duration" id="selected-waveform-duration">--:--</span>
              <span class="sound-waveform-seek-preview" id="selected-waveform-seek" style="display: none;">SEEK 0:00</span>
            </div>
          </div>
          <div class="sound-waveform-canvas-wrap sound-rev-canvas-wrap" id="selected-engine-track" role="region" aria-label="Dynamic engine rev visualizer. Click or drag to seek." title="Click or drag to seek playback">
            <canvas id="selected-waveform-canvas" class="sound-waveform-canvas"></canvas>
            <div class="sound-waveform-loading" id="selected-waveform-loading" style="display: none;">
              <span class="sound-waveform-loading-text">CALIBRATING ACOUSTIC SENSORS...</span>
            </div>
          </div>
        </div>

        <div class="sound-controls-row">
          <button class="sound-play-btn" id="selected-engine-button" type="button" aria-label="Play ${escapeHtml(category.label)} recording">
            <span class="btn-play-icon">&#9654;</span><span class="btn-label-text">LISTEN</span>
          </button>
          <span class="sound-time-readout" id="selected-engine-time">0:00 / --:--</span>
          <span class="sound-status-dot"><span class="status-indicator-circle"></span><span class="status-label" id="selected-engine-status">READY</span></span>
          <span class="sound-format-badge">${extension}</span>
        </div>
      </div>

      <div class="sound-specimen-source-row">
        <p class="sound-card-source">
          <a href="${escapeHtml(recording.source_page_url)}" target="_blank" rel="noopener">Source: ${escapeHtml(recording.source)}</a> &bull; ${escapeHtml(recording.license)}${attributionHtml}
        </p>
      </div>
    `;
  }

  function attachSelectedPlayer(recording) {
    const audio = document.getElementById("selected-engine-audio");
    const button = document.getElementById("selected-engine-button");
    const time = document.getElementById("selected-engine-time");
    const status = document.getElementById("selected-engine-status");
    const track = document.getElementById("selected-engine-track");
    const canvas = document.getElementById("selected-waveform-canvas");
    const durationBadge = document.getElementById("selected-waveform-duration");
    const seekPreview = document.getElementById("selected-waveform-seek");
    const dot = document.getElementById("selected-rev-dot");
    const badge = document.getElementById("selected-rev-badge");

    if (!audio || !button || !time || !status || !track || !canvas) return;

    if (activeRafId) {
      cancelAnimationFrame(activeRafId);
      activeRafId = null;
    }
    if (activeResizeObserver) {
      activeResizeObserver.disconnect();
      activeResizeObserver = null;
    }

    activeAudio = audio;
    audio.autoplay = false;
    audio.loop = false;
    audio.src = `audio/engines/${recording.filename}`;
    audio.load();

    let currentDuration = waveformCache.has(recording.filename)
      ? waveformCache.get(recording.filename).duration
      : 0;
    if (currentDuration > 0) {
      if (durationBadge) durationBadge.textContent = formatTime(currentDuration);
      time.textContent = `0:00 / ${formatTime(currentDuration)}`;
    }

    const numColumns = 24;
    const currentLevels = new Float32Array(numColumns);
    const peakLevels = new Float32Array(numColumns);
    const peakHoldTimes = new Float32Array(numColumns);
    let currentHoverRatio = null;
    let isScrubbing = false;

    function ensureWebAudio() {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const analyser = getAnalyser();
      if (!audio._sourceConnected && analyser) {
        try {
          const src = ctx.createMediaElementSource(audio);
          src.connect(analyser);
          analyser.connect(ctx.destination);
          audio._sourceConnected = true;
        } catch (e) {
          console.warn("MediaElementAudioSource connection:", e);
        }
      }
    }

    function draw(isResting = false, hoverRatio = currentHoverRatio) {
      if (!canvas || !track) return;
      const rect = track.getBoundingClientRect();
      const width = Math.max(10, Math.floor(rect.width));
      const height = Math.max(10, Math.floor(rect.height || 130));
      const dpr = window.devicePixelRatio || 1;

      const targetW = Math.floor(width * dpr);
      const targetH = Math.floor(height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 1. Dial plate background: Deep vintage British racing dark instrument slate
      ctx.fillStyle = "#121a15";
      ctx.fillRect(0, 0, width, height);

      // Subtle horizontal instrument texture lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.018)";
      ctx.lineWidth = 1;
      for (let gy = 6; gy < height; gy += 6) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Top bezel inner shadow & glass reflection
      const topShadow = ctx.createLinearGradient(0, 0, 0, 10);
      topShadow.addColorStop(0, "rgba(0, 0, 0, 0.65)");
      topShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = topShadow;
      ctx.fillRect(0, 0, width, 10);

      const isNarrow = width < 520;
      const padLeft = isNarrow ? 36 : 48;
      const padRight = isNarrow ? 12 : 18;
      const padTop = 14;
      const padBottom = 22; // space for bottom progress runner

      const plotW = Math.max(10, width - padLeft - padRight);
      const plotH = Math.max(10, height - padTop - padBottom);

      // 2. Horizontal Reference Markings & Engraved Labels
      const thresholds = [
        { ratio: 0.85, label: "PEAK", color: "rgba(207, 56, 36, 0.45)", textColor: "rgba(235, 120, 105, 0.75)", dash: [3, 3] },
        { ratio: 0.60, label: "PWR", color: "rgba(212, 162, 64, 0.3)", textColor: "rgba(226, 185, 110, 0.65)", dash: [2, 4] },
        { ratio: 0.35, label: "MID", color: "rgba(226, 218, 205, 0.16)", textColor: "rgba(226, 218, 205, 0.45)", dash: [2, 4] },
        { ratio: 0.12, label: "IDLE", color: "rgba(226, 218, 205, 0.12)", textColor: "rgba(226, 218, 205, 0.4)", dash: [2, 4] }
      ];

      thresholds.forEach(th => {
        const y = Math.round(padTop + plotH * (1 - th.ratio));
        ctx.strokeStyle = th.color;
        ctx.lineWidth = 1;
        ctx.setLineDash(th.dash);
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = th.textColor;
        ctx.font = `600 ${isNarrow ? "7px" : "8px"} ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(th.label, padLeft - (isNarrow ? 4 : 8), y);
      });

      // 3. 24 Dynamic Equalizer / Rev Columns
      const colGap = isNarrow ? 2 : 4;
      const totalGaps = (numColumns - 1) * colGap;
      const colWidth = Math.max(2, (plotW - totalGaps) / numColumns);
      const numSegments = 16;
      const segGap = 2;
      const totalSegGaps = (numSegments - 1) * segGap;
      const segHeight = Math.max(2, (plotH - totalSegGaps) / numSegments);

      for (let c = 0; c < numColumns; c++) {
        const colX = Math.round(padLeft + c * (colWidth + colGap));
        const level = isResting ? 0 : (currentLevels[c] || 0);
        const activeSegments = Math.min(numSegments, Math.round(level * numSegments));
        const peakSeg = isResting ? -1 : Math.min(numSegments - 1, Math.floor((peakLevels[c] || 0) * numSegments));

        for (let s = 0; s < numSegments; s++) {
          const segY = Math.round(padTop + plotH - (s + 1) * segHeight - s * segGap);
          const isLit = s < activeSegments;
          const isPeak = s === peakSeg && !isLit;

          if (isLit) {
            const segRatio = s / (numSegments - 1);
            if (segRatio >= 0.85) {
              ctx.fillStyle = "#cf3824";
            } else if (segRatio >= 0.60) {
              ctx.fillStyle = "#d49632";
            } else {
              ctx.fillStyle = "#dfd7ca";
            }
            ctx.fillRect(colX, segY, Math.round(colWidth), Math.round(segHeight));

            ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
            ctx.fillRect(colX, segY, Math.round(colWidth), 1);
          } else if (isPeak) {
            const segRatio = s / (numSegments - 1);
            ctx.fillStyle = segRatio >= 0.85 ? "#ff5a43" : (segRatio >= 0.60 ? "#f0b348" : "#ffffff");
            ctx.fillRect(colX, segY + Math.round(segHeight / 2) - 1, Math.round(colWidth), 2);
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
            ctx.fillRect(colX, segY, Math.round(colWidth), Math.round(segHeight));
          }
        }
      }

      // 4. Bottom Playback Runner
      const runnerY = height - 12;
      const runnerH = 4;
      const curDur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;
      const progressRatio = (curDur > 0 && Number.isFinite(audio.currentTime))
        ? Math.max(0, Math.min(1, audio.currentTime / curDur))
        : 0;

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(padLeft, runnerY, plotW, runnerH);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(padLeft, runnerY, plotW, runnerH);

      if (progressRatio > 0) {
        const fillW = Math.max(0, Math.min(plotW, progressRatio * plotW));
        const progGrad = ctx.createLinearGradient(padLeft, 0, padLeft + fillW, 0);
        progGrad.addColorStop(0, "#1c3d2e");
        progGrad.addColorStop(1, "#c29b38");
        ctx.fillStyle = progGrad;
        ctx.fillRect(padLeft, runnerY, fillW, runnerH);

        const headX = padLeft + fillW;
        ctx.fillStyle = "#dfd7ca";
        ctx.beginPath();
        ctx.arc(headX, runnerY + runnerH / 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#121a15";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Hover Seek Guideline
      if (hoverRatio !== null && hoverRatio >= 0 && hoverRatio <= 1) {
        const hX = Math.round(padLeft + hoverRatio * plotW);
        ctx.strokeStyle = "rgba(207, 56, 36, 0.65)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(hX, padTop);
        ctx.lineTo(hX, height - 6);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    function startPlaybackLoop() {
      if (activeRafId) {
        cancelAnimationFrame(activeRafId);
        activeRafId = null;
      }

      function frame() {
        if (!audio || audio.paused || audio.ended) {
          activeRafId = null;
          return;
        }

        if (analyserNode && freqArray && timeArray) {
          analyserNode.getByteFrequencyData(freqArray);
          analyserNode.getByteTimeDomainData(timeArray);

          let sumSq = 0;
          for (let i = 0; i < timeArray.length; i++) {
            const v = (timeArray[i] - 128) / 128;
            sumSq += v * v;
          }
          const rms = Math.sqrt(sumSq / timeArray.length);
          const acousticIntensity = Math.min(1, Math.max(0, (rms - 0.02) / 0.38));

          const rawBands = new Float32Array(numColumns);
          for (let c = 0; c < numColumns; c++) {
            const [startBin, endBin] = bandBinRanges[c];
            let sum = 0;
            let count = 0;
            for (let b = startBin; b <= endBin && b < freqArray.length; b++) {
              sum += freqArray[b];
              count++;
            }
            const avg = count > 0 ? (sum / count) / 255 : 0;
            const hfBoost = 1.0 + Math.pow(c / numColumns, 1.2) * 1.6;
            rawBands[c] = Math.min(1, avg * hfBoost);
          }

          const smoothedBands = new Float32Array(numColumns);
          for (let c = 0; c < numColumns; c++) {
            const prev = c > 0 ? rawBands[c - 1] : rawBands[c];
            const next = c < numColumns - 1 ? rawBands[c + 1] : rawBands[c];
            smoothedBands[c] = 0.22 * prev + 0.56 * rawBands[c] + 0.22 * next;
          }

          const now = performance.now();
          let maxCol = 0;

          for (let c = 0; c < numColumns; c++) {
            const arcWeight = 0.82 + 0.36 * Math.sin((c / (numColumns - 1)) * Math.PI);
            const target = Math.min(1, Math.max(0,
              (smoothedBands[c] * 0.60 + acousticIntensity * 0.60) * arcWeight
            ));

            if (target > currentLevels[c]) {
              currentLevels[c] += (target - currentLevels[c]) * 0.40;
            } else {
              currentLevels[c] += (target - currentLevels[c]) * 0.12;
            }

            if (currentLevels[c] > peakLevels[c]) {
              peakLevels[c] = currentLevels[c];
              peakHoldTimes[c] = now + 250;
            } else if (now > peakHoldTimes[c]) {
              peakLevels[c] = Math.max(0, peakLevels[c] - 0.012);
            }

            if (currentLevels[c] > maxCol) {
              maxCol = currentLevels[c];
            }
          }

          if (badge) {
            if (maxCol >= 0.80) {
              badge.textContent = "PEAK REV";
              badge.className = "sound-rev-intensity-badge is-peak";
            } else if (maxCol >= 0.45) {
              badge.textContent = "ACCEL";
              badge.className = "sound-rev-intensity-badge is-accel";
            } else if (maxCol >= 0.15) {
              badge.textContent = "IDLE";
              badge.className = "sound-rev-intensity-badge";
            } else {
              badge.textContent = "LOW";
              badge.className = "sound-rev-intensity-badge";
            }
          }
        }

        const dur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;
        if (dur > 0 && time) {
          time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(dur)}`;
        }

        draw(false, currentHoverRatio);
        activeRafId = requestAnimationFrame(frame);
      }

      activeRafId = requestAnimationFrame(frame);
    }

    function stopPlaybackLoop() {
      if (activeRafId) {
        cancelAnimationFrame(activeRafId);
        activeRafId = null;
      }
    }

    function resetVisualizer() {
      currentLevels.fill(0);
      peakLevels.fill(0);
      peakHoldTimes.fill(0);
      if (badge) {
        badge.textContent = "RESTING";
        badge.className = "sound-rev-intensity-badge";
      }
      if (dot) {
        dot.classList.remove("is-active");
      }
      draw(true, null);
    }

    audio.addEventListener("loadedmetadata", () => {
      currentDuration = audio.duration;
      waveformCache.set(recording.filename, { duration: audio.duration, peaks: [] });
      if (durationBadge) durationBadge.textContent = formatTime(audio.duration);
      time.textContent = `0:00 / ${formatTime(audio.duration)}`;
      draw(audio.paused, currentHoverRatio);
    });

    audio.addEventListener("error", () => {
      status.textContent = "ERROR";
      button.disabled = true;
    });

    button.addEventListener("click", () => {
      document.querySelectorAll("audio").forEach(el => {
        if (el !== audio && !el.paused) {
          el.pause();
        }
      });
      ensureWebAudio();
      if (audio.paused) {
        audio.play().then(() => {
          button.innerHTML = '<span class="btn-play-icon">&#10074;&#10074;</span><span class="btn-label-text">PAUSE</span>';
          status.textContent = "PLAYING";
          if (dot) dot.classList.add("is-active");
          startPlaybackLoop();
        }).catch(() => {
          status.textContent = "ERROR";
        });
      } else {
        audio.pause();
        stopPlaybackLoop();
        button.innerHTML = '<span class="btn-play-icon">&#9654;</span><span class="btn-label-text">LISTEN</span>';
        status.textContent = "PAUSED";
        if (dot) dot.classList.remove("is-active");
      }
    });

    audio.addEventListener("ended", () => {
      stopPlaybackLoop();
      button.innerHTML = '<span class="btn-play-icon">&#9654;</span><span class="btn-label-text">LISTEN</span>';
      status.textContent = "READY";
      audio.currentTime = 0;
      resetVisualizer();
      const dur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;
      if (dur > 0 && time) {
        time.textContent = `0:00 / ${formatTime(dur)}`;
      }
    });

    function getRatioFromEvent(e) {
      const bounds = track.getBoundingClientRect();
      if (bounds.width <= 0) return 0;
      const isNarrow = bounds.width < 520;
      const padLeft = isNarrow ? 36 : 48;
      const padRight = isNarrow ? 12 : 18;
      const plotW = Math.max(1, bounds.width - padLeft - padRight);
      const clickX = e.clientX - bounds.left;
      const ratio = (clickX - padLeft) / plotW;
      return Math.max(0, Math.min(1, ratio));
    }

    track.addEventListener("pointerdown", (e) => {
      isScrubbing = true;
      try { track.setPointerCapture(e.pointerId); } catch (_) {}
      const ratio = getRatioFromEvent(e);
      const dur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;
      if (dur > 0) {
        audio.currentTime = ratio * dur;
        time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(dur)}`;
      }
      draw(audio.paused, ratio);
    });

    track.addEventListener("pointermove", (e) => {
      const ratio = getRatioFromEvent(e);
      currentHoverRatio = ratio;
      const dur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;
      if (seekPreview && dur > 0) {
        seekPreview.textContent = `SEEK ${formatTime(ratio * dur)}`;
        seekPreview.style.display = "inline";
      }
      if (isScrubbing && dur > 0) {
        audio.currentTime = ratio * dur;
        time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(dur)}`;
        draw(audio.paused, ratio);
      } else if (!isScrubbing) {
        draw(audio.paused, ratio);
      }
    });

    function endScrub(e) {
      if (isScrubbing) {
        isScrubbing = false;
        try { if (e && e.pointerId) track.releasePointerCapture(e.pointerId); } catch (_) {}
        currentHoverRatio = null;
        if (seekPreview) seekPreview.style.display = "none";
        draw(audio.paused, null);
      }
    }
    track.addEventListener("pointerup", endScrub);
    track.addEventListener("pointercancel", endScrub);

    track.addEventListener("pointerleave", () => {
      if (!isScrubbing) {
        currentHoverRatio = null;
        if (seekPreview) seekPreview.style.display = "none";
        draw(audio.paused, null);
      }
    });

    const ResizeObserverClass = window.ResizeObserver || null;
    if (ResizeObserverClass) {
      activeResizeObserver = new ResizeObserverClass(() => {
        draw(audio.paused, currentHoverRatio);
      });
      activeResizeObserver.observe(track);
    }

    // Initial render of resting state
    resetVisualizer();
  }

  function selectCategory(category) {
    if (activeAudio) {
      if (!activeAudio.paused) {
        activeAudio.pause();
      }
      activeAudio.currentTime = 0;
    }
    activeAudio = null;

    if (activeRafId) {
      cancelAnimationFrame(activeRafId);
      activeRafId = null;
    }
    if (activeResizeObserver) {
      activeResizeObserver.disconnect();
      activeResizeObserver = null;
    }

    const select = document.getElementById("engine-type-select");
    if (select && select.value !== category.key) {
      select.value = category.key;
    }
    const detail = document.getElementById("engine-recording-detail");
    if (!detail) return;

    detail.classList.add("is-fading");
    setTimeout(() => {
      const recording = recordingFor(category);
      detail.innerHTML = recording ? availableDetail(category, recording) : "";
      if (recording) attachSelectedPlayer(recording);
      detail.classList.remove("is-fading");
    }, 120);
  }

  // Background preloader: quietly decode other audio specimens during browser idle time
  function preloadRemainingWaveforms() {
    const remaining = engineCategories.filter(cat => cat.file && !waveformCache.has(cat.file));
    if (remaining.length === 0) return;

    let idx = 0;
    function scheduleNext() {
      if (idx >= remaining.length) return;
      const cat = remaining[idx++];
      extractWaveformFromAudio(cat.file).finally(() => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(scheduleNext, { timeout: 2000 });
        } else {
          setTimeout(scheduleNext, 250);
        }
      });
    }

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(scheduleNext, { timeout: 2000 });
    } else {
      setTimeout(scheduleNext, 500);
    }
  }

  async function renderEngineRecordings() {
    const container = document.getElementById("sound-players-grid");
    if (!container) return;
    try {
      const response = await fetch("audio/engines/metadata.json");
      if (!response.ok) throw new Error(`Metadata request failed: ${response.status}`);
      const recordings = await response.json();
      recordingsByFilename = new Map(recordings.map(recording => [recording.filename, recording]));
      container.innerHTML = selectorHtml();

      const select = document.getElementById("engine-type-select");
      if (select) {
        select.addEventListener("change", (e) => {
          const category = engineCategories.find(item => item.key === e.target.value);
          if (category) selectCategory(category);
        });
      }

      const defaultCategory = engineCategories.find(category => category.key === "v8") || engineCategories[0];
      selectCategory(defaultCategory);

      // Start quiet background preloading of remaining waveforms
      preloadRemainingWaveforms();
    } catch (error) {
      container.innerHTML = '<p class="sound-card-character">Engine recording metadata could not be loaded.</p>';
      console.error("Unable to render engine recordings:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderEngineRecordings);
  } else {
    renderEngineRecordings();
  }
})();
