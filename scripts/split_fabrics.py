"""Crop verified fabrics, build photo masks, write templates.json."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

SRC_DIR = Path(
    r"C:\Users\ameya\.cursor\projects\c-Users-ameya-OneDrive-Desktop-Dressindia\assets"
)
ROOT = Path(r"C:\Users\ameya\OneDrive\Desktop\Dressindia")
OUT_DIR = ROOT / "assets" / "fabrics" / "verified"
JSON_PATH = ROOT / "assets" / "fabrics.json"
TPL = ROOT / "assets" / "templates"
TPL_JSON = ROOT / "assets" / "templates.json"

JOBS = [
    ("*PHOTO-2026-08-13-11-35-25-fd606367*", "h", 6, (0.08, 0.08, 0.92, 0.78)),
    ("*PHOTO-2026-08-13-11-35-25_1-450ec343*", "h", 9, (0.08, 0.07, 0.92, 0.80)),
    ("*PHOTO-2026-08-13-11-35-25_2-b3013211*", "h", 7, (0.07, 0.08, 0.93, 0.78)),
    ("*PHOTO-2026-08-13-11-35-25_3-0b164372*", "h", 9, (0.08, 0.07, 0.92, 0.82)),
    ("*PHOTO-2026-08-13-11-35-25_4-cb3edfb7*", "v", 9, (0.03, 0.12, 0.97, 0.86)),
    ("*PHOTO-2026-08-13-11-35-25_5-ea4a77c8*", "v", 7, (0.04, 0.14, 0.96, 0.84)),
    ("*PHOTO-2026-08-13-11-35-25_6-6dccc8cb*", "h", 5, (0.08, 0.10, 0.92, 0.78)),
    ("*PHOTO-2026-08-13-11-35-25_7-5e6ac208*", "h", 8, (0.08, 0.08, 0.92, 0.80)),
    ("*PHOTO-2026-08-13-11-35-26-3f43f2ee*", "grid13", 13, (0.05, 0.07, 0.96, 0.86)),
    ("*PHOTO-2026-08-13-11-35-26_2-6322501c*", "h", 10, (0.08, 0.06, 0.92, 0.82)),
]


def rgb_to_hsv(r, g, b):
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    mx, mn = max(r, g, b), min(r, g, b)
    df = mx - mn
    if df == 0:
        h = 0.0
    elif mx == r:
        h = (60 * ((g - b) / df) + 360) % 360
    elif mx == g:
        h = (60 * ((b - r) / df) + 120) % 360
    else:
        h = (60 * ((r - g) / df) + 240) % 360
    s = 0 if mx == 0 else df / mx
    return h, s, mx


def color_name(h, s, v):
    if s < 0.14:
        if v > 0.78:
            return "Ivory"
        if v > 0.52:
            return "Silver"
        return "Grey"
    if h < 10 or h >= 350:
        return "Red"
    if h < 22:
        return "Rust"
    if h < 32:
        return "Orange"
    if h < 42:
        return "Peach"
    if h < 55:
        return "Gold" if v > 0.55 else "Mustard"
    if h < 70:
        return "Yellow"
    if h < 95:
        return "Lime"
    if h < 125:
        return "Olive" if v < 0.45 else "Green"
    if h < 155:
        return "Emerald"
    if h < 175:
        return "Teal"
    if h < 195:
        return "Cyan"
    if h < 225:
        return "Sky"
    if h < 250:
        return "Blue"
    if h < 275:
        return "Navy"
    if h < 305:
        return "Lavender"
    if h < 328:
        return "Magenta"
    if h < 345:
        return "Pink"
    return "Rose"


def sort_key(h, s, v):
    if s < 0.14:
        return (1, v)
    return (0, (h + 15) % 360)


def dominant_hsv(im: Image.Image):
    small = im.convert("RGB").resize((90, 64), Image.Resampling.BOX)
    buckets = Counter()
    sv = []
    for r, g, b in small.getdata():
        h, s, v = rgb_to_hsv(r, g, b)
        if 38 <= h <= 58 and v > 0.62:
            continue
        if v < 0.12:
            continue
        if s < 0.16:
            continue
        buckets[int(h // 8) * 8] += 1
        sv.append((s, v))
    if not buckets:
        r, g, b = list(small.getdata())[len(list(small.getdata())) // 2]
        return rgb_to_hsv(r, g, b)
    h = buckets.most_common(1)[0][0] + 4
    s = sum(x[0] for x in sv) / len(sv)
    v = sum(x[1] for x in sv) / len(sv)
    return h, s, v


def find(globpat):
    hits = list(SRC_DIR.glob(globpat))
    if not hits:
        raise FileNotFoundError(globpat)
    return hits[0]


def even_split(im, axis, n, frac):
    w, h = im.size
    x0, y0, x1, y1 = [int(frac[0] * w), int(frac[1] * h), int(frac[2] * w), int(frac[3] * h)]
    crops = []
    gap = 0.10
    if axis == "h":
        sl = (y1 - y0) / n
        inset = int((x1 - x0) * 0.12)
        for i in range(n):
            a = int(y0 + sl * (i + gap))
            b = int(y0 + sl * (i + 1 - gap))
            crops.append(im.crop((x0 + inset, a, x1 - inset, b)))
    else:
        sl = (x1 - x0) / n
        inset = int((y1 - y0) * 0.12)
        for i in range(n):
            a = int(x0 + sl * (i + gap))
            b = int(x0 + sl * (i + 1 - gap))
            crops.append(im.crop((a, y0 + inset, b, y1 - inset)))
    return crops


def peak_split(im, axis, n, frac):
    w, h = im.size
    x0, y0, x1, y1 = [int(frac[0] * w), int(frac[1] * h), int(frac[2] * w), int(frac[3] * h)]
    rgb = im.convert("RGB")
    if axis == "h":
        means = []
        for y in range(y0, y1):
            acc = [0, 0, 0]
            c = 0
            for x in range(x0, x1, 5):
                p = rgb.getpixel((x, y))
                acc[0] += p[0]
                acc[1] += p[1]
                acc[2] += p[2]
                c += 1
            means.append(tuple(v / c for v in acc))
        d = [0.0]
        for i in range(1, len(means)):
            d.append(sum((means[i][k] - means[i - 1][k]) ** 2 for k in range(3)) ** 0.5)
        sm = d[:]
        for i in range(2, len(d) - 2):
            sm[i] = sum(d[i - 2 : i + 3]) / 5
        peaks = []
        for i in range(4, len(sm) - 4):
            if sm[i] >= sm[i - 1] and sm[i] >= sm[i + 1] and sm[i] > 7:
                peaks.append((sm[i], y0 + i))
        peaks.sort(reverse=True)
        minsp = (y1 - y0) / n * 0.5
        chosen = []
        for _, yi in peaks:
            if all(abs(yi - c) >= minsp for c in chosen):
                chosen.append(yi)
            if len(chosen) == n - 1:
                break
        if len(chosen) < n - 1:
            return even_split(im, axis, n, frac)
        bounds = [y0] + sorted(chosen) + [y1]
        inset = int((x1 - x0) * 0.12)
        crops = []
        for i in range(n):
            a, b = bounds[i], bounds[i + 1]
            pad = max(2, int((b - a) * 0.14))
            crops.append(im.crop((x0 + inset, a + pad, x1 - inset, b - pad)))
        return crops
    return even_split(im, axis, n, frac)


def split_grid13(im):
    left = peak_split(im, "h", 9, (0.05, 0.08, 0.60, 0.84))
    w, h = im.size
    rx0, ry0, rx1, ry1 = int(w * 0.60), int(h * 0.10), int(w * 0.96), int(h * 0.60)
    mx, my = (rx0 + rx1) // 2, (ry0 + ry1) // 2
    p = 12
    extra = [
        im.crop((rx0 + p, ry0 + p, mx - p, my - p)),
        im.crop((mx + p, ry0 + p, rx1 - p, my - p)),
        im.crop((rx0 + p, my + p, mx - p, ry1 - p)),
        im.crop((mx + p, my + p, rx1 - p, ry1 - p)),
    ]
    return left + extra


def prepare(crop: Image.Image) -> Image.Image:
    crop = crop.convert("RGB")
    w, h = crop.size
    if w < 40 or h < 22:
        raise ValueError("tiny")
    crop = ImageEnhance.Color(crop).enhance(1.07)
    crop = ImageEnhance.Contrast(crop).enhance(1.04)
    long = max(w, h)
    if long > 900:
        s = 900 / long
        crop = crop.resize((int(w * s), int(h * s)), Image.Resampling.LANCZOS)
    return crop


def crop_fabrics():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*"):
        old.unlink()
    raw = []
    for globpat, axis, count, frac in JOBS:
        path = find(globpat)
        im = Image.open(path).convert("RGB")
        crops = split_grid13(im) if axis == "grid13" else peak_split(im, axis, count, frac)
        print(path.name[-34:], "first", crops[0].size, "n", len(crops))
        for crop in crops:
            try:
                out = prepare(crop)
            except ValueError:
                continue
            h, s, v = dominant_hsv(out)
            raw.append((out, h, s, v, color_name(h, s, v)))
    raw.sort(key=lambda t: sort_key(t[1], t[2], t[3]))
    used = Counter()
    catalog = []
    for i, (im, h, s, v, label) in enumerate(raw, 1):
        used[label] += 1
        pretty = label if used[label] == 1 else f"{label} {used[label]}"
        fname = f"v{i:03d}-{label.lower()}.jpg"
        dest = OUT_DIR / fname
        if dest.exists():
            fname = f"v{i:03d}-{label.lower()}-{used[label]}.jpg"
            dest = OUT_DIR / fname
        im.save(dest, "JPEG", quality=88, optimize=True)
        catalog.append({"id": f"v{i:03d}", "name": pretty, "file": f"verified/{fname}", "group": "verified"})
    JSON_PATH.write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    print("fabrics", len(catalog), dict(used))
    return catalog


def is_skin(r, g, b):
    h, s, v = rgb_to_hsv(r, g, b)
    return (0 <= h <= 40 or h >= 350) and 0.18 < s < 0.68 and 0.25 < v < 0.95 and r > g > b * 0.7


def close_mask(mask: Image.Image) -> Image.Image:
    m = mask.filter(ImageFilter.MaxFilter(7))
    m = m.filter(ImageFilter.MinFilter(7))
    m = m.filter(ImageFilter.GaussianBlur(0.8))
    return m.point(lambda p: 255 if p > 90 else 0)


def punch_overlay(photo: Image.Image, mask: Image.Image) -> Image.Image:
    photo = photo.convert("RGBA")
    overlay = photo.copy()
    op = overlay.load()
    mp = mask.load()
    w, h = photo.size
    for y in range(h):
        for x in range(w):
            if mp[x, y] > 90:
                r, g, b, a = op[x, y]
                op[x, y] = (r, g, b, 0)
    return overlay


def light_map(photo: Image.Image) -> Image.Image:
    g = ImageOps.grayscale(photo.convert("RGB"))
    g = ImageEnhance.Contrast(g).enhance(1.35)
    return g


def mask_black_bg(path: Path, waist=0.39, hem=0.955):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    pix = im.load()
    skirt = Image.new("L", (w, h), 0)
    blouse = Image.new("L", (w, h), 0)
    sp, bp = skirt.load(), blouse.load()
    wy, hy = int(h * waist), int(h * hem)
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
            if lum < 16:
                continue
            if is_skin(r, g, b):
                continue
            if y >= wy and y <= hy:
                sp[x, y] = 255
            elif int(h * 0.20) < y < wy:
                bp[x, y] = 255
    return close_mask(skirt), close_mask(blouse), im


def mask_color_seed(path: Path, waist=0.36, hem=0.97, thresh=95):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    pix = im.load()
    sx, sy = int(w * 0.50), int(h * 0.62)
    sr, sg, sb = pix[sx, sy]
    skirt = Image.new("L", (w, h), 0)
    blouse = Image.new("L", (w, h), 0)
    sp, bp = skirt.load(), blouse.load()
    wy, hy = int(h * waist), int(h * hem)
    t2 = thresh * thresh
    for y in range(h):
        for x in range(w):
            r, g, b = pix[x, y]
            if is_skin(r, g, b):
                continue
            dist = (r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2
            if dist > t2:
                continue
            if y >= wy and y <= hy:
                sp[x, y] = 255
            elif int(h * 0.18) < y < wy:
                bp[x, y] = 255
    return close_mask(skirt), close_mask(blouse), im.convert("RGBA")


def save_set(stem: str, skirt, blouse, photo):
    skirt.save(TPL / f"{stem}-skirt.png")
    blouse.save(TPL / f"{stem}-blouse.png")
    light_map(photo).save(TPL / f"{stem}-light.png")
    punch_overlay(photo, skirt).save(TPL / f"{stem}-overlay.png")
    print("saved", stem, "skirt px", sum(1 for p in skirt.getdata() if p > 90))


def build_masks():
    s, b, im = mask_black_bg(TPL / "lehenga-studio.png", 0.40, 0.96)
    save_set("lehenga-studio", s, b, im)

    specs = [
        ("itrh-zarika", 0.34, 0.96, 110),
        ("itrh-rangmala", 0.36, 0.97, 100),
        ("itrh-rhea", 0.36, 0.97, 105),
        ("itrh-neelratna", 0.38, 0.97, 100),
    ]
    templates = [
        {
            "id": "studio",
            "name": "Studio flare",
            "photo": "assets/templates/lehenga-studio.png",
            "mask": "assets/templates/lehenga-studio-skirt.png",
            "blouse": "assets/templates/lehenga-studio-blouse.png",
            "light": "assets/templates/lehenga-studio-light.png",
            "overlay": "assets/templates/lehenga-studio-overlay.png",
            "credit": "",
        }
    ]
    names = {
        "itrh-zarika": "Zarika flare",
        "itrh-rangmala": "Rangmala flare",
        "itrh-rhea": "Rhea flare",
        "itrh-neelratna": "Neelratna panel",
    }
    for stem, waist, hem, th in specs:
        s, b, im = mask_color_seed(TPL / f"{stem}.jpg", waist, hem, th)
        save_set(stem, s, b, im)
        templates.append(
            {
                "id": stem,
                "name": names[stem],
                "photo": f"assets/templates/{stem}.jpg",
                "mask": f"assets/templates/{stem}-skirt.png",
                "blouse": f"assets/templates/{stem}-blouse.png",
                "light": f"assets/templates/{stem}-light.png",
                "overlay": f"assets/templates/{stem}-overlay.png",
                "credit": "ITRH",
            }
        )
    TPL_JSON.write_text(json.dumps(templates, indent=2), encoding="utf-8")


if __name__ == "__main__":
    crop_fabrics()
    build_masks()
