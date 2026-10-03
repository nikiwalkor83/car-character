/* Dropdown engine-category selector & real-time audio-reactive 24-band frequency spectrum instrument for the Sound section.
   Real-time Web Audio API frequency analysis drives vertical LED segments with mechanical inertia. */
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
  let audioContextInstance = null;
  let analyserNode = null;
  let freqArray = null;
  let timeArray = null;


  function getBandBinRanges(sampleRate = 44100, fftSize = 512, numColumns = 24) {
    const binCount = fftSize / 2;
    const binHz = sampleRate / fftSize;
    const minF = 40;
    const maxF = Math.min(12000, sampleRate / 2);
    const ranges = [];
    for (let c = 0; c < numColumns; c++) {
      const f0 = minF * Math.pow(maxF / minF, c / numColumns);
      const f1 = minF * Math.pow(maxF / minF, (c + 1) / numColumns);
      const b0 = Math.max(0, Math.floor(f0 / binHz));
      const b1 = Math.min(binCount - 1, Math.max(b0, Math.round(f1 / binHz)));
      ranges.push([b0, b1]);
    }
    return ranges;
  }

  const waveformCache = new Map();

  // Reference recorded peak amplitudes (master headroom baseline)
  const recordingPeaks = new Map([
    ["2-cylinder.ogg", 0.95],
    ["3-cylinder.ogg", 0.96],
    ["4-cylinder.wav", 0.958],
    ["5-cylinder.ogg", 0.94],
    ["inline-6.ogg", 0.92],
    ["flat-6.wav", 1.00],
    ["v6.ogg", 0.95],
    ["v8.ogg", 0.96],
    ["v10.ogg", 0.98],
    ["v12.ogg", 0.96],
    ["w16.ogg", 0.97],
    ["diesel.ogg", 0.95],
    ["hybrid.ogg", 0.93],
    ["electric-imiev.ogg", 0.91]
  ]);

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
      analyserNode.fftSize = 512;
      analyserNode.smoothingTimeConstant = 0.50;
      analyserNode.minDecibels = -90;
      analyserNode.maxDecibels = -12;
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

  function selectorHtml() {
    return `
      <audio id="selected-engine-audio" preload="metadata" style="display: none;"></audio>
      <div class="sound-two-column-layout" id="engine-recording-detail">
        <div class="sound-column-left">
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
          <div class="sound-specimen-left" id="sound-specimen-left" aria-live="polite"></div>
        </div>
        <div class="sound-column-right" id="sound-column-right"></div>
      </div>
      <div class="sound-specimen-source-row" id="sound-specimen-source"></div>
    `;
  }

  function leftInfoHtml(category, recording) {
    const extension = recording.filename.split(".").pop().toUpperCase();
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

      <div class="sound-controls-row">
        <button class="sound-play-btn" id="selected-engine-button" type="button" aria-label="Play ${escapeHtml(category.label)} recording">
          <span class="btn-play-icon">&#9654;</span><span class="btn-label-text">LISTEN</span>
        </button>
        <span class="sound-time-readout" id="selected-engine-time">0:00 / --:--</span>
        <span class="sound-status-dot"><span class="status-indicator-circle"></span><span class="status-label" id="selected-engine-status">READY</span></span>
        <span class="sound-format-badge">${extension}</span>
      </div>
    `;
  }

  function rightWaveformHtml(category, recording) {
    return `
      <div class="sound-waveform-container sound-rev-container">
        <div class="sound-waveform-header">
          <div class="sound-waveform-header-left">
            <span class="sound-waveform-indicator-dot sound-rev-dot" id="selected-rev-dot"></span>
            <span class="sound-waveform-label" id="selected-rpm-type-label">AUDIO VISUALIZER</span>
          </div>
          <div class="sound-waveform-header-right">
            <span class="sound-waveform-duration" id="selected-waveform-duration">--:--</span>
            <span class="sound-waveform-seek-preview" id="selected-waveform-seek" style="display: none;">SEEK 0:00</span>
          </div>
        </div>
        <div class="sound-waveform-canvas-wrap sound-rev-canvas-wrap" id="selected-engine-track" role="region" aria-label="Audio visualizer. Click or drag to seek." title="Click or drag to seek playback">
          <canvas id="selected-waveform-canvas" class="sound-waveform-canvas"></canvas>
          <div class="sound-waveform-loading" id="selected-waveform-loading" style="display: none;">
            <span class="sound-waveform-loading-text">LOADING AUDIO...</span>
          </div>
        </div>
      </div>
    `;
  }

  function sourceHtml(recording) {
    const attributionHtml = recording.attribution
      ? ` &bull; Attribution: ${escapeHtml(recording.attribution)}`
      : "";
    return `
      <p class="sound-card-source">
        <a href="${escapeHtml(recording.source_page_url)}" target="_blank" rel="noopener">Source: ${escapeHtml(recording.source)}</a> &bull; ${escapeHtml(recording.license)}${attributionHtml}
      </p>
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
    const smoothedBands = new Float32Array(numColumns);
    const rawBands = new Float32Array(numColumns);
    let currentHoverRatio = null;
    let isScrubbing = false;
    let runningObservedAmp = 0.05;

    // Asynchronously measure precise decoded audio buffer peak if Web Audio decoding is available
    async function updateAccurateRecordingPeak() {
      const fn = recording.filename;
      if (!fn) return;
      const ctx = getAudioContext();
      if (!ctx || !window.fetch) return;
      try {
        const res = await fetch(`audio/engines/${fn}`);
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(buf);
        const data = audioBuf.getChannelData(0);
        let peak = 0.05;
        const step = Math.max(1, Math.floor(data.length / 30000));
        for (let i = 0; i < data.length; i += step) {
          const v = Math.abs(data[i]);
          if (v > peak) peak = v;
        }
        if (peak > 0.01) {
          recordingPeaks.set(fn, peak);
        }
      } catch (e) {
        // Fallback map remains active
      }
    }
    updateAccurateRecordingPeak();

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
      const height = Math.max(10, Math.floor(rect.height || 230));
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
      const padLeft = isNarrow ? 12 : 16;
      const padRight = isNarrow ? 12 : 16;
      const padTop = 14;
      const padBottom = 20;

      const plotW = Math.max(10, width - padLeft - padRight);
      const plotH = Math.max(10, height - padTop - padBottom);

      // 2. Horizontal Reference Markings (Acoustic Dynamic Levels)
      const ticks = [
        {
          ratio: 0.88,
          color: "rgba(207, 56, 36, 0.45)",
          dash: [3, 3]
        },
        {
          ratio: 0.50,
          color: "rgba(212, 150, 50, 0.35)",
          dash: [2, 4]
        },
        {
          ratio: 0.16,
          color: "rgba(226, 218, 205, 0.15)",
          dash: [2, 4]
        }
      ];

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
      });

      // 3. 24 Dynamic Equalizer Columns
      const colGap = isNarrow ? 2 : 4;
      const totalGaps = (numColumns - 1) * colGap;
      const colWidth = Math.max(2, (plotW - totalGaps) / numColumns);
      const numSegments = 24;
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
            if (segRatio >= 0.85) {
              ctx.fillStyle = "#cf3824";
            } else if (segRatio >= 0.58) {
              ctx.fillStyle = "#d49632";
            } else {
              ctx.fillStyle = "#dfd7ca";
            }
            ctx.fillRect(colX, segY, Math.round(colWidth), Math.round(segHeight));

            // Top edge gloss highlight
            ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
            ctx.fillRect(colX, segY, Math.round(colWidth), 1);
          } else if (isPeak) {
            ctx.fillStyle = (segRatio >= 0.85)
              ? "#ff5a43"
              : (segRatio >= 0.58 ? "#f0b348" : "#ffffff");
            ctx.fillRect(colX, segY + Math.round(segHeight / 2) - 1, Math.round(colWidth), 2);
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
            ctx.fillRect(colX, segY, Math.round(colWidth), Math.round(segHeight));
          }
        }
      }

      // 4. Bottom Playback Runner
      const runnerY = height - 10;
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

        let currentRawAmp = 0;
        let meanEnergy = 0;
        let dominantCol = 0;
        let dominantColEnergy = 0;

        if (analyserNode) {
          // 1. Time-domain waveform amplitude: measure physical acoustic signal
          if (timeArray) {
            analyserNode.getByteTimeDomainData(timeArray);
            let peakSample = 0;
            let sumSq = 0;
            for (let i = 0; i < timeArray.length; i++) {
              const s = Math.abs(timeArray[i] - 128) / 128;
              if (s > peakSample) peakSample = s;
              sumSq += s * s;
            }
            const rmsSample = Math.sqrt(sumSq / timeArray.length);
            // Blend peak transients (70%) and RMS acoustic body (30%)
            currentRawAmp = peakSample * 0.70 + rmsSample * 0.30;
          }

          // 2. Frequency spectrum analysis across 24 logarithmic bands
          if (freqArray) {
            analyserNode.getByteFrequencyData(freqArray);
            const sampleRate = (audioContextInstance && audioContextInstance.sampleRate) ? audioContextInstance.sampleRate : 44100;
            const bandRanges = getBandBinRanges(sampleRate, analyserNode.fftSize, numColumns);

            for (let c = 0; c < numColumns; c++) {
              const [startBin, endBin] = bandRanges[c];
              let sum = 0;
              let count = 0;
              for (let b = startBin; b <= endBin && b < freqArray.length; b++) {
                sum += freqArray[b];
                count++;
              }
              const avg = count > 0 ? (sum / count) / 255 : 0;
              // Gentle high-frequency compensation tilt for mechanical/induction harmonics
              const tilt = 1.0 + Math.pow(c / (numColumns - 1), 1.25) * 1.8;
              rawBands[c] = avg * tilt;
            }

            // Spatial acoustic smoothing across neighboring bands
            for (let c = 0; c < numColumns; c++) {
              const prev = c > 0 ? rawBands[c - 1] : rawBands[c];
              const next = c < numColumns - 1 ? rawBands[c + 1] : rawBands[c];
              smoothedBands[c] = 0.18 * prev + 0.64 * rawBands[c] + 0.18 * next;
              meanEnergy += smoothedBands[c];
              if (smoothedBands[c] > dominantColEnergy) {
                dominantColEnergy = smoothedBands[c];
                dominantCol = c;
              }
            }
            meanEnergy /= numColumns;
          }
        }

        // Track live maximum observed amplitude so no legitimate peaks ever clip
        if (currentRawAmp > runningObservedAmp) {
          runningObservedAmp = currentRawAmp;
        }
        const recordingMax = recordingPeaks.get(recording.filename) || 0.95;
        const effectiveMax = Math.max(recordingMax, runningObservedAmp);

        // Amplitude normalized to actual maximum in the recording:
        const normalizedAmp = effectiveMax > 0 ? Math.min(1.0, currentRawAmp / effectiveMax) : 0;

        // Nonlinear amplitude scaling (dynamic range expansion):
        // Small idle/ambient variations occupy very little vertical space,
        // rising engine RPM builds progressively, and the actual peak reaches near the top.
        const scaledEnvelope = Math.pow(normalizedAmp, 1.65);

        const now = performance.now();

        // Modulate 24 frequency bands with the scaled amplitude envelope
        for (let c = 0; c < numColumns; c++) {
          const spectralFactor = meanEnergy > 0.001
            ? (smoothedBands[c] / meanEnergy)
            : 1.0;
          const colWeight = 0.60 + 0.40 * Math.max(0.25, Math.min(2.0, spectralFactor));
          const colTarget = Math.max(0, Math.min(1.0, scaledEnvelope * colWeight));

          // Physical mechanical inertia for heavy needle tracking
          const smooth = colTarget > currentLevels[c] ? 0.28 : 0.12;
          currentLevels[c] += (colTarget - currentLevels[c]) * smooth;

          if (currentLevels[c] > peakLevels[c]) {
            peakLevels[c] = currentLevels[c];
            peakHoldTimes[c] = now + 380;
          } else if (now > peakHoldTimes[c]) {
            peakLevels[c] = Math.max(0, peakLevels[c] - 0.008);
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
      rawBands.fill(0);
      runningObservedAmp = 0.05;
      if (dot) {
        dot.classList.remove("is-active");
      }
      draw(true, null);
    }

    function smoothReturnToRest() {
      stopPlaybackLoop();
      button.innerHTML = '<span class="btn-play-icon">&#9654;</span><span class="btn-label-text">LISTEN</span>';
      status.textContent = "READY";
      if (dot) dot.classList.remove("is-active");

      let framesLeft = 24;
      function decayStep() {
        let active = false;
        for (let c = 0; c < numColumns; c++) {
          currentLevels[c] *= 0.80;
          peakLevels[c] *= 0.82;
          if (currentLevels[c] > 0.005 || peakLevels[c] > 0.005) {
            active = true;
          }
        }
        draw(false, null);
        framesLeft--;
        if (active && framesLeft > 0) {
          activeRafId = requestAnimationFrame(decayStep);
        } else {
          resetVisualizer();
          activeRafId = null;
        }
      }
      activeRafId = requestAnimationFrame(decayStep);
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
        }).catch(err => {
          console.warn("Audio playback error:", err);
          status.textContent = "READY";
        });
      } else {
        audio.pause();
        stopPlaybackLoop();
        button.innerHTML = '<span class="btn-play-icon">&#9654;</span><span class="btn-label-text">RESUME</span>';
        status.textContent = "PAUSED";
        if (dot) dot.classList.remove("is-active");
      }
    });

    audio.addEventListener("ended", () => {
      audio.currentTime = 0;
      const dur = (Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : currentDuration;
      if (dur > 0 && time) {
        time.textContent = `0:00 / ${formatTime(dur)}`;
      }
      smoothReturnToRest();
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
      }
      draw(false, ratio);
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
      }
      draw(false, ratio);
    });

    function endScrub(e) {
      if (isScrubbing) {
        isScrubbing = false;
        try { if (e && e.pointerId) track.releasePointerCapture(e.pointerId); } catch (_) {}
        currentHoverRatio = null;
        if (seekPreview) seekPreview.style.display = "none";
        draw(false, null);
      }
    }
    track.addEventListener("pointerup", endScrub);
    track.addEventListener("pointercancel", endScrub);

    track.addEventListener("pointerleave", () => {
      if (!isScrubbing) {
        currentHoverRatio = null;
        if (seekPreview) seekPreview.style.display = "none";
        draw(false, null);
      }
    });

    const ResizeObserverClass = window.ResizeObserver || null;
    if (ResizeObserverClass) {
      activeResizeObserver = new ResizeObserverClass(() => {
        draw(false, currentHoverRatio);
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
    const leftEl = document.getElementById("sound-specimen-left");
    const rightEl = document.getElementById("sound-column-right");
    const sourceEl = document.getElementById("sound-specimen-source");
    if (!leftEl || !rightEl) return;

    leftEl.classList.add("is-fading");
    rightEl.classList.add("is-fading");
    if (sourceEl) sourceEl.classList.add("is-fading");

    setTimeout(() => {
      const recording = recordingFor(category);
      leftEl.innerHTML = recording ? leftInfoHtml(category, recording) : "";
      rightEl.innerHTML = recording ? rightWaveformHtml(category, recording) : "";
      if (sourceEl) {
        sourceEl.innerHTML = recording ? sourceHtml(recording) : "";
      }
      if (recording) attachSelectedPlayer(recording, category);
      leftEl.classList.remove("is-fading");
      rightEl.classList.remove("is-fading");
      if (sourceEl) sourceEl.classList.remove("is-fading");
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
