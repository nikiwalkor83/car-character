/* Dropdown engine-category selector for the Sound section. */
(function () {
  const engineCategories = [
    { key: "2-cylinder", label: "2-cylinder", count: 51, file: "2-cylinder.ogg" },
    { key: "3-cylinder", label: "3-cylinder", count: 1260, file: "3-cylinder.ogg" },
    { key: "4-cylinder", label: "4-cylinder", count: 18955, file: "4-cylinder.wav" },
    { key: "5-cylinder", label: "5-cylinder", count: 684, file: "5-cylinder.ogg" },
    { key: "flat-6", label: "Flat-6", count: 346, file: "flat-6.wav" },
    { key: "v6", label: "V6", count: 2596, file: "v6.ogg" },
    { key: "v8", label: "V8", count: 1996, file: "v8.ogg" },
    { key: "v10", label: "V10", count: 80, file: "v10.ogg" },
    { key: "v12", label: "V12", count: 235, file: "v12.ogg" },
    { key: "w16", label: "W16", count: 12, file: "w16.ogg" },
    { key: "diesel", label: "Diesel", count: 8320, file: "diesel.ogg" },
    { key: "hybrid", label: "Hybrid", count: 1319, file: "hybrid.ogg" },
    { key: "electric", label: "Electric motor", count: 705, file: "electric-motor.ogg" }
  ];

  const waveform = [0.3, 0.46, 0.35, 0.62, 0.42, 0.78, 0.52, 0.68, 0.38, 0.57, 0.74, 0.48, 0.64, 0.36, 0.58, 0.8, 0.45, 0.69, 0.4, 0.55, 0.72, 0.5, 0.63, 0.34];
  let recordingsByFilename = new Map();
  let activeAudio = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  function waveformHtml() {
    return waveform.map(height =>
      `<div class="waveform-bar" style="height: ${Math.round(height * 100)}%;"></div>`
    ).join("");
  }

  function recordingFor(category) {
    return category.file ? recordingsByFilename.get(category.file) : null;
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
        <div class="sound-waveform-track" id="selected-engine-track" title="Click waveform to seek">${waveformHtml()}</div>
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

  function attachSelectedPlayer() {
    const audio = document.getElementById("selected-engine-audio");
    const button = document.getElementById("selected-engine-button");
    const time = document.getElementById("selected-engine-time");
    const status = document.getElementById("selected-engine-status");
    const track = document.getElementById("selected-engine-track");
    if (!audio || !button || !time || !status || !track) return;

    activeAudio = audio;
    audio.autoplay = false;
    audio.loop = false;
    const bars = track.querySelectorAll(".waveform-bar");

    audio.addEventListener("loadedmetadata", () => {
      time.textContent = `0:00 / ${formatTime(audio.duration)}`;
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
        }).catch(() => {
          status.textContent = "ERROR";
        });
      } else {
        audio.pause();
        button.innerHTML = '<span class="btn-play-icon">&#9654;</span><span class="btn-label-text">LISTEN</span>';
        status.textContent = "PAUSED";
      }
    });
    audio.addEventListener("timeupdate", () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const progress = audio.currentTime / audio.duration;
      const activeIndex = Math.min(bars.length - 1, Math.floor(progress * bars.length));
      time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
      bars.forEach((bar, index) => {
        bar.classList.toggle("passed", index <= activeIndex);
        bar.classList.toggle("active-bar", index === activeIndex);
      });
    });
    audio.addEventListener("ended", () => {
      button.innerHTML = '<span class="btn-play-icon">&#9654;</span><span class="btn-label-text">LISTEN</span>';
      status.textContent = "READY";
      audio.currentTime = 0;
    });
    track.addEventListener("click", event => {
      if (!Number.isFinite(audio.duration)) return;
      const bounds = track.getBoundingClientRect();
      audio.currentTime = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)) * audio.duration;
      if (audio.paused) button.click();
    });
  }

  function selectCategory(category) {
    if (activeAudio && !activeAudio.paused) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }
    activeAudio = null;

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
      if (recording) attachSelectedPlayer();
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