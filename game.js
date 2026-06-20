const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const loginOverlay = document.getElementById("loginOverlay");
const loginForm = document.getElementById("loginForm");
const nameInput = document.getElementById("nameInput");
const loginError = document.getElementById("loginError");
const loginTankChoice = document.getElementById("loginTankChoice");
const tankTypeSelect = document.getElementById("tankTypeSelect");
const angleInput = document.getElementById("angle");
const powerInput = document.getElementById("power");
const angleValue = document.getElementById("angleValue");
const powerValue = document.getElementById("powerValue");
const moveLeftButton = document.getElementById("moveLeftButton");
const moveRightButton = document.getElementById("moveRightButton");
const moveValue = document.getElementById("moveValue");
const fireButton = document.getElementById("fireButton");
const resetButton = document.getElementById("resetButton");
const aimFireControl = document.getElementById("aimFireControl");
const aimDial = document.getElementById("aimDial");
const aimRangePath = document.getElementById("aimRangePath");
const aimRangeLine = document.getElementById("aimRangeLine");
const angleIndicator = document.getElementById("angleIndicator");
const previousPowerBar = document.getElementById("previousPowerBar");
const chargePowerBar = document.getElementById("chargePowerBar");
const tankDescription = document.getElementById("tankDescription");

const W = canvas.width;
const H = canvas.height;
const TANK_SCALE = 0.5;
const STRIP_PLATFORM_EXTRA = 8;
const ISLAND_PLATFORM_EXTRA = 5;
const AIM_MIN = 5;
const LASER_AIM_MIN = -8;
const AIM_MAX = 85;
const POWER_MIN = 20;
const POWER_MAX = 100;
const POWER_CHARGE_MS = 3600;
const ARTILLERY_GROW_START = 0.15;
const ARTILLERY_GROW_DURATION = 2.65;
const CHEESE_SCALE_PER_STACK = 0.12;
const CHEESE_MAX_SCALE = 1.72;
const TANK_TYPE_META = {
  dragon: { label: "D", name: "드래곤 탱크", desc: "블랙 근거리 탱크. 짧은 직선 화염으로 30-36 광역 피해를 줍니다.", color: "#050608", shell: "#ff5a1f", glow: "#ffb13b" },
  normal: { label: "N", name: "노말 탱크", desc: "기본 포탄을 안정적으로 쏘는 표준 탱크.", color: "#5fb8ff", shell: "#1f252c", glow: "#ffcd6f" },
  shield: { label: "S", name: "쉴드 탱크", desc: "공격력은 낮지만 1회 공격을 막고 3턴 뒤 쉴드가 돌아옵니다.", color: "#6de7ff", shell: "#2f7dff", glow: "#d8ffff" },
  multi: { label: "III", name: "멀티미사일", desc: "세 발을 동시에 흩뿌려 넓게 압박합니다.", color: "#74d7ff", shell: "#1f252c", glow: "#ffcd6f" },
  red: { label: "R", name: "빨콩탱크", desc: "작은 폭발 대신 매우 강한 빨간 핵심탄을 쏩니다.", color: "#ff4848", shell: "#ff3030", glow: "#ff8674" },
  missile: { label: "M", name: "유도탄 탱크", desc: "내려오며 가까운 목표를 강하게 추적하는 약한 유도탄.", color: "#39ff14", shell: "#39ff14", glow: "#baffee" },
  artillery: { label: "A", name: "자주포 탱크", desc: "오래 날수록 탄이 커지고 폭발도 강해집니다.", color: "#f5d76e", shell: "#4b4f58", glow: "#ffe07a" },
  laser: { label: "L", name: "레이저 탱크", desc: "직선 레이저로 맞은 경로의 지형을 길게 깎습니다.", color: "#5df6ff", shell: "#5df6ff", glow: "#d8ffff" },
  chain: { label: "C", name: "3쿠션 체인", desc: "지형에 튕길 때 가까운 탱크 쪽으로 살짝 방향을 보정합니다.", color: "#c8d0d8", shell: "#9fa8b2", glow: "#f4f7fb" },
  poop: { label: "P", name: "똥탱크", desc: "똥 스택을 쌓아 이동력을 줄이고 피해를 키웁니다.", color: "#8b5a2b", shell: "#7a4a24", glow: "#d59b55" },
  nuke: { label: "X", name: "핵폭탄 탱크", desc: "첫 탄으로 표식을 남기고 같은 곳을 다시 맞추면 대폭발.", color: "#ff3030", shell: "#ff3030", glow: "#ffd15c" },
  cruise: { label: "V", name: "순항미사일", desc: "비행 중 Fire/Space로 상승시키는 느린 미사일.", color: "#72a7ff", shell: "#72a7ff", glow: "#c7e2ff" },
  cheese: { label: "CH", name: "치즈 탱크", desc: "맞은 탱크를 먹여서 키우고 피격 판정을 넓힙니다.", color: "#ffd84d", shell: "#ffd84d", glow: "#fff2a0" },
  zombie: { label: "Z", name: "좀비 탱크", desc: "맞은 근처에 좀비를 풀어 목표를 따라다니게 합니다.", color: "#6fe36f", shell: "#5d6158", glow: "#b5ff8a" },
  healing: { label: "H", name: "힐링탱크", desc: "자신에게 맞추면 잃은 체력의 일부를 반짝 회복합니다.", color: "#8fffe8", shell: "#9dfff1", glow: "#fff7a8" },
  heart: { label: "♥", name: "하트탱크", desc: "비행 중 Fire/Space를 누를 때마다 크기가 바뀌고 가끔 왕하트가 나옵니다.", color: "#ff85c8", shell: "#ff5ebd", glow: "#ffd6ef" },
  butt: { label: "B", name: "뿌직탱크", desc: "비행 중 Fire/Space를 누르면 그 자리에서 똥을 떨어뜨립니다.", color: "#f0b28f", shell: "#f2b090", glow: "#ffe0c9" },
  poopdrop: { label: "P", name: "똥", desc: "떨어지는 똥 포탄.", color: "#8b5a2b", shell: "#7a4a24", glow: "#d59b55" },
  boing: { label: "BO", name: "또잉탱크", desc: "지형에 맞으면 그 지점으로 또잉 점프 이동합니다.", color: "#b68cff", shell: "#b68cff", glow: "#f0dcff" },
  superball: { label: "B", name: "볼탱크", desc: "흰 공 5발이 20발까지 갈라진 뒤 합쳐져 커집니다.", color: "#ffffff", shell: "#ffffff", glow: "#eaf7ff" },
  super: { label: "S", name: "슈퍼탱크", desc: "드물게 등장하는 다섯 발짜리 무지개 유도 미사일.", color: "#ffe23f", shell: "#39ff14", glow: "#fff1a8" },
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
let cruiseBoostTimer = null;
let isChargingShot = false;
let chargeStartTime = 0;
let chargeFrame = null;
let chargePower = Number(powerInput.value);
let previousPowerValue = Number(powerInput.value);
let isDialDragging = false;
let isSpaceCharging = false;
let isSpaceCruiseBoosting = false;
let moveHoldTimer = null;
let moveHoldDirection = 0;

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
  } else if (name === "laser") {
    tone(1320, 0.12, "sawtooth", 0.055, 1880);
    setTimeout(() => tone(720, 0.1, "triangle", 0.04, 1280), 70);
  } else if (name === "dragon") {
    tone(92, 0.18, "sawtooth", 0.08, 48);
    setTimeout(() => tone(180, 0.16, "triangle", 0.06, 86), 55);
    setTimeout(() => tone(360, 0.12, "sawtooth", 0.045, 140), 120);
  } else if (name === "boing") {
    tone(340, 0.1, "sine", 0.06, 620);
    setTimeout(() => tone(250, 0.08, "triangle", 0.04, 480), 90);
  } else if (name === "poop") {
    tone(92, 0.18, "sawtooth", 0.08, 56);
    setTimeout(() => tone(130, 0.08, "square", 0.045, 90), 80);
  } else if (name === "target") {
    tone(740, 0.08, "triangle", 0.045, 520);
    setTimeout(() => tone(740, 0.08, "triangle", 0.035, 520), 120);
  } else if (name === "nuke") {
    tone(64, 0.5, "sawtooth", 0.18, 24);
    setTimeout(() => tone(118, 0.32, "square", 0.11, 42), 70);
    setTimeout(() => tone(220, 0.18, "triangle", 0.08, 90), 180);
  } else if (name === "cruise") {
    tone(180, 0.22, "sawtooth", 0.065, 120);
    setTimeout(() => tone(260, 0.18, "triangle", 0.04, 190), 80);
  } else if (name === "cheese") {
    tone(720, 0.06, "triangle", 0.045, 980);
    setTimeout(() => tone(920, 0.05, "sine", 0.035, 1220), 55);
  } else if (name === "shield") {
    tone(520, 0.08, "sine", 0.055, 980);
    setTimeout(() => tone(1180, 0.12, "triangle", 0.045, 640), 70);
  } else if (name === "zombie") {
    tone(128, 0.2, "sawtooth", 0.07, 82);
    setTimeout(() => tone(220, 0.12, "triangle", 0.045, 130), 120);
  } else if (name === "zombiehit") {
    tone(260, 0.045, "square", 0.04, 180);
  } else if (name === "zombiedie") {
    tone(520, 0.08, "triangle", 0.05, 760);
    setTimeout(() => tone(240, 0.1, "sine", 0.035, 180), 80);
  } else if (name === "heal") {
    tone(1180, 0.08, "sine", 0.038, 1720);
    setTimeout(() => tone(1840, 0.12, "triangle", 0.045, 1320), 55);
    setTimeout(() => tone(1360, 0.08, "sine", 0.035, 1980), 170);
    setTimeout(() => tone(2160, 0.16, "triangle", 0.04, 1460), 225);
  } else if (name === "heart") {
    tone(760, 0.06, "sine", 0.04, 1080);
    setTimeout(() => tone(560, 0.06, "triangle", 0.035, 880), 65);
  } else if (name === "toing") {
    tone(320, 0.18, "sine", 0.075, 780);
    setTimeout(() => tone(520, 0.22, "triangle", 0.055, 1180), 120);
    setTimeout(() => tone(760, 0.26, "sine", 0.04, 360), 300);
  } else if (name === "superball") {
    tone(520, 0.07, "sine", 0.045, 820);
    setTimeout(() => tone(720, 0.08, "triangle", 0.04, 1040), 70);
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
  const body = { id: clientId, name };
  if (!loginTankChoice.hidden) body.tankType = tankTypeSelect.value;
  const result = await postJson("/join", body);
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

function updateLoginTankChoice(state) {
  const isSolo = state && Number(state.playerCount) === 1;
  loginTankChoice.hidden = !isSolo;
}

async function refreshLoginOptions() {
  if (loginOverlay.classList.contains("hidden")) return;
  try {
    const response = await fetch("/state", { cache: "no-store" });
    if (!response.ok) return;
    const state = await response.json();
    updateLoginTankChoice(state);
  } catch (error) {
    updateLoginTankChoice(null);
  }
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
  updateLoginTankChoice(latest);
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

function currentProjectiles() {
  if (latest?.projectiles?.length) return latest.projectiles;
  return latest?.projectile ? [latest.projectile] : [];
}

function activeCruiseProjectile() {
  return currentProjectiles().find((projectile) => projectile.cruise && projectile.owner === seat);
}

function activeSpecialProjectile() {
  return currentProjectiles().find((projectile) => {
    if (projectile.owner !== seat) return false;
    if (projectile.cruise || projectile.heart) return true;
    return projectile.butt && !projectile.buttDropped;
  });
}

function specialProjectileButtonText(projectile) {
  if (!projectile) return "Fire";
  if (projectile.cruise) return "Lift";
  if (projectile.heart) return "Resize";
  if (projectile.butt && !projectile.buttDropped) return "Drop";
  return "Fire";
}

function canFireShot() {
  return latest?.phase === "playing"
    && seat === latest.current
    && currentProjectiles().length === 0
    && latest.winner === null;
}

function normalizeRadians(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function normalizeDegrees(angle) {
  return ((angle % 360) + 360) % 360;
}

function clockwiseDeltaDegrees(from, to) {
  return normalizeDegrees(to - from);
}

function dialPoint(angleDegrees, radius = 43) {
  const radians = angleDegrees * Math.PI / 180;
  return {
    x: 50 + Math.cos(radians) * radius,
    y: 50 + Math.sin(radians) * radius,
  };
}

function dialArcPath(startDegrees, sweepDegrees, radius = 43) {
  const start = dialPoint(startDegrees, radius);
  const end = dialPoint(startDegrees + sweepDegrees, radius);
  const largeArc = sweepDegrees > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function updateAimGuide(player) {
  if (!player || !aimRangePath || !aimRangeLine) return;
  const minPlayer = { ...player, aim: aimMinForPlayer(player) };
  const maxPlayer = { ...player, aim: AIM_MAX };
  const minAngle = barrelAngle(minPlayer) * 180 / Math.PI;
  const maxAngle = barrelAngle(maxPlayer) * 180 / Math.PI;
  const minToMax = clockwiseDeltaDegrees(minAngle, maxAngle);
  const startAngle = minToMax <= 180 ? minAngle : maxAngle;
  const sweepAngle = minToMax <= 180 ? minToMax : clockwiseDeltaDegrees(maxAngle, minAngle);
  const path = dialArcPath(startAngle, sweepAngle);
  aimRangePath.setAttribute("d", path);
  aimRangeLine.setAttribute("d", path);
  aimDial?.style.setProperty("--aim-range-sweep", `${Math.round(sweepAngle)}deg`);
}

function setPowerGauge(current = Number(powerInput.value), previous = previousPowerValue) {
  const currentRatio = clamp((current - POWER_MIN) / (POWER_MAX - POWER_MIN), 0, 1);
  const previousRatio = clamp((previous - POWER_MIN) / (POWER_MAX - POWER_MIN), 0, 1);
  if (chargePowerBar) chargePowerBar.style.width = `${currentRatio * 100}%`;
  if (previousPowerBar) previousPowerBar.style.width = `${previousRatio * 100}%`;
}

function updateAimDial(player = latest?.players?.[latest?.current]) {
  if (!player || !angleIndicator) return;
  const dialPlayer = { ...player, aim: Number(angleInput.value) };
  const angle = barrelAngle(dialPlayer) * 180 / Math.PI;
  angleIndicator.style.transform = `rotate(${angle}deg)`;
  updateAimGuide(dialPlayer);
  if (aimDial) {
    aimDial.setAttribute("aria-valuemin", String(aimMinForPlayer(player)));
    aimDial.setAttribute("aria-valuemax", String(AIM_MAX));
    aimDial.setAttribute("aria-valuenow", String(Math.round(Number(angleInput.value))));
  }
}

function updateTankDescription() {
  if (!tankDescription) return;
  const player = latest?.players?.[seat];
  if (!player || latest?.phase !== "playing") {
    tankDescription.textContent = "Three phones can join on the same Wi-Fi. Movement is limited each turn.";
    return;
  }
  const meta = tankMeta(player);
  tankDescription.textContent = `${meta.name}: ${meta.desc || "선택된 탱크입니다."}`;
}

function updateHud() {
  if (!latest) return;
  if (latest.phase !== "playing") {
    updateTankDescription();
    moveValue.textContent = "0";
    moveLeftButton.disabled = true;
    moveRightButton.disabled = true;
    fireButton.disabled = true;
    fireButton.textContent = "Fire";
    angleInput.disabled = true;
    powerInput.disabled = true;
    return;
  }
  syncControlsFromState();
  updateTankDescription();

  const activeSpecial = activeSpecialProjectile();
  const projectileActive = currentProjectiles().length > 0;
  const myTurn = seat === latest.current && !projectileActive && latest.winner === null;
  const canSpecial = Boolean(activeSpecial) && latest.winner === null;
  const moveRemaining = latest.players[seat]?.moveRemaining ?? 0;
  moveValue.textContent = projectileActive ? "0" : Math.round(moveRemaining);
  moveLeftButton.disabled = !myTurn;
  moveRightButton.disabled = !myTurn;
  fireButton.disabled = !(myTurn || canSpecial);
  if (!isChargingShot) fireButton.textContent = canSpecial ? specialProjectileButtonText(activeSpecial) : "Fire";
  angleInput.disabled = !myTurn;
  powerInput.disabled = !myTurn;
  if (!activeCruiseProjectile()) {
    isSpaceCruiseBoosting = false;
    stopCruiseBoost();
  }
  if (!isChargingShot) setPowerGauge(Number(powerInput.value), previousPowerValue);
  updateAimDial(latest.players[latest.current]);

}

function syncControlsFromState() {
  const activePlayer = latest?.players?.[latest.current];
  if (!activePlayer || isAdjustingControls) return;
  applyAimInputBounds(activePlayer);
  angleInput.value = Math.round(clamp(activePlayer.aim, aimMinForPlayer(activePlayer), AIM_MAX));
  powerInput.value = Math.round(activePlayer.power);
  angleValue.textContent = angleInput.value;
  powerValue.textContent = powerInput.value;
  if (!isChargingShot) previousPowerValue = Number(powerInput.value);
  if (!isChargingShot) setPowerGauge(Number(powerInput.value), previousPowerValue);
  updateAimDial(activePlayer);
}

function sendControlsNow(timeoutMs = 2500) {
  angleValue.textContent = angleInput.value;
  powerValue.textContent = powerInput.value;
  updateAimDial(latest?.players?.[latest.current]);
  setPowerGauge(Number(powerInput.value), previousPowerValue);
  return postJson("/input", {
    id: clientId,
    angle: Number(angleInput.value),
    power: Number(powerInput.value),
  }, timeoutMs);
}

function sendControls() {
  isAdjustingControls = true;
  sendControlsNow().catch(() => {}).finally(() => {
    window.setTimeout(() => {
      isAdjustingControls = false;
    }, 120);
  });
}

function fire() {
  ensureAudio();
  if (activeSpecialProjectile()) {
    activateProjectileSpecial();
    return;
  }
  postJson("/fire", { id: clientId }).catch(() => {});
}

function updateShotCharge(now = performance.now()) {
  if (!isChargingShot) return;
  const ratio = clamp((now - chargeStartTime) / POWER_CHARGE_MS, 0, 1);
  chargePower = Math.round(POWER_MIN + (POWER_MAX - POWER_MIN) * ratio);
  powerInput.value = chargePower;
  powerValue.textContent = chargePower;
  setPowerGauge(chargePower, previousPowerValue);
  if (ratio < 1) {
    chargeFrame = requestAnimationFrame(updateShotCharge);
  }
}

function startShotCharge(event) {
  if (!canFireShot()) return;
  event?.preventDefault?.();
  ensureAudio();
  isChargingShot = true;
  previousPowerValue = Number(powerInput.value) || 60;
  chargePower = POWER_MIN;
  chargeStartTime = performance.now();
  powerInput.value = chargePower;
  powerValue.textContent = chargePower;
  setPowerGauge(chargePower, previousPowerValue);
  fireButton.classList.add("is-charging");
  fireButton.textContent = "Hold";
  if (event?.pointerId !== undefined) {
    try {
      fireButton.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is best-effort on older mobile browsers.
    }
  }
  if (chargeFrame) cancelAnimationFrame(chargeFrame);
  chargeFrame = requestAnimationFrame(updateShotCharge);
}

async function releaseShotCharge(event) {
  if (!isChargingShot) return;
  event?.preventDefault?.();
  isChargingShot = false;
  if (chargeFrame) cancelAnimationFrame(chargeFrame);
  chargeFrame = null;
  fireButton.classList.remove("is-charging");
  fireButton.textContent = "Fire";
  powerInput.value = Math.round(chargePower);
  powerValue.textContent = powerInput.value;
  setPowerGauge(Number(powerInput.value), previousPowerValue);
  try {
    await sendControlsNow(1800);
  } catch (error) {
    // Fire anyway; the next state sync will correct the UI if the input post failed.
  }
  postJson("/fire", { id: clientId }).catch(() => {});
}

function cancelShotCharge() {
  if (!isChargingShot) return;
  isChargingShot = false;
  if (chargeFrame) cancelAnimationFrame(chargeFrame);
  chargeFrame = null;
  fireButton.classList.remove("is-charging");
  fireButton.textContent = "Fire";
  powerInput.value = Math.round(previousPowerValue);
  powerValue.textContent = powerInput.value;
  setPowerGauge(Number(powerInput.value), previousPowerValue);
}

function move(direction) {
  postJson("/move", { id: clientId, direction }).catch(() => {});
}

function activateProjectileSpecial() {
  postJson("/boost", { id: clientId }, 1800).catch(() => {});
}

function boostCruise() {
  activateProjectileSpecial();
}

function startCruiseBoost(event) {
  if (!activeCruiseProjectile()) return;
  event.preventDefault();
  ensureAudio();
  if (cruiseBoostTimer) return;
  boostCruise();
  cruiseBoostTimer = window.setInterval(() => {
    if (activeCruiseProjectile()) {
      boostCruise();
    } else {
      stopCruiseBoost();
    }
  }, 80);
}

function stopCruiseBoost() {
  if (!cruiseBoostTimer) return;
  window.clearInterval(cruiseBoostTimer);
  cruiseBoostTimer = null;
}

function moveWhileHolding(direction) {
  move(direction);
}

function stopMoveHold() {
  if (!moveHoldTimer) return;
  window.clearInterval(moveHoldTimer);
  moveHoldTimer = null;
  moveHoldDirection = 0;
}

function startMoveHoldDirection(direction) {
  const button = direction < 0 ? moveLeftButton : moveRightButton;
  if (button.disabled) return;
  if (moveHoldDirection === direction && moveHoldTimer) return;
  ensureAudio();
  stopMoveHold();
  moveHoldDirection = direction;
  moveWhileHolding(direction);
  moveHoldTimer = window.setInterval(() => {
    if (!moveHoldDirection) return;
    const activeButton = moveHoldDirection < 0 ? moveLeftButton : moveRightButton;
    if (activeButton.disabled) {
      stopMoveHold();
      return;
    }
    moveWhileHolding(moveHoldDirection);
  }, 80);
}

function startMoveHold(event, direction) {
  if (event.currentTarget.disabled) return;
  event.preventDefault();
  event.stopPropagation();
  startMoveHoldDirection(direction);
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch (error) {
    // Pointer capture is best-effort on older mobile browsers.
  }
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

function cheeseStackCount(player) {
  return Math.max(0, Math.floor(player.cheeseStacks || 0));
}

function tankSizeMultiplier(player) {
  return clamp(1 + cheeseStackCount(player) * CHEESE_SCALE_PER_STACK, 1, CHEESE_MAX_SCALE);
}

function tankDrawScale(player) {
  return TANK_SCALE * tankSizeMultiplier(player);
}

function drawTank(player, index) {
  if (player.health <= 0) {
    drawDestroyedTank(player);
    return;
  }

  const active = latest && index === latest.current && latest.winner === null;
  const sprite = sprites.tanks[index % sprites.tanks.length];
  const size = tankSizeMultiplier(player);
  const scale = tankDrawScale(player);
  if (sprite.complete && sprite.naturalWidth) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angleBody);
    ctx.scale(scale, scale);
    ctx.drawImage(sprite, -31, -30, 62, 38);
    ctx.restore();

    drawTankTypeTrim(player);
    drawTankBarrels(player);

    if (active) {
      ctx.strokeStyle = "#fff1a8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y - 4 * size, 14 * size, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
    return;
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angleBody);
  ctx.scale(scale, scale);
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
    ctx.arc(player.x, player.y - 4 * size, 20 * size, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
}

function drawDestroyedTank(player) {
  const scale = tankDrawScale(player);
  ctx.save();
  ctx.translate(player.x, player.y + 1 * scale);
  ctx.rotate(player.angleBody + 0.08);
  ctx.scale(scale, scale);

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
  const isActive = latest && !player.isDummy && index === latest.current && latest.winner === null;
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
  const y = Math.max(22, player.y - 42 * tankSizeMultiplier(player));
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

function formatPoopDamageMultiplier(stacks) {
  return String(Math.max(1, stacks));
}

function drawPoopStacks() {
  if (!latest) return;
  latest.players.forEach((player) => {
    const stacks = Math.max(0, Math.floor(player.poopStacks || 0));
    if (!stacks || player.health <= 0) return;

    const label = `똥 x${formatPoopDamageMultiplier(stacks)}`;
    ctx.save();
    ctx.font = "800 11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const width = Math.max(62, ctx.measureText(label).width + 25);
    const height = 18;
    const x = clamp(player.x, width / 2 + 6, W - width / 2 - 6);
    const nameY = Math.max(22, player.y - 42 * tankSizeMultiplier(player));
    const y = Math.max(12, nameY - (cheeseStackCount(player) ? 46 : 24));

    ctx.fillStyle = "rgba(75, 44, 24, 0.92)";
    roundRect(x - width / 2, y - height / 2, width, height, 7);
    ctx.fill();
    ctx.strokeStyle = "#d59b55";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#8b5a2b";
    ctx.beginPath();
    ctx.arc(x - width / 2 + 9, y + 2, 4.2, 0, Math.PI * 2);
    ctx.arc(x - width / 2 + 14, y - 2, 4.8, 0, Math.PI * 2);
    ctx.arc(x - width / 2 + 19, y + 2, 3.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffdca8";
    ctx.fillText(label, x - width / 2 + 24, y + 0.2);
    ctx.restore();
  });
}

function drawCheeseStacks() {
  if (!latest) return;
  latest.players.forEach((player) => {
    const stacks = cheeseStackCount(player);
    if (!stacks || player.health <= 0) return;

    const label = `치즈 x${stacks}`;
    ctx.save();
    ctx.font = "800 11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const width = Math.max(68, ctx.measureText(label).width + 28);
    const height = 18;
    const x = clamp(player.x, width / 2 + 6, W - width / 2 - 6);
    const nameY = Math.max(22, player.y - 42 * tankSizeMultiplier(player));
    const y = Math.max(12, nameY - 24);

    ctx.fillStyle = "rgba(86, 57, 8, 0.92)";
    roundRect(x - width / 2, y - height / 2, width, height, 7);
    ctx.fill();
    ctx.strokeStyle = "#ffd84d";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#ffd84d";
    ctx.beginPath();
    ctx.moveTo(x - width / 2 + 7, y + 5);
    ctx.lineTo(x - width / 2 + 22, y);
    ctx.lineTo(x - width / 2 + 17, y - 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#9f7113";
    [[13, -1, 1.8], [18, 2, 1.4]].forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.arc(x - width / 2 + dx, y + dy, r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#fff2a0";
    ctx.fillText(label, x - width / 2 + 27, y + 0.2);
    ctx.restore();
  });
}

function drawShieldStates() {
  if (!latest) return;
  latest.players.forEach((player) => {
    if (tankType(player) !== "shield" || player.health <= 0) return;
    const size = tankSizeMultiplier(player);
    const radius = 26 * size;
    const centerY = player.y - 8 * size;
    ctx.save();
    if (player.shieldActive) {
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(player.x, centerY, radius * 0.35, player.x, centerY, radius * 1.28);
      glow.addColorStop(0, "rgba(216, 255, 255, 0.05)");
      glow.addColorStop(0.58, "rgba(109, 231, 255, 0.18)");
      glow.addColorStop(1, "rgba(47, 125, 255, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(player.x, centerY, radius * 1.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(216, 255, 255, 0.82)";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(player.x, centerY, radius, Math.PI * 0.08, Math.PI * 1.92);
      ctx.stroke();
      ctx.strokeStyle = "rgba(47, 125, 255, 0.58)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(player.x, centerY, radius + 3, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
    } else if ((player.shieldCooldown || 0) > 0) {
      const label = `${player.shieldCooldown}`;
      const y = Math.max(12, player.y - 66 * size);
      ctx.font = "900 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(8, 18, 30, 0.82)";
      ctx.beginPath();
      ctx.arc(player.x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(109, 231, 255, 0.8)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = "#d8ffff";
      ctx.fillText(label, player.x, y + 0.4);
    }
    ctx.restore();
  });
}

function drawMoveBars() {
  if (!latest) return;
  latest.players.forEach((player, index) => {
    if (player.isDummy) return;
    if (player.health <= 0) return;
    const size = tankSizeMultiplier(player);
    const width = 32 * Math.min(1.35, size);
    const height = 5;
    const ratio = clamp((player.moveRemaining || 0) / 150, 0, 1);
    const x = player.x - width / 2;
    const y = player.y + 11 * size;
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

function aimMinForPlayer(player) {
  return tankType(player) === "laser" ? LASER_AIM_MIN : AIM_MIN;
}

function applyAimInputBounds(player) {
  const min = aimMinForPlayer(player || {});
  angleInput.min = String(min);
  angleInput.max = String(AIM_MAX);
  if (Number(angleInput.value) < min) angleInput.value = min;
  if (Number(angleInput.value) > AIM_MAX) angleInput.value = AIM_MAX;
}

function setAimFromDialPointer(event) {
  const activePlayer = latest?.players?.[latest.current];
  if (!activePlayer || angleInput.disabled || !aimDial) return;
  event.preventDefault();
  const rect = aimDial.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const desired = Math.atan2(event.clientY - centerY, event.clientX - centerX);
  const local = normalizeRadians(desired - (activePlayer.angleBody || 0));
  const aimRadians = activePlayer.dir === 1
    ? normalizeRadians(-local)
    : normalizeRadians(local - Math.PI);
  const aim = clamp(Math.round(aimRadians * 180 / Math.PI), aimMinForPlayer(activePlayer), AIM_MAX);
  angleInput.value = aim;
  angleValue.textContent = aim;
  updateAimDial(activePlayer);
  sendControls();
}

function startAimDialDrag(event) {
  if (angleInput.disabled) return;
  isDialDragging = true;
  try {
    aimDial.setPointerCapture(event.pointerId);
  } catch (error) {
    // Pointer capture is best-effort on older mobile browsers.
  }
  setAimFromDialPointer(event);
}

function stopAimDialDrag() {
  isDialDragging = false;
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
  const scale = tankDrawScale(player);
  ctx.scale(scale, scale);

  if (type === "dragon") {
    const body = ctx.createLinearGradient(-33, -32, 34, 10);
    body.addColorStop(0, "#4b5058");
    body.addColorStop(0.2, "#101317");
    body.addColorStop(1, "#020304");
    ctx.fillStyle = body;
    roundRect(-32, -16, 64, 30, 8);
    ctx.fill();
    roundRect(-19, -32, 38, 23, 9);
    ctx.fill();
    ctx.fillStyle = "#ff5a1f";
    ctx.beginPath();
    ctx.moveTo(15, -31);
    ctx.lineTo(30, -44);
    ctx.lineTo(27, -24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-15, -31);
    ctx.lineTo(-30, -44);
    ctx.lineTo(-27, -24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffcf5a";
    ctx.beginPath();
    ctx.arc(player.dir === 1 ? 9 : -9, -23, 3.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "shield") {
    const armor = ctx.createLinearGradient(-33, -30, 34, 12);
    armor.addColorStop(0, "#d8ffff");
    armor.addColorStop(0.38, "#6de7ff");
    armor.addColorStop(1, "#2f7dff");
    ctx.fillStyle = armor;
    roundRect(-32, -16, 64, 30, 9);
    ctx.fill();
    roundRect(-18, -31, 36, 22, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(216, 255, 255, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -21, 18, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    roundRect(-24, -24, 48, 4, 2);
    ctx.fill();
  } else if (type === "multi") {
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
  } else if (type === "cruise") {
    ctx.fillStyle = "rgba(114, 167, 255, 0.95)";
    roundRect(-27, -28, 54, 10, 5);
    ctx.fill();
    ctx.fillStyle = "#c7e2ff";
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(-15, -21);
    ctx.lineTo(15, -21);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#264a85";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, -16);
    ctx.lineTo(24, -16);
    ctx.stroke();
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
  } else if (type === "superball") {
    ctx.globalCompositeOperation = "lighter";
    [-24, -12, 0, 12, 24].forEach((x, index) => {
      const shine = ctx.createRadialGradient(x - 2, -27, 1, x, -24, 8);
      shine.addColorStop(0, "#ffffff");
      shine.addColorStop(0.55, "#eaf7ff");
      shine.addColorStop(1, "#a9c7f2");
      ctx.fillStyle = shine;
      ctx.beginPath();
      ctx.arc(x, -24 - (index % 2) * 3, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#d7e8ff";
    roundRect(-34, -16, 68, 9, 5);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (type === "laser") {
    ctx.strokeStyle = "#5df6ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, -24);
    ctx.lineTo(20, -24);
    ctx.stroke();
    ctx.fillStyle = "#d8ffff";
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "chain") {
    ctx.strokeStyle = "#d7dde4";
    ctx.lineWidth = 3;
    [-12, 0, 12].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, -24, 6, 0, Math.PI * 2);
      ctx.stroke();
    });
  } else if (type === "poop") {
    ctx.fillStyle = "#8b5a2b";
    ctx.beginPath();
    ctx.arc(-8, -22, 6, 0, Math.PI * 2);
    ctx.arc(1, -26, 7, 0, Math.PI * 2);
    ctx.arc(10, -21, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "nuke") {
    ctx.fillStyle = "#2a1111";
    roundRect(-26, -31, 52, 18, 7);
    ctx.fill();
    ctx.strokeStyle = "#ff3030";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-18, -22);
    ctx.lineTo(18, -22);
    ctx.moveTo(0, -36);
    ctx.lineTo(0, -8);
    ctx.stroke();
    ctx.fillStyle = "#ffd15c";
    ctx.beginPath();
    ctx.arc(0, -22, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "cheese") {
    ctx.fillStyle = "#ffd84d";
    ctx.beginPath();
    ctx.moveTo(-26, -15);
    ctx.lineTo(24, -31);
    ctx.lineTo(17, -10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#b98418";
    [[-9, -18, 3], [7, -21, 2.6], [15, -14, 2.2]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = "rgba(255, 246, 166, 0.78)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-23, -13);
    ctx.lineTo(18, -27);
    ctx.stroke();
  } else if (type === "zombie") {
    const rock = ctx.createRadialGradient(-6, -28, 4, 0, -24, 24);
    rock.addColorStop(0, "#9aa094");
    rock.addColorStop(0.62, "#5d6158");
    rock.addColorStop(1, "#252922");
    ctx.fillStyle = rock;
    ctx.beginPath();
    ctx.ellipse(0, -23, 28, 18, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(180, 190, 174, 0.55)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#6fe36f";
    ctx.beginPath();
    ctx.arc(-4, -23, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#17351a";
    [-7, -1].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, -25, 1.4, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === "healing") {
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(0, -23, 3, 0, -23, 25);
    glow.addColorStop(0, "rgba(255, 255, 210, 0.95)");
    glow.addColorStop(0.42, "rgba(143, 255, 232, 0.65)");
    glow.addColorStop(1, "rgba(143, 255, 232, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -23, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff7a8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -39);
    ctx.lineTo(0, -10);
    ctx.moveTo(-15, -24);
    ctx.lineTo(15, -24);
    ctx.stroke();
  } else if (type === "heart") {
    ctx.fillStyle = "#ff85c8";
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.bezierCurveTo(-22, -32, -38, -8, 0, 15);
    ctx.bezierCurveTo(38, -8, 22, -32, 0, -13);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 214, 239, 0.85)";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (type === "butt") {
    const skin = ctx.createRadialGradient(-6, -26, 3, 0, -21, 25);
    skin.addColorStop(0, "#ffe0c9");
    skin.addColorStop(0.55, "#f0b28f");
    skin.addColorStop(1, "#9d5d45");
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(-9, -22, 13, 0, Math.PI * 2);
    ctx.arc(9, -22, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(94, 43, 34, 0.55)";
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(0, -22, 0, -10);
    ctx.stroke();
  } else if (type === "boing") {
    ctx.strokeStyle = "#f0dcff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const x = -18 + i * 9;
      ctx.arc(x, -23, 5, Math.PI * 0.2, Math.PI * 1.8);
    }
    ctx.stroke();
    ctx.fillStyle = "#b68cff";
    ctx.beginPath();
    ctx.arc(-23, -23, 5, 0, Math.PI * 2);
    ctx.arc(23, -23, 5, 0, Math.PI * 2);
    ctx.fill();
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
  if (type === "dragon") {
    drawBarrel(player, undefined, 0, { length: 34, thickness: 12, tip: 8, accent: "#ff5a1f" });
  } else if (type === "shield") {
    drawBarrel(player, undefined, 0, { length: 30, thickness: 8, tip: 6, accent: "#2f7dff" });
  } else if (type === "multi") {
    [-8, 0, 8].forEach((offset) => drawBarrel(player, undefined, offset, { length: 27, thickness: 4, tip: 3, accent: "#74d7ff" }));
  } else if (type === "red") {
    drawBarrel(player, undefined, 0, { length: 25, thickness: 9, tip: 6, accent: "#ff3030" });
  } else if (type === "missile") {
    drawBarrel(player, undefined, 0, { length: 34, thickness: 5, tip: 5, accent: "#39ff14", fins: true });
  } else if (type === "cruise") {
    drawBarrel(player, undefined, 0, { length: 43, thickness: 6, tip: 5, accent: "#72a7ff", fins: true });
  } else if (type === "super") {
    [-12, -6, 0, 6, 12].forEach((offset, index) => {
      drawBarrel(player, undefined, offset, { length: 34, thickness: 3.6, tip: 4, accent: SUPER_MISSILE_COLORS[index], fins: true });
    });
  } else if (type === "superball") {
    [-12, -6, 0, 6, 12].forEach((offset) => {
      drawBarrel(player, undefined, offset, { length: 31, thickness: 4.8, tip: 5, accent: "#ffffff" });
    });
  } else if (type === "laser") {
    drawBarrel(player, undefined, 0, { length: 42, thickness: 4, tip: 6, accent: "#5df6ff" });
  } else if (type === "chain") {
    drawBarrel(player, undefined, 0, { length: 31, thickness: 7, tip: 5, accent: "#c8d0d8" });
  } else if (type === "poop") {
    drawBarrel(player, undefined, 0, { length: 26, thickness: 8, tip: 6, accent: "#8b5a2b" });
  } else if (type === "nuke") {
    drawBarrel(player, undefined, 0, { length: 38, thickness: 9, tip: 7, accent: "#ff3030" });
  } else if (type === "cheese") {
    drawBarrel(player, undefined, 0, { length: 31, thickness: 8, tip: 6, accent: "#ffd84d" });
  } else if (type === "zombie") {
    drawBarrel(player, undefined, 0, { length: 32, thickness: 9, tip: 6, accent: "#5d6158" });
  } else if (type === "healing") {
    drawBarrel(player, undefined, 0, { length: 32, thickness: 7, tip: 6, accent: "#8fffe8" });
  } else if (type === "heart") {
    drawBarrel(player, undefined, 0, { length: 30, thickness: 8, tip: 6, accent: "#ff85c8" });
  } else if (type === "butt") {
    drawBarrel(player, undefined, 0, { length: 27, thickness: 9, tip: 6, accent: "#f0b28f" });
  } else if (type === "boing") {
    drawBarrel(player, undefined, 0, { length: 30, thickness: 7, tip: 7, accent: "#b68cff" });
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
  const scale = tankDrawScale(player);
  ctx.save();
  ctx.translate(player.x, player.y - 12 * scale);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
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
  const amount = clamp(((p.age || 0) - ARTILLERY_GROW_START) / ARTILLERY_GROW_DURATION, 0, 1);
  const scale = 0.45 + amount * 2.75;
  return {
    width: 22 * scale,
    height: 11 * scale,
    scale,
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
  if (p.tankType === "cruise") return "rgba(114, 167, 255, 0.9)";
  if (p.tankType === "artillery") return hexToRgba(artilleryProjectileColor(p), 0.82);
  if (p.tankType === "chain") return "rgba(220, 230, 240, 0.86)";
  if (p.tankType === "poop") return "rgba(132, 82, 38, 0.84)";
  if (p.tankType === "nuke") return "rgba(255, 48, 48, 0.9)";
  if (p.tankType === "cheese") return "rgba(255, 216, 77, 0.92)";
  if (p.tankType === "zombie") return "rgba(111, 227, 111, 0.84)";
  if (p.tankType === "healing") return "rgba(143, 255, 232, 0.9)";
  if (p.tankType === "heart") return "rgba(255, 94, 189, 0.88)";
  if (p.tankType === "butt") return "rgba(240, 178, 143, 0.84)";
  if (p.tankType === "poopdrop") return "rgba(132, 82, 38, 0.84)";
  if (p.tankType === "boing") return "rgba(182, 140, 255, 0.9)";
  if (p.tankType === "superball") return "rgba(255, 255, 255, 0.9)";
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

function drawChainProjectile() {
  const metal = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7);
  metal.addColorStop(0, "#f4f7fb");
  metal.addColorStop(0.42, "#aeb8c3");
  metal.addColorStop(1, "#3b444e");
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(20, 25, 31, 0.9)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  return true;
}

function drawPoopProjectile() {
  const mud = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7);
  mud.addColorStop(0, "#d59b55");
  mud.addColorStop(0.55, "#8b5a2b");
  mud.addColorStop(1, "#4b2d18");
  ctx.fillStyle = mud;
  ctx.beginPath();
  ctx.arc(-2, 1, 5, 0, Math.PI * 2);
  ctx.arc(3, -1, 4.5, 0, Math.PI * 2);
  ctx.fill();
  return true;
}

function drawNukeProjectile() {
  const core = ctx.createRadialGradient(-3, -2, 1, 0, 0, 8);
  core.addColorStop(0, "#fff4c8");
  core.addColorStop(0.35, "#ff3030");
  core.addColorStop(1, "#420606");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 209, 92, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  return true;
}

function drawCheeseProjectile(p) {
  const level = Math.max(0, Math.min(3, p.cheeseLevel || 0));
  const scale = 1 - level * 0.08;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffd84d";
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-8, -7);
  ctx.lineTo(-5, 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#fff2a0";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#b98418";
  [[-3, -2, 1.6], [1.8, 1.5, 1.2], [-5, 3.6, 1]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
  return true;
}

function drawZombieStoneProjectile() {
  const rock = ctx.createRadialGradient(-3, -3, 1, 0, 0, 9);
  rock.addColorStop(0, "#b7beb0");
  rock.addColorStop(0.58, "#696f66");
  rock.addColorStop(1, "#242921");
  ctx.fillStyle = rock;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 7, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(185, 195, 178, 0.55)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = "rgba(111, 227, 111, 0.76)";
  ctx.beginPath();
  ctx.arc(-2, -1, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#163018";
  ctx.beginPath();
  ctx.arc(-3.2, -2, 0.7, 0, Math.PI * 2);
  ctx.arc(-0.8, -2, 0.7, 0, Math.PI * 2);
  ctx.fill();
  return true;
}

function drawHealingProjectile() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
  glow.addColorStop(0, "rgba(255, 255, 210, 0.95)");
  glow.addColorStop(0.42, "rgba(143, 255, 232, 0.7)");
  glow.addColorStop(1, "rgba(143, 255, 232, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 247, 168, 0.95)";
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, 8);
  ctx.moveTo(-8, 0);
  ctx.lineTo(8, 0);
  ctx.stroke();
  ctx.restore();
  return true;
}

function drawHeartProjectile(p) {
  const scale = clamp(p.heartScale || 1, 0.55, 3.6);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ff5ebd";
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.bezierCurveTo(-18, -4, -11, -18, 0, -9);
  ctx.bezierCurveTo(11, -18, 18, -4, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 214, 239, 0.9)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
  ctx.beginPath();
  ctx.arc(-4, -7, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return true;
}

function drawButtProjectile() {
  const skin = ctx.createRadialGradient(-2, -3, 1, 0, 0, 9);
  skin.addColorStop(0, "#ffe0c9");
  skin.addColorStop(0.55, "#f0b28f");
  skin.addColorStop(1, "#9d5d45");
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(-4.4, 0, 6.2, 0, Math.PI * 2);
  ctx.arc(4.4, 0, 6.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(94, 43, 34, 0.55)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -5.8);
  ctx.quadraticCurveTo(0, 0, 0, 5.8);
  ctx.stroke();
  return true;
}

function drawBoingProjectile() {
  ctx.strokeStyle = "#f0dcff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 4; i += 1) {
    ctx.arc(-6 + i * 4, 0, 3.6, Math.PI * 0.25, Math.PI * 1.75);
  }
  ctx.stroke();
  const orb = ctx.createRadialGradient(-2, -3, 1, 0, 0, 8);
  orb.addColorStop(0, "#ffffff");
  orb.addColorStop(0.45, "#b68cff");
  orb.addColorStop(1, "#5a2f9b");
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(8, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  return true;
}

function superballProjectileScale(p) {
  const mass = clamp(p.superballMass || 1, 1, 8);
  return 0.78 + Math.sqrt(mass) * 0.34;
}

function drawSuperballProjectile(p) {
  const scale = superballProjectileScale(p);
  ctx.save();
  ctx.scale(scale, scale);
  const ball = ctx.createRadialGradient(-2.4, -2.8, 0.8, 0, 0, 7.2);
  ball.addColorStop(0, "#ffffff");
  ball.addColorStop(0.42, "#f6fbff");
  ball.addColorStop(0.78, "#cdddf2");
  ball.addColorStop(1, "#8aa5cf");
  ctx.fillStyle = ball;
  ctx.beginPath();
  ctx.arc(0, 0, 7.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  if ((p.superballLevel || 0) >= 2 || (p.superballMass || 1) > 1) {
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(234, 247, 255, ${0.38 + Math.min(0.32, (p.superballMass || 1) * 0.04)})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 10.2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  return true;
}

function drawArtilleryProjectile(p) {
  const tint = artilleryProjectileColor(p);
  const size = artilleryProjectileSize(p);
  const drawn = drawShellProjectile(size.width, size.height, tint, 0.52);
  if (!drawn) {
    const shell = ctx.createLinearGradient(-size.width / 2, -size.height / 2, size.width / 2, size.height / 2);
    shell.addColorStop(0, "#f2e8ff");
    shell.addColorStop(0.42, tint);
    shell.addColorStop(1, "#1e1728");
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.ellipse(0, 0, size.width / 2, size.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = hexToRgba(tint, 0.12 + size.charge * 0.24);
  ctx.beginPath();
  ctx.ellipse(0, 0, size.width * 0.64, size.height * 0.76, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return true;
}

function cruiseProjectileScale(p) {
  const maxAge = p.maxAge || 10;
  const ageRatio = clamp((p.age || 0) / Math.max(maxAge, 0.001), 0, 1);
  return 1 - ageRatio * 0.62;
}

function drawCruiseProjectile(p) {
  const color = "#72a7ff";
  const scale = cruiseProjectileScale(p);
  const boosting = (p.boostTime || 0) > 0;
  if (drawSheetProjectile("blueRocket", 30 * scale, 13 * scale, color, 0.62)) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(114, 167, 255, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 19 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = boosting
      ? `rgba(255, 245, 160, ${0.38 + scale * 0.38})`
      : `rgba(255, 230, 130, ${0.18 + scale * 0.27})`;
    ctx.beginPath();
    ctx.ellipse(-18 * scale, 0, (8 + Math.sin((p.age || 0) * 22) * 2 + (boosting ? 6 : 0)) * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
  }

  ctx.save();
  ctx.scale(scale, scale);
  const body = ctx.createLinearGradient(-14, -5, 16, 5);
  body.addColorStop(0, "#1c2e4f");
  body.addColorStop(0.55, color);
  body.addColorStop(1, "#eaf4ff");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(8, -5);
  ctx.lineTo(-13, -5);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-13, 5);
  ctx.lineTo(8, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#264a85";
  ctx.beginPath();
  ctx.moveTo(-5, -5);
  ctx.lineTo(-14, -12);
  ctx.lineTo(-11, -4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-5, 5);
  ctx.lineTo(-14, 12);
  ctx.lineTo(-11, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
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
  if (type === "chain") {
    return drawChainProjectile();
  }
  if (type === "poop" || type === "poopdrop") {
    return drawPoopProjectile();
  }
  if (type === "nuke") {
    return drawNukeProjectile();
  }
  if (type === "cheese") {
    return drawCheeseProjectile(p);
  }
  if (type === "zombie") {
    return drawZombieStoneProjectile();
  }
  if (type === "healing") {
    return drawHealingProjectile();
  }
  if (type === "heart") {
    return drawHeartProjectile(p);
  }
  if (type === "butt") {
    return drawButtProjectile();
  }
  if (type === "boing") {
    return drawBoingProjectile();
  }
  if (type === "superball") {
    return drawSuperballProjectile(p);
  }
  if (type === "cruise") {
    return drawCruiseProjectile(p);
  }
  if (type === "artillery") {
    return drawArtilleryProjectile(p);
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
  const visualScale = p.tankType === "cruise"
    ? cruiseProjectileScale(p)
    : p.tankType === "heart" ? clamp(p.heartScale || 1, 0.55, 3.6)
      : p.tankType === "superball" ? superballProjectileScale(p) : 1;
  const tailX = p.x - Math.cos(flightAngle) * 14 * visualScale;
  const tailY = p.y - Math.sin(flightAngle) * 14 * visualScale;
  const trail = ctx.createLinearGradient(tailX, tailY, p.x, p.y);
  trail.addColorStop(0, "rgba(255, 215, 120, 0)");
  trail.addColorStop(1, projectileTrailColor(p));
  ctx.strokeStyle = trail;
  ctx.lineWidth = p.tankType === "red" ? 4 : (p.tankType === "missile" || p.tankType === "super" || p.tankType === "cruise" || p.tankType === "heart" || p.tankType === "superball") ? Math.max(1, 2 * visualScale) : 3;
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

function drawZombies() {
  (latest?.zombies || []).forEach((zombie) => {
    const age = zombie.age || 0;
    const bob = Math.sin(age * 10) * 1.6;
    const dir = zombie.dir === -1 ? -1 : 1;
    ctx.save();
    ctx.translate(zombie.x, zombie.y + bob);
    ctx.scale(dir, 1);
    ctx.fillStyle = "rgba(25, 22, 18, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6fe36f";
    roundRect(-7, -21, 14, 19, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -26, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#214321";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7, -15);
    ctx.lineTo(-14, -9 + Math.sin(age * 18) * 4);
    ctx.moveTo(7, -15);
    ctx.lineTo(15, -12 + Math.cos(age * 18) * 4);
    ctx.stroke();
    ctx.fillStyle = "#133018";
    ctx.beginPath();
    ctx.arc(-3, -28, 1.3, 0, Math.PI * 2);
    ctx.arc(3, -28, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(12, 40, 14, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-3, -23);
    ctx.lineTo(3, -22);
    ctx.stroke();
    ctx.restore();
  });
}

function drawNukeMarks() {
  (latest?.nukeMarks || []).forEach((mark) => {
    ctx.save();
    ctx.translate(mark.x, mark.y);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255, 48, 48, 0.92)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.moveTo(-24, 0);
    ctx.lineTo(-7, 0);
    ctx.moveTo(7, 0);
    ctx.lineTo(24, 0);
    ctx.moveTo(0, -24);
    ctx.lineTo(0, -7);
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 24);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 209, 92, 0.72)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawEffects() {
  (latest?.effects || []).forEach((effect) => {
    const fade = clamp(effect.life / (effect.maxLife || 10), 0, 1);
    if (effect.type === "laser") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(216, 255, 255, ${0.9 * fade})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(effect.x1, effect.y1);
      ctx.lineTo(effect.x2, effect.y2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(93, 246, 255, ${0.55 * fade})`;
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.moveTo(effect.x1, effect.y1);
      ctx.lineTo(effect.x2, effect.y2);
      ctx.stroke();
      ctx.restore();
    } else if (effect.type === "dragon-flame") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      const width = effect.width || 34;
      const shimmer = Math.sin((effect.life || 0) * 1.7) * 3;
      const flame = ctx.createLinearGradient(effect.x1, effect.y1, effect.x2, effect.y2);
      flame.addColorStop(0, `rgba(255, 245, 150, ${0.92 * fade})`);
      flame.addColorStop(0.36, `rgba(255, 92, 31, ${0.86 * fade})`);
      flame.addColorStop(1, `rgba(95, 18, 4, ${0.05 * fade})`);
      ctx.strokeStyle = flame;
      ctx.lineWidth = width + shimmer;
      ctx.beginPath();
      ctx.moveTo(effect.x1, effect.y1);
      ctx.lineTo(effect.x2, effect.y2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 207, 90, ${0.92 * fade})`;
      ctx.lineWidth = Math.max(8, width * 0.34);
      ctx.beginPath();
      ctx.moveTo(effect.x1, effect.y1);
      ctx.lineTo(effect.x2, effect.y2);
      ctx.stroke();
      ctx.restore();
    } else if (effect.type === "nuke-mark") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255, 48, 48, ${0.7 * fade})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 12 + (1 - fade) * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (effect.type === "nuke") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const radius = 60 + (1 - fade) * 150;
      const glow = ctx.createRadialGradient(effect.x, effect.y, 4, effect.x, effect.y, radius);
      glow.addColorStop(0, `rgba(255, 245, 190, ${0.95 * fade})`);
      glow.addColorStop(0.22, `rgba(255, 48, 48, ${0.52 * fade})`);
      glow.addColorStop(1, "rgba(255, 48, 48, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (effect.type === "heal") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const pulse = 16 + (1 - fade) * 34;
      const glow = ctx.createRadialGradient(effect.x, effect.y, 2, effect.x, effect.y, pulse);
      glow.addColorStop(0, `rgba(255, 255, 205, ${0.9 * fade})`);
      glow.addColorStop(0.42, `rgba(143, 255, 232, ${0.48 * fade})`);
      glow.addColorStop(1, "rgba(143, 255, 232, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 247, 168, ${0.85 * fade})`;
      ctx.lineWidth = 2.4;
      for (let i = 0; i < 6; i += 1) {
        const angle = i * Math.PI / 3 + (1 - fade) * 1.8;
        const sx = effect.x + Math.cos(angle) * (10 + i % 2 * 7);
        const sy = effect.y + Math.sin(angle) * (10 + i % 2 * 7);
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy);
        ctx.lineTo(sx + 4, sy);
        ctx.moveTo(sx, sy - 4);
        ctx.lineTo(sx, sy + 4);
        ctx.stroke();
      }
      ctx.restore();
    } else if (effect.type === "cheese-stack") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const pulse = 10 + (1 - fade) * 34;
      ctx.strokeStyle = `rgba(255, 216, 77, ${0.88 * fade})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 242, 160, ${0.9 * fade})`;
      ctx.font = "900 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`+${effect.stack || 1}`, effect.x, effect.y - 2);
      ctx.restore();
    } else if (effect.type === "shield-break" || effect.type === "shield-ready") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const ready = effect.type === "shield-ready";
      const radius = ready ? 18 + (1 - fade) * 24 : 38 - (1 - fade) * 16;
      ctx.strokeStyle = ready
        ? `rgba(216, 255, 255, ${0.86 * fade})`
        : `rgba(47, 125, 255, ${0.86 * fade})`;
      ctx.lineWidth = ready ? 3 : 5;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      if (!ready) {
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = `rgba(216, 255, 255, ${0.66 * fade})`;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius + 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    } else if (effect.type === "heart-shift") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const radius = (effect.scale || 1) * (12 + (1 - fade) * 20);
      ctx.strokeStyle = `rgba(255, 94, 189, ${0.7 * fade})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (effect.type === "butt-drop") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(139, 90, 43, ${0.32 * fade})`;
      ctx.beginPath();
      ctx.ellipse(effect.x, effect.y + (1 - fade) * 14, 26 * (1 - fade), 10 * fade, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (effect.type === "boing-jump") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const midX = (effect.x1 + effect.x2) / 2;
      const midY = Math.min(effect.y1, effect.y2) - 80 * fade;
      ctx.strokeStyle = `rgba(240, 220, 255, ${0.72 * fade})`;
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(effect.x1, effect.y1);
      ctx.quadraticCurveTo(midX, midY, effect.x2, effect.y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(182, 140, 255, ${0.7 * fade})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i += 1) {
        const radius = 10 + i * 8 + (1 - fade) * 16;
        ctx.beginPath();
        ctx.arc(effect.x2, effect.y2, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  });
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
    const size = tankSizeMultiplier(player);
    const width = 44 * Math.min(1.4, size);
    const height = 8;
    const y = player.y - 33 * size;
    const value = clamp(player.health, 0, 100) / 100;
    const healthColor = player.health <= 10 ? "#ff3030" : player.health <= 50 ? "#ffe23f" : "#39ff14";
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    roundRect(player.x - width / 2, y, width, height, 4);
    ctx.fill();
    ctx.fillStyle = healthColor;
    roundRect(player.x - width / 2, y, width * value, height, 4);
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
    drawNukeMarks();
    drawHealthBars();
    drawZombies();
    latest.players.forEach(drawTank);
    drawShieldStates();
    drawMoveBars();
    latest.players.forEach(drawNameTag);
    drawCheeseStacks();
    drawPoopStacks();
    drawProjectile();
    drawEffects();
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
moveLeftButton.addEventListener("pointerdown", (event) => startMoveHold(event, -1));
moveRightButton.addEventListener("pointerdown", (event) => startMoveHold(event, 1));
[moveLeftButton, moveRightButton].forEach((button) => {
  button.addEventListener("pointerup", stopMoveHold);
  button.addEventListener("pointercancel", stopMoveHold);
  button.addEventListener("lostpointercapture", stopMoveHold);
  button.addEventListener("click", (event) => event.preventDefault());
});
aimDial.addEventListener("pointerdown", startAimDialDrag);
aimDial.addEventListener("pointermove", (event) => {
  if (isDialDragging) setAimFromDialPointer(event);
});
aimDial.addEventListener("pointerup", stopAimDialDrag);
aimDial.addEventListener("pointercancel", stopAimDialDrag);
fireButton.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
  const special = activeSpecialProjectile();
  if (special?.cruise) {
    startCruiseBoost(event);
  } else if (special) {
    event.preventDefault();
    ensureAudio();
    activateProjectileSpecial();
  } else {
    startShotCharge(event);
  }
});
fireButton.addEventListener("pointerup", (event) => {
  event.stopPropagation();
  if (activeCruiseProjectile()) {
    stopCruiseBoost();
  } else if (activeSpecialProjectile()) {
    event.preventDefault();
  } else {
    releaseShotCharge(event);
  }
});
fireButton.addEventListener("pointerleave", () => {
  if (activeCruiseProjectile()) stopCruiseBoost();
});
fireButton.addEventListener("pointercancel", () => {
  stopCruiseBoost();
  cancelShotCharge();
});
fireButton.addEventListener("click", (event) => {
  event.preventDefault();
});
resetButton.addEventListener("click", resetGame);
window.addEventListener("beforeunload", closeEvents);

window.addEventListener("keydown", (event) => {
  if (!loginOverlay.classList.contains("hidden")) return;
  const special = activeSpecialProjectile();
  if (special) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "a" || event.key === "A" || event.key === "d" || event.key === "D") {
      event.preventDefault();
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      if (special.cruise && !isSpaceCruiseBoosting) {
        isSpaceCruiseBoosting = true;
        startCruiseBoost(event);
      } else if (!special.cruise) {
        activateProjectileSpecial();
      }
    }
    return;
  }
  if (angleInput.disabled) return;
  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
    event.preventDefault();
    startMoveHoldDirection(-1);
    return;
  }
  if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
    event.preventDefault();
    startMoveHoldDirection(1);
    return;
  }
  const activePlayer = latest?.players?.[latest.current] || {};
  const minAim = aimMinForPlayer(activePlayer);
  if (event.key === "ArrowUp") {
    event.preventDefault();
    angleInput.value = clamp(Number(angleInput.value) + 1, minAim, AIM_MAX);
    sendControls();
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    angleInput.value = clamp(Number(angleInput.value) - 1, minAim, AIM_MAX);
    sendControls();
    return;
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (!isSpaceCharging) {
      isSpaceCharging = true;
      startShotCharge(event);
    }
    return;
  }
  sendControls();
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "a" || event.key === "A" || event.key === "d" || event.key === "D") {
    event.preventDefault();
    stopMoveHold();
    return;
  }
  if (event.code !== "Space") return;
  event.preventDefault();
  if (isSpaceCruiseBoosting) {
    isSpaceCruiseBoosting = false;
    stopCruiseBoost();
    return;
  }
  if (activeSpecialProjectile() || currentProjectiles().length) return;
  isSpaceCharging = false;
  releaseShotCharge(event);
});

nameInput.value = localStorage.getItem("skyBatteryName") || "";
angleValue.textContent = angleInput.value;
powerValue.textContent = powerInput.value;
setPowerGauge(Number(powerInput.value), previousPowerValue);
refreshLoginOptions();
setInterval(refreshLoginOptions, 2000);
render();
