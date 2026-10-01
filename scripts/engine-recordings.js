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

  const engineCalloutData = {
    "v8": {
      kicker: "DID YOU NOTICE?",
      title: "A cross-plane boom that shifted from mainstream to prestige.",
      body: "The cross-plane V8 accounts for 1,996 cataloged vehicles. Once representing 20% of the entire passenger fleet in the 1970s, its uneven burble gradually migrated into high-performance and luxury badges.",
      meta: "V8 &bull; 1,996 Models Cataloged (6.7%)"
    },
    "v10": {
      kicker: "DID YOU NOTICE?",
      title: "Some sounds were always rare.",
      body: "With only 80 cataloged models in the 29,880-vehicle archive, the ten-cylinder was never an everyday note—it existed almost exclusively as a high-revving exotic hallmark.",
      meta: "V10 &bull; 80 Models Cataloged (0.3%)"
    },
    "v12": {
      kicker: "DID YOU NOTICE?",
      title: "Some sounds were always rare.",
      body: "The twelve-cylinder accounts for just 235 models out of nearly 30,000 recorded. Its seamless overlapping power strokes were a luxury preserve that few motorists ever experienced first-hand.",
      meta: "V12 &bull; 235 Models Cataloged (0.8%)"
    },
    "w16": {
      kicker: "DID YOU NOTICE?",
      title: "Some sounds were always rare.",
      body: "Representing just 12 cataloged models in the entire database, the quad-turbocharged sixteen-cylinder represents the absolute acoustic fringe of production combustion engineering.",
      meta: "W16 &bull; 12 Models Cataloged (<0.1%)"
    },
    "flat-6": {
      kicker: "DID YOU NOTICE?",
      title: "Some sounds were always rare.",
      body: "Horizontally opposed sixes appear in just 346 cataloged models—an inherently balanced acoustic signature that remained almost solely tied to a single German sports car marque.",
      meta: "Flat-6 &bull; 346 Models Cataloged (1.2%)"
    },
    "2-cylinder": {
      kicker: "DID YOU NOTICE?",
      title: "Some sounds were always rare.",
      body: "With only 51 cataloged examples, two-cylinder engines belong almost entirely to early economy runabouts, producing an uneven, puttering cadence that all but vanished from production.",
      meta: "2-Cylinder &bull; 51 Models Cataloged (0.2%)"
    },
    "4-cylinder": {
      kicker: "DID YOU NOTICE?",
      title: "The undisputed workhorse of the century.",
      body: "The four-cylinder is the acoustic backdrop of modern motoring, accounting for 18,955 vehicles—nearly two-thirds of all cataloged passenger cars. Its even firing intervals became the default rhythm of global mobility.",
      meta: "Inline-4 &bull; 18,955 Models Cataloged (63.4%)"
    },
    "3-cylinder": {
      kicker: "DID YOU NOTICE?",
      title: "The thrum of cylinder downsizing.",
      body: "With 1,260 models—mostly recorded after 2010—the three-cylinder delivers a characteristic off-beat syncopated thrum that grew as turbocharging replaced natural displacement.",
      meta: "3-Cylinder &bull; 1,260 Models Cataloged (4.2%)"
    },
    "5-cylinder": {
      kicker: "DID YOU NOTICE?",
      title: "The distinctive warble of an odd cylinder count.",
      body: "Appearing in 684 models, the five-cylinder's 144-degree firing order creates a unique off-beat acoustic warble midway between the rasp of a four and the howl of a straight-six.",
      meta: "5-Cylinder &bull; 684 Models Cataloged (2.3%)"
    },
    "inline-6": {
      kicker: "DID YOU NOTICE?",
      title: "Inherent primary balance.",
      body: "With 2,504 cataloged models, the straight-six generates a harmonically smooth acoustic delivery due to its natural mechanical balance, before packaging constraints pushed manufacturers toward compact V6 layouts.",
      meta: "Inline-6 &bull; 2,504 Models Cataloged (8.4%)"
    },
    "v6": {
      kicker: "DID YOU NOTICE?",
      title: "The packaging compromise that conquered executive cars.",
      body: "Recording 2,596 models, the V6 offered six-cylinder output within the transverse engine bays of front-wheel-drive platforms, becoming the ubiquitous mid-displacement executive sound of the 1990s and 2000s.",
      meta: "V6 &bull; 2,596 Models Cataloged (8.7%)"
    },
    "diesel": {
      kicker: "DID YOU NOTICE?",
      title: "Compression ignition's heavy cadence.",
      body: "With 8,320 cataloged models, compression-ignition engines formed the second-largest powertrain family, identifiable by rapid high-pressure fuel injection rattle rather than spark ignition.",
      meta: "Diesel &bull; 8,320 Models Cataloged (27.8%)"
    },
    "hybrid": {
      kicker: "DID YOU NOTICE?",
      title: "Intermittent silence meets combustion load.",
      body: "Accounting for 1,319 models, hybrids introduced a novel acoustic pattern: silent low-speed electric gliding punctuated by sudden internal combustion engagement under acceleration.",
      meta: "Hybrid &bull; 1,319 Models Cataloged (4.4%)"
    },
    "electric": {
      kicker: "DID YOU NOTICE?",
      title: "Silence isn't empty—it shifts the frequency spectrum.",
      body: "Across 705 cataloged electric models, the absence of combustion pressure waves brings high-frequency inverter switching, motor stator harmonics, and tire roar to the auditory forefront.",
      meta: "Electric &bull; 705 Models Cataloged (2.4%)"
    }
  };

  function updateEngineCallout(category) {
    const item = engineCalloutData[category.key];
    if (!item) return;
    const callout = document.getElementById("sound-engine-callout");
    if (!callout) return;
    callout.innerHTML = `
      <div class="editorial-callout-kicker">${item.kicker}</div>
      <h4 class="editorial-callout-title">${item.title}</h4>
      <p class="editorial-callout-body">${item.body}</p>
      <div class="editorial-callout-meta">${item.meta}</div>
    `;
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
      <div class="editorial-viz-layout">
        <div class="editorial-viz-main">
          <div class="engine-recording-detail" id="engine-recording-detail" aria-live="polite"></div>
        </div>
        <aside class="editorial-callout-sidebar" aria-label="Editorial margin note">
          <div class="editorial-callout" id="sound-engine-callout">
            <!-- Populated dynamically via selectCategory -->
          </div>
        </aside>
      </div>
    `;
  }

  function availableDetail(category, recording) {
    const extension = recording.filename.split(".").pop().toUpperCase();
    const attributionHtml = recording.attribution
      ? ` &bull; Attribution: ${escapeHtml(recording.attribution)}`
      : "";
    const powertrainDesc = recording.engine_description || recording.engine_type;

    return `
      <audio id="selected-engine-audio" src="audio/engines/${escapeHtml(recording.filename)}" preload="metadata"></audio>
      <div class="sound-specimen-meta">
        <div class="sound-specimen-heading-row">
          <h4 class="sound-specimen-title">${escapeHtml(category.label)}</h4>
          <span class="sound-specimen-count">${category.count.toLocaleString()} cataloged models in dataset</span>
        </div>
        <div class="sound-specimen-vehicle">${escapeHtml(recording.vehicle)}</div>
        <div class="sound-specimen-engine-desc">${escapeHtml(powertrainDesc)}</div>
      </div>

      <div class="engine-detail-player">
        <div class="sound-waveform-container sound-tuner-container">
          <div class="sound-waveform-header">
            <div class="sound-waveform-header-left">
              <span class="sound-waveform-indicator-dot"></span>
              <span class="sound-waveform-label">ANALOG RADIO TUNER // FREQUENCY SCALE</span>
            </div>
            <div class="sound-waveform-header-right">
              <span class="sound-waveform-duration" id="selected-waveform-duration">--:--</span>
              <span class="sound-waveform-seek-preview" id="selected-waveform-seek" style="display: none;">TUNE 0:00</span>
            </div>
          </div>
          <div class="sound-waveform-canvas-wrap sound-tuner-canvas-wrap" id="selected-engine-track" role="region" aria-label="Analog car radio tuner scale. Click or drag to tune playback." title="Click or drag to tune playback">
            <canvas id="selected-waveform-canvas" class="sound-waveform-canvas"></canvas>
            <div class="sound-waveform-loading" id="selected-waveform-loading" style="display: none;">
              <span class="sound-waveform-loading-text">RECEIVER READY...</span>
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
    const loading = document.getElementById("selected-waveform-loading");
    const durationBadge = document.getElementById("selected-waveform-duration");
    const seekPreview = document.getElementById("selected-waveform-seek");

    if (!audio || !button || !time || !status || !track || !canvas) return;

    // Reset previous loop and observer
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

    let currentDuration = waveformCache.has(recording.filename)
      ? waveformCache.get(recording.filename).duration
      : 0;
    let currentProgress = 0;
    let currentHoverRatio = null;
    let isScrubbing = false;
    let playbackAnchorTime = 0;
    let playbackAnchorAudioTime = 0;
    let lastKnownAudioTime = -1;

    function draw(progress = currentProgress, hoverRatio = currentHoverRatio) {
      if (!canvas || !track) return;
      const rect = track.getBoundingClientRect();
      const width = Math.max(10, Math.floor(rect.width));
      const height = Math.max(10, Math.floor(rect.height || 82));
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

      // 1. Dial plate background: Deep vintage British racing charcoal
      ctx.fillStyle = "#141c17";
      ctx.fillRect(0, 0, width, height);

      // Subtle horizontal brushed / grooved texture lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.018)";
      ctx.lineWidth = 1;
      for (let gy = 4; gy < height; gy += 4) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // 2. Bezel rim inner shadow & glass reflection
      const topShadow = ctx.createLinearGradient(0, 0, 0, 7);
      topShadow.addColorStop(0, "rgba(0, 0, 0, 0.55)");
      topShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = topShadow;
      ctx.fillRect(0, 0, width, 7);

      const btmShadow = ctx.createLinearGradient(0, height - 6, 0, height);
      btmShadow.addColorStop(0, "rgba(0, 0, 0, 0)");
      btmShadow.addColorStop(1, "rgba(0, 0, 0, 0.45)");
      ctx.fillStyle = btmShadow;
      ctx.fillRect(0, height - 6, width, 6);

      // Specular glass sheen across upper portion
      const glassGrad = ctx.createLinearGradient(0, 0, 0, height * 0.48);
      glassGrad.addColorStop(0, "rgba(255, 255, 255, 0.05)");
      glassGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.02)");
      glassGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glassGrad;
      ctx.fillRect(0, 0, width, height * 0.48);

      // 3. Layout geometry
      const isNarrow = width < 520;
      const padLeft = isNarrow ? 38 : 50;
      const padRight = isNarrow ? 38 : 50;
      const scaleW = Math.max(10, width - padLeft - padRight);

      const yTopRail = 14;
      const yBtmRail = height - 14;
      const yCenter = Math.round(height / 2);

      // 4. Center mechanical slider slot
      ctx.fillStyle = "rgba(8, 12, 10, 0.85)";
      ctx.fillRect(padLeft - 10, yCenter - 4, scaleW + 20, 8);

      // Slot borders
      ctx.strokeStyle = "rgba(226, 218, 205, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft - 10, yCenter - 4);
      ctx.lineTo(padLeft + scaleW + 10, yCenter - 4);
      ctx.moveTo(padLeft - 10, yCenter + 4);
      ctx.lineTo(padLeft + scaleW + 10, yCenter + 4);
      ctx.stroke();

      // Centerline rule
      ctx.strokeStyle = "rgba(226, 218, 205, 0.08)";
      ctx.beginPath();
      ctx.moveTo(padLeft, yCenter);
      ctx.lineTo(padLeft + scaleW, yCenter);
      ctx.stroke();

      // Center vintage designation badge
      ctx.fillStyle = "rgba(226, 218, 205, 0.35)";
      ctx.font = `600 ${isNarrow ? "7px" : "8px"} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const badgeText = isNarrow ? "ANALOG TUNER" : "BRITISH MOTORING // SOLID STATE TUNER";
      ctx.fillText(badgeText, width / 2, yCenter);

      // 5. Guide rails
      ctx.strokeStyle = "rgba(226, 218, 205, 0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft - 8, yTopRail);
      ctx.lineTo(padLeft + scaleW + 8, yTopRail);
      ctx.moveTo(padLeft - 8, yBtmRail);
      ctx.lineTo(padLeft + scaleW + 8, yBtmRail);
      ctx.stroke();

      // 6. Band labels (MW and FM)
      ctx.fillStyle = "rgba(235, 228, 218, 0.82)";
      ctx.font = "bold 9px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("MW", padLeft - 10, yTopRail + 5);

      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(226, 218, 205, 0.45)";
      ctx.font = "8px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace";
      ctx.fillText("kHz", padLeft + scaleW + 8, yTopRail + 5);

      ctx.fillStyle = "rgba(235, 228, 218, 0.82)";
      ctx.font = "bold 9px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("FM", padLeft - 10, yBtmRail - 5);

      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(226, 218, 205, 0.45)";
      ctx.font = "8px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace";
      ctx.fillText("MHz", padLeft + scaleW + 8, yBtmRail - 5);

      // 7. Scale 1 (Top): MW Frequencies (54 to 160 kHz × 10)
      const mwFrequencies = isNarrow
        ? [54, 70, 90, 120, 160]
        : [54, 60, 70, 80, 100, 120, 140, 160];

      // Ticks across MW rail
      const mwTotalSteps = isNarrow ? 30 : 53;
      for (let s = 0; s <= mwTotalSteps; s++) {
        const sx = padLeft + (s / mwTotalSteps) * scaleW;
        const isMajor = s % (isNarrow ? 6 : 5) === 0;
        const isMid = s % 2 === 0;
        const tickH = isMajor ? 8 : (isMid ? 5 : 3);
        const alpha = isMajor ? 0.6 : (isMid ? 0.35 : 0.2);

        ctx.strokeStyle = `rgba(226, 218, 205, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(sx, yTopRail);
        ctx.lineTo(sx, yTopRail + tickH);
        ctx.stroke();
      }

      // MW Frequency labels
      ctx.fillStyle = "rgba(235, 228, 218, 0.85)";
      ctx.font = "9px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      mwFrequencies.forEach((freq, idx) => {
        const frac = idx / (mwFrequencies.length - 1);
        const fx = padLeft + frac * scaleW;
        ctx.fillText(freq.toString(), fx, yTopRail + 9);
      });

      // 8. Scale 2 (Bottom): FM Frequencies (88 to 108 MHz)
      const fmFrequencies = isNarrow
        ? [88, 94, 100, 108]
        : [88, 92, 96, 100, 104, 108];

      // Ticks across FM rail
      const fmTotalSteps = isNarrow ? 28 : 50;
      for (let s = 0; s <= fmTotalSteps; s++) {
        const sx = padLeft + (s / fmTotalSteps) * scaleW;
        const isMajor = s % (isNarrow ? 7 : 5) === 0;
        const isMid = s % 2 === 0;
        const tickH = isMajor ? 8 : (isMid ? 5 : 3);
        const alpha = isMajor ? 0.6 : (isMid ? 0.35 : 0.2);

        ctx.strokeStyle = `rgba(226, 218, 205, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(sx, yBtmRail);
        ctx.lineTo(sx, yBtmRail - tickH);
        ctx.stroke();
      }

      // FM Frequency labels
      ctx.fillStyle = "rgba(235, 228, 218, 0.85)";
      ctx.font = "9px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      fmFrequencies.forEach((freq, idx) => {
        const frac = idx / (fmFrequencies.length - 1);
        const fx = padLeft + frac * scaleW;
        ctx.fillText(freq.toString(), fx, yBtmRail - 9);
      });

      // 9. Hover guideline (when pointer hovers over scale)
      if (hoverRatio !== null && hoverRatio >= 0 && hoverRatio <= 1) {
        const hX = Math.round(padLeft + hoverRatio * scaleW);
        ctx.strokeStyle = "rgba(226, 218, 205, 0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(hX, 6);
        ctx.lineTo(hX, height - 6);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 10. The Analog Mechanical Tuning Needle
      const clampedProgress = Math.max(0, Math.min(1, progress || 0));
      const needleX = padLeft + clampedProgress * scaleW;

      // Needle drop shadow on the dial plate
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(Math.round(needleX + 2), 6, 2, height - 12);

      // Primary mechanical needle (classic vintage dial vermilion)
      ctx.fillStyle = "#cf3824";
      ctx.fillRect(Math.round(needleX - 1), 6, 2, height - 12);

      // Fine highlight hairline down needle center
      ctx.fillStyle = "rgba(255, 185, 170, 0.65)";
      ctx.fillRect(Math.round(needleX), 7, 1, height - 14);

      // Top mechanical carriage pointer tab
      ctx.fillStyle = "#cf3824";
      ctx.beginPath();
      ctx.moveTo(needleX - 4, 6);
      ctx.lineTo(needleX + 4, 6);
      ctx.lineTo(needleX, 13);
      ctx.closePath();
      ctx.fill();

      // Bottom mechanical carriage pointer tab
      ctx.beginPath();
      ctx.moveTo(needleX - 4, height - 6);
      ctx.lineTo(needleX + 4, height - 6);
      ctx.lineTo(needleX, height - 13);
      ctx.closePath();
      ctx.fill();

      // Center mechanical slide bead / carriage jewel
      ctx.fillStyle = "#8a1c10";
      ctx.beginPath();
      ctx.arc(needleX, yCenter, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff6a56";
      ctx.beginPath();
      ctx.arc(needleX, yCenter, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function startPlaybackLoop() {
      if (activeRafId) {
        if (typeof window !== "undefined" && window.cancelAnimationFrame) {
          window.cancelAnimationFrame(activeRafId);
        } else if (typeof cancelAnimationFrame !== "undefined") {
          cancelAnimationFrame(activeRafId);
        }
      }
      playbackAnchorTime = performance.now();
      playbackAnchorAudioTime = audio.currentTime;
      lastKnownAudioTime = audio.currentTime;

      function frame() {
        if (!audio || audio.paused || audio.ended) {
          activeRafId = null;
          return;
        }
        const now = performance.now();
        if (audio.currentTime !== lastKnownAudioTime) {
          lastKnownAudioTime = audio.currentTime;
          playbackAnchorTime = now;
          playbackAnchorAudioTime = audio.currentTime;
        }
        const elapsed = (now - playbackAnchorTime) / 1000;
        const dur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;

        if (dur > 0) {
          const estimatedCurrent = Math.min(dur, playbackAnchorAudioTime + elapsed * (audio.playbackRate || 1));
          currentProgress = Math.max(0, Math.min(1, estimatedCurrent / dur));
          draw(currentProgress, currentHoverRatio);
          time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(dur)}`;
        }
        if (typeof window !== "undefined" && window.requestAnimationFrame) {
          activeRafId = window.requestAnimationFrame(frame);
        } else if (typeof requestAnimationFrame !== "undefined") {
          activeRafId = requestAnimationFrame(frame);
        }
      }
      if (typeof window !== "undefined" && window.requestAnimationFrame) {
        activeRafId = window.requestAnimationFrame(frame);
      } else if (typeof requestAnimationFrame !== "undefined") {
        activeRafId = requestAnimationFrame(frame);
      }
    }

    function stopPlaybackLoop() {
      if (activeRafId) {
        if (typeof window !== "undefined" && window.cancelAnimationFrame) {
          window.cancelAnimationFrame(activeRafId);
        } else if (typeof cancelAnimationFrame !== "undefined") {
          cancelAnimationFrame(activeRafId);
        }
        activeRafId = null;
      }
    }

    audio.addEventListener("loadedmetadata", () => {
      currentDuration = audio.duration;
      waveformCache.set(recording.filename, { duration: audio.duration, peaks: [] });
      if (durationBadge) durationBadge.textContent = formatTime(audio.duration);
      time.textContent = `0:00 / ${formatTime(audio.duration)}`;
      draw(currentProgress, currentHoverRatio);
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
      if (audio.paused) {
        audio.play().then(() => {
          button.innerHTML = '<span class="btn-play-icon">&#10074;&#10074;</span><span class="btn-label-text">PAUSE</span>';
          status.textContent = "PLAYING";
          startPlaybackLoop();
        }).catch(() => {
          status.textContent = "ERROR";
        });
      } else {
        audio.pause();
        stopPlaybackLoop();
        button.innerHTML = '<span class="btn-play-icon">&#9654;</span><span class="btn-label-text">LISTEN</span>';
        status.textContent = "PAUSED";
        const dur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;
        if (dur > 0) {
          currentProgress = Math.max(0, Math.min(1, audio.currentTime / dur));
          draw(currentProgress, currentHoverRatio);
        }
      }
    });

    audio.addEventListener("ended", () => {
      stopPlaybackLoop();
      button.innerHTML = '<span class="btn-play-icon">&#9654;</span><span class="btn-label-text">LISTEN</span>';
      status.textContent = "READY";
      currentProgress = 1.0;
      draw(1.0, null);
      audio.currentTime = 0;
      time.textContent = `0:00 / ${formatTime(audio.duration)}`;
      setTimeout(() => {
        if (audio.paused) {
          currentProgress = 0;
          draw(0, null);
        }
      }, 900);
    });

    function getRatioFromEvent(e) {
      const bounds = track.getBoundingClientRect();
      if (bounds.width <= 0) return 0;
      const isNarrow = bounds.width < 520;
      const padLeft = isNarrow ? 38 : 50;
      const padRight = isNarrow ? 38 : 50;
      const scaleW = Math.max(1, bounds.width - padLeft - padRight);
      const clickX = e.clientX - bounds.left;
      const ratio = (clickX - padLeft) / scaleW;
      return Math.max(0, Math.min(1, ratio));
    }

    track.addEventListener("pointerdown", e => {
      const dur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;
      if (dur <= 0) return;
      isScrubbing = true;
      if (track.setPointerCapture) {
        try { track.setPointerCapture(e.pointerId); } catch (_) {}
      }
      const ratio = getRatioFromEvent(e);
      audio.currentTime = ratio * dur;
      playbackAnchorTime = performance.now();
      playbackAnchorAudioTime = audio.currentTime;
      lastKnownAudioTime = audio.currentTime;
      currentProgress = ratio;
      draw(currentProgress, ratio);
      time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(dur)}`;
    });

    track.addEventListener("pointermove", e => {
      const dur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;
      const ratio = getRatioFromEvent(e);
      currentHoverRatio = ratio;

      if (seekPreview && dur > 0) {
        seekPreview.textContent = `TUNE ${formatTime(ratio * dur)}`;
        seekPreview.style.display = "inline";
      }

      if (isScrubbing && dur > 0) {
        audio.currentTime = ratio * dur;
        playbackAnchorTime = performance.now();
        playbackAnchorAudioTime = audio.currentTime;
        lastKnownAudioTime = audio.currentTime;
        currentProgress = ratio;
        draw(currentProgress, ratio);
        time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(dur)}`;
      } else {
        draw(currentProgress, ratio);
      }
    });

    function endScrub() {
      isScrubbing = false;
    }
    track.addEventListener("pointerup", endScrub);
    track.addEventListener("pointercancel", endScrub);

    track.addEventListener("pointerleave", () => {
      currentHoverRatio = null;
      if (seekPreview) seekPreview.style.display = "none";
      if (!isScrubbing) {
        draw(currentProgress, null);
      }
    });

    const ResizeObserverClass = (typeof window !== "undefined" && window.ResizeObserver) || (typeof ResizeObserver !== "undefined" ? ResizeObserver : null);
    if (ResizeObserverClass) {
      activeResizeObserver = new ResizeObserverClass(() => {
        draw(currentProgress, currentHoverRatio);
      });
      activeResizeObserver.observe(track);
    }

    // Initial render of tuner scale and reset position
    activeRecordingFile = recording.filename;
    if (currentDuration > 0 && durationBadge) {
      durationBadge.textContent = formatTime(currentDuration);
    }
    draw(0, null);
  }

  function selectCategory(category) {
    if (activeAudio) {
      if (!activeAudio.paused) {
        activeAudio.pause();
      }
      activeAudio.currentTime = 0;
      activeAudio.removeAttribute("src");
      activeAudio.load();
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

    // Synchronize dynamic editorial margin callout
    updateEngineCallout(category);

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
