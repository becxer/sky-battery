# Repository Guidelines

## Project Structure & Module Organization

Sky Battery is a local Wi-Fi browser artillery game. The authoritative game logic lives in `server.py`: player state, turn order, terrain generation, projectile physics, weapon effects, HTTP APIs, and SSE broadcasts. The browser client is in `game.js`, which renders the canvas, plays sounds, handles input, and posts control/fire/move requests back to the server. `index.html` and `style.css` define the mobile-first game screen; `host.html` and `host.js` provide the host page for player count and world recreation. Art assets are stored in `assets/`, while `vendor/` contains vendored libraries.

## Build, Test, and Development Commands

- `python server.py`: start the server on `0.0.0.0:4173`.
- `python -m py_compile server.py`: validate Python syntax before restarting the server.
- `Invoke-RestMethod http://127.0.0.1:4173/state`: smoke-test that the server responds.
- Open `http://<host-ip>:4173` on phones on the same Wi-Fi; use `http://<host-ip>:4173/host.html` for host controls.

There is no npm build step. Static file changes are served directly, but update the query string in `index.html` or `host.html` when changing JS/CSS so mobile browsers do not use stale cached files.

## Coding Style & Naming Conventions

Use 4-space indentation in Python and 2-space indentation in JavaScript, HTML, and CSS. Keep the server authoritative: clients should render state and send user intent, not decide hits, damage, terrain destruction, or turn advancement. Name new tank types with short lowercase keys such as `cheese` or `zombie`, and keep user-facing labels in the relevant metadata maps.

## Testing Guidelines

For server changes, run `python -m py_compile server.py`, restart the server, then check `/state`. For gameplay changes, test at least one turn through the browser and confirm projectiles collide with visible terrain/platforms only. For UI changes, verify both desktop and phone-sized layouts. When adding a tank, test its projectile, damage, sound trigger, terrain effect, turn completion, and KO behavior.

## Commit & Pull Request Guidelines

Use short imperative commit messages, for example `Add cheese splitter tank` or `Tune laser terrain carving`. Pull requests should summarize gameplay changes, list validation performed, and include screenshots or short clips for UI or rendering changes. Mention changed tuning constants when they affect balance.

## Agent-Specific Instructions

Work from `C:\Users\Tower\Desktop\projects\test`, not the transient attachment directory. Do not commit logs, caches, or local generated folders such as `server.out.log`, `server.err.log`, `__pycache__/`, or `NVIDIA Corporation/`. When implementing a tank, update `server.py` weapon behavior, `game.js` rendering/audio metadata, the login tank selector in `index.html`, and any cache-busting query strings together.
