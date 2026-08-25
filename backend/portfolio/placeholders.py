"""Deterministic placeholder image generation.

Generated locally with Pillow rather than fetched from a placeholder service, so
`seed_demo` works with no network and CI never depends on a third party being up.
"""

from __future__ import annotations

import colorsys
import hashlib
from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageFont


def _hue_from(seed: str) -> float:
    digest = hashlib.sha256(seed.encode()).digest()
    return digest[0] / 255.0


def _rgb(hue: float, saturation: float, value: float) -> tuple[int, int, int]:
    r, g, b = colorsys.hsv_to_rgb(hue, saturation, value)
    return int(r * 255), int(g * 255), int(b * 255)


def gradient_image(seed: str, width: int, height: int, label: str = "") -> ContentFile:
    """A soft diagonal-gradient panel, deterministic for a given seed."""
    hue = _hue_from(seed)
    start = _rgb(hue, 0.55, 0.85)
    end = _rgb((hue + 0.12) % 1.0, 0.65, 0.45)

    image = Image.new("RGB", (width, height), start)
    draw = ImageDraw.Draw(image)
    steps = max(width, height)
    for i in range(steps):
        ratio = i / steps
        colour = tuple(int(start[c] + (end[c] - start[c]) * ratio) for c in range(3))
        draw.line([(i - height, height), (i, 0)], fill=colour, width=3)

    if label:
        initials = "".join(part[0] for part in label.split()[:2]).upper()
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size=height // 4)
        except OSError:  # pragma: no cover - font availability varies by platform
            font = ImageFont.load_default()
        box = draw.textbbox((0, 0), initials, font=font)
        draw.text(
            ((width - box[2]) / 2, (height - box[3]) / 2 - box[1] / 2),
            initials,
            font=font,
            fill=(255, 255, 255),
        )

    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=82, optimize=True)
    return ContentFile(buffer.getvalue())


def avatar_image(seed: str, size: int = 512) -> ContentFile:
    """A portrait-shaped placeholder for the profile photo."""
    return gradient_image(seed, size, size, label="A R")


def logo_image(seed: str, label: str, size: int = 128) -> ContentFile:
    return gradient_image(seed, size, size, label=label)
