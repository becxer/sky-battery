const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const loginOverlay = document.getElementById("loginOverlay");
const loginForm = document.getElementById("loginForm");
const nameInput = document.getElementById("nameInput");
const loginError = document.getElementById("loginError");
const angleInput = document.getElementById("angle");
const powerInput = document.getElementById("power");
const angleValue = document.getElementById("angleValue");
const powerValue = document.getElementById("powerValue");
const moveLeftButton = document.getElementById("moveLeftButton");
const moveRightButton = document.getElementById("moveRightButton");
const moveValue = document.getElementById("moveValue");
const fireButton = document.getElementById("fireButton");
const resetButton = document.getElementById("resetButton");

const W = canvas.width;
const H = canvas.height;
const TANK_SCALE = 0.5;
const STRIP_PLATFORM_EXTRA = 8;
const ISLAND_PLATFORM_EXTRA = 5;
const TANK_TYPE_META = {
  normal: { label: "N", name: "노말 탱크", color: "#5fb8ff", shell: "#1f252c", glow: "#ffcd6f" },
  multi: { label: "III", name: "멀티미사일", color: "#74d7ff", shell: "#1f252c", glow: "#ffcd6f" },
  red: { label: "R", name: "빨콩탱크", color: "#ff4848", shell: "#ff3030", glow: "#ff8674" },
  missile: { label: "M", name: "유도탄 탱크", color: "#39ff14", shell: "#39ff14", glow: "#baffee" },
  artillery: { label: "A", name: "자주포 탱크", color: "#f5d76e", shell: "#4b4f58", glow: "#ffe07a" },
  super: { label: "S", name: "슈퍼탱크", color: "#ffe23f", shell: "#39ff14", glow: "#fff1a8" },
};
const SUPER_MISSILE_COLORS = ["#ff3030", "#ff9f1a", "#ffe23f", "#39ff14", "#4aa3ff"];
const sprites = {
  tanks: [
    loadSprite("assets/tank-blue.svg"),
    loadSprite("assets/tank-orange.svg"),
    loadSprite("assets/tank-green.svg"),
  ],
  shell: loadSprite("assets/shell.svg"),
  sheet: loadSprite("assets/artillery-asset-sheet.png"),
};

const ASSET_SHEET_FRAMES = {
  blueRocket: { x: 842, y: 46, w: 252, h: 112 },
  redRocket: { x: 842, y: 160, w: 252, h: 112 },
};
const assetCanvasCache = new Map();

let clientId = localStorage.getItem("skyBatteryClientId");
if (!clientId) {
  clientId = makeClientId();
  localStorage.setItem("skyBatteryClientId", clientId);
}

let seat = null;
let latest = null;
let audio;
let eventSource = null;
let isAdjustingControls = false;
let cloudOffset = 0;
let lastRenderTime = performance.now();
let seenWorldVersion = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadSprite(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function spriteReady(sprite) {
  return sprite && sprite.complete && sprite.naturalWidth;
}

function keyedSheetFrame(name) {
  const frame = ASSET_SHEET_FRAMES[name];
  if (!frame || !spriteReady(sprites.sheet)) return null;
  const cacheKey = `sheet:${name}`;
  if (assetCanvasCache.has(cacheKey)) return assetCanvasCache.get(cacheKey);

  const buffer = document.createElement("canvas");
  buffer.width = frame.w;
  buffer.height = frame.h;
  const bufferCtx = buffer.getContext("2d");
  bufferCtx.drawImage(sprites.sheet, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);

  try {
    const imageData = bufferCtx.getImageData(0, 0, frame.w, frame.h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      if (red > 210 && green < 80 && blue > 200 && Math.abs(red - blue) < 90) {
        data[i + 3] = 0;
      }
    }
    bufferCtx.putImageData(imageData, 0, 0);
  } catch (error) {
    return null;
  }

  assetCanvasCache.set(cacheKey, buffer);
  return buffer;
}

function tintedAsset(source, sourceKey, tint, alpha) {
  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  if (!width || !height) return null;
  const cacheKey = `tint:${sourceKey}:${tint}:${alpha}:${width}x${height}`;
  if (assetCanvasCache.has(cacheKey)) return assetCanvasCache.get(cacheKey);

  const buffer = document.createElement("canvas");
  buffer.width = width;
  buffer.height = height;
  const bufferCtx = buffer.getContext("2d");
  bufferCtx.drawImage(source, 0, 0, width, height);
  bufferCtx.globalCompositeOperation = "source-atop";
  bufferCtx.globalAlpha = alpha;
  bufferCtx.fillStyle = tint;
  bufferCtx.fillRect(0, 0, width, height);
  bufferCtx.globalAlpha = 1;
  bufferCtx.globalCompositeOperation = "source-over";
  assetCanvasCache.set(cacheKey, buffer);
  return buffer;
}

function makeClientId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  const random = Math.random().toString(36).slice(2);
  return `client-${Date.now().toString(36)}-${random}`;
}

function ensureAudio() {
  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    if (!audio) audio = new AudioCtor();
    if (audio.state === "suspended") audio.resume();
  } catch (error) {
    audio = null;
  }
}

function tone(freq, duration, type, gainValue, slideTo) {
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audio.currentTime + duration);
  gain.gain.setValueAtTime(gainValue, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

function playSound(name) {
  if (name === "fire") {
    tone(220, 0.14, "sawtooth", 0.08, 90);
  } else if (name === "explode") {
    tone(80, 0.36, "square", 0.16, 38);
    setTimeout(() => tone(48, 0.18, "sawtooth", 0.08, 30), 35);
  } else if (name === "damage") {
    tone(520, 0.08, "triangle", 0.06, 260);
  } else if (name === "join") {
    tone(440, 0.08, "sine", 0.04, 660);
    setTimeout(() => tone(660, 0.1, "sine", 0.04, 880), 90);
  } else if (name === "move") {
    tone(92, 0.07, "square", 0.045, 72);
    setTimeout(() => tone(118, 0.05, "square", 0.035, 84), 55);
  } else if (name === "lock") {
    tone(980, 0.055, "square", 0.045, 1240);
    setTimeout(() => tone(1320, 0.055, "square", 0.045, 1680), 70);
    setTimeout(() => tone(1760, 0.08, "triangle", 0.05, 1180), 140);
  } else if (name === "retire") {
    tone(760, 0.12, "sine", 0.075, 1140);
    setTimeout(() => tone(520, 0.14, "triangle", 0.065, 860), 95);
    setTimeout(() => tone(360, 0.22, "sine", 0.06, 210), 210);
  }
}

async function postJson(path, body, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

async function join(name) {
  ensureAudio();
  loginError.textContent = "";
  const result = await postJson("/join", { id: clientId, name });
  seat = result.seat;
  seenWorldVersion = result.worldVersion;
  if (result.phase === "playing") {
    loginOverlay.classList.add("hidden");
    connectEvents();
  } else {
    seat = null;
    closeEvents();
    loginError.textContent = "Waiting for host to start the world.";
  }
  playSound("join");
}

function closeEvents() {
  if (!eventSource) return;
  eventSource.close();
  eventSource = null;
}

function connectEvents() {
  closeEvents();
  const source = new EventSource(`/events?id=${encodeURIComponent(clientId)}`);
  eventSource = source;
  source.addEventListener("state", (event) => {
    if (source !== eventSource) return;
    latest = JSON.parse(event.data);
    handleWorldState();
    if (latest.sounds) latest.sounds.forEach(playSound);
    updateHud();
  });
  source.onerror = () => {
    if (source !== eventSource) return;
    latest = latest || null;
  };
}

function handleWorldState() {
  if (!latest) return;
  let shouldCloseEvents = false;
  if (seenWorldVersion !== null && latest.worldVersion !== seenWorldVersion) {
    seat = null;
    seenWorldVersion = latest.worldVersion;
    shouldCloseEvents = true;
    loginOverlay.classList.remove("hidden");
    loginError.textContent = latest.phase === "setup"
      ? "World recreated. Waiting for host to choose players."
      : "World recreated. Join again.";
  }
  if (latest.phase === "setup") {
    seat = null;
    shouldCloseEvents = true;
    loginOverlay.classList.remove("hidden");
    loginError.textContent = "Waiting for host to choose players.";
  }
  if (shouldCloseEvents) closeEvents();
}

function updateHud() {
  if (!latest) return;
  if (latest.phase !== "playing") {
    moveValue.textContent = "0";
    moveLeftButton.disabled = true;
    moveRightButton.disabled = true;
    fireButton.disabled = true;
    angleInput.disabled = true;
    powerInput.disabled = true;
    return;
  }
  syncControlsFromState();

  const myTurn = seat === latest.current && !latest.projectile && latest.winner === null;
  const moveRemaining = latest.players[seat]?.moveRemaining ?? 0;
  moveValue.textContent = Math.round(moveRemaining);
  moveLeftButton.disabled = !myTurn;
  moveRightButton.disabled = !myTurn;
  fireButton.disabled = !myTurn;
  angleInput.disabled = !myTurn;
  powerInput.disabled = !myTurn;

}

function syncControlsFromState() {
  const activePlayer = latest?.players?.[latest.current];
  if (!activePlayer || isAdjustingControls) return;
  angleInput.value = Math.round(activePlayer.aim);
  powerInput.value = Math.round(activePlayer.power);
  angleValue.textContent = angleInput.value;
  powerValue.textContent = powerInput.value;
}

function sendControls() {
  isAdjustingControls = true;
  angleValue.textContent = angleInput.value;
  powerValue.textContent = powerInput.value;
  postJson("/input", {
    id: clientId,
    angle: Number(angleInput.value),
    power: Number(powerInput.value),
  }, 2500).catch(() => {}).finally(() => {
    window.setTimeout(() => {
      isAdjustingControls = false;
    }, 120);
  });
}

function fire() {
  ensureAudio();
  postJson("/fire", { id: clientId }).catch(() => {});
}

function move(direction) {
  postJson("/move", { id: clientId, direction }).catch(() => {});
}

function resetGame() {
  ensureAudio();
  postJson("/reset", { id: clientId }).catch(() => {});
}

function drawSky() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastRenderTime) / 1000);
  lastRenderTime = now;
  cloudOffset = (cloudOffset + (latest?.wind || 0) * 38 * dt) % W;

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  if (latest?.skyMode === "evening") {
    sky.addColorStop(0, "#4f6fa8");
    sky.addColorStop(0.38, "#c1809a");
    sky.addColorStop(0.76, "#f0aa6e");
    sky.addColorStop(1, "#704d4f");
  } else {
    sky.addColorStop(0, "#62add8");
    sky.addColorStop(0.42, "#a9d7df");
    sky.addColorStop(0.82, "#f1cf98");
    sky.addColorStop(1, "#d69c67");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = latest?.skyMode === "evening" ? "rgba(255, 154, 96, 0.82)" : "rgba(255, 236, 156, 0.72)";
  ctx.beginPath();
  ctx.arc(930, 92, 44, 0, Math.PI * 2);
  ctx.fill();

  const far = ctx.createLinearGradient(0, 230, 0, 430);
  far.addColorStop(0, latest?.skyMode === "evening" ? "rgba(82, 70, 104, 0.16)" : "rgba(82, 132, 142, 0.08)");
  far.addColorStop(1, latest?.skyMode === "evening" ? "rgba(72, 58, 74, 0.5)" : "rgba(72, 102, 96, 0.42)");
  ctx.fillStyle = far;
  ctx.beginPath();
  ctx.moveTo(0, 372);
  for (let x = 0; x <= W; x += 28) {
    ctx.lineTo(x, 330 + Math.sin(x * 0.012) * 24 + Math.sin(x * 0.004) * 58);
  }
  ctx.lineTo(W, 430);
  ctx.lineTo(0, 430);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
  drawWindCloud(180, 100, 1.1, 0.65);
  drawWindCloud(740, 78, 0.9, 0.9);
  drawWindCloud(940, 145, 1.25, 0.5);
  drawWindCloud(420, 132, 0.72, 1.15);
}

function drawWindCloud(x, y, scale, drift) {
  const shifted = ((x + cloudOffset * drift + W * 2) % (W + 220)) - 110;
  drawCloud(shifted, y, scale);
}

function drawCloud(x, y, scale) {
  ctx.beginPath();
  ctx.ellipse(x, y, 48 * scale, 18 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 36 * scale, y + 4 * scale, 42 * scale, 16 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 34 * scale, y + 6 * scale, 34 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTerrain() {
  const ground = latest?.ground || [];
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x < W; x += 1) ctx.lineTo(x, ground[x] ?? H);
  ctx.lineTo(W, H);
  ctx.closePath();
  const dirt = ctx.createLinearGradient(0, 370, 0, H);
  dirt.addColorStop(0, "#5d8f4f");
  dirt.addColorStop(0.12, "#7aa85d");
  dirt.addColorStop(0.2, "#8b7046");
  dirt.addColorStop(1, "#3b2a24");
  ctx.fillStyle = dirt;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x < W; x += 4) {
    if (x === 0) ctx.moveTo(x, ground[x] ?? H);
    else ctx.lineTo(x, ground[x] ?? H);
  }
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let x = 10; x < W; x += 34) {
    const y = ground[x] ?? H;
    ctx.fillStyle = x % 68 === 0 ? "#c59b5b" : "#3f2c25";
    ctx.beginPath();
    ctx.ellipse(x, y + 34 + Math.sin(x) * 7, 14, 5, 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(245, 230, 162, 0.46)";
  ctx.lineWidth = 2;
  for (let x = 12; x < W; x += 18) {
    const y = ground[x] ?? H;
    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.quadraticCurveTo(x + 5, y - 12, x + 12, y - 3);
    ctx.stroke();
  }
}

function drawPlatforms() {
  (latest?.platforms || []).forEach((platform) => {
    if (platform.type === "thin") {
      drawPlatformShape(platform);
    } else if (platform.type === "steps") {
      platform.steps.forEach((step) => drawPlatformShape(step));
    } else if (platform.type === "island") {
      drawPlatformIsland(platform);
    }
  });
}

function drawPlatformBlock(x, y, w, h) {
  drawPlatformShape({ x, y, w, h, craters: [] });
}

function drawPlatformShape(platform) {
  const { x, y, w, h } = platform;
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.32)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 3;
  const fill = ctx.createLinearGradient(0, y, 0, y + h + STRIP_PLATFORM_EXTRA + 4);
  fill.addColorStop(0, "#78a85b");
  fill.addColorStop(0.45, "#846b45");
  fill.addColorStop(1, "#3b2a24");

  let runStart = null;
  const samples = renderOffsets(w, 4);
  let previousPx = null;
  samples.forEach((offset, index) => {
    const px = x + offset;
    const surface = platformSurfaceY(platform, px);
    const solid = surface !== null && platformPointIsExposed(surface, px);
    const atEnd = index === samples.length - 1;
    if (solid && runStart === null) runStart = px;
    if ((!solid || atEnd) && runStart !== null) {
      const end = solid && atEnd ? x + w : previousPx;
      if (end - runStart >= 4) {
        ctx.fillStyle = fill;
        roundRect(runStart, y, end - runStart, h + STRIP_PLATFORM_EXTRA, 4);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "rgba(22, 17, 12, 0.72)";
        ctx.lineWidth = 2;
        roundRect(runStart, y, end - runStart, h + STRIP_PLATFORM_EXTRA, 4);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255, 239, 166, 0.82)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(runStart + 2, y + 1);
        ctx.lineTo(end - 2, y + 1);
        ctx.stroke();
      }
      runStart = null;
    }
    previousPx = px;
  });
  ctx.restore();
}

function renderOffsets(width, step) {
  const offsets = [];
  for (let i = 0; i <= width; i += step) offsets.push(i);
  if (offsets[offsets.length - 1] !== width) offsets.push(width);
  return offsets;
}

function platformSurfaceY(platform, x) {
  let y = platform.y;
  (platform.craters || []).forEach((crater) => {
    const dx = x - crater.x;
    if (Math.abs(dx) <= crater.r) {
      y = Math.max(y, crater.y + Math.sqrt(Math.max(0, crater.r * crater.r - dx * dx)));
    }
  });
  return y > platform.y + platform.h + STRIP_PLATFORM_EXTRA ? null : y;
}

function platformPointIsExposed(surfaceY, x) {
  const mask = latest?.platformMask || latest?.platformGround || latest?.ground;
  const ground = mask?.[Math.round(clamp(x, 0, W - 1))] ?? H;
  return surfaceY < ground - 10;
}

function drawPlatformIsland(platform) {
  const h = platform.h || 10;
  const minX = Math.round(Math.min(...platform.points.map(([x]) => x)));
  const maxX = Math.round(Math.max(...platform.points.map(([x]) => x)));
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.34)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  const fill = ctx.createLinearGradient(0, platform.points[0][1], 0, platform.points[0][1] + h + ISLAND_PLATFORM_EXTRA + 12);
  fill.addColorStop(0, "#7aa85d");
  fill.addColorStop(0.38, "#8b7046");
  fill.addColorStop(1, "#3b2a24");
  ctx.fillStyle = fill;
  for (let x = minX; x < maxX; x += 5) {
    const endX = Math.min(x + 5, maxX);
    const y1 = islandSurfaceY(platform, x);
    const y2 = islandSurfaceY(platform, endX);
    if (y1 === null || y2 === null) continue;
    if (!platformPointIsExposed(y1, x) && !platformPointIsExposed(y2, endX)) continue;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(endX, y2);
    ctx.lineTo(endX, y2 + h + ISLAND_PLATFORM_EXTRA);
    ctx.lineTo(x, y1 + h + ISLAND_PLATFORM_EXTRA);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255, 239, 166, 0.82)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let drawing = false;
  for (let x = minX; x <= maxX; x += 5) {
    const y = islandSurfaceY(platform, x);
    const visible = y !== null && platformPointIsExposed(y, x);
    if (visible && !drawing) {
      ctx.moveTo(x, y);
      drawing = true;
    } else if (visible) {
      ctx.lineTo(x, y);
    } else {
      drawing = false;
    }
  }
  ctx.stroke();
  ctx.restore();
}

function islandSurfaceY(platform, x) {
  for (let i = 0; i < platform.points.length - 1; i += 1) {
    const [x1, y1] = platform.points[i];
    const [x2, y2] = platform.points[i + 1];
    if (Math.min(x1, x2) <= x && x <= Math.max(x1, x2)) {
      const t = (x - x1) / Math.max(1, x2 - x1);
      return y1 + (y2 - y1) * t;
    }
  }
  return null;
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawTank(player, index) {
  if (player.health <= 0) {
    drawDestroyedTank(player);
    return;
  }

  const active = latest && index === latest.current && latest.winner === null;
  const sprite = sprites.tanks[index % sprites.tanks.length];
  if (sprite.complete && sprite.naturalWidth) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angleBody);
    ctx.scale(TANK_SCALE, TANK_SCALE);
    ctx.drawImage(sprite, -31, -30, 62, 38);
    ctx.restore();

    drawTankTypeTrim(player);
    drawTankBarrels(player);

    if (active) {
      ctx.strokeStyle = "#fff1a8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y - 4, 14, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
    return;
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angleBody);
  ctx.scale(TANK_SCALE, TANK_SCALE);
  ctx.fillStyle = "rgba(0, 0, 0, 0.30)";
  ctx.beginPath();
  ctx.ellipse(0, 19, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyGradient = ctx.createLinearGradient(-25, -28, 28, 14);
  bodyGradient.addColorStop(0, "#ffffff");
  bodyGradient.addColorStop(0.08, player.color);
  bodyGradient.addColorStop(1, index === 0 ? "#2879b9" : "#cb5f42");
  ctx.fillStyle = bodyGradient;
  roundRect(-30, -14, 60, 27, 8);
  ctx.fill();

  ctx.fillStyle = "rgba(16, 24, 31, 0.34)";
  roundRect(-28, 3, 56, 13, 6);
  ctx.fill();
  ctx.fillStyle = "#151a20";
  for (let i = -20; i <= 20; i += 10) {
    ctx.beginPath();
    ctx.arc(i, 9, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = bodyGradient;
  roundRect(-17, -30, 34, 21, 9);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  roundRect(-9, -25, 18, 5, 3);
  ctx.fill();
  ctx.restore();

  drawTankTypeTrim(player);
  drawTankBarrels(player);

  if (active) {
    ctx.strokeStyle = "#fff1a8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y - 4, 20, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
}

function drawDestroyedTank(player) {
  ctx.save();
  ctx.translate(player.x, player.y + 1 * TANK_SCALE);
  ctx.rotate(player.angleBody + 0.08);
  ctx.scale(TANK_SCALE, TANK_SCALE);

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(0, 16, 33, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const wreck = ctx.createLinearGradient(-32, -18, 32, 14);
  wreck.addColorStop(0, "#5f6468");
  wreck.addColorStop(0.5, "#2d3339");
  wreck.addColorStop(1, "#11161c");
  ctx.fillStyle = wreck;
  roundRect(-31, -12, 62, 24, 7);
  ctx.fill();

  ctx.fillStyle = "#171b20";
  roundRect(-24, 1, 48, 12, 5);
  ctx.fill();

  ctx.strokeStyle = "#0b0e12";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-10, -18);
  ctx.lineTo(18, 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 112, 74, 0.82)";
  ctx.beginPath();
  ctx.arc(-13, -19, 5, 0, Math.PI * 2);
  ctx.arc(1, -25, 7, 0, Math.PI * 2);
  ctx.arc(12, -18, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(42, 45, 48, 0.58)";
  ctx.beginPath();
  ctx.arc(-20, -33, 11, 0, Math.PI * 2);
  ctx.arc(-6, -40, 15, 0, Math.PI * 2);
  ctx.arc(10, -34, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawNameTag(player, index) {
  const isActive = latest && index === latest.current && latest.winner === null;
  const knockedOut = player.health <= 0;
  const text = knockedOut
    ? `${player.name || `P${index + 1}`} KO`
    : `${player.name || `P${index + 1}`}`;
  ctx.save();
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = Math.min(120, Math.max(54, ctx.measureText(text).width + 16));
  const x = clamp(player.x, width / 2 + 8, W - width / 2 - 8);
  const y = Math.max(22, player.y - 42);
  ctx.fillStyle = knockedOut
    ? "rgba(25, 28, 32, 0.72)"
    : isActive ? "rgba(255, 241, 168, 0.94)" : "rgba(12, 17, 24, 0.78)";
  roundRect(x - width / 2, y - 12, width, 24, 7);
  ctx.fill();
  ctx.strokeStyle = knockedOut ? "rgba(120, 126, 132, 0.8)" : player.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = knockedOut ? "#c3c8ce" : isActive ? "#1b1d1f" : "#f4f7fb";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawMoveBars() {
  if (!latest) return;
  latest.players.forEach((player, index) => {
    if (player.health <= 0) return;
    const width = 32;
    const height = 5;
    const ratio = clamp((player.moveRemaining || 0) / 150, 0, 1);
    const x = player.x - width / 2;
    const y = player.y + 11;
    ctx.fillStyle = "rgba(8, 12, 16, 0.62)";
    roundRect(x, y, width, height, 3);
    ctx.fill();
    ctx.fillStyle = index === latest.current ? "#ffcd6f" : "rgba(216, 229, 240, 0.72)";
    roundRect(x, y, width * ratio, height, 3);
    ctx.fill();

    const meta = tankMeta(player);
    const label = meta.name;
    ctx.save();
    ctx.font = "800 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelWidth = Math.min(86, Math.max(42, ctx.measureText(label).width + 10));
    const labelX = clamp(player.x, labelWidth / 2 + 6, W - labelWidth / 2 - 6);
    const labelY = y + height + 10;
    ctx.fillStyle = "rgba(8, 12, 16, 0.68)";
    roundRect(labelX - labelWidth / 2, labelY - 7, labelWidth, 14, 5);
    ctx.fill();
    ctx.fillStyle = "#f4f7fb";
    ctx.fillText(label, labelX, labelY + 0.3);
    ctx.restore();
  });
}

function tankType(player) {
  return player.tankType || "normal";
}

function tankMeta(player) {
  return TANK_TYPE_META[tankType(player)] || TANK_TYPE_META.normal;
}

function mixHexColor(from, to, amount) {
  const a = from.match(/\w\w/g).map((value) => parseInt(value, 16));
  const b = to.match(/\w\w/g).map((value) => parseInt(value, 16));
  const mixed = a.map((value, index) => Math.round(value + (b[index] - value) * amount));
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function artilleryColor(player) {
  const amount = clamp(((player.aim || 45) - 5) / 80, 0, 1);
  return mixHexColor("#7b2cff", "#ff3030", amount);
}

function drawTankTypeTrim(player) {
  const type = tankType(player);
  const meta = tankMeta(player);
  const typeColor = type === "artillery" ? artilleryColor(player) : meta.color;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angleBody);
  ctx.scale(TANK_SCALE, TANK_SCALE);

  if (type === "multi") {
    ctx.fillStyle = "rgba(116, 215, 255, 0.95)";
    [-13, 0, 13].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, -24, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === "red") {
    const core = ctx.createRadialGradient(2, -22, 2, 2, -22, 15);
    core.addColorStop(0, "#fff0d8");
    core.addColorStop(0.45, "#ff4747");
    core.addColorStop(1, "#7d1010");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(2, -22, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "missile") {
    ctx.strokeStyle = "#75ffe0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-5, -30);
    ctx.lineTo(-5, -44);
    ctx.stroke();
    ctx.fillStyle = "#baffee";
    ctx.beginPath();
    ctx.arc(-5, -47, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "super") {
    SUPER_MISSILE_COLORS.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(-28 + index * 14, -25, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#fff1a8";
    roundRect(-34, -16, 68, 9, 5);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (type === "artillery") {
    ctx.globalAlpha = 0.74;
    ctx.fillStyle = typeColor;
    roundRect(-30, -14, 60, 27, 8);
    ctx.fill();
    roundRect(-17, -30, 34, 21, 9);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(38, 43, 48, 0.8)";
    roundRect(-5, -38, 10, 16, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
    roundRect(-22, -25, 44, 4, 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    roundRect(-11, -26, 22, 5, 3);
    ctx.fill();
  }

  ctx.restore();
}

function barrelAngle(player) {
  const aim = player.aim * Math.PI / 180;
  const localAngle = player.dir === 1 ? -aim : Math.PI + aim;
  return player.angleBody + localAngle;
}

function drawTankBarrels(player) {
  const type = tankType(player);
  if (type === "multi") {
    [-8, 0, 8].forEach((offset) => drawBarrel(player, undefined, offset, { length: 27, thickness: 4, tip: 3, accent: "#74d7ff" }));
  } else if (type === "red") {
    drawBarrel(player, undefined, 0, { length: 25, thickness: 9, tip: 6, accent: "#ff3030" });
  } else if (type === "missile") {
    drawBarrel(player, undefined, 0, { length: 34, thickness: 5, tip: 5, accent: "#39ff14", fins: true });
  } else if (type === "super") {
    [-12, -6, 0, 6, 12].forEach((offset, index) => {
      drawBarrel(player, undefined, offset, { length: 34, thickness: 3.6, tip: 4, accent: SUPER_MISSILE_COLORS[index], fins: true });
    });
  } else if (type === "artillery") {
    drawBarrel(player, undefined, 0, { length: 40, thickness: 8, tip: 5, accent: artilleryColor(player) });
  } else {
    drawBarrel(player);
  }
}

function drawBarrel(player, barrel, offset = 0, options = {}) {
  const angle = barrel ?? barrelAngle(player);
  const length = options.length || 29;
  const thickness = options.thickness || 6;
  const tip = options.tip || 4;
  const accent = options.accent || "#46505a";
  ctx.save();
  ctx.translate(player.x, player.y - 12 * TANK_SCALE);
  ctx.rotate(angle);
  ctx.scale(TANK_SCALE, TANK_SCALE);
  ctx.translate(0, offset);
  const barrelGradient = ctx.createLinearGradient(0, -5, 48, 5);
  barrelGradient.addColorStop(0, "#20262e");
  barrelGradient.addColorStop(0.7, accent);
  barrelGradient.addColorStop(1, "#1d232a");
  ctx.fillStyle = barrelGradient;
  roundRect(0, -thickness / 2, length, thickness, thickness / 2);
  ctx.fill();
  if (options.fins) {
    ctx.fillStyle = "#2b4f4b";
    ctx.beginPath();
    ctx.moveTo(14, -thickness / 2);
    ctx.lineTo(6, -13);
    ctx.lineTo(19, -thickness / 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#14191f";
  ctx.beginPath();
  ctx.arc(length, 0, tip, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawProjectile() {
  const projectiles = latest?.projectiles?.length
    ? latest.projectiles
    : latest?.projectile ? [latest.projectile] : [];
  projectiles.forEach(drawOneProjectile);
}

function hexToRgba(hex, alpha) {
  const values = hex.match(/\w\w/g).map((value) => parseInt(value, 16));
  return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${alpha})`;
}

function artilleryProjectileColor(p) {
  const owner = latest?.players?.[p.owner];
  const aim = Number.isFinite(p.shotAim) ? p.shotAim : owner?.aim ?? 45;
  return artilleryColor({ aim });
}

function artilleryProjectileSize(p) {
  const amount = clamp(((p.age || 0) - 0.35) / 2.65, 0, 1);
  const scale = 0.5 + amount * 2.5;
  return {
    width: 22 * scale,
    height: 11 * scale,
    charge: amount,
  };
}

function seekerProjectileColor(p) {
  if (p.shotColor) return p.shotColor;
  if (p.tankType === "super") return SUPER_MISSILE_COLORS[(p.shotIndex || 0) % SUPER_MISSILE_COLORS.length];
  return "#39ff14";
}

function projectileTrailColor(p) {
  if (p.tankType === "red") return "rgba(255, 48, 48, 0.86)";
  if (p.tankType === "missile" || p.tankType === "super") return hexToRgba(seekerProjectileColor(p), 0.92);
  if (p.tankType === "artillery") return hexToRgba(artilleryProjectileColor(p), 0.82);
  return p.locked ? "rgba(57, 255, 20, 0.92)" : "rgba(255, 215, 120, 0.78)";
}

function drawSheetProjectile(frameName, width, height, tint = null, alpha = 0.45) {
  let asset = keyedSheetFrame(frameName);
  if (!asset) return false;
  if (tint) {
    asset = tintedAsset(asset, frameName, tint, alpha);
  }
  if (!asset) return false;
  ctx.drawImage(asset, -width / 2, -height / 2, width, height);
  return true;
}

function drawShellProjectile(width, height, tint = null, alpha = 0.28) {
  if (!spriteReady(sprites.shell)) return false;
  const asset = tint
    ? tintedAsset(sprites.shell, "shell", tint, alpha)
    : sprites.shell;
  if (!asset) return false;
  ctx.drawImage(asset, -width / 2, -height / 2, width, height);
  return true;
}

function drawSeekerProjectile(p) {
  const color = seekerProjectileColor(p);
  const width = p.tankType === "super" ? 18 : 21;
  const height = p.tankType === "super" ? 8 : 9;
  if (drawSheetProjectile("blueRocket", width, height, color, 0.7)) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = hexToRgba(color, p.locked ? 0.3 : 0.18);
    ctx.beginPath();
    ctx.ellipse(1, 0, width * 0.58, height * 0.56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
  }

  const body = ctx.createLinearGradient(-9, -4, 11, 4);
  body.addColorStop(0, mixHexColor("#101820", color, 0.35));
  body.addColorStop(0.45, color);
  body.addColorStop(1, "#e6ffe2");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(5, -4);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-11, 0);
  ctx.lineTo(-8, 4);
  ctx.lineTo(5, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = mixHexColor("#101820", color, 0.58);
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.lineTo(-11, -8);
  ctx.lineTo(-8, -2);
  ctx.closePath();
  ctx.fill();
  return true;
}

function drawRedCoreProjectile() {
  const core = ctx.createRadialGradient(1.4, -1.4, 0.8, 0, 0, 5.2);
  core.addColorStop(0, "#fff0d8");
  core.addColorStop(0.35, "#ff4a3d");
  core.addColorStop(1, "#9d0909");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.beginPath();
  ctx.arc(1.6, -1.8, 1.2, 0, Math.PI * 2);
  ctx.fill();
  return true;
}

function drawProjectileAsset(p, meta, flightAngle) {
  const type = p.tankType || "normal";
  if (type === "red") {
    return drawRedCoreProjectile();
  }
  if (type === "missile" || type === "super") {
    return drawSeekerProjectile(p);
  }
  if (type === "multi") {
    return drawShellProjectile(16, 8, "#10151b", 0.24);
  }
  if (type === "artillery") {
    const tint = artilleryProjectileColor(p);
    const size = artilleryProjectileSize(p);
    const drawn = drawShellProjectile(size.width, size.height, tint, 0.48);
    if (drawn && size.charge > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = hexToRgba(tint, 0.1 + size.charge * 0.18);
      ctx.beginPath();
      ctx.ellipse(0, 0, size.width * 0.56, size.height * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return drawn;
  }
  return drawSheetProjectile("blueRocket", 29, 13) || drawShellProjectile(20, 10, meta.shell, 0.18);
}

function drawFallbackProjectile(meta) {
  ctx.fillStyle = meta.shell;
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = meta.glow;
  ctx.fillRect(-5, -1.5, 2.5, 3);
}

function drawOneProjectile(p) {
  const meta = TANK_TYPE_META[p.tankType || "normal"] || TANK_TYPE_META.normal;
  const flightAngle = Math.atan2(p.vy || 0, p.vx || 1);
  const tailX = p.x - Math.cos(flightAngle) * 14;
  const tailY = p.y - Math.sin(flightAngle) * 14;
  const trail = ctx.createLinearGradient(tailX, tailY, p.x, p.y);
  trail.addColorStop(0, "rgba(255, 215, 120, 0)");
  trail.addColorStop(1, projectileTrailColor(p));
  ctx.strokeStyle = trail;
  ctx.lineWidth = p.tankType === "red" ? 4 : (p.tankType === "missile" || p.tankType === "super") ? 2 : 3;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(flightAngle);
  if (!drawProjectileAsset(p, meta, flightAngle)) drawFallbackProjectile(meta);
  ctx.restore();
}

function drawParticles() {
  (latest?.particles || []).forEach((p) => {
    const fade = clamp(p.life / (p.maxLife || 34), 0, 1);
    const glowSize = p.size * 1.55;
    const glow = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, glowSize);
    glow.addColorStop(0, `rgba(255, 238, 159, ${fade})`);
    glow.addColorStop(0.45, `rgba(255, 126, 54, ${fade * 0.55})`);
    glow.addColorStop(1, "rgba(83, 56, 37, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(75, 51, 35, ${fade * 0.65})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawHealthBars() {
  latest.players.forEach((player) => {
    const width = 44;
    const height = 8;
    const value = clamp(player.health, 0, 100) / 100;
    const healthColor = player.health <= 10 ? "#ff3030" : player.health <= 50 ? "#ffe23f" : "#39ff14";
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    roundRect(player.x - width / 2, player.y - 33, width, height, 4);
    ctx.fill();
    ctx.fillStyle = healthColor;
    roundRect(player.x - width / 2, player.y - 33, width * value, height, 4);
    ctx.fill();
  });
}

function drawWinner() {
  if (latest?.winner === null || latest?.winner === undefined) return;
  ctx.fillStyle = "rgba(10, 12, 16, 0.58)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 54px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${latest.players[latest.winner].name} wins`, W / 2, H / 2);
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText("Press Reset for another round", W / 2, H / 2 + 42);
}

function drawInGameHud() {
  if (!latest) return;
  if (latest.phase === "setup") {
    ctx.save();
    ctx.font = "800 22px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(9, 13, 18, 0.7)";
    roundRect(14, 14, 244, 58, 8);
    ctx.fill();
    ctx.fillStyle = "#f4f7fb";
    ctx.fillText("Waiting for host", 28, 25);
    ctx.fillStyle = "#9db1c6";
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.fillText("Open /host to start", 28, 51);
    ctx.restore();
    return;
  }
  const current = latest.players[latest.current];
  const isMine = seat === latest.current;
  const lines = [
    latest.winner === null || latest.winner === undefined
      ? `${current.name || `Player ${latest.current + 1}`}${isMine ? " turn" : ""}`
      : `${latest.players[latest.winner].name} wins`,
    `Wind ${latest.wind > 0 ? "+" : ""}${latest.wind.toFixed(2)}`,
  ];
  if (seat >= 0 && seat < latest.players.length) {
    lines.push(isMine ? `Move ${Math.round(latest.players[seat].moveRemaining || 0)}` : `You are P${seat + 1}`);
  } else {
    lines.push("Watching");
  }

  ctx.save();
  ctx.font = "800 18px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const width = 190;
  const height = 76;
  ctx.fillStyle = "rgba(9, 13, 18, 0.66)";
  roundRect(14, 14, width, height, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.stroke();
  ctx.fillStyle = "#f4f7fb";
  ctx.fillText(lines[0], 28, 24);
  ctx.fillStyle = "#d6e4a7";
  ctx.fillText(lines[1], 28, 47);
  ctx.fillStyle = isMine ? "#ffcd6f" : "#9db1c6";
  ctx.fillText(lines[2], 28, 66);
  ctx.restore();
}

function render() {
  drawSky();
  if (latest) {
    drawTerrain();
    drawPlatforms();
    drawHealthBars();
    latest.players.forEach(drawTank);
    drawMoveBars();
    latest.players.forEach(drawNameTag);
    drawProjectile();
    drawParticles();
    drawInGameHud();
    drawWinner();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "700 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Join to start", W / 2, H / 2);
  }
  requestAnimationFrame(render);
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim() || "Player";
  localStorage.setItem("skyBatteryName", name);
  join(name).catch((error) => {
    loginError.textContent = `Login failed: ${error.message}`;
  });
});

angleInput.addEventListener("input", sendControls);
powerInput.addEventListener("input", sendControls);
moveLeftButton.addEventListener("click", () => move(-1));
moveRightButton.addEventListener("click", () => move(1));
fireButton.addEventListener("click", fire);
resetButton.addEventListener("click", resetGame);
window.addEventListener("beforeunload", closeEvents);

window.addEventListener("keydown", (event) => {
  if (angleInput.disabled) return;
  if (event.key === "a" || event.key === "A") move(-1);
  if (event.key === "d" || event.key === "D") move(1);
  if (event.key === "ArrowLeft") angleInput.value = clamp(Number(angleInput.value) + 1, 5, 85);
  if (event.key === "ArrowRight") angleInput.value = clamp(Number(angleInput.value) - 1, 5, 85);
  if (event.key === "ArrowUp") powerInput.value = clamp(Number(powerInput.value) + 2, 20, 100);
  if (event.key === "ArrowDown") powerInput.value = clamp(Number(powerInput.value) - 2, 20, 100);
  if (event.code === "Space") {
    event.preventDefault();
    fire();
  }
  sendControls();
});

nameInput.value = localStorage.getItem("skyBatteryName") || "";
angleValue.textContent = angleInput.value;
powerValue.textContent = powerInput.value;
render();
