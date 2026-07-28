"""
Animated GIF: chaotic particles → cat silhouette (from avatar.png edges).
"""
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent

W, H = 980, 432
MAP_X, MAP_Y = 24, 60
MAP_W, MAP_H = 320, 320
BG = (13, 17, 23)
PANEL = (1, 4, 9)
TEXT = (230, 237, 243)
MUTED = (139, 148, 158)
CYAN = (88, 166, 255)
GREEN = (0, 255, 157)
PURPLE = (139, 92, 246)
RED = (255, 23, 68)
COLORS = [
    (255, 23, 68),
    (139, 92, 246),
    (0, 255, 157),
    (88, 166, 255),
    (230, 237, 243),
    (163, 113, 247),
]


def cat_targets(n=780, seed=42):
    """Edge + light fill of the cat head from avatar.png."""
    rng = random.Random(seed)
    im = Image.open(ROOT / "avatar.png").convert("L").resize((240, 240), Image.Resampling.LANCZOS)
    arr = np.array(im)
    # crop to head/shoulders (drop top chrome + bottom floor bar)
    y0, y1 = 70, 215
    x0, x1 = 20, 220
    crop = arr[y0:y1, x0:x1]
    mask = (crop < 90).astype(np.uint8) * 255
    mask_img = Image.fromarray(mask)
    edges = np.array(mask_img.filter(ImageFilter.FIND_EDGES))

    h, w = crop.shape
    pts = []

    # outline (priority — ears readable)
    ey, ex = np.where(edges > 40)
    for x, y in zip(ex.tolist(), ey.tolist()):
        pts.append((x, y, True))

    # sparse interior fill
    iy, ix = np.where(mask > 0)
    for i in range(0, len(ix), 6):
        pts.append((int(ix[i]), int(iy[i]), False))

    rng.shuffle(pts)
    pts = pts[:n]

    # map into visual panel with padding
    pad = 0.1
    usable_w = MAP_W * (1 - 2 * pad)
    usable_h = MAP_H * (1 - 2 * pad)
    out = []
    for x, y, solid in pts:
        out.append(
            (
                MAP_X + MAP_W * pad + (x / w) * usable_w,
                MAP_Y + MAP_H * pad + (y / h) * usable_h,
                solid,
            )
        )
    return out


def lerp(a, b, t):
    return a + (b - a) * t


def ease_out_cubic(t):
    return 1 - (1 - t) ** 3


def frame_phase(f, total):
    t = f / total
    if t < 0.40:
        return ease_out_cubic(t / 0.40), "assemble"
    if t < 0.78:
        return 1.0, "hold"
    u = (t - 0.78) / 0.22
    return 1.0 - ease_out_cubic(u) * 0.9, "scatter"


def draw_window(draw: ImageDraw.ImageDraw):
    draw.rounded_rectangle([4, 4, W - 5, H - 5], radius=14, outline=(139, 92, 246), width=2)
    draw.rounded_rectangle([4, 4, W - 5, 36], radius=14, fill=(1, 4, 9))
    draw.rectangle([4, 22, W - 5, 36], fill=(1, 4, 9))
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        draw.ellipse([16 + i * 18, 12, 28 + i * 18, 24], fill=c)
    draw.text((78, 12), "dente22 — visual.map · cat assemble", fill=MUTED)
    draw.text((W - 280, 12), "diskusms-site-iota.vercel.app", fill=MUTED)

    draw.text((MAP_X + 4, 42), "VISUAL.MAP", fill=CYAN)
    draw.text((MAP_X + 95, 43), "./assemble --target=cat", fill=(72, 79, 88))
    draw.rounded_rectangle(
        [MAP_X - 4, MAP_Y - 4, MAP_X + MAP_W + 4, MAP_Y + MAP_H + 4],
        radius=12,
        outline=(88, 166, 255),
        width=1,
        fill=PANEL,
    )
    draw.line([(MAP_X + 6, MAP_Y + 18), (MAP_X + 6, MAP_Y + 6), (MAP_X + 18, MAP_Y + 6)], fill=GREEN, width=2)
    draw.line(
        [(MAP_X + MAP_W - 6, MAP_Y + 18), (MAP_X + MAP_W - 6, MAP_Y + 6), (MAP_X + MAP_W - 18, MAP_Y + 6)],
        fill=GREEN,
        width=2,
    )
    draw.line(
        [(MAP_X + 6, MAP_Y + MAP_H - 18), (MAP_X + 6, MAP_Y + MAP_H - 6), (MAP_X + 18, MAP_Y + MAP_H - 6)],
        fill=RED,
        width=2,
    )
    draw.line(
        [
            (MAP_X + MAP_W - 6, MAP_Y + MAP_H - 18),
            (MAP_X + MAP_W - 6, MAP_Y + MAP_H - 6),
            (MAP_X + MAP_W - 18, MAP_Y + MAP_H - 6),
        ],
        fill=RED,
        width=2,
    )


def draw_system(draw: ImageDraw.ImageDraw):
    sx = 380
    draw.text((sx, 42), "SYSTEM.INFO", fill=CYAN)
    draw.line([(sx, 58), (sx + 420, 58)], fill=(48, 54, 61), width=1)
    draw.text((W - 70, 42), "LIVE", fill=RED)
    draw.ellipse([W - 88, 45, W - 78, 55], fill=RED)

    draw.rounded_rectangle([sx, 72, sx + 188, 94], radius=4, fill=(76, 29, 149))
    draw.text((sx + 10, 76), "dente22@diskusms", fill=(233, 213, 255))

    rows = [
        ("Subject", "Dente22"),
        ("Role", "vibe coder · sound x code"),
        ("Origin", "Almaty"),
        ("Uptime", "~18-19 yrs (b. 2007)"),
        ("Status", "Jam · Mix · Master · Ship"),
        ("ToolChain", "Cursor · VS Code · git"),
        ("Core.Lang", "TypeScript · Python · JS"),
        ("Core.Stack", "3D web · bots · Vercel"),
        ("Core.Sound", "DiskusMS · drops · radar"),
        ("Grid.TG", "@Diskusmms"),
        ("Grid.GH", "github.com/Dente22"),
        ("Grid.Web", "diskusms-site-iota.vercel.app"),
    ]
    y = 118
    for label, value in rows:
        dots = "." * max(2, 40 - len(label) - len(value) // 2)
        draw.text((sx, y), f"{label} {dots} {value}", fill=TEXT)
        # recolor label approx by overdrawing green label
        draw.text((sx, y), label, fill=GREEN)
        y += 20

    draw.text((sx, H - 28), "Mode VIBE+AI  ·  Diff +ideas/-noise  ·  REBEL_MODE", fill=MUTED)


def main():
    targets = cat_targets()
    rng = random.Random(7)
    starts = [(rng.uniform(MAP_X, MAP_X + MAP_W), rng.uniform(MAP_Y, MAP_Y + MAP_H)) for _ in targets]
    colors = [COLORS[i % len(COLORS)] for i in range(len(targets))]

    frames = []
    total = 56
    for f in range(total):
        img = Image.new("RGB", (W, H), BG)
        draw = ImageDraw.Draw(img)
        draw_window(draw)

        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        cx, cy = MAP_X + MAP_W / 2, MAP_Y + MAP_H * 0.55
        for r, a in ((90, 28), (55, 40), (30, 55)):
            gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(139, 92, 246, a))
        img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
        draw = ImageDraw.Draw(img)

        t, phase = frame_phase(f, total)
        for i, ((tx, ty, solid), (sx, sy), col) in enumerate(zip(targets, starts, colors)):
            shimmer = math.sin(f * 0.35 + i * 0.17) * 1.5 if phase == "hold" else 0.0
            x = lerp(sx, tx, t) + shimmer
            y = lerp(sy, ty, t) + shimmer * 0.35
            r = 2.2 if solid else 1.3
            draw.ellipse([x - r, y - r, x + r, y + r], fill=col)

        draw.rounded_rectangle(
            [MAP_X + 70, MAP_Y + MAP_H + 10, MAP_X + 260, MAP_Y + MAP_H + 30],
            radius=10,
            fill=(22, 27, 34),
            outline=(48, 54, 61),
        )
        label = {"assemble": "assembling...", "hold": "CAT LOCKED", "scatter": "reshuffle..."}[phase]
        draw.ellipse(
            [MAP_X + 82, MAP_Y + MAP_H + 16, MAP_X + 90, MAP_Y + MAP_H + 24],
            fill=GREEN if phase == "hold" else CYAN,
        )
        draw.text((MAP_X + 96, MAP_Y + MAP_H + 14), f"particles -> {label}", fill=MUTED)

        draw_system(draw)
        frames.append(img.convert("P", palette=Image.ADAPTIVE, colors=64))

    out = ROOT / "visual-map.gif"
    frames[0].save(
        out,
        save_all=True,
        append_images=frames[1:],
        duration=75,
        loop=0,
        optimize=True,
    )
    hold_idx = int(total * 0.58)
    frames[hold_idx].convert("RGB").save(ROOT / "visual-map.png", optimize=True)
    print("wrote", out, "bytes", out.stat().st_size, "frames", len(frames), "targets", len(targets))


if __name__ == "__main__":
    main()
