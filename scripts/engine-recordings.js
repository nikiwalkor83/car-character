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
        <div class="sound-waveform-container">
          <div class="sound-waveform-header">
            <div class="sound-waveform-header-left">
              <span class="sound-waveform-indicator-dot"></span>
              <span class="sound-waveform-label">ACOUSTIC PROFILE // AMPLITUDE OVER TIME</span>
            </div>
            <div class="sound-waveform-header-right">
              <span class="sound-waveform-duration" id="selected-waveform-duration">--:--</span>
              <span class="sound-waveform-seek-preview" id="selected-waveform-seek" style="display: none;">SEEK 0:00</span>
            </div>
          </div>
          <div class="sound-waveform-canvas-wrap" id="selected-engine-track" role="region" aria-label="Interactive audio waveform. Click or drag to seek." title="Click or drag to seek playback">
            <canvas id="selected-waveform-canvas" class="sound-waveform-canvas"></canvas>
            <div class="sound-waveform-loading" id="selected-waveform-loading" style="display: none;">
              <span class="sound-waveform-loading-text">MEASURING ACOUSTIC SIGNAL...</span>
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

    let currentPeaks = null;
    let currentDuration = 0;
    let currentProgress = 0;
    let currentHoverRatio = null;
    let isScrubbing = false;

    function draw(progress = currentProgress, hoverRatio = currentHoverRatio) {
      if (!canvas || !track) return;
      const rect = track.getBoundingClientRect();
      const width = Math.max(10, Math.floor(rect.width));
      const height = Math.max(10, Math.floor(rect.height || 80));
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

      const yCenter = Math.round(height / 2);

      // Reference guide lines (+50% / -50% amplitude)
      ctx.strokeStyle = "rgba(28, 61, 46, 0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(0, Math.round(height * 0.2));
      ctx.lineTo(width, Math.round(height * 0.2));
      ctx.moveTo(0, Math.round(height * 0.8));
      ctx.lineTo(width, Math.round(height * 0.8));
      ctx.stroke();
      ctx.setLineDash([]);

      // Centerline zero-crossing baseline
      ctx.strokeStyle = "rgba(28, 61, 46, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, yCenter);
      ctx.lineTo(width, yCenter);
      ctx.stroke();

      // Time ticks along bottom baseline
      const dur = currentDuration > 0
        ? currentDuration
        : (audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 10);

      if (dur > 0) {
        const step = dur <= 12 ? 2 : (dur <= 25 ? 5 : 10);
        ctx.fillStyle = "rgba(71, 85, 105, 0.55)";
        ctx.font = "9px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        for (let t = step; t < dur; t += step) {
          const tx = Math.round((t / dur) * width);
          ctx.strokeStyle = "rgba(28, 61, 46, 0.12)";
          ctx.beginPath();
          ctx.moveTo(tx, height - 5);
          ctx.lineTo(tx, height);
          ctx.stroke();
          ctx.fillText(`${t}s`, tx, height - 6);
        }
      }

      // Amplitude bars
      if (currentPeaks && currentPeaks.length > 0) {
        const barW = 2.0;
        const gap = 1.5;
        const barStep = barW + gap;
        const totalBars = Math.floor((width - 4) / barStep);
        const maxBarH = height * 0.38;

        for (let i = 0; i < totalBars; i++) {
          const bx = 2 + i * barStep;
          const sampleIdx = Math.floor((i / totalBars) * currentPeaks.length);
          const amp = currentPeaks[sampleIdx] || 0.04;
          const halfH = Math.max(2, Math.round(amp * maxBarH));
          const isPlayed = (bx + barW / 2) / width <= progress;

          ctx.fillStyle = isPlayed ? "#1c3d2e" : "rgba(30, 41, 59, 0.28)";
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(bx, yCenter - halfH, barW, halfH * 2, 1);
            ctx.fill();
          } else {
            ctx.fillRect(bx, yCenter - halfH, barW, halfH * 2);
          }
        }
      }

      // Playhead needle
      if (progress > 0) {
        const needleX = Math.max(0, Math.min(width, Math.round(progress * width)));

        // Needle subtle wash
        ctx.fillStyle = "rgba(28, 61, 46, 0.12)";
        ctx.fillRect(needleX - 2, 0, 4, height);

        // Needle line
        ctx.strokeStyle = "#1c3d2e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(needleX, 0);
        ctx.lineTo(needleX, height);
        ctx.stroke();

        // Top pointer cap
        ctx.fillStyle = "#1c3d2e";
        ctx.beginPath();
        ctx.moveTo(needleX - 3, 0);
        ctx.lineTo(needleX + 3, 0);
        ctx.lineTo(needleX, 4);
        ctx.closePath();
        ctx.fill();

        // Bottom pointer cap
        ctx.beginPath();
        ctx.moveTo(needleX - 3, height);
        ctx.lineTo(needleX + 3, height);
        ctx.lineTo(needleX, height - 4);
        ctx.closePath();
        ctx.fill();
      }

      // Hover hairline (only appears when cursor is over waveform)
      if (hoverRatio !== null && hoverRatio >= 0 && hoverRatio <= 1) {
        const hX = Math.round(hoverRatio * width);
        ctx.strokeStyle = "rgba(28, 61, 46, 0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hX, 0);
        ctx.lineTo(hX, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    function startPlaybackLoop() {
      if (activeRafId) cancelAnimationFrame(activeRafId);

      function frame() {
        if (!audio || audio.paused || audio.ended) {
          activeRafId = null;
          return;
        }
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          currentProgress = audio.currentTime / audio.duration;
          draw(currentProgress, currentHoverRatio);
          time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        }
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

    audio.addEventListener("loadedmetadata", () => {
      currentDuration = audio.duration;
      if (durationBadge) durationBadge.textContent = formatTime(audio.duration);
      time.textContent = `0:00 / ${formatTime(audio.duration)}`;
      draw();
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
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          currentProgress = audio.currentTime / audio.duration;
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
      }, 1200);
    });

    function getRatioFromEvent(e) {
      const bounds = track.getBoundingClientRect();
      if (bounds.width <= 0) return 0;
      return Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));
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
      currentProgress = ratio;
      draw(currentProgress, ratio);
      time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(dur)}`;
    });

    track.addEventListener("pointermove", e => {
      const dur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;
      const ratio = getRatioFromEvent(e);
      currentHoverRatio = ratio;

      if (seekPreview && dur > 0) {
        seekPreview.textContent = `SEEK ${formatTime(ratio * dur)}`;
        seekPreview.style.display = "inline";
      }

      if (isScrubbing && dur > 0) {
        audio.currentTime = ratio * dur;
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

    // Load / retrieve waveform for current recording
    const targetFile = recording.filename;
    activeRecordingFile = targetFile;

    if (waveformCache.has(targetFile)) {
      const cached = waveformCache.get(targetFile);
      currentPeaks = cached.peaks;
      currentDuration = cached.duration;
      if (durationBadge) durationBadge.textContent = formatTime(currentDuration);
      draw(0, null);
    } else {
      if (loading) loading.style.display = "flex";
      extractWaveformFromAudio(targetFile).then(data => {
        if (activeRecordingFile === targetFile) {
          if (loading) loading.style.display = "none";
          currentPeaks = data.peaks;
          currentDuration = data.duration;
          if (durationBadge) durationBadge.textContent = formatTime(currentDuration);
          draw(0, null);
        }
      }).catch(() => {
        if (loading) loading.style.display = "none";
      });
    }
  }

  function selectCategory(category) {
    if (activeAudio && !activeAudio.paused) {
      activeAudio.pause();
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
