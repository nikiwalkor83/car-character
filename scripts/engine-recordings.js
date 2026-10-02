/* Dropdown engine-category selector & real interactive audio waveform for the Sound section.
   RPM is the primary scale of vertical movement; real audio provides subtle acoustic texture. */
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

  /* Documented engine specifications & representative RPM profiles */
  const rpmDataByCategory = {
    "2-cylinder": {
      label: "2-Cylinder",
      vehicle: "Citroën 2CV6 Charleston (1987)",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 900,
      peakPowerRpm: 5750,
      maxRpm: 6000,
      redlineStartRpm: 5750,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 900], [5.0, 920], [12.0, 1900], [18.0, 3100], [24.0, 2400],
        [32.0, 950], [40.0, 2200], [48.0, 3500], [56.0, 2600], [64.0, 950], [69.6, 900]
      ]
    },
    "3-cylinder": {
      label: "3-Cylinder",
      vehicle: "Citroën C1 (1st Gen, 2005–2014)",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 800,
      peakPowerRpm: 6000,
      maxRpm: 6500,
      redlineStartRpm: 6000,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 0], [2.5, 0], [3.2, 1400], [4.5, 820], [6.0, 800],
        [7.5, 1200], [9.5, 2600], [11.5, 3600], [12.2, 2200], [14.0, 3400],
        [15.5, 4100], [16.9, 2800]
      ]
    },
    "4-cylinder": {
      label: "4-Cylinder",
      vehicle: "Lada 1500 Combi (VAZ-21023, 1981)",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 850,
      peakPowerRpm: 5600,
      maxRpm: 6000,
      redlineStartRpm: 5600,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 0], [9.0, 0], [10.5, 250], [12.5, 400], [14.0, 1600],
        [16.0, 880], [20.0, 850], [25.5, 850], [27.0, 1400], [30.0, 2400],
        [34.0, 3500], [35.5, 2100], [38.5, 3200], [41.0, 3700], [42.9, 2600]
      ]
    },
    "5-cylinder": {
      label: "5-Cylinder",
      vehicle: "Volvo 850 T5",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 850,
      peakPowerRpm: 5200,
      maxRpm: 6000,
      redlineStartRpm: 5600,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 850], [3.0, 850], [6.0, 2200], [9.0, 3800], [12.0, 4800],
        [15.0, 1600], [18.0, 850], [21.0, 2800], [24.0, 4900], [27.0, 3200],
        [30.0, 1200], [32.6, 850]
      ]
    },
    "inline-6": {
      label: "Inline-6",
      vehicle: "1965 Chrysler Valiant (225 Slant-6)",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 600,
      peakPowerRpm: 4000,
      maxRpm: 4500,
      redlineStartRpm: 4000,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 0], [0.8, 200], [1.6, 1450], [3.2, 1300], [5.0, 950],
        [6.8, 650], [7.6, 600], [8.2, 0], [9.0, 0]
      ]
    },
    "flat-6": {
      label: "Flat-6",
      vehicle: "Porsche Cayman S (2006)",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 700,
      peakPowerRpm: 6250,
      maxRpm: 7300,
      redlineStartRpm: 7000,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 750], [2.0, 800], [3.5, 2200], [6.0, 4200], [9.0, 6200],
        [11.5, 6900], [12.5, 4100], [15.0, 5200], [18.0, 6500], [21.0, 7050],
        [22.5, 4400], [26.0, 3900], [30.0, 3600], [33.1, 3500]
      ]
    },
    "v6": {
      label: "V6",
      vehicle: "Lotus Evora (2009)",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 680,
      peakPowerRpm: 6400,
      maxRpm: 7000,
      redlineStartRpm: 6600,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 2400], [1.8, 3200], [2.8, 5200], [4.5, 6600], [5.2, 4600],
        [6.5, 6200], [7.8, 6700], [8.8, 5800]
      ]
    },
    "v8": {
      label: "V8",
      vehicle: "Ferrari F60 Formula One (2009)",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 4500,
      peakPowerRpm: 18000,
      maxRpm: 18000,
      redlineStartRpm: 17000,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 7800], [1.5, 8600], [2.8, 9200], [4.0, 14200], [5.5, 17400],
        [6.5, 17800], [7.2, 13800], [9.0, 16800], [11.0, 17700], [12.2, 14200],
        [14.5, 16500], [17.0, 17400], [19.5, 15500]
      ]
    },
    "v10": {
      label: "V10",
      vehicle: "Lamborghini Gallardo LP570-4 Superleggera (2010)",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 900,
      peakPowerRpm: 8000,
      maxRpm: 8500,
      redlineStartRpm: 8000,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 2200], [1.2, 3600], [2.4, 4200], [3.6, 6800], [5.2, 8250],
        [5.8, 5600], [7.2, 7800], [8.5, 8300], [9.5, 7400]
      ]
    },
    "v12": {
      label: "V12",
      vehicle: "Pagani Zonda Roadster F",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 650,
      peakPowerRpm: 6200,
      maxRpm: 7000,
      redlineStartRpm: 6500,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 1800], [1.8, 2800], [3.2, 4400], [5.0, 6200], [6.6, 6700],
        [7.4, 4600], [9.2, 5900], [11.0, 6650], [13.1, 5800]
      ]
    },
    "w16": {
      label: "W16",
      vehicle: "Bugatti Veyron 16.4 Grand Sport (2009)",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 700,
      peakPowerRpm: 6000,
      maxRpm: 6000,
      redlineStartRpm: 5800,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 1600], [1.5, 2400], [2.8, 3800], [4.5, 5400], [5.8, 5900],
        [6.4, 4200], [7.8, 5500], [9.2, 5700]
      ]
    },
    "diesel": {
      label: "Diesel",
      vehicle: "BMW M57 3.0L Turbodiesel",
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 700,
      peakPowerRpm: 4000,
      maxRpm: 4500,
      redlineStartRpm: 4200,
      isMotor: false,
      isHybrid: false,
      methodologyLabel: "Representative rev animation based on documented engine specifications",
      timeline: [
        [0.0, 700], [3.0, 720], [5.5, 1400], [8.0, 2600], [10.5, 3400],
        [12.5, 2200], [15.0, 1100], [17.5, 750], [19.6, 700]
      ]
    },
    "hybrid": {
      label: "Hybrid",
      vehicle: "Toyota Prius C (2015)",
      scaleType: "HYBRID SYSTEM RPM",
      rpmUnit: "ICE RPM",
      idleRpm: 0,
      peakPowerRpm: 4800,
      maxRpm: 5000,
      redlineStartRpm: 4800,
      isMotor: false,
      isHybrid: true,
      methodologyLabel: "Representative hybrid powertrain state based on documented specifications",
      timeline: [
        [0.0, 1800], [3.0, 1500], [6.0, 1200], [8.5, 600], [10.0, 0],
        [12.0, 0], [14.0, 0], [16.5, 0], [18.5, 800], [21.0, 1600],
        [24.0, 2400], [27.0, 2700], [30.4, 2100]
      ]
    },
    "electric": {
      label: "Electric",
      vehicle: "Mitsubishi i-MiEV (2010)",
      scaleType: "MOTOR RPM",
      rpmUnit: "MOTOR RPM",
      idleRpm: 0,
      peakPowerRpm: 6000,
      maxRpm: 9900,
      redlineStartRpm: 8500,
      isMotor: true,
      isHybrid: false,
      methodologyLabel: "Representative electric motor rotation speed based on documented specifications",
      timeline: [
        [0.0, 0], [1.5, 500], [3.5, 2100], [6.0, 4200], [8.5, 6400],
        [11.0, 8200], [13.0, 7800], [15.0, 6500], [17.6, 5200]
      ]
    }
  };

  let recordingsByFilename = new Map();
  let activeAudio = null;
  let activeRafId = null;
  let activeResizeObserver = null;
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

  const waveformCache = new Map();

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

  function recordingFor(category) {
    return category.file ? recordingsByFilename.get(category.file) : null;
  }

  /* Compute instantaneous RPM based on documented timeline keyframes */
  function getRpmState(categoryKey, currentTime, duration) {
    const spec = rpmDataByCategory[categoryKey];
    if (!spec) {
      return { rpm: 0, normalizedRatio: 0, label: "0 RPM", spec: null };
    }
    const timeline = spec.timeline;
    if (!timeline || timeline.length === 0) {
      const idleNorm = spec.idleRpm / spec.maxRpm;
      return {
        rpm: spec.idleRpm,
        normalizedRatio: idleNorm,
        label: `${spec.idleRpm.toLocaleString()} ${spec.rpmUnit}`,
        spec
      };
    }

    const maxT = duration > 0 ? duration : timeline[timeline.length - 1][0];
    const t = Math.max(0, Math.min(currentTime, maxT));
    let rpm = timeline[0][1];

    if (t <= timeline[0][0]) {
      rpm = timeline[0][1];
    } else if (t >= timeline[timeline.length - 1][0]) {
      rpm = timeline[timeline.length - 1][1];
    } else {
      for (let i = 0; i < timeline.length - 1; i++) {
        const t0 = timeline[i][0];
        const t1 = timeline[i + 1][0];
        if (t >= t0 && t <= t1) {
          const span = t1 - t0;
          const progress = span > 0 ? (t - t0) / span : 0;
          // Smooth cosine easing so RPM transition feels like a physical mechanical rotating mass
          const ease = 0.5 * (1 - Math.cos(progress * Math.PI));
          rpm = timeline[i][1] + (timeline[i + 1][1] - timeline[i][1]) * ease;
          break;
        }
      }
    }

    const roundedRpm = Math.round(rpm);
    let label = `${roundedRpm.toLocaleString()} ${spec.rpmUnit}`;

    if (spec.isHybrid && roundedRpm === 0 && t >= 9.5 && t <= 17.0) {
      label = "0 ICE RPM [AUTO-STOP]";
    } else if (spec.isMotor && roundedRpm === 0) {
      label = "0 MOTOR RPM [REST]";
    }

    const normalizedRatio = Math.max(0, Math.min(1.0, roundedRpm / spec.maxRpm));
    return {
      rpm: roundedRpm,
      normalizedRatio,
      label,
      spec
    };
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
    const spec = rpmDataByCategory[category.key] || {
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 800,
      peakPowerRpm: 5500,
      maxRpm: 6500,
      redlineStartRpm: 6000,
      methodologyLabel: "Representative rev animation based on documented engine specifications"
    };

    const maxBadgeText = spec.isMotor
      ? `MAX ${spec.maxRpm.toLocaleString()} MOTOR RPM`
      : (spec.isHybrid
          ? `ICE MAX ${spec.maxRpm.toLocaleString()} RPM`
          : `REDLINE ${spec.maxRpm.toLocaleString()} RPM`);

    const initialRpmText = spec.idleRpm > 0
      ? `${spec.idleRpm.toLocaleString()} ${spec.rpmUnit}`
      : `0 ${spec.rpmUnit}`;

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
              <span class="sound-waveform-label" id="selected-rpm-type-label">${escapeHtml(spec.scaleType)} &bull; REV PROFILE</span>
              <span class="sound-rpm-live" id="selected-rpm-live">${initialRpmText}</span>
            </div>
            <div class="sound-waveform-header-right">
              <span class="sound-rpm-max-badge" id="selected-rpm-max">${maxBadgeText}</span>
              <span class="sound-rev-intensity-badge is-idle" id="selected-rev-badge">RESTING</span>
              <span class="sound-waveform-duration" id="selected-waveform-duration">--:--</span>
              <span class="sound-waveform-seek-preview" id="selected-waveform-seek" style="display: none;">SEEK 0:00</span>
            </div>
          </div>
          <div class="sound-waveform-canvas-wrap sound-rev-canvas-wrap" id="selected-engine-track" role="region" aria-label="Dynamic engine rev visualizer. Click or drag to seek." title="Click or drag to seek playback">
            <canvas id="selected-waveform-canvas" class="sound-waveform-canvas"></canvas>
            <div class="sound-waveform-loading" id="selected-waveform-loading" style="display: none;">
              <span class="sound-waveform-loading-text">CALIBRATING RPM SENSORS...</span>
            </div>
          </div>

          <div class="sound-rpm-provenance" id="selected-rpm-provenance">
            <div class="sound-rpm-provenance-header">
              <span class="sound-rpm-prov-title">POWERTRAIN CALIBRATION</span>
              <span class="sound-rpm-prov-mode">REPRESENTATIVE PROFILE</span>
            </div>
            <span class="sound-rpm-prov-specs">Documented Range: Idle ${spec.idleRpm.toLocaleString()} ${spec.rpmUnit} &bull; Peak ${spec.peakPowerRpm.toLocaleString()} &bull; Max ${spec.maxRpm.toLocaleString()} ${spec.rpmUnit}</span>
            <p class="sound-rpm-prov-desc">
              Vertical bar height represents documented engine rotational speed (${spec.scaleType}) rather than microphone loudness. The actual recording modulates subtle acoustic harmonic texture without inflating apparent engine speed.
            </p>
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

  function attachSelectedPlayer(recording, category) {
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
    const liveRpmEl = document.getElementById("selected-rpm-live");

    if (!audio || !button || !time || !status || !track || !canvas) return;

    if (activeRafId) {
      cancelAnimationFrame(activeRafId);
      activeRafId = null;
    }
    if (activeResizeObserver) {
      activeResizeObserver.disconnect();
      activeResizeObserver = null;
    }

    const catKey = category.key;
    const spec = rpmDataByCategory[catKey] || {
      scaleType: "ENGINE RPM",
      rpmUnit: "RPM",
      idleRpm: 800,
      peakPowerRpm: 5500,
      maxRpm: 6500,
      redlineStartRpm: 6000,
      timeline: []
    };

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
    const smoothedBands = new Float32Array(numColumns);
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

      const isNarrow = width < 540;
      const padLeft = isNarrow ? 56 : 74;
      const padRight = isNarrow ? 12 : 18;
      const padTop = 14;
      const padBottom = 22; // space for bottom progress runner

      const plotW = Math.max(10, width - padLeft - padRight);
      const plotH = Math.max(10, height - padTop - padBottom);

      // 2. Horizontal Reference Markings calibrated to Documented Engine RPM
      const redlineRatio = Math.min(1.0, spec.redlineStartRpm / spec.maxRpm);
      const peakPowerRatio = Math.min(0.95, spec.peakPowerRpm / spec.maxRpm);
      const idleRatio = Math.max(0.06, Math.min(0.35, spec.idleRpm / spec.maxRpm));

      const ticks = [];

      // Redline / Max Mark
      ticks.push({
        ratio: redlineRatio,
        label: spec.isMotor
          ? `${spec.maxRpm.toLocaleString()} MAX`
          : `${spec.maxRpm.toLocaleString()} REDLINE`,
        color: "rgba(207, 56, 36, 0.55)",
        textColor: "rgba(235, 120, 105, 0.85)",
        dash: [3, 3]
      });

      // Peak Power Mark (if distinct from redline)
      if (Math.abs(peakPowerRatio - redlineRatio) > 0.08) {
        ticks.push({
          ratio: peakPowerRatio,
          label: `${spec.peakPowerRpm.toLocaleString()} PWR`,
          color: "rgba(212, 150, 50, 0.38)",
          textColor: "rgba(226, 185, 110, 0.75)",
          dash: [2, 4]
        });
      }

      // Mid-Scale Reference Mark (~50% of maximum rotational speed)
      const midRatio = 0.50;
      if (Math.abs(midRatio - redlineRatio) > 0.12 && Math.abs(midRatio - peakPowerRatio) > 0.10) {
        const midRpm = Math.round(spec.maxRpm * 0.50);
        ticks.push({
          ratio: midRatio,
          label: `${midRpm.toLocaleString()}`,
          color: "rgba(226, 218, 205, 0.16)",
          textColor: "rgba(226, 218, 205, 0.45)",
          dash: [2, 4]
        });
      }

      // Idle / Standstill Mark
      if (spec.idleRpm > 0) {
        ticks.push({
          ratio: idleRatio,
          label: `${spec.idleRpm.toLocaleString()} IDLE`,
          color: "rgba(226, 218, 205, 0.15)",
          textColor: "rgba(226, 218, 205, 0.50)",
          dash: [2, 4]
        });
      } else {
        ticks.push({
          ratio: 0.05,
          label: spec.isMotor ? "0 REST" : "0 STOP",
          color: "rgba(226, 218, 205, 0.12)",
          textColor: "rgba(226, 218, 205, 0.40)",
          dash: [2, 4]
        });
      }

      ticks.forEach(th => {
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
          const segRatio = s / (numSegments - 1);

          if (isLit) {
            if (segRatio >= redlineRatio || segRatio >= 0.85) {
              ctx.fillStyle = "#cf3824";
            } else if (segRatio >= (peakPowerRatio * 0.85) || segRatio >= 0.60) {
              ctx.fillStyle = "#d49632";
            } else {
              ctx.fillStyle = "#dfd7ca";
            }
            ctx.fillRect(colX, segY, Math.round(colWidth), Math.round(segHeight));

            // Top edge gloss highlight
            ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
            ctx.fillRect(colX, segY, Math.round(colWidth), 1);
          } else if (isPeak) {
            ctx.fillStyle = (segRatio >= redlineRatio || segRatio >= 0.85)
              ? "#ff5a43"
              : (segRatio >= 0.60 ? "#f0b348" : "#ffffff");
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

        const dur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;
        const rpmState = getRpmState(catKey, audio.currentTime, dur);
        const baseRatio = rpmState.normalizedRatio;

        // Process real audio frequency bands for subtle acoustic modulation
        if (analyserNode && freqArray && timeArray) {
          analyserNode.getByteFrequencyData(freqArray);

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
            const hfBoost = 1.0 + Math.pow(c / numColumns, 1.2) * 1.4;
            rawBands[c] = Math.min(1, avg * hfBoost);
          }

          for (let c = 0; c < numColumns; c++) {
            const prev = c > 0 ? rawBands[c - 1] : rawBands[c];
            const next = c < numColumns - 1 ? rawBands[c + 1] : rawBands[c];
            smoothedBands[c] = 0.22 * prev + 0.56 * rawBands[c] + 0.22 * next;
          }
        }

        const now = performance.now();

        // RPM is the primary driver of height; real audio adds fine physical texture (+/- 0.08)
        for (let c = 0; c < numColumns; c++) {
          const bandEnergy = smoothedBands[c] || 0.35;
          // Subtle acoustic fluctuation (+/- 0.08) so real sound pulses without distorting engine RPM
          const audioTexture = (bandEnergy - 0.35) * 0.16;
          // Gentle acoustic curvature across columns
          const arcWeight = 0.96 + 0.08 * Math.sin((c / (numColumns - 1)) * Math.PI);
          const colTarget = Math.max(0.04, Math.min(1.0, (baseRatio + audioTexture) * arcWeight));

          // Physical mechanical inertia for needle / segment tracking
          const smooth = colTarget > currentLevels[c] ? 0.32 : 0.15;
          currentLevels[c] += (colTarget - currentLevels[c]) * smooth;

          if (currentLevels[c] > peakLevels[c]) {
            peakLevels[c] = currentLevels[c];
            peakHoldTimes[c] = now + 250;
          } else if (now > peakHoldTimes[c]) {
            peakLevels[c] = Math.max(0, peakLevels[c] - 0.010);
          }
        }

        // Update live RPM counter readout
        if (liveRpmEl) {
          liveRpmEl.textContent = rpmState.label;
        }

        // Update status badge
        if (badge) {
          if (baseRatio >= 0.85) {
            badge.textContent = spec.isMotor ? "PEAK REV" : "REDLINE";
            badge.className = "sound-rev-intensity-badge is-redline";
          } else if (baseRatio >= 0.60) {
            badge.textContent = "POWER BAND";
            badge.className = "sound-rev-intensity-badge is-power";
          } else if (baseRatio >= 0.20) {
            badge.textContent = "CRUISING";
            badge.className = "sound-rev-intensity-badge is-cruising";
          } else if (rpmState.rpm > 0) {
            badge.textContent = "IDLE";
            badge.className = "sound-rev-intensity-badge is-idle";
          } else {
            badge.textContent = spec.isMotor ? "REST" : (spec.isHybrid ? "ENGINE OFF" : "STOPPED");
            badge.className = "sound-rev-intensity-badge";
          }
        }

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
      smoothedBands.fill(0);
      if (badge) {
        badge.textContent = "RESTING";
        badge.className = "sound-rev-intensity-badge is-idle";
      }
      if (dot) {
        dot.classList.remove("is-active");
      }
      if (liveRpmEl) {
        liveRpmEl.textContent = spec.idleRpm > 0
          ? `${spec.idleRpm.toLocaleString()} ${spec.rpmUnit}`
          : `0 ${spec.rpmUnit}`;
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
      const isNarrow = bounds.width < 540;
      const padLeft = isNarrow ? 56 : 74;
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
        const rpmState = getRpmState(catKey, audio.currentTime, dur);
        if (liveRpmEl) liveRpmEl.textContent = rpmState.label;
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
        const rpmState = getRpmState(catKey, audio.currentTime, dur);
        if (liveRpmEl) liveRpmEl.textContent = rpmState.label;
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
      if (recording) attachSelectedPlayer(recording, category);
      detail.classList.remove("is-fading");
    }, 120);
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
