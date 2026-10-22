"""Génère l'icône de Faunapedia et ses déclinaisons (Pillow requis).

Usage : python3 scripts/make-icons.py
La chouette provient de la police Material Design Icons (licence Apache 2.0).
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
VENDOR = ROOT / 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons'
FONT = VENDOR / 'Fonts/MaterialCommunityIcons.ttf'
GLYPHS = json.loads((VENDOR / 'glyphmaps/MaterialCommunityIcons.json').read_text())
OUT = ROOT / 'assets/images'

BG_CENTER = (24, 38, 31)
BG_EDGE = (7, 9, 11)
GOLD_TOP = (246, 206, 122)
GOLD_BOTTOM = (214, 150, 52)


def radial_background(size: int) -> Image.Image:
    img = Image.new('RGB', (size, size), BG_EDGE)
    px = img.load()
    cx = cy = size / 2
    max_d = (2 ** 0.5) * size / 2
    for y in range(size):
        for x in range(size):
            t = min(1.0, (((x - cx) ** 2 + (y - cy * 0.9) ** 2) ** 0.5) / max_d)
            t = t ** 1.3
            px[x, y] = tuple(round(BG_CENTER[i] * (1 - t) + BG_EDGE[i] * t) for i in range(3))
    return img


def vertical_gradient(size: int) -> Image.Image:
    grad = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(grad)
    for y in range(size):
        t = y / (size - 1)
        draw.line([(0, y), (size, y)], fill=tuple(round(GOLD_TOP[i] * (1 - t) + GOLD_BOTTOM[i] * t) for i in range(3)))
    return grad


def emblem(size: int, scale: float = 1.0, ring: bool = True) -> Image.Image:
    """Chouette dorée (et anneau) sur fond transparent."""
    layer = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(layer)
    if ring:
        r = size * 0.36 * scale
        w = max(2, round(size * 0.018 * scale))
        draw.ellipse([size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r], outline=255, width=w)
    font = ImageFont.truetype(str(FONT), round(size * 0.5 * scale))
    glyph = chr(GLYPHS['owl'])
    box = draw.textbbox((0, 0), glyph, font=font)
    gw, gh = box[2] - box[0], box[3] - box[1]
    draw.text(((size - gw) / 2 - box[0], (size - gh) / 2 - box[1]), glyph, font=font, fill=255)
    gold = vertical_gradient(size).convert('RGBA')
    gold.putalpha(layer)
    return gold


def compose(size: int, scale: float = 1.0) -> Image.Image:
    base = radial_background(size).convert('RGBA')
    mark = emblem(size, scale)
    glow = mark.copy().filter(ImageFilter.GaussianBlur(size * 0.03))
    glow.putalpha(glow.getchannel('A').point(lambda a: a * 0.45))
    base.alpha_composite(glow)
    base.alpha_composite(mark)
    return base


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    icon = compose(1024)
    icon.convert('RGB').save(OUT / 'icon.png')
    # Android adaptatif : le motif doit tenir dans la zone sûre (~66 %).
    emblem(1024, scale=0.72).save(OUT / 'android-icon-foreground.png')
    radial_background(1024).save(OUT / 'android-icon-background.png')
    mono = emblem(1024, scale=0.72).getchannel('A')
    Image.merge('RGBA', (mono, mono, mono, mono)).save(OUT / 'android-icon-monochrome.png')
    # Écran de démarrage : emblème seul sur fond transparent.
    emblem(512, ring=True).save(OUT / 'splash-icon.png')
    icon.resize((48, 48), Image.LANCZOS).convert('RGB').save(OUT / 'favicon.png')
    print('Icônes générées dans', OUT)


if __name__ == '__main__':
    main()
