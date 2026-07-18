# Sky Battery Design

## Goal

Sky Battery is a same-Wi-Fi, browser-based artillery game inspired by classic turn-based tank battles. The current final result supports one to six players, mobile controls, random destructible worlds, multiple tank classes, sounds, and a host page for recreating the world.

## Runtime Architecture

`server.py` is the single source of truth. It serves static files, owns all gameplay state, and exposes JSON endpoints such as `/join`, `/input`, `/move`, `/fire`, `/steer`, `/boost`, `/reset`, `/host/start`, and `/host/recreate`. It also streams state to clients through `/events` using Server-Sent Events.

`game.js` is a renderer and input client. It draws the 1200x600 canvas at a 2:1 ratio, handles mobile pointer controls and keyboard controls, plays generated audio cues, and posts user intent to the server. The client may locally predict simple projectile flight for smoother visuals, but it should never independently decide projectile collisions, damage, terrain removal, or turn order.

## World And Terrain

Each reset builds a random day or evening world. The ground uses rolling, valley, peak, or jagged height profiles, with extra floating platforms such as thin strips, steps, and island-like structures. Terrain and platforms are destructible. Explosions carve only visible solid geometry, and floating structures split or disappear only where the blast overlaps them. The initial ground is kept high enough to remain above the bottom controls, while tanks may fall under gravity and die if they reach the bottom of the screen.

## Turn And Control Model

The server advances turns after a shot and randomizes starting player and spawn order. Movement is limited per turn by `MOVE_LIMIT`, reduced by poop stacks, and shown as a bar under each tank. Holding left or right moves continuously in small steps. Direction can still change after movement is exhausted.

Mobile controls sit over the bottom of the game: left/right triangle buttons, a long power charge bar, an angle dial with a visible aim line, and a round Fire button. Holding Fire charges power, releasing fires. Keyboard controls mirror this: left/right arrows or A/D move, up/down adjust angle, and Space charges/fires. During a cruise missile flight, Space/Fire applies lift.

## Tank Roster

- `normal`: baseline shell and damage.
- `multi`: fires three normal black shells with slight angle spread.
- `red`: small red core shell with very narrow blast and high direct damage.
- `missile`: small fluorescent green seeker with low damage and stronger homing while descending.
- `artillery`: shell grows during flight; longer airtime increases shell size, damage, and blast radius.
- `laser`: fires a beam with a laser sound and carves a short path through terrain instead of a round crater.
- `chain`: bounces up to three times with chain-like impact sounds.
- `poop`: adds permanent poop stacks; stacks multiply later damage and halve movement per stack.
- `nuke`: first hit places a red target marker with light damage; a matching follow-up hit detonates a huge blast.
- `cruise`: launches a steerable missile; left/right steer and Space/Fire lifts it during flight.
- `cheese`: fires cheese that splits from one piece to two, four, then eight pieces.
- `zombie`: throws a stone; impact or graze spawns a zombie near the target tank, which follows and taps damage until hit once.
- `f1`: fires a checkered flag, then the tank races to that point and damages tanks crossed along the route.
- `super`: rare rainbow five-shot homing multi-missile tank.

## Reproduction Steps

1. Clone or open this repository at `C:\Users\Tower\Desktop\projects\test`.
2. Ensure Python 3 is available.
3. Run `python server.py`.
4. Open `http://127.0.0.1:4173` locally, or `http://<host-ip>:4173` from phones on the same Wi-Fi.
5. Use `http://<host-ip>:4173/host.html` to choose player count from 1 to 6. `Recreate World` returns all clients to setup and generates a fresh world.

## Extension Checklist

When adding a weapon or tank, update `TANK_TYPES` and weights in `server.py`, implement projectile behavior and damage resolution on the server, add render metadata and projectile visuals in `game.js`, add a tank option in `index.html`, add or reuse sounds, then test collision, terrain destruction, KO/retire behavior, and turn advancement.
