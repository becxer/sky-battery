# Sky Battery

Sky Battery is a local Wi-Fi browser artillery game developed by Eugene Back and Seohyun Back. One PC runs the Python server, and phones or browsers on the same network join as clients.

## Gameplay Snapshot

![Sky Battery gameplay screen](docs/sky-battery-gameplay.png)

Sky Battery uses a wide 20:9 battlefield with destructible terrain, floating platforms, wind, turn-based movement, and touch-friendly fire controls.

## Requirements

- Windows, macOS, or Linux with Python 3 installed
- Modern browser such as Chrome, Edge, or Safari
- All phones/clients connected to the same Wi-Fi as the server PC

No npm install or build step is required.

## Start The Server

From the project directory:

```powershell
cd C:\Users\Tower\Desktop\projects\sky-battery
python server.py
```

The server listens on port `4173`.

Local PC access:

```text
http://127.0.0.1:4173
```

Host control page:

```text
http://127.0.0.1:4173/host.html
```

## Connect From Phones

Find the server PC's Wi-Fi IP address:

```powershell
ipconfig
```

Look for the IPv4 address on the active Wi-Fi adapter, then open this on each phone:

```text
http://<server-ip>:4173
```

Example:

```text
http://192.168.0.2:4173
```

The host page is:

```text
http://<server-ip>:4173/host.html
```

## Run The Server On Android

You can run the current Python server directly on an Android phone with Termux. This keeps the existing code path and does not require an APK.

### Fresh Termux Setup

1. Install Termux on the Android phone that will host the game.
   - Recommended source: F-Droid
   - Avoid old or incompatible Termux builds if package installs fail.
2. Open Termux.
3. Update Termux packages:

```bash
pkg update
pkg upgrade
```

If Termux asks a question during update or upgrade, press `y` and Enter.

Fresh Termux does not include Git or Python, so install both:

```bash
pkg install git python
```

Check that they installed correctly:

```bash
git --version
python --version
```

Download Sky Battery:

```bash
git clone https://github.com/becxer/sky-battery.git
cd sky-battery
```

Start the server:

```bash
python server.py
```

Keep Termux open while playing. On the server phone, open Chrome and visit:

```text
http://127.0.0.1:4173
```

The host page on the server phone is:

```text
http://127.0.0.1:4173/host.html
```

### Join From Other Phones

All phones must be on the same Wi-Fi. Find the Android server phone's Wi-Fi IP address in Android Wi-Fi details, or run this in Termux:

```bash
ip -4 addr show wlan0
```

Other phones on the same Wi-Fi should open:

```text
http://<android-phone-ip>:4173
```

Example:

```text
http://192.168.0.25:4173
```

For longer games, keep the server phone awake or run this before starting the server:

```bash
termux-wake-lock
```

After playing, release it with:

```bash
termux-wake-unlock
```

## Host Flow

1. Open `/host.html`.
2. Choose player count from `1` to `6`.
3. Press `Start World`.
4. Each player opens the game URL and enters a name.
5. In one-player mode, the player can choose a tank type and fight a dummy target.

Pressing `Recreate World` returns everyone to setup and generates a fresh map.

## Controls

- Hold left/right buttons to move.
- Drag the angle dial to aim.
- Hold Fire to charge power, then release to shoot.
- Keyboard: left/right arrows or `A`/`D` move, up/down arrows adjust angle, Space charges and fires.
- During cruise missile flight, Space or Fire applies lift.

## Tank Types

| Tank | Role |
| --- | --- |
| Normal Tank | Standard single-shot tank with balanced damage and blast size. |
| Triple Missile | Fires three shells at slight angle offsets for wider coverage. |
| Red Core | Fires a small red round with very high direct damage and a tight blast. |
| Seeker | Fires a small green missile that locks onto nearby targets while falling. |
| Howitzer | Projectile grows with flight time, increasing visible size, damage, and blast radius. |
| Laser | Shoots an instant beam that carves terrain along its path. |
| Dragon Tank | Black close-range tank that breathes a short line of fire for 30-36 area damage. |
| 3-Cushion Chain | Bounces off terrain up to three times, slightly steering each bounce toward the nearest tank. |
| Poop Tank | Adds poop stacks that reduce movement and increase later poop damage. |
| Nuke Tank | Marks a target point first; hitting the same point again triggers a huge blast. |
| Cruise Missile | Launches a slow missile; Fire or Space applies lift during flight. |
| Cheese Tank | Cheese projectile splits repeatedly into multiple pieces. |
| Zombie Tank | Throws a stone that releases a zombie near impact; zombies can be shot down, and retire after dealing about one normal shell of total damage. |
| Healing Tank | Deals reduced damage, but self-hits restore part of missing health with a sparkle effect. |
| Heart Tank | Fires a pink heart; pressing Fire or Space changes its size, with a rare giant heart. |
| Pujik Tank | Launches a butt-shaped projectile that can stop midair and drop poop. |
| Boing Tank | Hitting terrain jumps the tank to that point; hitting a tank explodes like a normal shell. |
| Ball Tank | Fires white balls that split, then merge into larger falling balls. |
| Super Tank | Very rare rainbow homing missile tank with five guided shots. |

## Troubleshooting

- If phones cannot connect, confirm they are on the same Wi-Fi and use the PC's Wi-Fi IPv4 address.
- If Android is hosting the server, confirm the hosting phone is not asleep and that the Wi-Fi network allows devices to reach each other.
- If port `4173` is already in use, stop the old Python server process and run `python server.py` again.
- If the browser shows an old UI, refresh the page or close and reopen the tab.
- If the server file changes, restart the server.

## Development Notes

Before changing server logic, run:

```powershell
python -m py_compile server.py
```

Main files:

- `server.py`: game state, physics, terrain, weapons, HTTP/SSE server
- `game.js`: canvas rendering, input, sound, client state updates
- `index.html`, `style.css`: game UI
- `host.html`, `host.js`: host setup page
- `assets/`: tank and projectile assets

## Authors

- Eugene Back
- Seohyun Back
