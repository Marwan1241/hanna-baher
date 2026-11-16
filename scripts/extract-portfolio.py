"""Regenerate the site's image assets from the source portfolio + brand files.

Run from the repo root:  python -I scripts/extract-portfolio.py
Needs: pymupdf, opencv-python, pillow, numpy (local dev only, not a site dependency).
"""
import os
import cv2
import numpy as np
import pymupdf
from PIL import Image

SRC = "design-source/branding"
PDF = pymupdf.open(f"{SRC}/Hanna baher Portfolio .pdf")
OUT = "public"
HALF_L, HALF_R = (0, 0, 595, 842), (595, 0, 1190, 842)


def save(img: Image.Image, path: str, max_side: int = 1400, q: int = 82):
    os.makedirs(os.path.dirname(f"{OUT}/{path}"), exist_ok=True)
    img = img.convert("RGB")
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    img.save(f"{OUT}/{path}", "WEBP", quality=q, method=6)
    print(f"{path:44} {img.width}x{img.height}")


def xref(x: int) -> Image.Image:
    pix = pymupdf.Pixmap(PDF, x)
    if pix.n - pix.alpha > 3 or pix.alpha:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix, 0)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def plate(page: int, rect, zoom: float = 2.2) -> Image.Image:
    """Rasterize a region of a 1-based PDF page — needed for layered/masked artwork."""
    pix = PDF[page - 1].get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=pymupdf.Rect(*rect))
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def sample(page: int, pts) -> list[str]:
    pix = PDF[page - 1].get_pixmap()
    out = []
    for x, y in pts:
        r, g, b = pix.pixel(int(x), int(y))[:3]
        out.append(f"#{r:02x}{g:02x}{b:02x}")
    return out


# --- lookbook photos (her own work) --------------------------------------
PHOTOS = {
    "identity/look-1": 600, "identity/look-2": 613, "identity/look-3": 612,
    "identity/look-4": 619, "identity/look-5": 620,
    "play/cover": 625, "play/look-1": 665, "play/look-2": 667, "play/look-3": 673,
    "play/look-4": 674, "play/look-5": 680, "play/look-6": 681,
    "bio/studio": 554,
}
for name, x in PHOTOS.items():
    img = xref(x)
    save(img, f"archive/{name}.webp")
    if name != "bio/studio":
        save(img, f"loader/{name.replace('/', '-')}.webp", max_side=600, q=70)

# --- book pages: every PDF half-page, as designed --------------------------
# Fixes applied in memory only: the PDF misspells "Hanna" (drop the trailing h), and Autovroom is out of the archive
# (its stale running header is still on the closing pages).
GAPS: dict[int, list] = {}  # page index -> [(y0, y1, [(word x0, x1, shift left)])]: words to slide into a removed h
for p, page in enumerate(PDF):
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            chars = [c for span in line["spans"] for c in span["chars"]]
            text = "".join(c["c"] for c in chars).lower()
            for k in range(len(text) - 5):
                if text[k:k + 6] == "hannah":
                    page.add_redact_annot(pymupdf.Rect(chars[k + 5]["bbox"]), fill=False)
                    # Mid-line, the missing h leaves a hole: spread its width over the line's word gaps so justified
                    # text stays flush. A single trailing word (signatures, headers) gets no shift.
                    rest = chars[k + 6:]
                    if rest:
                        w = rest[0]["origin"][0] - chars[k + 5]["origin"][0]
                        words, cur = [], []
                        for c in rest + [{"c": " "}]:
                            if c["c"] == " ":
                                if cur:
                                    words.append((cur[0]["bbox"][0], cur[-1]["bbox"][2]))
                                cur = []
                            else:
                                cur.append(c)
                        m = len(words)
                        GAPS.setdefault(p, []).append(
                            (line["bbox"][1], line["bbox"][3], [(x0, x1, w * (m - 1 - j) / m) for j, (x0, x1) in enumerate(words)])
                        )
            for span in line["spans"]:
                if "autovroom" in "".join(c["c"] for c in span["chars"]).lower():
                    page.add_redact_annot(pymupdf.Rect(span["bbox"]), fill=False)
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
print("gap fixes (page: words shifted)", {p + 1: [sum(s > 0 for *_, s in w) for *_, w in v] for p, v in GAPS.items()})


def close_gaps(img: Image.Image, p: int, rect, zoom: float) -> Image.Image:
    # shortcut: assumes a flat background behind the line (true for the bio page); re-check if the name lands on a photo.
    for y0, y1, words in GAPS.get(p, []):
        words = [(x0, x1, s) for x0, x1, s in words if rect[0] <= x0 and x1 <= rect[2] and s > 0]
        if not words:
            continue
        px = lambda v, o: round((v - o) * zoom)
        top, bot = px(y0, rect[1]), px(y1, rect[1])
        strips = [(img.crop((px(x0, rect[0]), top, px(x1, rect[0]) + 1, bot)), px(x0 - s, rect[0])) for x0, x1, s in words]
        bg = img.getpixel((max(0, px(words[0][0], rect[0]) - 2), top + 1))
        img.paste(bg, (px(words[0][0], rect[0]) - px(words[0][2], 0), top, px(words[-1][1], rect[0]) + 1, bot))
        for strip, x in strips:
            img.paste(strip, (x, top))
    return img


for s in range(len(PDF)):
    for h, rect in enumerate((HALF_L, HALF_R)):
        save(close_gaps(plate(s + 1, rect, zoom=2), s, rect, 2), f"archive/pages/{2 * s + h + 1:02}.webp", max_side=1700)

# --- plates (composites rasterized from the page) -------------------------
PLATES = {
    "identity/reference": (3, HALF_R),
    "identity/moodboard": (4, HALF_L),
    "identity/sketches": (4, HALF_R),
    "identity/flats": (5, (100, 228, 500, 725)),
    "play/title": (8, HALF_L),
    "play/moodboard": (8, (630, 355, 1145, 485)),
    "play/fabrics": (9, (675, 280, 1120, 595)),
    "play/collection": (10, (30, 110, 560, 735)),
    "play/final": (10, (670, 244, 1075, 670)),
    "cairona/poster": (14, HALF_L),
    "cairona/tees": (15, HALF_L),
    "cairona/hoodies": (15, HALF_R),
    "cairona/stickers": (16, (10, 330, 585, 510)),
    "cairona/mailer": (16, (750, 280, 1030, 600)),
    "barraserb/designs": (17, HALF_R),
}
for name, (page, rect) in PLATES.items():
    save(plate(page, rect), f"archive/{name}.webp", max_side=1600)

print("play palette   ", sample(9, [(76, 428), (165, 428), (255, 428), (342, 428), (431, 428), (522, 428)]))
print("cairona palette", sample(14, [(693, 435), (767, 435), (841, 435), (917, 435), (999, 435), (1080, 435)]))


# --- textures: patch the mark out with a nearby swatch of the same weave ----
def patched(path, box, src_dy):
    img = cv2.imread(path)
    x0, y0, x1, y1 = box
    patch = img[y0 - src_dy:y1 - src_dy, x0:x1].copy()
    mask = np.zeros(patch.shape[:2], np.float32)
    cv2.rectangle(mask, (12, 12), (x1 - x0 - 12, y1 - y0 - 12), 1, -1)
    mask = cv2.GaussianBlur(mask, (0, 0), 6)[..., None]
    img[y0:y1, x0:x1] = (patch * mask + img[y0:y1, x0:x1] * (1 - mask)).astype(np.uint8)
    return img


denim = patched(f"{SRC}/THE H logo.jpg.jpeg", (380, 560, 720, 830), 300)
save(Image.fromarray(cv2.cvtColor(denim, cv2.COLOR_BGR2RGB)), "brand/denim.webp", max_side=1350, q=80)
gray = cv2.cvtColor(denim, cv2.COLOR_BGR2GRAY).astype(np.float32)
weave = np.clip((gray - cv2.GaussianBlur(gray, (0, 0), 8)) * 3 + 128, 0, 255).astype(np.uint8)
save(Image.fromarray(weave), "brand/weave.webp", max_side=1350, q=70)

linen = patched(f"{SRC}/the-house-strucutre.jpeg", (330, 540, 760, 1020), 480)
save(Image.fromarray(cv2.cvtColor(linen, cv2.COLOR_BGR2RGB)), "brand/linen.webp", max_side=1350, q=80)

# --- monogram → single-path SVG -------------------------------------------
logo = cv2.imread(f"{SRC}/THE H logo.jpg.jpeg")[540:820, 380:720]
L = cv2.cvtColor(logo, cv2.COLOR_BGR2LAB)[:, :, 0].astype(np.float32)
S = 8
up = cv2.GaussianBlur(cv2.resize(L, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC), (0, 0), 10)
m = (up > (np.percentile(L, 50) + np.percentile(L, 99)) / 2).astype(np.uint8) * 255
cs, _ = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
cs = [c for c in cs if cv2.contourArea(c) > 400]
bx, by, bw, bh = cv2.boundingRect(np.vstack(cs))
d = "".join(
    "M" + "L".join(f"{(px - bx) / S:.1f} {(py - by) / S:.1f}" for px, py in cv2.approxPolyDP(c, 1.5, True).reshape(-1, 2)) + "Z"
    for c in cs
)
vw, vh = f"{bw / S:.1f}", f"{bh / S:.1f}"
os.makedirs(f"{OUT}/brand", exist_ok=True)
with open(f"{OUT}/brand/the-h.svg", "w") as f:
    f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}"><path fill-rule="evenodd" d="{d}"/></svg>')
pad = 0.22 * max(bw, bh) / S
side = max(bw, bh) / S + 2 * pad
with open("app/icon.svg", "w") as f:
    f.write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {side:.1f} {side:.1f}">'
        f'<rect width="100%" height="100%" rx="{side * 0.18:.1f}" fill="#5e3478"/>'
        f'<path transform="translate({(side - bw / S) / 2:.1f} {(side - bh / S) / 2:.1f})" fill="#d9b8f0" fill-rule="evenodd" d="{d}"/></svg>'
    )
print("monogram", vw, "x", vh, "path chars", len(d))
