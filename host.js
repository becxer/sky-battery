const countInput = document.getElementById("playerCount");
const countValue = document.getElementById("playerCountValue");
const statusText = document.getElementById("hostStatus");
const startButton = document.getElementById("startWorldButton");
const recreateButton = document.getElementById("recreateWorldButton");

function setStatus(text) {
  statusText.textContent = text;
}

async function postJson(path, body = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function refreshStatus() {
  const response = await fetch("/state", { cache: "no-store" });
  const state = await response.json();
  countInput.value = state.playerCount || 3;
  countValue.textContent = countInput.value;
  setStatus(state.phase === "setup"
    ? "Setup mode. Choose player count, then start the world."
    : `World running with ${state.playerCount} players.`);
}

countInput.addEventListener("input", () => {
  countValue.textContent = countInput.value;
});

startButton.addEventListener("click", async () => {
  startButton.disabled = true;
  try {
    const result = await postJson("/host/start", { count: Number(countInput.value) });
    setStatus(`World started with ${result.playerCount} players.`);
  } catch (error) {
    setStatus(`Start failed: ${error.message}`);
  } finally {
    startButton.disabled = false;
  }
});

recreateButton.addEventListener("click", async () => {
  recreateButton.disabled = true;
  try {
    await postJson("/host/recreate");
    setStatus("World recreated. Everyone was kicked back to setup.");
    await refreshStatus();
  } catch (error) {
    setStatus(`Recreate failed: ${error.message}`);
  } finally {
    recreateButton.disabled = false;
  }
});

refreshStatus().catch((error) => setStatus(`Status failed: ${error.message}`));
