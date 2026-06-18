# Sky Battery

![Sky Battery gameplay screen](docs/sky-battery-gameplay.png)

Sky Battery is a local Wi-Fi browser artillery game. One PC runs the Python server, and phones or browsers on the same network join as clients.

## Requirements

- Windows, macOS, or Linux with Python 3 installed
- Modern browser such as Chrome, Edge, or Safari
- All phones/clients connected to the same Wi-Fi as the server PC

No npm install or build step is required.

## Start The Server

From the project directory:

```powershell
cd C:\Users\Tower\Desktop\projects\test
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

Install Termux on the Android phone that will host the game, then run:

```bash
pkg update
pkg install python git
git clone https://github.com/becxer/sky-battery.git
cd sky-battery
python server.py
```

On the server phone, open:

```text
http://127.0.0.1:4173
```

To let other phones join, find the Android phone's Wi-Fi IP address in Android Wi-Fi details, or from Termux:

```bash
ip -4 addr show wlan0
```

Other phones on the same Wi-Fi should open:

```text
http://<android-phone-ip>:4173
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
