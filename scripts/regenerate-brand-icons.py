#!/usr/bin/env python3
"""Generate tab/apple favicons from public/brand/logo.png (ikon W biru)."""
from __future__ import annotations

import base64
import io
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "public/brand/logo.png"

# Fine-tune jika tab masih terpotong (positif = crop lebih ke bawah)
EXTRA_BOTTOM_RATIO = 0.20
EXTRA_TOP_RATIO = 0.0
CANVAS_INSET = 0.12
# Geser sedikit ke atas di canvas tab (lebih banyak ruang di bawah)
TAB_OFFSET_Y = -2


def extract_icon_mark(logo: Image.Image) -> Image.Image:
    arr = np.array(logo.convert("RGBA"))
    h, w = arr.shape[:2]
    search_h = int(h * 0.55)
    region = arr[:search_h, :, :]
    rgb = region[:, :, :3]
    alpha = region[:, :, 3]
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    blue = (b > 160) & (r < 120) & (g < 180) & (alpha > 200)
    ys, xs = np.where(blue)
    if ys.size == 0:
        raise RuntimeError("Tidak menemukan area biru ikon di brand/logo.png")

    y0, y1 = int(ys.min()), int(ys.max())
    x0, x1 = int(xs.min()), int(xs.max())
    side_est = max(x1 - x0 + 1, y1 - y0 + 1)
    pad = int(side_est * 0.05) + 4

    x0 = max(0, x0 - pad)
    x1 = min(w - 1, x1 + pad)
    y0 = max(0, y0 - pad - int(side_est * EXTRA_TOP_RATIO))
    y1 = min(
        search_h - 1,
        y1 + pad + int(side_est * EXTRA_BOTTOM_RATIO),
    )

    side = max(x1 - x0 + 1, y1 - y0 + 1)
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2 + side_est * (EXTRA_BOTTOM_RATIO * 0.35)
    left = max(0, int(round(cx - side / 2)))
    top = max(0, int(round(cy - side / 2)))
    right = min(w, left + side)
    bottom = min(search_h, top + side)
    if right - left < side:
        left = max(0, right - side)
    if bottom - top < side:
        top = max(0, bottom - side)

    return logo.crop((left, top, right, bottom))


def fit_tab_icon(src: Image.Image, size: int) -> Image.Image:
    src = src.convert("RGBA")
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = max(1, int(round(size * (1 - 2 * CANVAS_INSET))))
    scaled = src.resize((inner, inner), Image.Resampling.LANCZOS)
    ox = (size - inner) // 2
    oy = (size - inner) // 2 + TAB_OFFSET_Y
    oy = max(0, min(size - inner, oy))
    if scaled.mode != "RGBA":
        scaled = scaled.convert("RGBA")
    canvas.paste(scaled, (ox, oy), scaled.split()[3])
    return canvas


def write_svg_from_png(png32: Image.Image, path: Path) -> None:
    buf = io.BytesIO()
    png32.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    path.write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        'viewBox="0 0 32 32" role="img" aria-label="WorkRecord">\n'
        f'  <image width="32" height="32" xlink:href="data:image/png;base64,{b64}"/>\n'
        "</svg>\n",
        encoding="utf-8",
    )


def main() -> None:
    logo = Image.open(LOGO)
    icon = extract_icon_mark(logo)
    icon32 = fit_tab_icon(icon, 32)

    icon32.save(ROOT / "public/icon.png", "PNG")
    icon32.save(ROOT / "app/icon.png", "PNG")
    icon32.save(ROOT / "public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])

    for pad, path in [
        (22, ROOT / "public/apple-touch-icon.png"),
        (22, ROOT / "app/apple-icon.png"),
    ]:
        canvas = Image.new("RGBA", (180, 180), (255, 255, 255, 255))
        inner_side = 180 - 2 * pad
        inner = fit_tab_icon(icon, inner_side)
        canvas.paste(inner, (pad, pad), inner)
        canvas.save(path, "PNG")

    for p in [ROOT / "public/favicon.svg", ROOT / "public/brand/favicon.svg"]:
        write_svg_from_png(icon32, p)
    shutil.copy2(ROOT / "public/favicon.ico", ROOT / "app/favicon.ico")
    print("Brand icons regenerated.")


if __name__ == "__main__":
    main()
