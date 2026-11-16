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
    "identity/look-1": 647, "identity/look-2": 660, "identity/look-3": 659,
    "identity/look-4": 666, "identity/look-5": 667,
    "play/cover": 672, "play/look-1": 712, "play/look-2": 714, "play/look-3": 720,
    "play/look-4": 721, "play/look-5": 727, "play/look-6": 728,
    "bio/studio": 601,
}
for name, x in PHOTOS.items():
    img = xref(x)
    save(img, f"archive/{name}.webp")
    if name != "bio/studio":
        save(img, f"loader/{name.replace('/', '-')}.webp", max_side=600, q=70)

# --- book pages: every PDF half-page, as designed --------------------------
# Fixes applied in memory only: the PDF misspells "Hanna" (drop the trailing h), and Autovroom is out of the archive.
for page in PDF:
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                text = "".join(c["c"] for c in span["chars"]).lower()
                for k in range(len(text) - 5):
                    if text[k:k + 6] == "hannah":
                        page.add_redact_annot(pymupdf.Rect(span["chars"][k + 5]["bbox"]), fill=False)
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
PDF[1].draw_rect(pymupdf.Rect(640, 565, 1000, 790), color=None, fill=(1, 1, 1))  # "06 Autovroom" contents entry
PDF[18].delete_image(801)  # Autovroom page's black ground, which bleeds past the spine onto the closing page

for s in range(len(PDF)):
    for h, rect in enumerate((HALF_L, HALF_R)):
        n = 2 * s + h + 1
        if n != 37:  # Autovroom
            save(plate(s + 1, rect, zoom=2), f"archive/pages/{n:02}.webp", max_side=1700)

# --- plates (composites rasterized from the page) -------------------------
PLATES = {
    "identity/reference": (4, HALF_R),
    "identity/moodboard": (5, HALF_L),
    "identity/sketches": (5, HALF_R),
    "identity/flats": (6, (100, 228, 500, 725)),
    "play/title": (9, HALF_L),
    "play/moodboard": (9, (630, 355, 1145, 485)),
    "play/fabrics": (10, (675, 280, 1120, 595)),
    "play/collection": (11, (30, 110, 560, 735)),
    "play/final": (11, (670, 244, 1075, 670)),
    "cairona/poster": (15, HALF_L),
    "cairona/tees": (16, HALF_L),
    "cairona/hoodies": (16, HALF_R),
    "cairona/stickers": (17, (10, 330, 585, 510)),
    "cairona/mailer": (17, (750, 280, 1030, 600)),
    "barraserb/designs": (18, HALF_R),
}
for name, (page, rect) in PLATES.items():
    save(plate(page, rect), f"archive/{name}.webp", max_side=1600)

print("play palette   ", sample(10, [(76, 428), (165, 428), (255, 428), (342, 428), (431, 428), (522, 428)]))
print("cairona palette", sample(15, [(693, 435), (767, 435), (841, 435), (917, 435), (999, 435), (1080, 435)]))


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
