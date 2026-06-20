from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from queue import Queue
from pathlib import Path
import json
import math
import random
import threading
import time

ROOT = Path(__file__).parent
W = 1200
H = 540
MIN_PLAYERS = 1
MAX_PLAYERS = 6
DEFAULT_PLAYER_COUNT = 3
PLAYER_COUNT = DEFAULT_PLAYER_COUNT
TANK_GROUND_OFFSET = 7
TANK_EDGE_MARGIN = 20
TANK_FIRE_DISTANCE = 19
TANK_MUZZLE_Y = 8
TANK_CONTACT_RADIUS = 12
BOING_CONTACT_RADIUS = 22
TANK_BOTTOM_OFFSET = TANK_GROUND_OFFSET
TANK_SLOPE_SAMPLE = 18
TANK_MAX_BODY_ANGLE = math.radians(28)
PLATFORM_ATTACH_STEP = 12
MOVE_LIMIT = 150
MOVE_STEP = 7.5
MAX_CLIMB_STEP = 34
AIM_MIN = 5
LASER_AIM_MIN = -8
AIM_MAX = 85
LASER_CARVE_WIDTH = 8
LASER_CARVE_LENGTH = 55
LASER_CARVE_STEP = 7
PLAYER_GRAVITY = 1800
PROJECTILE_GRAVITY = 1600
PROJECTILE_POWER_SCALE = 12.5
WIND_FORCE = 42
GROUND_MIN_Y = 225
GROUND_CONTROL_CLEARANCE = 150
GROUND_MAX_Y = H - GROUND_CONTROL_CLEARANCE
MIN_PLATFORM_AIR_GAP = 10
STRIP_RENDER_STEP = 4
ISLAND_RENDER_STEP = 5
STRIP_PLATFORM_EXTRA = 8
ISLAND_PLATFORM_EXTRA = 5
EXPLOSION_MIN_RADIUS = 16
EXPLOSION_MAX_RADIUS = 28
EXPLOSION_SPEED_SCALE = 0.014
EXPLOSION_PLATFORM_SCALE = 1.08
EXPLOSION_DAMAGE_SCALE = 1.32
HOMING_LOCK_RADIUS = 260
HOMING_DESCENT_MIN_VY = 80
HOMING_TURN_RATE = math.radians(320)
HOMING_MIN_SPEED = 330
ARTILLERY_MIN_DAMAGE = 0.65
ARTILLERY_MAX_DAMAGE = 2.05
ARTILLERY_MIN_RADIUS = 0.45
ARTILLERY_MAX_RADIUS = 3.2
ARTILLERY_GROW_START = 0.15
ARTILLERY_GROW_DURATION = 2.65
DUMMY_RESPAWN_SECONDS = 3.0
POOP_MOVE_FACTOR = 0.5
NUKE_MARK_DAMAGE = 5
NUKE_MARK_RADIUS_MULTIPLIER = 0.35
NUKE_MATCH_RADIUS = 18
NUKE_DAMAGE = 95
NUKE_RADIUS_MULTIPLIER = ARTILLERY_MAX_RADIUS * 2
CRUISE_MAX_AGE = 10.0
CRUISE_SPEED_SCALE = 0.60
CRUISE_MIN_SPEED = 210
CRUISE_DRAG = 0.990
CRUISE_BOOST_TIME = 0.18
CRUISE_GRAVITY_SCALE = 0.24
CRUISE_LIFT_ACCEL = 720
CHEESE_SPLIT_INTERVAL = 0.38
CHEESE_SPLIT_ANGLE = math.radians(10)
CHEESE_MAX_SPLIT_LEVEL = 3
CHEESE_SPLIT_SPEED = 0.96
SUPERBALL_SPLIT_INTERVAL = 0.34
SUPERBALL_SPLIT_ANGLE = math.radians(8)
SUPERBALL_SPLIT_SPEED = 0.98
SUPERBALL_MAX_SPLIT_LEVEL = 2
SUPERBALL_MERGE_RADIUS = 20
SUPERBALL_MERGE_DELAY = 0.28
SUPERBALL_MAX_MASS = 8
ZOMBIE_SPEED = 62
ZOMBIE_ATTACK_RANGE = 30
ZOMBIE_ATTACK_INTERVAL = 0.42
ZOMBIE_ATTACK_DAMAGE = 2
ZOMBIE_RETIRE_DAMAGE = 45
ZOMBIE_HIT_RADIUS = 17
ZOMBIE_SPAWN_RADIUS = 62
ZOMBIE_MAX_COUNT = 8
HEAL_SELF_RATIO = 0.2
HEART_RESIZE_COOLDOWN = 0.0
HEART_MIN_SCALE = 0.65
HEART_MAX_SCALE = 1.85
HEART_HUGE_CHANCE = 0.08
HEART_HUGE_MIN_SCALE = 2.8
HEART_HUGE_MAX_SCALE = 3.6
TANK_TYPES = {
    "normal": {"label": "Normal", "damage": 1.0, "radius": 1.0, "shots": [0], "barrels": [0]},
    "multi": {"label": "Triple", "damage": 0.75, "radius": 0.82, "shots": [-3, 0, 3], "barrels": [-6, 0, 6]},
    "red": {"label": "Red Core", "damage": 1.0, "baseDamage": 80, "radius": 0.45, "shots": [0], "barrels": [0]},
    "missile": {"label": "Seeker", "damage": 0.2, "radius": 0.92, "shots": [0], "barrels": [0], "homing": True},
    "artillery": {"label": "Howitzer", "damage": 1.0, "radius": 1.0, "shots": [0], "barrels": [0], "artillery": True},
    "laser": {"label": "Laser", "damage": 1.0, "radius": 0.35, "shots": [0], "barrels": [0], "laser": True},
    "chain": {"label": "Chain", "damage": 0.78, "radius": 0.86, "shots": [0], "barrels": [0], "bouncy": True, "maxBounces": 3},
    "poop": {"label": "Poop", "damage": 0.34, "radius": 0.72, "shots": [0], "barrels": [0], "effect": "poop"},
    "nuke": {"label": "Nuke", "damage": 1.0, "radius": 1.0, "shots": [0], "barrels": [0], "nuke": True},
    "cruise": {"label": "Cruise", "damage": 1.35, "radius": 1.05, "shots": [0], "barrels": [0], "cruise": True},
    "cheese": {"label": "Cheese", "damage": 0.57, "radius": 0.58, "shots": [0], "barrels": [0], "cheese": True},
    "zombie": {"label": "Zombie", "damage": 0.16, "radius": 0.9, "shots": [0], "barrels": [0], "zombie": True},
    "healing": {"label": "Healing", "damage": 0.8, "radius": 0.9, "shots": [0], "barrels": [0], "effect": "heal"},
    "heart": {"label": "Heart", "damage": 0.82, "radius": 0.82, "shots": [0], "barrels": [0], "heart": True},
    "butt": {"label": "Pujik", "damage": 0.34, "radius": 0.72, "shots": [0], "barrels": [0], "effect": "poop", "butt": True},
    "boing": {"label": "Boing", "damage": 1.0, "radius": 1.0, "shots": [0], "barrels": [0], "boing": True},
    "superball": {
        "label": "Ball",
        "damage": 0.18,
        "radius": 0.52,
        "shots": [-9, -4.5, 0, 4.5, 9],
        "barrels": [-14, -7, 0, 7, 14],
        "superball": True,
    },
    "super": {
        "label": "Super",
        "damage": 0.22,
        "radius": 0.78,
        "shots": [-8, -4, 0, 4, 8],
        "barrels": [-14, -7, 0, 7, 14],
        "homing": True,
        "shotColors": ["#ff3030", "#ff9f1a", "#ffe23f", "#39ff14", "#4aa3ff"],
    },
}
TANK_TYPE_KEYS = list(TANK_TYPES.keys())
TANK_TYPE_WEIGHTS = {
    "normal": 24,
    "multi": 24,
    "red": 24,
    "missile": 24,
    "artillery": 24,
    "laser": 18,
    "chain": 18,
    "poop": 18,
    "nuke": 10,
    "cruise": 14,
    "cheese": 18,
    "zombie": 16,
    "healing": 18,
    "heart": 18,
    "butt": 18,
    "boing": 18,
    "superball": 18,
    "super": 1,
}

lock = threading.RLock()
clients = {}
listeners = {}
sounds = []


def random_sky_mode():
    return random.choice(["day", "evening"])


def clamp(value, low, high):
    return max(low, min(high, value))


def player_count():
    return int(state.get("playerCount", DEFAULT_PLAYER_COUNT))


def build_terrain():
    base = random.randint(GROUND_MAX_Y - 78, GROUND_MAX_Y - 26)
    profile = random.choice(["rolling", "valley", "peaks", "jagged"])
    phase_a = random.random() * math.pi * 2
    phase_b = random.random() * math.pi * 2
    phase_c = random.random() * math.pi * 2
    ground = []
    for x in range(W):
        if profile == "rolling":
            y = base + math.sin(x * 0.006 + phase_a) * 46 + math.sin(x * 0.017 + phase_b) * 20
        elif profile == "valley":
            center = W * random.uniform(0.35, 0.65)
            bowl = 62 * math.exp(-((x - center) ** 2) / (2 * 190 ** 2))
            y = base + bowl + math.sin(x * 0.011 + phase_a) * 28
        elif profile == "peaks":
            y = base + math.sin(x * 0.004 + phase_a) * 70 - abs(math.sin(x * 0.014 + phase_b)) * 34
        else:
            y = base + math.sin(x * 0.009 + phase_a) * 38 + math.sin(x * 0.031 + phase_b) * 17 + math.sin(x * 0.057 + phase_c) * 8
        ground.append(round(clamp(y, GROUND_MIN_Y, GROUND_MAX_Y)))
    return smooth_ground(ground)


def smooth_ground(ground):
    smoothed = ground[:]
    for _ in range(2):
        next_ground = smoothed[:]
        for x in range(2, W - 2):
            window = smoothed[x - 2:x + 3]
            next_ground[x] = round(sum(window) / len(window))
        smoothed = next_ground
    return smoothed


def build_platforms(ground):
    platforms = []
    count = random.choice([0, 1, 1, 2, 2, 3])
    for _ in range(count):
        kind = random.choice(["thin", "steps", "island"])
        x = random.randint(120, W - 360)
        width = random.randint(130, 300)
        y = random.randint(215, 365)
        ground_gap = min(ground[int(clamp(x + width * t / 4, 0, W - 1))] for t in range(5)) - y
        if ground_gap < 82:
            y -= 82 - ground_gap
        if kind == "thin":
            platforms.append(make_platform_strip(x, y, width, random.randint(5, 9)))
        elif kind == "steps":
            step_count = random.randint(3, 5)
            step_w = width / step_count
            direction = random.choice([-1, 1])
            steps = []
            for i in range(step_count):
                steps.append(make_platform_strip(
                    round(x + i * step_w),
                    round(y + direction * i * random.randint(13, 21)),
                    round(step_w + 2),
                    random.randint(6, 10),
                ))
            platforms.append({"type": "steps", "steps": steps})
        else:
            points = []
            segments = random.randint(5, 8)
            for i in range(segments + 1):
                px = round(x + width * i / segments)
                py = round(y + math.sin(i * 1.7 + random.random()) * 12 + random.randint(-7, 7))
                points.append([px, py])
            platforms.append({"type": "island", "points": points, "h": random.randint(7, 12)})
    return platforms


def make_platform_strip(x, y, w, h):
    return {"type": "thin", "x": x, "y": y, "w": w, "h": h, "craters": []}


def install_platforms(platforms):
    state["platformMask"] = state["platformGround"][:]
    visible = []
    for platform in sorted(platforms, key=platform_sort_y):
        if platform_is_visible(platform):
            visible.append(platform)
            add_platform_to_mask(platform)
    return visible


def platform_sort_y(platform):
    if platform["type"] == "thin":
        return platform["y"]
    if platform["type"] == "steps":
        return min(step["y"] for step in platform["steps"])
    if platform["type"] == "island":
        return min(p[1] for p in platform["points"])
    return H


def add_platform_to_mask(platform):
    if platform["type"] == "thin":
        add_strip_to_mask(platform)
    elif platform["type"] == "steps":
        for step in platform["steps"]:
            add_strip_to_mask(step)
    elif platform["type"] == "island":
        min_x = round(min(p[0] for p in platform["points"]))
        max_x = round(max(p[0] for p in platform["points"]))
        for x in range(min_x, max_x + 1):
            surface = island_surface_y(platform, x)
            if surface is None or not platform_point_is_exposed(surface, x):
                continue
            i = int(clamp(round(x), 0, W - 1))
            state["platformMask"][i] = min(state["platformMask"][i], round(surface + platform.get("h", 10) + ISLAND_PLATFORM_EXTRA))


def add_strip_to_mask(platform):
    for start, end in platform_strip_render_runs(platform):
        for x in range(round(start), round(end) + 1):
            i = int(clamp(round(x), 0, W - 1))
            state["platformMask"][i] = min(state["platformMask"][i], round(platform["y"] + platform["h"] + STRIP_PLATFORM_EXTRA))


def terrain_y(x):
    i = int(clamp(round(x), 0, W - 1))
    return state["ground"][i]


def platform_y_at(x):
    best = None
    for platform in state.get("platforms", []):
        if platform["type"] == "thin":
            if platform_strip_drawn_at(platform, x):
                y = platform_surface_y(platform, x)
                if y is not None and platform_point_is_exposed(y, x):
                    best = y if best is None else min(best, y)
        elif platform["type"] == "steps":
            for step in platform["steps"]:
                if platform_strip_drawn_at(step, x):
                    y = platform_surface_y(step, x)
                    if y is not None and platform_point_is_exposed(y, x):
                        best = y if best is None else min(best, y)
        elif platform["type"] == "island":
            y = island_surface_y(platform, x)
            if y is not None and island_drawn_at(platform, x):
                best = y if best is None else min(best, y)
    return best


def platform_surface_y(platform, x):
    if not platform_has_support_width(platform, x):
        return None
    y = platform["y"]
    for crater in platform.get("craters", []):
        dx = x - crater["x"]
        radius = crater["r"]
        if abs(dx) <= radius:
            y = max(y, crater["y"] + math.sqrt(max(0, radius * radius - dx * dx)))
    if y > platform["y"] + platform["h"] + STRIP_PLATFORM_EXTRA:
        return None
    return y


def platform_has_support_width(platform, x):
    left = max(platform["x"], x - 12)
    right = min(platform["x"] + platform["w"], x + 12)
    solid_columns = 0
    sample_count = 0
    for sx in range(round(left), round(right) + 1, 4):
        sample_count += 1
        y = platform["y"]
        for crater in platform.get("craters", []):
            dx = sx - crater["x"]
            radius = crater["r"]
            if abs(dx) <= radius:
                y = max(y, crater["y"] + math.sqrt(max(0, radius * radius - dx * dx)))
        if y <= platform["y"] + platform["h"] + STRIP_PLATFORM_EXTRA:
            solid_columns += 1
    return sample_count > 0 and solid_columns >= max(2, math.ceil(sample_count * 0.45))


def point_hits_platform(platform, x, y):
    if platform["type"] == "thin":
        return point_hits_platform_strip(platform, x, y)
    if platform["type"] == "steps":
        return any(point_hits_platform_strip(step, x, y) for step in platform["steps"])
    if platform["type"] == "island":
        return point_hits_island(platform, x, y)
    return False


def point_hits_platform_strip(platform, x, y):
    if not platform_strip_drawn_at(platform, x):
        return False
    surface_y = platform_surface_y(platform, x)
    if surface_y is None:
        return False
    if not platform_point_is_exposed(surface_y, x):
        return False
    bottom_y = platform["y"] + platform["h"] + STRIP_PLATFORM_EXTRA
    return surface_y <= y <= bottom_y


def point_hits_island(platform, x, y):
    surface = island_surface_y(platform, x)
    if surface is None:
        return False
    if not island_drawn_at(platform, x):
        return False
    return surface <= y <= surface + platform.get("h", 10) + ISLAND_PLATFORM_EXTRA


def solid_at(x, y):
    if y >= terrain_y(x):
        return True
    return any(point_hits_platform(platform, x, y) for platform in state.get("platforms", []))


def platform_is_visible(platform):
    if platform["type"] == "thin":
        return platform_strip_visible(platform)
    if platform["type"] == "steps":
        return any(platform_strip_visible(step) for step in platform["steps"])
    if platform["type"] == "island":
        return island_visible(platform)
    return False


def platform_strip_visible(platform):
    return any(end - start >= STRIP_RENDER_STEP for start, end in platform_strip_render_runs(platform))


def platform_strip_render_runs(platform):
    offsets = render_offsets(platform["w"], STRIP_RENDER_STEP)
    runs = []
    run_start = None
    previous_x = None
    for index, offset in enumerate(offsets):
        sample_x = platform["x"] + offset
        surface = platform_surface_y(platform, sample_x)
        solid = surface is not None and platform_point_is_exposed(surface, sample_x)
        at_end = index == len(offsets) - 1
        if solid and run_start is None:
            run_start = sample_x
        if ((not solid) or at_end) and run_start is not None:
            end = sample_x if solid and at_end else previous_x
            if end is not None and end - run_start >= STRIP_RENDER_STEP:
                runs.append((run_start, end))
            run_start = None
        previous_x = sample_x
    return runs


def platform_strip_drawn_at(platform, x):
    if not (platform["x"] <= x <= platform["x"] + platform["w"]):
        return False
    return any(start <= x <= end for start, end in platform_strip_render_runs(platform))


def render_offsets(width, step):
    width = round(width)
    offsets = list(range(0, width + 1, step))
    if not offsets or offsets[-1] != width:
        offsets.append(width)
    return offsets


def island_visible(platform):
    points = platform["points"]
    if len(points) < 2 or max(p[0] for p in points) - min(p[0] for p in points) < 36:
        return False
    min_x = round(min(p[0] for p in points))
    max_x = round(max(p[0] for p in points))
    exposed_columns = 0
    for sx in range(min_x, max_x + 1, ISLAND_RENDER_STEP):
        if island_drawn_at(platform, sx):
            exposed_columns += 1
    return exposed_columns >= 4


def island_surface_y(platform, x):
    points = platform["points"]
    min_x = min(p[0] for p in points)
    max_x = max(p[0] for p in points)
    if not (min_x <= x <= max_x):
        return None
    for i in range(len(points) - 1):
        x1, y1 = points[i]
        x2, y2 = points[i + 1]
        if min(x1, x2) <= x <= max(x1, x2):
            span = max(1, x2 - x1)
            t = (x - x1) / span
            return y1 + (y2 - y1) * t
    return None


def island_drawn_at(platform, x):
    points = platform["points"]
    min_x = round(min(p[0] for p in points))
    max_x = round(max(p[0] for p in points))
    if not (min_x <= x <= max_x):
        return False
    segment_start = min_x + math.floor((x - min_x) / ISLAND_RENDER_STEP) * ISLAND_RENDER_STEP
    segment_end = min(segment_start + ISLAND_RENDER_STEP, max_x)
    y1 = island_surface_y(platform, segment_start)
    y2 = island_surface_y(platform, segment_end)
    if y1 is None or y2 is None:
        return False
    return platform_point_is_exposed(y1, segment_start) or platform_point_is_exposed(y2, segment_end)


def platform_point_is_exposed(surface_y, x):
    i = int(clamp(round(x), 0, W - 1))
    mask = state.get("platformMask") or state.get("platformGround") or state["ground"]
    return surface_y < mask[i] - MIN_PLATFORM_AIR_GAP


def floor_y(x):
    platform_y = platform_y_at(x)
    ground_y = terrain_y(x)
    return min(ground_y, platform_y) if platform_y is not None else ground_y


def supported_floor_y(x, current_y=None):
    ground_y = terrain_y(x)
    platform_y = platform_y_at(x)
    if platform_y is None:
        return ground_y
    if current_y is not None and platform_y < current_y + TANK_GROUND_OFFSET - PLATFORM_ATTACH_STEP:
        return ground_y
    return min(ground_y, platform_y)


def ground_angle_at(x, current_y=None):
    left_x = clamp(x - TANK_SLOPE_SAMPLE, TANK_EDGE_MARGIN, W - TANK_EDGE_MARGIN)
    right_x = clamp(x + TANK_SLOPE_SAMPLE, TANK_EDGE_MARGIN, W - TANK_EDGE_MARGIN)
    left_y = supported_floor_y(left_x, current_y)
    right_y = supported_floor_y(right_x, current_y)
    angle = math.atan2(right_y - left_y, right_x - left_x)
    return clamp(angle, -TANK_MAX_BODY_ANGLE, TANK_MAX_BODY_ANGLE)


def barrel_angle_for(player):
    aim = math.radians(player["aim"])
    local_angle = -aim if player["dir"] == 1 else math.pi + aim
    return player["angleBody"] + local_angle


def tank_spec(player):
    return TANK_TYPES.get(player.get("tankType", "normal"), TANK_TYPES["normal"])


def aim_min_for_player(player):
    return LASER_AIM_MIN if player.get("tankType") == "laser" else AIM_MIN


def random_tank_type():
    return random.choices(TANK_TYPE_KEYS, weights=[TANK_TYPE_WEIGHTS.get(key, 1) for key in TANK_TYPE_KEYS], k=1)[0]


def artillery_flight_factor(age):
    return clamp((age - ARTILLERY_GROW_START) / ARTILLERY_GROW_DURATION, 0, 1)


def artillery_damage_multiplier_for_age(age):
    return ARTILLERY_MIN_DAMAGE + (ARTILLERY_MAX_DAMAGE - ARTILLERY_MIN_DAMAGE) * artillery_flight_factor(age)


def artillery_radius_multiplier_for_age(age):
    return ARTILLERY_MIN_RADIUS + (ARTILLERY_MAX_RADIUS - ARTILLERY_MIN_RADIUS) * artillery_flight_factor(age)


def random_heart_scale():
    if random.random() < HEART_HUGE_CHANCE:
        return random.uniform(HEART_HUGE_MIN_SCALE, HEART_HUGE_MAX_SCALE)
    return random.uniform(HEART_MIN_SCALE, HEART_MAX_SCALE)


def projectile_effect_multipliers(projectile):
    damage = projectile.get("damageMultiplier", 1.0)
    radius = projectile.get("radiusMultiplier", 1.0)
    base_damage = projectile.get("baseDamage")
    if projectile.get("heart"):
        heart_scale = clamp(projectile.get("heartScale", 1.0), HEART_MIN_SCALE, HEART_HUGE_MAX_SCALE)
        damage *= heart_scale
        radius *= heart_scale
    if projectile.get("superball"):
        mass = clamp(projectile.get("superballMass", 1), 1, SUPERBALL_MAX_MASS)
        damage *= mass ** 0.72
        radius *= mass ** 0.48
    if projectile.get("tankType") == "artillery":
        age = projectile.get("age", 0)
        damage *= artillery_damage_multiplier_for_age(age)
        radius *= artillery_radius_multiplier_for_age(age)
    return damage, radius, base_damage


def sync_projectile_field():
    projectiles = state.get("projectiles", [])
    state["projectile"] = projectiles[0] if projectiles else None


def active_projectiles():
    return bool(state.get("projectiles") or state.get("projectile"))


def set_projectiles(projectiles):
    state["projectiles"] = projectiles
    sync_projectile_field()


def resolve_shot_end():
    alive = [i for i, p in enumerate(state["players"]) if p["health"] > 0]
    if player_count() == 1:
        state["winner"] = None
        next_turn()
    elif len(alive) == 1:
        state["winner"] = alive[0]
    elif len(alive) == 0:
        state["winner"] = state["current"]
    else:
        next_turn()


def projectile_surface_hit(x, previous_y, current_y):
    top_y = min(previous_y, current_y)
    bottom_y = max(previous_y, current_y)
    candidates = []
    ground_y = terrain_y(x)
    if top_y <= ground_y <= bottom_y:
        candidates.append(ground_y)
    platform_y = platform_y_at(x)
    if platform_y is not None and top_y <= platform_y <= bottom_y:
        candidates.append(platform_y)
    return min(candidates) if candidates else None


def projectile_path_hit(previous_x, previous_y, current_x, current_y):
    distance = math.hypot(current_x - previous_x, current_y - previous_y)
    steps = max(2, math.ceil(distance / 2))
    last_x = previous_x
    last_y = previous_y
    for i in range(1, steps + 1):
        t = i / steps
        x = previous_x + (current_x - previous_x) * t
        y = previous_y + (current_y - previous_y) * t
        if solid_at(x, y):
            return x, y
        hit_y = projectile_surface_hit(x, last_y, y)
        if hit_y is not None:
            return x, hit_y
        last_x = x
        last_y = y
    return None


def projectile_zombie_hit(previous_x, previous_y, current_x, current_y):
    zombies = state.get("zombies", [])
    if not zombies:
        return None
    distance = math.hypot(current_x - previous_x, current_y - previous_y)
    steps = max(2, math.ceil(distance / 3))
    for i in range(1, steps + 1):
        t = i / steps
        x = previous_x + (current_x - previous_x) * t
        y = previous_y + (current_y - previous_y) * t
        for index, zombie in enumerate(zombies):
            if math.hypot(zombie["x"] - x, zombie["y"] - 12 - y) <= ZOMBIE_HIT_RADIUS:
                return index, x, y
    return None


def raycast_laser(owner, start_x, start_y, angle, max_distance=1600):
    step = 3
    distance = 0
    while distance <= max_distance:
        x = start_x + math.cos(angle) * distance
        y = start_y + math.sin(angle) * distance
        if x < 0 or x >= W or y < -80 or y > H + 80:
            return {"type": "air", "x": x, "y": y}
        if solid_at(x, y):
            return {"type": "solid", "x": x, "y": y}
        for index, zombie in enumerate(state.get("zombies", [])):
            if math.hypot(zombie["x"] - x, zombie["y"] - 12 - y) <= ZOMBIE_HIT_RADIUS:
                return {"type": "zombie", "x": x, "y": y, "zombie": index}
        for index, player in enumerate(state["players"]):
            if index == owner or player["health"] <= 0:
                continue
            if math.hypot(player["x"] - x, player["y"] - 8 - y) <= TANK_CONTACT_RADIUS:
                return {"type": "player", "x": x, "y": y, "player": index}
        distance += step
    return {"type": "air", "x": start_x + math.cos(angle) * max_distance, "y": start_y + math.sin(angle) * max_distance}


def surface_normal_at(x, y, vx, vy):
    sample = 8
    left_x = clamp(x - sample, 0, W - 1)
    right_x = clamp(x + sample, 0, W - 1)
    left_y = floor_y(left_x)
    right_y = floor_y(right_x)
    tx = right_x - left_x
    ty = right_y - left_y
    nx = -ty
    ny = tx
    length = max(0.001, math.hypot(nx, ny))
    nx /= length
    ny /= length
    if vx * nx + vy * ny > 0:
        nx = -nx
        ny = -ny
    return nx, ny


def bounce_projectile(projectile, hit_x, hit_y):
    nx, ny = surface_normal_at(hit_x, hit_y, projectile["vx"], projectile["vy"])
    dot = projectile["vx"] * nx + projectile["vy"] * ny
    projectile["vx"] = (projectile["vx"] - 2 * dot * nx) * 0.76
    projectile["vy"] = (projectile["vy"] - 2 * dot * ny) * 0.76
    projectile["x"] = hit_x + nx * 8
    projectile["y"] = hit_y + ny * 8
    projectile["bounces"] = projectile.get("bounces", 0) + 1
    projectile["age"] = max(projectile.get("age", 0), 0.22)
    sounds.append("boing")


def random_positions(count=None):
    count = count or player_count()
    slots = list(range(90, W - 89, 70))
    for minimum_gap in [220, 180, 140, 100, 70]:
        random.shuffle(slots)
        chosen = []
        for x in slots:
            if all(abs(x - other) >= minimum_gap for other in chosen):
                chosen.append(x)
            if len(chosen) == count:
                random.shuffle(chosen)
                return chosen
    random.shuffle(slots)
    return slots[:count]


def spawn_y(x):
    return terrain_y(x) - TANK_GROUND_OFFSET


def has_support(player):
    support = terrain_y(player["x"])
    return abs((player["y"] + TANK_GROUND_OFFSET) - support) <= 3


def safe_spawn_x(exclude=None):
    exclude = exclude or []
    candidates = list(range(120, W - 119, 40))
    random.shuffle(candidates)
    for x in candidates:
        if all(abs(x - other) >= 160 for other in exclude):
            return x
    return random.choice(candidates)


def validate_spawns():
    placed = []
    for player in state["players"]:
        if not has_support(player):
            player["x"] = safe_spawn_x(placed)
            player["y"] = spawn_y(player["x"])
            player["vx"] = 0
            player["vy"] = 0
        player["angleBody"] = ground_angle_at(player["x"], player["y"])
        placed.append(player["x"])


def make_player(index, x):
    colors = ["#5fb8ff", "#ff9167", "#73d38a", "#f5d76e", "#c58cff", "#65e0d5"]
    return {
        "name": f"Player {index + 1}",
        "tankType": random_tank_type(),
        "x": x,
        "y": spawn_y(x),
        "vx": 0,
        "vy": 0,
        "angleBody": ground_angle_at(x),
        "av": 0,
        "health": 100,
        "color": colors[index % len(colors)],
        "dir": 1 if x < W / 2 else -1,
        "aim": 45,
        "power": 66,
        "moveRemaining": MOVE_LIMIT,
        "stuckTurns": 0,
        "poopDamage": 0,
        "poopStacks": 0,
        "respawnTimer": 0,
        "isDummy": False,
    }


def make_dummy_target(index, x):
    target = make_player(index, x)
    target.update({
        "name": "Target",
        "tankType": "normal",
        "color": "#d7dde4",
        "moveRemaining": 0,
        "poopDamage": 0,
        "poopStacks": 0,
        "respawnTimer": 0,
        "isDummy": True,
    })
    return target


def build_players_for_count(count):
    positions = random_positions(count + 1 if count == 1 else count)
    players = [make_player(i, x) for i, x in enumerate(positions[:count])]
    if count == 1:
        target = make_dummy_target(1, positions[1])
        players.append(target)
        if players[0]["x"] < target["x"]:
            players[0]["dir"] = 1
            target["dir"] = -1
        else:
            players[0]["dir"] = -1
            target["dir"] = 1
    return players


state = {
    "ground": build_terrain(),
    "platformGround": [],
    "platformMask": [],
    "platforms": [],
    "players": [],
    "playerCount": DEFAULT_PLAYER_COUNT,
    "phase": "setup",
    "worldVersion": 0,
    "current": 0,
    "projectile": None,
    "projectiles": [],
    "particles": [],
    "effects": [],
    "zombies": [],
    "nukeMarks": [],
    "wind": 0,
    "skyMode": random_sky_mode(),
    "winner": None,
    "tick": 0,
}
state["platformGround"] = state["ground"][:]
state["platforms"] = install_platforms(build_platforms(state["ground"]))
state["players"] = build_players_for_count(DEFAULT_PLAYER_COUNT)
validate_spawns()
state["current"] = random.randrange(PLAYER_COUNT)
state["wind"] = round(random.uniform(-2.8, 2.8), 2)


def reset_game(count=None, kick_clients=False, phase="playing"):
    if count is not None:
        state["playerCount"] = int(clamp(int(count), MIN_PLAYERS, MAX_PLAYERS))
    state["ground"] = build_terrain()
    state["platformGround"] = state["ground"][:]
    state["platforms"] = install_platforms(build_platforms(state["ground"]))
    state["players"] = build_players_for_count(player_count())
    validate_spawns()
    if kick_clients:
        clients.clear()
    for cid, client in clients.items():
        if client["seat"] in range(player_count()):
            state["players"][client["seat"]]["name"] = client["name"]
    state["current"] = random.randrange(player_count())
    set_projectiles([])
    state["particles"] = []
    state["effects"] = []
    state["zombies"] = []
    state["nukeMarks"] = []
    state["wind"] = round(random.uniform(-2.8, 2.8), 2)
    state["skyMode"] = random_sky_mode()
    state["winner"] = None
    state["phase"] = phase
    state["worldVersion"] += 1
    sounds.append("join")


def recreate_world():
    clients.clear()
    state["phase"] = "setup"
    set_projectiles([])
    state["particles"] = []
    state["effects"] = []
    state["zombies"] = []
    state["nukeMarks"] = []
    state["winner"] = None
    state["worldVersion"] += 1
    sounds.append("join")


def apply_solo_tank_choice(seat, tank_type):
    if player_count() == 1 and seat == 0 and tank_type in TANK_TYPES:
        state["players"][0]["tankType"] = tank_type


def assign_seat(client_id, name, tank_type=None):
    if state["phase"] != "playing":
        clients[client_id] = {"name": name, "seat": player_count(), "last": time.time()}
        return player_count()
    existing = clients.get(client_id)
    if existing:
        existing["name"] = name
        if existing["seat"] in range(player_count()):
            state["players"][existing["seat"]]["name"] = name
            apply_solo_tank_choice(existing["seat"], tank_type)
        return existing["seat"]

    taken = {c["seat"] for c in clients.values()}
    count = player_count()
    seat = next((i for i in range(count) if i not in taken), count)
    clients[client_id] = {"name": name, "seat": seat, "last": time.time()}
    if seat in range(count):
        state["players"][seat]["name"] = name
        apply_solo_tank_choice(seat, tank_type)
    sounds.append("join")
    return seat


def start_turn_for(index):
    player = state["players"][index]
    stacks = max(0, int(player.get("poopStacks", 0)))
    player["moveRemaining"] = round(MOVE_LIMIT * (POOP_MOVE_FACTOR ** stacks))
    player["stuckTurns"] = 0


def next_turn():
    alive = [i for i, p in enumerate(state["players"]) if p["health"] > 0]
    if player_count() == 1:
        state["current"] = 0
        start_turn_for(0)
        state["wind"] = round(random.uniform(-2.8, 2.8), 2)
        return
    if len(alive) == 1:
        state["winner"] = alive[0]
        return
    if len(alive) == 0:
        state["winner"] = state["current"]
        return
    count = player_count()
    for step in range(1, count + 1):
        candidate = (state["current"] + step) % count
        if state["players"][candidate]["health"] > 0:
            state["current"] = candidate
            start_turn_for(candidate)
            state["wind"] = round(random.uniform(-2.8, 2.8), 2)
            return


def fire_laser(player, owner):
    angle = barrel_angle_for(player)
    start_x = player["x"] + math.cos(angle) * TANK_FIRE_DISTANCE
    start_y = player["y"] - TANK_MUZZLE_Y + math.sin(angle) * TANK_FIRE_DISTANCE
    hit = raycast_laser(owner, start_x, start_y, angle)
    state["effects"].append({
        "type": "laser",
        "x1": start_x,
        "y1": start_y,
        "x2": hit["x"],
        "y2": hit["y"],
        "life": 10,
        "maxLife": 10,
    })
    sounds.append("laser")
    if hit["type"] == "solid":
        carve_laser_path(hit["x"], hit["y"], angle)
    elif hit["type"] == "zombie":
        zombie_index = hit.get("zombie", -1)
        if 0 <= zombie_index < len(state.get("zombies", [])):
            state["zombies"].pop(zombie_index)
        sounds.append("zombiedie")
    elif hit["type"] == "player":
        target = state["players"][hit["player"]]
        target["health"] -= 42
        target["vx"] += math.cos(angle) * 14
        target["vy"] += math.sin(angle) * 8 - 5
        target["av"] += target["dir"] * 0.16
        sounds.append("damage")
        if target["health"] <= 0:
            target["health"] = 0
            sounds.append("retire")
    resolve_shot_end()


def fire_for(client_id):
    client = clients.get(client_id)
    if state["phase"] != "playing" or not client or client["seat"] != state["current"] or active_projectiles() or state["winner"] is not None:
        return
    player = state["players"][state["current"]]
    spec = tank_spec(player)
    if spec.get("laser"):
        fire_laser(player, state["current"])
        return
    base_angle = barrel_angle_for(player)
    power = player["power"] * PROJECTILE_POWER_SCALE
    damage = spec["damage"]
    radius = spec["radius"]
    shot_colors = spec.get("shotColors", [])
    projectiles = []
    for shot_index, (shot_offset, barrel_offset) in enumerate(zip(spec["shots"], spec["barrels"])):
        angle = base_angle + math.radians(shot_offset)
        offset_x = -math.sin(angle) * barrel_offset
        offset_y = math.cos(angle) * barrel_offset
        projectile_power = power * (CRUISE_SPEED_SCALE if spec.get("cruise") else 1.0)
        projectiles.append({
            "x": player["x"] + math.cos(angle) * TANK_FIRE_DISTANCE + offset_x,
            "y": player["y"] - TANK_MUZZLE_Y + math.sin(angle) * TANK_FIRE_DISTANCE + offset_y,
            "vx": math.cos(angle) * projectile_power + player["vx"] * 0.25,
            "vy": math.sin(angle) * projectile_power + player["vy"] * 0.08,
            "angle": 0,
            "av": player["dir"] * 0.24,
            "age": 0,
            "owner": state["current"],
            "tankType": player.get("tankType", "normal"),
            "shotIndex": shot_index,
            "shotColor": shot_colors[shot_index % len(shot_colors)] if shot_colors else None,
            "shotAim": player["aim"],
            "damageMultiplier": damage,
            "baseDamage": spec.get("baseDamage"),
            "radiusMultiplier": radius,
            "homing": bool(spec.get("homing")),
            "cruise": bool(spec.get("cruise")),
            "maxAge": spec.get("maxAge", CRUISE_MAX_AGE if spec.get("cruise") else None),
            "boostTime": 0,
            "bouncy": bool(spec.get("bouncy")),
            "bounces": 0,
            "maxBounces": spec.get("maxBounces", 0),
            "cheese": bool(spec.get("cheese")),
            "cheeseLevel": 0,
            "cheeseMaxLevel": CHEESE_MAX_SPLIT_LEVEL if spec.get("cheese") else 0,
            "nextSplitAge": CHEESE_SPLIT_INTERVAL if spec.get("cheese") else None,
            "zombie": bool(spec.get("zombie")),
            "heart": bool(spec.get("heart")),
            "heartScale": random_heart_scale() if spec.get("heart") else 1.0,
            "heartCooldown": 0,
            "butt": bool(spec.get("butt")),
            "buttDropped": False,
            "boing": bool(spec.get("boing")),
            "superball": bool(spec.get("superball")),
            "superballLevel": 0,
            "superballMaxLevel": SUPERBALL_MAX_SPLIT_LEVEL if spec.get("superball") else 0,
            "superballMass": 1,
            "nextSuperballSplitAge": SUPERBALL_SPLIT_INTERVAL if spec.get("superball") else None,
            "superballMergeReadyAge": None,
            "effect": spec.get("effect"),
            "locked": False,
        })
    set_projectiles(projectiles)
    sounds.append("superball" if spec.get("superball") else "cruise" if spec.get("cruise") else "fire")


def move_for(client_id, direction):
    client = clients.get(client_id)
    if state["phase"] != "playing" or not client or client["seat"] != state["current"] or active_projectiles() or state["winner"] is not None:
        return
    player = state["players"][state["current"]]
    direction = -1 if float(direction) < 0 else 1
    player["dir"] = direction
    if player["moveRemaining"] <= 0:
        return
    distance = min(MOVE_STEP, player["moveRemaining"])
    next_x = clamp(player["x"] + direction * distance, TANK_EDGE_MARGIN, W - TANK_EDGE_MARGIN)
    if not can_move_to(player["x"], next_x, player["y"]):
        return
    next_ground = supported_floor_y(next_x, player["y"])
    player["x"] = next_x
    if next_ground <= player["y"] + TANK_GROUND_OFFSET:
        player["y"] = next_ground - TANK_GROUND_OFFSET
    player["angleBody"] = ground_angle_at(player["x"], player["y"])
    player["vx"] = 0
    player["moveRemaining"] = max(0, player["moveRemaining"] - distance)
    sounds.append("move")


def steer_for(client_id, direction):
    return


def boost_for(client_id):
    client = clients.get(client_id)
    if state["phase"] != "playing" or not client:
        return
    seat = client["seat"]
    if seat not in range(player_count()):
        return
    for projectile in state.get("projectiles", []):
        if projectile.get("owner") != seat:
            continue
        if projectile.get("cruise"):
            projectile["boostTime"] = CRUISE_BOOST_TIME
        elif projectile.get("heart"):
            projectile["heartScale"] = random_heart_scale()
            projectile["heartCooldown"] = HEART_RESIZE_COOLDOWN
            state["effects"].append({
                "type": "heart-shift",
                "x": projectile["x"],
                "y": projectile["y"],
                "scale": projectile["heartScale"],
                "life": 16,
                "maxLife": 16,
            })
            sounds.append("heart")
        elif projectile.get("butt") and not projectile.get("buttDropped"):
            projectile["buttDropped"] = True
            projectile["tankType"] = "poopdrop"
            projectile["vx"] = 0
            projectile["vy"] = max(70, abs(projectile.get("vy", 0)) * 0.2)
            projectile["av"] = 0.2
            projectile["angle"] = math.pi / 2
            projectile["effect"] = "poop"
            state["effects"].append({
                "type": "butt-drop",
                "x": projectile["x"],
                "y": projectile["y"],
                "life": 18,
                "maxLife": 18,
            })
            sounds.append("poop")


def can_move_to(start_x, end_x, current_y=None):
    distance = end_x - start_x
    steps = max(2, math.ceil(abs(distance) / 8))
    previous_y = supported_floor_y(start_x, current_y)
    for i in range(1, steps + 1):
        x = start_x + distance * i / steps
        body_y = previous_y - TANK_GROUND_OFFSET
        y = supported_floor_y(x, body_y)
        if previous_y - y > MAX_CLIMB_STEP:
            return False
        previous_y = y
    return True


def carve_crater(x, y, radius):
    start = max(0, round(x - radius))
    end = min(W, round(x + radius))
    for i in range(start, end):
        dx = i - x
        carve = math.sqrt(max(0, radius * radius - dx * dx))
        state["ground"][i] = max(state["ground"][i], round(y + carve))


def damage_platforms(x, y, radius):
    remaining = []
    for platform in state.get("platforms", []):
        if not platform_is_visible(platform):
            continue
        if platform["type"] == "thin":
            damaged = crater_platform_strip(platform, x, y, radius)
            if damaged and platform_is_visible(damaged):
                remaining.append(damaged)
        elif platform["type"] == "steps":
            steps = []
            for step in platform["steps"]:
                damaged = crater_platform_strip(step, x, y, radius)
                if damaged and platform_strip_visible(damaged):
                    steps.append(damaged)
            if steps:
                remaining.append({"type": "steps", "steps": steps})
        elif platform["type"] == "island":
            damaged = damage_island(platform, x, y, radius)
            remaining.extend(piece for piece in damaged if platform_is_visible(piece))
    state["platforms"] = remaining


def carve_laser_path(x, y, angle):
    steps = max(2, math.ceil(LASER_CARVE_LENGTH / LASER_CARVE_STEP))
    for step in range(steps + 1):
        distance = -LASER_CARVE_WIDTH + step * LASER_CARVE_STEP
        px = x + math.cos(angle) * distance
        py = y + math.sin(angle) * distance
        if px < -LASER_CARVE_WIDTH or px > W + LASER_CARVE_WIDTH or py < -80 or py > H + LASER_CARVE_LENGTH:
            continue
        carve_crater(px, py, LASER_CARVE_WIDTH)
        damage_platforms(px, py, LASER_CARVE_WIDTH + 2)


def crater_platform_strip(platform, x, y, radius):
    px = platform["x"]
    py = platform["y"]
    pw = platform["w"]
    ph = platform["h"]
    closest_x = clamp(x, px, px + pw)
    closest_y = clamp(y, py, py + ph + STRIP_PLATFORM_EXTRA)
    if math.hypot(closest_x - x, closest_y - y) > radius:
        return platform
    craters = platform.get("craters", []) + [{"x": x, "y": y, "r": radius}]
    remaining_columns = 0
    damaged_platform = {**platform, "craters": craters}
    for start, end in platform_strip_render_runs(damaged_platform):
        remaining_columns += max(0, round(end - start))
    if remaining_columns < 5:
        return None
    return {**platform, "craters": craters}


def damage_island(platform, x, y, radius):
    points = platform["points"]
    min_x = min(p[0] for p in points)
    max_x = max(p[0] for p in points)
    avg_y = sum(p[1] for p in points) / len(points)
    closest_x = clamp(x, min_x, max_x)
    closest_y = clamp(y, avg_y - 8, avg_y + platform.get("h", 10) + ISLAND_PLATFORM_EXTRA + 6)
    if math.hypot(closest_x - x, closest_y - y) > radius:
        return [platform]

    left_limit = x - radius
    right_limit = x + radius
    left_points = [p for p in points if p[0] < left_limit]
    right_points = [p for p in points if p[0] > right_limit]
    pieces = []
    if len(left_points) >= 2 and left_points[-1][0] - left_points[0][0] >= 36:
        pieces.append({"type": "island", "points": left_points, "h": platform.get("h", 10)})
    if len(right_points) >= 2 and right_points[-1][0] - right_points[0][0] >= 36:
        pieces.append({"type": "island", "points": right_points, "h": platform.get("h", 10)})
    return pieces


def explode(x, y, impact_speed, damage_multiplier=1.0, radius_multiplier=1.0, base_damage=None, effect=None, owner=None, advance_turn=True):
    base_radius = clamp(14 + impact_speed * EXPLOSION_SPEED_SCALE, EXPLOSION_MIN_RADIUS, EXPLOSION_MAX_RADIUS)
    radius_cap = EXPLOSION_MAX_RADIUS * max(1.0, radius_multiplier)
    radius = clamp(base_radius * radius_multiplier, 8, radius_cap)
    carve_crater(x, y, radius)
    damage_platforms(x, y, radius * EXPLOSION_PLATFORM_SCALE)
    hit = False
    damaged = False
    retired = False
    healed = False
    for index, player in enumerate(state["players"]):
        if player["health"] <= 0:
            continue
        dx = player["x"] - x
        dy = player["y"] - y
        distance = math.hypot(dx, dy)
        damage_radius = radius * EXPLOSION_DAMAGE_SCALE
        if distance < damage_radius:
            falloff = 1 - distance / damage_radius
            if effect == "heal" and index == owner:
                missing = max(0, 100 - player["health"])
                heal_amount = round(missing * HEAL_SELF_RATIO)
                if missing > 0 and heal_amount <= 0:
                    heal_amount = 1
                if heal_amount > 0:
                    player["health"] = min(100, player["health"] + heal_amount)
                    healed = True
                state["effects"].append({
                    "type": "heal",
                    "x": player["x"],
                    "y": player["y"] - 18,
                    "amount": heal_amount,
                    "life": 28,
                    "maxLife": 28,
                })
                hit = True
                continue
            if base_damage is not None:
                damage = round(base_damage * damage_multiplier)
            else:
                damage = round(falloff * (36 + impact_speed * 0.032) * damage_multiplier)
            if effect == "poop" and index != owner:
                stacks = max(0, int(player.get("poopStacks", 0))) + 1
                damage = max(1, round(damage * stacks))
                player["poopDamage"] = damage
                player["poopStacks"] = stacks
            player["health"] -= damage
            if player["health"] <= 0:
                player["health"] = 0
                retired = True
            player["vx"] += (dx / max(distance, 1)) * falloff * 9
            player["vy"] += (dy / max(distance, 1)) * falloff * 9 - falloff * 8
            player["av"] += falloff * player["dir"] * 0.12
            hit = True
            damaged = True

    particle_scale = clamp(radius / EXPLOSION_MAX_RADIUS, 0.5, 3.0)
    particle_count = round(36 * clamp(particle_scale, 0.7, 2.4))
    particle_life = round(28 + particle_scale * 10)
    for _ in range(particle_count):
        speed = (random.random() * 3.6 + 0.9) * (0.78 + particle_scale * 0.24)
        angle = random.random() * math.pi * 2
        state["particles"].append({
            "x": x,
            "y": y,
            "vx": math.cos(angle) * speed,
            "vy": math.sin(angle) * speed - 0.9,
            "life": particle_life,
            "maxLife": particle_life,
            "size": (random.random() * 2.4 + 1.2) * (0.78 + particle_scale * 0.28),
        })

    sounds.append("explode")
    if effect == "poop":
        sounds.append("poop")
    if healed:
        sounds.append("heal")
    if damaged:
        sounds.append("damage")
    if retired:
        sounds.append("retire")

    if advance_turn:
        set_projectiles([])
        resolve_shot_end()


def nuke_mark_for_owner(owner):
    for mark in state.get("nukeMarks", []):
        if mark.get("owner") == owner:
            return mark
    return None


def set_nuke_mark(owner, x, y):
    state["nukeMarks"] = [mark for mark in state.get("nukeMarks", []) if mark.get("owner") != owner]
    state["nukeMarks"].append({"owner": owner, "x": x, "y": y})
    state["effects"].append({
        "type": "nuke-mark",
        "x": x,
        "y": y,
        "life": 18,
        "maxLife": 18,
    })
    sounds.append("target")


def handle_nuke_impact(projectile, x, y, impact_speed):
    owner = projectile.get("owner")
    mark = nuke_mark_for_owner(owner)
    if mark and math.hypot(mark["x"] - x, mark["y"] - y) <= NUKE_MATCH_RADIUS:
        state["nukeMarks"] = [item for item in state.get("nukeMarks", []) if item.get("owner") != owner]
        state["effects"].append({
            "type": "nuke",
            "x": mark["x"],
            "y": mark["y"],
            "life": 24,
            "maxLife": 24,
        })
        explode(
            mark["x"],
            mark["y"],
            impact_speed + 60,
            1.0,
            NUKE_RADIUS_MULTIPLIER,
            NUKE_DAMAGE,
            None,
            owner,
            advance_turn=False,
        )
        sounds.append("nuke")
    else:
        set_nuke_mark(owner, x, y)
        explode(
            x,
            y,
            impact_speed,
            1.0,
            NUKE_MARK_RADIUS_MULTIPLIER,
            NUKE_MARK_DAMAGE,
            None,
            owner,
            advance_turn=False,
        )


def handle_boing_terrain_impact(projectile, x, y):
    owner = projectile.get("owner")
    if owner is None or owner < 0 or owner >= len(state["players"]):
        return
    player = state["players"][owner]
    if player["health"] <= 0:
        return
    start_x = player["x"]
    start_y = player["y"]
    landing_x = clamp(x, TANK_EDGE_MARGIN, W - TANK_EDGE_MARGIN)
    landing_floor = supported_floor_y(landing_x, y)
    player["x"] = landing_x
    player["y"] = landing_floor - TANK_GROUND_OFFSET
    player["vx"] = clamp(projectile.get("vx", 0) * 0.04, -90, 90)
    player["vy"] = -170
    player["av"] += player["dir"] * 0.22
    player["angleBody"] = ground_angle_at(player["x"], player["y"])
    player["moveRemaining"] = 0
    state["effects"].append({
        "type": "boing-jump",
        "x1": start_x,
        "y1": start_y - 14,
        "x2": player["x"],
        "y2": player["y"] - 14,
        "life": 24,
        "maxLife": 24,
    })
    sounds.append("toing")


def update_player(player, dt):
    floor = supported_floor_y(player["x"], player["y"]) - TANK_GROUND_OFFSET
    player["vy"] += PLAYER_GRAVITY * dt
    player["x"] += player["vx"] * dt
    player["y"] += player["vy"] * dt
    player["angleBody"] += player["av"] * dt
    player["vx"] *= 0.975
    player["av"] *= 0.965
    player["x"] = clamp(player["x"], TANK_EDGE_MARGIN, W - TANK_EDGE_MARGIN)
    if player["y"] > floor:
        player["y"] = floor
        player["vy"] = 0
        player["vx"] *= 0.5
        target_angle = ground_angle_at(player["x"], player["y"])
        player["angleBody"] += (target_angle - player["angleBody"]) * 0.35
        player["av"] *= 0.35
    if player["y"] + TANK_BOTTOM_OFFSET >= H and player["health"] > 0:
        player["health"] = 0
        sounds.append("retire")


def respawn_dummy_target(player):
    exclude = [p["x"] for p in state["players"] if p is not player and p["health"] > 0]
    player["x"] = safe_spawn_x(exclude)
    player["y"] = spawn_y(player["x"])
    player["vx"] = 0
    player["vy"] = 0
    player["av"] = 0
    player["health"] = 100
    player["moveRemaining"] = 0
    player["stuckTurns"] = 0
    player["poopDamage"] = 0
    player["poopStacks"] = 0
    player["respawnTimer"] = 0
    player["angleBody"] = ground_angle_at(player["x"], player["y"])
    if state["players"] and not state["players"][0].get("isDummy"):
        player["dir"] = -1 if player["x"] > state["players"][0]["x"] else 1
    sounds.append("join")


def update_dummy_respawns(dt):
    if player_count() != 1:
        return
    for player in state["players"]:
        if not player.get("isDummy"):
            continue
        if player["health"] > 0:
            player["respawnTimer"] = 0
            continue
        timer = player.get("respawnTimer", 0)
        if timer <= 0:
            timer = DUMMY_RESPAWN_SECONDS
        timer -= dt
        if timer <= 0.000001:
            respawn_dummy_target(player)
        else:
            player["respawnTimer"] = timer


def spawn_zombie(owner, target, x, y):
    if target < 0 or target >= len(state["players"]):
        return
    target_player = state["players"][target]
    target_floor = supported_floor_y(target_player["x"], target_player["y"])
    side = -1 if x < target_player["x"] else 1
    candidates = [
        clamp(target_player["x"] + side * 18, TANK_EDGE_MARGIN, W - TANK_EDGE_MARGIN),
        clamp(target_player["x"] - side * 18, TANK_EDGE_MARGIN, W - TANK_EDGE_MARGIN),
        target_player["x"],
    ]
    spawn_x = target_player["x"]
    floor = target_floor
    for candidate_x in candidates:
        candidate_floor = supported_floor_y(candidate_x, target_player["y"])
        if abs(candidate_floor - target_floor) <= 28:
            spawn_x = candidate_x
            floor = candidate_floor
            break
    zombie = {
        "x": spawn_x,
        "y": floor - 2,
        "target": target,
        "owner": owner,
        "dir": 1,
        "attackCooldown": 0.18,
        "damageDealt": 0,
        "age": 0,
    }
    state["zombies"] = (state.get("zombies", []) + [zombie])[-ZOMBIE_MAX_COUNT:]
    sounds.append("zombie")


def handle_zombie_impact(projectile, x, y, speed):
    damage_multiplier, radius_multiplier, base_damage = projectile_effect_multipliers(projectile)
    explode(
        x,
        y,
        speed,
        damage_multiplier,
        radius_multiplier,
        base_damage,
        projectile.get("effect"),
        projectile.get("owner"),
        advance_turn=False,
    )
    spawned = False
    for index, player in enumerate(state["players"]):
        if player["health"] <= 0:
            continue
        if math.hypot(player["x"] - x, player["y"] - y) <= ZOMBIE_SPAWN_RADIUS:
            spawn_zombie(projectile.get("owner"), index, x, y)
            spawned = True
    if spawned:
        sounds.append("damage")


def update_zombies(dt):
    zombies = state.get("zombies", [])
    if not zombies:
        return
    next_zombies = []
    retired = False
    for zombie in zombies:
        target_index = int(zombie.get("target", -1))
        if target_index < 0 or target_index >= len(state["players"]):
            continue
        target = state["players"][target_index]
        if target["health"] <= 0:
            continue

        zombie["age"] = zombie.get("age", 0) + dt
        dx = target["x"] - zombie["x"]
        direction = -1 if dx < 0 else 1
        zombie["dir"] = direction
        step = clamp(dx, -ZOMBIE_SPEED * dt, ZOMBIE_SPEED * dt)
        if abs(dx) > ZOMBIE_ATTACK_RANGE * 0.55:
            zombie["x"] = clamp(zombie["x"] + step, TANK_EDGE_MARGIN, W - TANK_EDGE_MARGIN)
        floor = supported_floor_y(zombie["x"], zombie.get("y")) - 2
        zombie["y"] += (floor - zombie["y"]) * 0.45

        zombie["attackCooldown"] = max(0, zombie.get("attackCooldown", 0) - dt)
        close = abs(target["x"] - zombie["x"]) <= ZOMBIE_ATTACK_RANGE and abs(target["y"] - zombie["y"]) <= 42
        if close and zombie["attackCooldown"] <= 0:
            damage_done = min(ZOMBIE_ATTACK_DAMAGE, max(0, target["health"]))
            target["health"] -= damage_done
            target["vx"] += direction * 2.2
            target["av"] += direction * 0.035
            zombie["damageDealt"] = zombie.get("damageDealt", 0) + damage_done
            zombie["attackCooldown"] = ZOMBIE_ATTACK_INTERVAL
            sounds.append("zombiehit")
            if target["health"] <= 0:
                target["health"] = 0
                retired = True
                sounds.append("retire")
            if zombie["damageDealt"] >= ZOMBIE_RETIRE_DAMAGE:
                sounds.append("zombiedie")
                continue
        next_zombies.append(zombie)

    state["zombies"] = next_zombies[:ZOMBIE_MAX_COUNT]
    if retired and player_count() > 1:
        alive = [i for i, player in enumerate(state["players"]) if player["health"] > 0]
        if len(alive) == 1:
            state["winner"] = alive[0]
        elif not alive:
            state["winner"] = state["current"]


def angle_delta(target, current):
    return (target - current + math.pi) % (math.pi * 2) - math.pi


def steer_homing_projectile(p, dt):
    if not p.get("homing") or p["age"] < 0.25 or p["vy"] < HOMING_DESCENT_MIN_VY:
        return
    was_locked = bool(p.get("locked"))
    owner = p.get("owner")
    candidates = []
    for index, player in enumerate(state["players"]):
        if index == owner or player["health"] <= 0:
            continue
        target_x = player["x"]
        target_y = player["y"] - 8
        distance = math.hypot(target_x - p["x"], target_y - p["y"])
        if distance <= HOMING_LOCK_RADIUS:
            candidates.append((distance, target_x, target_y))
    if not candidates:
        return
    _, target_x, target_y = min(candidates, key=lambda item: item[0])
    speed = max(HOMING_MIN_SPEED, math.hypot(p["vx"], p["vy"]) * 1.006)
    current = math.atan2(p["vy"], p["vx"])
    desired = math.atan2(target_y - p["y"], target_x - p["x"])
    turn = clamp(angle_delta(desired, current), -HOMING_TURN_RATE * dt, HOMING_TURN_RATE * dt)
    adjusted = current + turn
    p["vx"] = math.cos(adjusted) * speed
    p["vy"] = math.sin(adjusted) * speed
    p["locked"] = True
    if not was_locked:
        sounds.append("lock")


def update_cruise_projectile(p, dt):
    speed = max(CRUISE_MIN_SPEED, math.hypot(p["vx"], p["vy"]) * CRUISE_DRAG)
    angle = math.atan2(p["vy"], p["vx"])
    p["vx"] = math.cos(angle) * speed
    p["vy"] = math.sin(angle) * speed + PROJECTILE_GRAVITY * CRUISE_GRAVITY_SCALE * dt
    if p.get("boostTime", 0) > 0:
        p["vy"] -= CRUISE_LIFT_ACCEL * dt
        p["boostTime"] = max(0, p.get("boostTime", 0) - dt)
    p["angle"] = angle


def split_cheese_projectile(p):
    if not p.get("cheese"):
        return None
    level = int(p.get("cheeseLevel", 0))
    max_level = int(p.get("cheeseMaxLevel", CHEESE_MAX_SPLIT_LEVEL))
    next_split = p.get("nextSplitAge")
    if next_split is None or level >= max_level or p.get("age", 0) < next_split:
        return None

    speed = max(180, math.hypot(p["vx"], p["vy"]) * CHEESE_SPLIT_SPEED)
    base_angle = math.atan2(p["vy"], p["vx"])
    spread = CHEESE_SPLIT_ANGLE * (1 + level * 0.35)
    children = []
    for child_index, side in enumerate((-1, 1)):
        angle = base_angle + side * spread
        child = p.copy()
        child["x"] = p["x"] + math.cos(angle) * 5
        child["y"] = p["y"] + math.sin(angle) * 5
        child["vx"] = math.cos(angle) * speed
        child["vy"] = math.sin(angle) * speed - (18 if level == 0 else 8)
        child["angle"] = angle
        child["av"] = side * (0.32 + level * 0.1)
        child["cheeseLevel"] = level + 1
        child["nextSplitAge"] = p.get("age", 0) + CHEESE_SPLIT_INTERVAL
        child["shotIndex"] = int(p.get("shotIndex", 0)) * 2 + child_index
        children.append(child)
    sounds.append("cheese")
    return children


def split_superball_projectile(p):
    if not p.get("superball"):
        return None
    level = int(p.get("superballLevel", 0))
    max_level = int(p.get("superballMaxLevel", SUPERBALL_MAX_SPLIT_LEVEL))
    next_split = p.get("nextSuperballSplitAge")
    if next_split is None or level >= max_level or p.get("age", 0) < next_split:
        return None

    speed = max(190, math.hypot(p["vx"], p["vy"]) * SUPERBALL_SPLIT_SPEED)
    base_angle = math.atan2(p["vy"], p["vx"])
    spread = SUPERBALL_SPLIT_ANGLE * (1 + level * 0.28)
    children = []
    for child_index, side in enumerate((-1, 1)):
        angle = base_angle + side * spread
        child = p.copy()
        child["x"] = p["x"] + math.cos(angle) * 4
        child["y"] = p["y"] + math.sin(angle) * 4
        child["vx"] = math.cos(angle) * speed
        child["vy"] = math.sin(angle) * speed - (12 if level == 0 else 5)
        child["angle"] = angle
        child["av"] = side * (0.22 + level * 0.08)
        child["superballLevel"] = level + 1
        child["superballMass"] = 1
        child["nextSuperballSplitAge"] = p.get("age", 0) + SUPERBALL_SPLIT_INTERVAL
        child["superballMergeReadyAge"] = p.get("age", 0) + SUPERBALL_MERGE_DELAY if level + 1 >= max_level else None
        child["shotIndex"] = int(p.get("shotIndex", 0)) * 2 + child_index
        children.append(child)
    sounds.append("superball")
    return children


def superball_can_merge(projectile):
    if not projectile.get("superball") or int(projectile.get("superballLevel", 0)) < SUPERBALL_MAX_SPLIT_LEVEL:
        return False
    ready_age = projectile.get("superballMergeReadyAge")
    return ready_age is None or projectile.get("age", 0) >= ready_age


def merge_superballs(projectiles):
    result = []
    used = [False] * len(projectiles)
    merged_any = False
    for index, projectile in enumerate(projectiles):
        if used[index]:
            continue
        if not superball_can_merge(projectile):
            used[index] = True
            result.append(projectile)
            continue

        group = [projectile]
        used[index] = True
        for other_index in range(index + 1, len(projectiles)):
            other = projectiles[other_index]
            if used[other_index] or not superball_can_merge(other):
                continue
            if other.get("owner") != projectile.get("owner"):
                continue
            merge_radius = SUPERBALL_MERGE_RADIUS + (projectile.get("superballMass", 1) + other.get("superballMass", 1)) * 2.2
            if math.hypot(other["x"] - projectile["x"], other["y"] - projectile["y"]) <= merge_radius:
                group.append(other)
                used[other_index] = True

        if len(group) == 1:
            result.append(projectile)
            continue

        total_mass = min(SUPERBALL_MAX_MASS, sum(max(1, item.get("superballMass", 1)) for item in group))
        weight_sum = sum(max(1, item.get("superballMass", 1)) for item in group)
        merged = projectile.copy()
        merged["x"] = sum(item["x"] * max(1, item.get("superballMass", 1)) for item in group) / weight_sum
        merged["y"] = sum(item["y"] * max(1, item.get("superballMass", 1)) for item in group) / weight_sum
        merged["vx"] = sum(item["vx"] * max(1, item.get("superballMass", 1)) for item in group) / weight_sum * 0.52
        merged["vy"] = max(90, sum(item["vy"] * max(1, item.get("superballMass", 1)) for item in group) / weight_sum + 120)
        merged["av"] = projectile.get("av", 0) * 0.6
        merged["superballMass"] = total_mass
        merged["nextSuperballSplitAge"] = None
        merged["superballMergeReadyAge"] = None
        merged["merged"] = True
        result.append(merged)
        merged_any = True

    if merged_any:
        sounds.append("superball")
    return result


def projectile_player_direct_hit(projectile, speed):
    if projectile["age"] <= 0.18:
        return False
    for index, player in enumerate(state["players"]):
        if player["health"] <= 0:
            continue
        contact_radius = ZOMBIE_SPAWN_RADIUS if projectile.get("zombie") and index != projectile.get("owner") else TANK_CONTACT_RADIUS
        if projectile.get("boing"):
            contact_radius = BOING_CONTACT_RADIUS
        if projectile.get("superball"):
            contact_radius += min(18, (max(1, projectile.get("superballMass", 1)) ** 0.5) * 5)
        if math.hypot(player["x"] - projectile["x"], player["y"] - projectile["y"]) >= contact_radius:
            continue
        if projectile.get("tankType") == "nuke":
            handle_nuke_impact(projectile, projectile["x"], projectile["y"], speed + 18)
            return True
        if projectile.get("zombie"):
            handle_zombie_impact(projectile, projectile["x"], projectile["y"], speed + 18)
            return True
        damage_multiplier, radius_multiplier, base_damage = projectile_effect_multipliers(projectile)
        explode(
            projectile["x"],
            projectile["y"],
            speed + 18,
            damage_multiplier,
            radius_multiplier,
            base_damage,
            projectile.get("effect"),
            projectile.get("owner"),
            advance_turn=False,
        )
        return True
    return False


def update_projectiles(dt):
    projectiles = state.get("projectiles", [])
    if not projectiles:
        sync_projectile_field()
        return
    survivors = []
    exploded = False
    for p in projectiles:
        p["age"] += dt
        if p.get("heartCooldown", 0) > 0:
            p["heartCooldown"] = max(0, p.get("heartCooldown", 0) - dt)
        previous_x = p["x"]
        previous_y = p["y"]
        if p.get("cruise"):
            update_cruise_projectile(p, dt)
        else:
            steer_homing_projectile(p, dt)
            p["vx"] += state["wind"] * WIND_FORCE * dt
            p["vy"] += PROJECTILE_GRAVITY * dt
        p["x"] += p["vx"] * dt
        p["y"] += p["vy"] * dt
        p["angle"] += p["av"] * dt * 10
        speed = math.hypot(p["vx"], p["vy"])

        if p.get("cruise") and p["age"] >= p.get("maxAge", CRUISE_MAX_AGE):
            damage_multiplier, radius_multiplier, base_damage = projectile_effect_multipliers(p)
            explode(
                p["x"],
                p["y"],
                speed,
                damage_multiplier,
                radius_multiplier,
                base_damage,
                p.get("effect"),
                p.get("owner"),
                advance_turn=False,
            )
            exploded = True
            continue

        if p["x"] < -40 or p["x"] > W + 40 or p["y"] > H + 60:
            continue

        zombie_hit = projectile_zombie_hit(previous_x, previous_y, p["x"], p["y"])
        if zombie_hit is not None:
            zombie_index, zombie_x, zombie_y = zombie_hit
            impact_speed = speed + 10
            if 0 <= zombie_index < len(state.get("zombies", [])):
                state["zombies"].pop(zombie_index)
            sounds.append("zombiedie")
            if p.get("tankType") == "nuke":
                handle_nuke_impact(p, zombie_x, zombie_y, impact_speed)
            else:
                damage_multiplier, radius_multiplier, base_damage = projectile_effect_multipliers(p)
                explode(
                    zombie_x,
                    zombie_y,
                    impact_speed,
                    damage_multiplier,
                    radius_multiplier,
                    base_damage,
                    p.get("effect"),
                    p.get("owner"),
                    advance_turn=False,
                )
            exploded = True
            continue

        if projectile_player_direct_hit(p, speed):
            exploded = True
            continue

        hit = projectile_path_hit(previous_x, previous_y, p["x"], p["y"])
        if hit is not None:
            hit_x, hit_y = hit
            if p.get("boing"):
                handle_boing_terrain_impact(p, hit_x, hit_y)
                exploded = True
                continue
            if p.get("tankType") == "nuke":
                handle_nuke_impact(p, hit_x, hit_y, speed)
                exploded = True
                continue
            if p.get("zombie"):
                handle_zombie_impact(p, hit_x, hit_y, speed)
                exploded = True
                continue
            if p.get("bouncy") and p.get("bounces", 0) < p.get("maxBounces", 0):
                bounce_projectile(p, hit_x, hit_y)
                survivors.append(p)
                continue
            damage_multiplier, radius_multiplier, base_damage = projectile_effect_multipliers(p)
            explode(
                hit_x,
                hit_y,
                speed,
                damage_multiplier,
                radius_multiplier,
                base_damage,
                p.get("effect"),
                p.get("owner"),
                advance_turn=False,
            )
            exploded = True
            continue

        cheese_children = split_cheese_projectile(p)
        if cheese_children:
            survivors.extend(cheese_children)
        else:
            superball_children = split_superball_projectile(p)
            if superball_children:
                survivors.extend(superball_children)
            else:
                survivors.append(p)

    survivors = merge_superballs(survivors)
    set_projectiles(survivors)
    if not survivors and state["winner"] is None:
        resolve_shot_end()


def update_particles():
    next_particles = []
    for p in state["particles"]:
        p["x"] += p["vx"]
        p["y"] += p["vy"]
        p["vy"] += 0.1
        p["life"] -= 1
        if p["life"] > 0:
            next_particles.append(p)
    state["particles"] = next_particles[:120]


def update_effects():
    next_effects = []
    for effect in state.get("effects", []):
        effect["life"] -= 1
        if effect["life"] > 0:
            next_effects.append(effect)
    state["effects"] = next_effects[:40]


def snapshot():
    state["tick"] += 1
    event_sounds = list(sounds)
    sounds.clear()
    state["platforms"] = [platform for platform in state["platforms"] if platform_is_visible(platform)]
    return {
        "ground": state["ground"],
        "platformGround": state["platformGround"],
        "platformMask": state["platformMask"],
        "platforms": state["platforms"],
        "players": [
            {k: p[k] for k in ("name", "tankType", "x", "y", "angleBody", "health", "color", "dir", "aim", "power", "moveRemaining", "stuckTurns", "poopDamage", "poopStacks", "respawnTimer", "isDummy")}
            for p in state["players"]
        ],
        "playerCount": state["playerCount"],
        "phase": state["phase"],
        "worldVersion": state["worldVersion"],
        "current": state["current"],
        "projectile": state["projectile"],
        "projectiles": state.get("projectiles", []),
        "particles": state["particles"],
        "effects": state.get("effects", []),
        "zombies": state.get("zombies", []),
        "nukeMarks": state.get("nukeMarks", []),
        "wind": state["wind"],
        "skyMode": state["skyMode"],
        "winner": state["winner"],
        "tick": state["tick"],
        "sounds": event_sounds,
    }


def broadcast():
    data = "event: state\ndata: " + json.dumps(snapshot(), separators=(",", ":")) + "\n\n"
    dead = []
    for client_id, queue in list(listeners.items()):
        try:
            queue.put_nowait(data)
        except Exception:
            dead.append(client_id)
    for client_id in dead:
        listeners.pop(client_id, None)


def game_loop():
    last_broadcast = 0
    while True:
        time.sleep(1 / 60)
        with lock:
            if state["phase"] == "playing" and state["winner"] is None:
                for player in state["players"]:
                    update_player(player, 1 / 60)
                update_dummy_respawns(1 / 60)
                update_zombies(1 / 60)
                update_projectiles(1 / 60)
            update_particles()
            update_effects()
            now = time.time()
            if now - last_broadcast > 1 / 30:
                broadcast()
                last_broadcast = now


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        with lock:
            if self.path == "/join":
                name = "".join(ch for ch in str(body.get("name", "Player"))[:16] if ch.isalnum() or ch in " _-").strip() or "Player"
                tank_type = str(body.get("tankType", ""))
                seat = assign_seat(str(body.get("id", "")), name, tank_type)
                self.send_json({"seat": seat, "phase": state["phase"], "worldVersion": state["worldVersion"]})
            elif self.path == "/input":
                client = clients.get(str(body.get("id", "")))
                if state["phase"] == "playing" and client and client["seat"] in range(player_count()):
                    player = state["players"][client["seat"]]
                    player["aim"] = clamp(float(body.get("angle", player["aim"])), aim_min_for_player(player), AIM_MAX)
                    player["power"] = clamp(float(body.get("power", player["power"])), 20, 100)
                self.send_json({"ok": True})
            elif self.path == "/fire":
                fire_for(str(body.get("id", "")))
                self.send_json({"ok": True})
            elif self.path == "/move":
                move_for(str(body.get("id", "")), body.get("direction", 0))
                self.send_json({"ok": True})
            elif self.path == "/steer":
                steer_for(str(body.get("id", "")), body.get("direction", 0))
                self.send_json({"ok": True})
            elif self.path == "/boost":
                boost_for(str(body.get("id", "")))
                self.send_json({"ok": True})
            elif self.path == "/reset":
                reset_game()
                self.send_json({"ok": True})
            elif self.path == "/host/start":
                count = int(clamp(int(body.get("count", player_count())), MIN_PLAYERS, MAX_PLAYERS))
                reset_game(count=count, kick_clients=True, phase="playing")
                self.send_json({
                    "ok": True,
                    "playerCount": player_count(),
                    "worldVersion": state["worldVersion"],
                })
            elif self.path == "/host/recreate":
                recreate_world()
                self.send_json({"ok": True, "phase": state["phase"], "worldVersion": state["worldVersion"]})
            else:
                self.send_error(404)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def do_GET(self):
        if self.path.startswith("/state"):
            with lock:
                self.send_json(snapshot())
            return
        if self.path.startswith("/events"):
            client_id = parse_qs(urlparse(self.path).query).get("id", [""])[0] or f"anonymous-{id(self)}"
            queue = Queue()
            with lock:
                old_queue = listeners.get(client_id)
                if old_queue is not None:
                    old_queue.put_nowait(None)
                listeners[client_id] = queue
                queue.put("event: state\ndata: " + json.dumps(snapshot(), separators=(",", ":")) + "\n\n")
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            try:
                while True:
                    message = queue.get()
                    if message is None:
                        break
                    self.wfile.write(message.encode("utf-8"))
                    self.wfile.flush()
            except Exception:
                pass
            finally:
                with lock:
                    if listeners.get(client_id) is queue:
                        listeners.pop(client_id, None)
            return
        super().do_GET()

    def send_json(self, payload):
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


if __name__ == "__main__":
    threading.Thread(target=game_loop, daemon=True).start()
    server = ThreadingHTTPServer(("0.0.0.0", 4173), Handler)
    print("Sky Battery server: http://0.0.0.0:4173", flush=True)
    server.serve_forever()
