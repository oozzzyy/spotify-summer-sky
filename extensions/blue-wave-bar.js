// Blue Wave Bar: the music bar as living water, always light blue.
// The surface is a sum of waves with different lengths, speeds and directions,
// so every point differs. Loudness bursts spread from the slider toward the start of the track.
// On pause the water calms down. Seeking works as usual.
(function blueWaveBar() {
  const RGB = "56, 189, 248";
  const HEIGHT = 32;
  const SURFACE = 15; // calm water level from the top of the canvas
  const DEPTH = 9; // how far the body of water goes below the surface
  const CREST_MAX = 8; // highest crest
  const FLOW_PX_PER_MS = 0.07; // speed of a burst along the bar
  const SAMPLE_MS = 30;
  const HISTORY = 512;

  if (!window.Spicetify || !Spicetify.Player || !document.body) {
    setTimeout(blueWaveBar, 300);
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .playback-bar .playback-progressbar { position: relative; overflow: visible !important; }
    .playback-bar .progress-bar,
    .playback-bar .x-progressBar-progressBarBg { overflow: visible !important; background: transparent !important; }
    .playback-bar .x-progressBar-progressFillColor { visibility: hidden !important; }
    .playback-bar .x-progressBar-fillColor,
    .playback-bar .x-progressBar-foreground,
    .playback-bar .progress-bar__slider,
    .playback-bar [data-testid="progress-bar-handle"],
    .playback-bar .x-progressBar-handle { opacity: 0 !important; }
    #blue-wave-bar {
      position: absolute; left: 0; top: 50%; width: 100%; height: ${HEIGHT}px;
      transform: translateY(-50%); pointer-events: none; z-index: 1;
    }`;
  document.head.appendChild(style);

  const canvas = document.createElement("canvas");
  canvas.id = "blue-wave-bar";
  const ctx = canvas.getContext("2d");

  let host = null;
  let last = performance.now();
  let time = 0; // runs only during playback, so the water does not jerk after a pause
  let energy = 0; // overall agitation: 0 on pause
  let shown = 0;
  let segments = null;
  let average = -12;
  let segmentIndex = 0;
  let loadedUri = null;

  const history = new Float32Array(HISTORY).fill(0.5);
  let head = 0;
  let sampleClock = 0;
  let smooth = 0.5;

  async function loadAnalysis() {
    const uri = Spicetify.Player.data?.item?.uri;
    if (uri === loadedUri) return;
    loadedUri = uri;
    segments = null;
    segmentIndex = 0;
    if (!uri || !Spicetify.getAudioData) return;
    try {
      const data = await Spicetify.getAudioData(uri);
      if (loadedUri === uri && data?.segments?.length) {
        segments = data.segments;
        average = segments.reduce((sum, s) => sum + (s.loudness_max ?? -60), 0) / segments.length;
      }
    } catch (_) {
      // Analysis is unavailable: bursts will be random, like ordinary ripples.
    }
  }

  // Loudness relative to the track average, otherwise a flat master would look uniform.
  function loudness() {
    if (!segments) {
      return 0.5 + 0.3 * Math.sin(time * 0.0043) * Math.sin(time * 0.0017 + 1);
    }
    const t = Spicetify.Player.getProgress() / 1000;
    if (segments[segmentIndex]?.start > t) segmentIndex = 0;
    while (segmentIndex < segments.length - 1 && segments[segmentIndex + 1].start <= t) segmentIndex++;
    const db = segments[segmentIndex].loudness_max ?? -60;
    return Math.min(1, Math.max(0, (db - average) / 10 + 0.5));
  }

  function pushHistory(dt) {
    sampleClock += dt;
    while (sampleClock >= SAMPLE_MS) {
      sampleClock -= SAMPLE_MS;
      smooth += (loudness() - smooth) * 0.35;
      head = (head + 1) % HISTORY;
      history[head] = smooth;
    }
  }

  // Burst height d pixels from the slider: what was playing d / speed ago.
  function swell(d) {
    const age = d / FLOW_PX_PER_MS / SAMPLE_MS;
    const i = Math.min(HISTORY - 2, Math.floor(age));
    const f = Math.min(1, age - i);
    const a = history[(head - i + HISTORY) % HISTORY];
    const b = history[(head - i - 1 + HISTORY) % HISTORY];
    return a + (b - a) * f;
  }

  // Surface offset at x. The periods are incommensurate, so the pattern does not repeat.
  function height(x, t, shift) {
    const calm =
      0.5 + 0.5 * Math.sin(x * 0.019 - t * 0.00037 + shift) * Math.sin(x * 0.0071 + t * 0.00023 + shift * 2);
    const wave =
      0.6 * Math.sin(x * 0.083 - t * 0.0027 + shift) +
      0.35 * Math.sin(x * 0.137 + t * 0.0019 + shift * 1.7) +
      0.12 * Math.sin(x * 0.241 - t * 0.0043 + shift * 0.6) +
      0.3 * Math.sin(x * 0.037 + t * 0.0011 + shift * 2.3);
    return wave * (0.3 + 0.7 * calm);
  }

  function progress(bar) {
    // Spotify's own variable: it also moves during dragging.
    const raw = bar && getComputedStyle(bar).getPropertyValue("--progress-bar-transform");
    const parsed = parseFloat(raw);
    if (Number.isFinite(parsed)) return parsed / 100;
    return Spicetify.Player.getProgressPercent() || 0;
  }

  function attach() {
    const wrapper = document.querySelector(".playback-bar .playback-progressbar");
    if (!wrapper) return false;
    if (host !== wrapper || !canvas.isConnected) {
      host = wrapper;
      wrapper.appendChild(canvas);
    }
    return true;
  }

  function surface(end, shift, scale) {
    const points = [];
    for (let x = 0; x <= end; x += 1) {
      // Near the start and the slider the water settles to its level, so there is no cliff.
      const edge = Math.min(1, x / 14, (end - x) / 14 + 0.1);
      const push = 0.3 + 1.1 * swell(end - x);
      const y = SURFACE - height(x, time, shift) * CREST_MAX * energy * push * edge * scale;
      points.push(Math.max(1.5, Math.min(HEIGHT - 1.5, y)));
    }
    return points;
  }

  function trace(points) {
    points.forEach((y, x) => (x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  }

  function fillBody(points, end, alphaTop) {
    const bottom = SURFACE + DEPTH;
    const gradient = ctx.createLinearGradient(0, SURFACE - 3, 0, bottom);
    gradient.addColorStop(0, `rgba(${RGB}, ${alphaTop})`);
    gradient.addColorStop(1, `rgba(${RGB}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    trace(points);
    ctx.lineTo(end, bottom);
    ctx.lineTo(0, bottom);
    ctx.closePath();
    ctx.fill();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(now - last, 100);
    last = now;
    if (!attach()) return;

    const width = host.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    if (!width) return;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(HEIGHT * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(HEIGHT * dpr);
    }

    const playing = Spicetify.Player.isPlaying();
    energy += ((playing ? 1 : 0) - energy) * Math.min(1, dt * (playing ? 0.004 : 0.002));
    if (playing) {
      time += dt;
      pushHistory(dt);
    } else if (energy < 0.002) {
      time += 0; // the water has already calmed down
    } else {
      time += dt * energy; // on pause the waves slow down instead of stopping at once
    }

    const real = progress(host.querySelector(".progress-bar"));
    shown = Math.abs(real - shown) > 0.01 ? real : shown + (real - shown) * Math.min(1, dt * 0.01);
    const end = Math.round(Math.max(0, Math.min(width, shown * width)));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, HEIGHT);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (end < width) {
      ctx.strokeStyle = `rgba(${RGB}, 0.25)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(end, SURFACE);
      ctx.lineTo(width, SURFACE);
      ctx.stroke();
    }

    if (end > 0) {
      // Back layer: a different phase and lower height add depth.
      fillBody(surface(end, 2.4, 0.8), end, 0.45);

      const front = surface(end, 0, 1);
      fillBody(front, end, 0.75);

      ctx.strokeStyle = `rgb(${RGB})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      trace(front);
      ctx.stroke();

      ctx.fillStyle = `rgb(${RGB})`;
      ctx.beginPath();
      ctx.roundRect(end - 2, SURFACE - 8, 4, 16, 2);
      ctx.fill();
    }
  }

  Spicetify.Player.addEventListener("songchange", loadAnalysis);
  loadAnalysis();
  requestAnimationFrame(frame);
})();
