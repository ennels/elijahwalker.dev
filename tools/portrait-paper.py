"""Remake the cover portrait's clean-edge photo and its two paper cuts from the photo and its mask.

    python3 tools/portrait-paper.py public/headshot.jpg public/headshot-mask.webp

Writes, next to the photo:
  headshot-cutout.webp    the photo with the backdrop's color taken out of its edge pixels (pymatting
                          estimate_foreground_ml), so no light fringe shows around the hair under the mask
  headshot-paper-a.webp   two hand-cut paper shapes: the silhouette grown ~8 px, traced as straight
  headshot-paper-b.webp   "scissor" cuts with a little jitter, each cut differently (alpha only, 2x size)

Needs numpy, pillow, scipy, scikit-image, pymatting. Make the mask first (rembg, u2net_human_seg).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from pymatting import estimate_foreground_ml
from scipy import ndimage
from skimage import measure

photo_path, mask_path = Path(sys.argv[1]), Path(sys.argv[2])
out = photo_path.parent
photo = np.asarray(Image.open(photo_path).convert('RGB')).astype(float) / 255
alpha = np.asarray(Image.open(mask_path).convert('RGBA'))[..., 3].astype(float) / 255

# 1. Clean edge: solve for the person's own colors where the mask is partly clear.
fg = estimate_foreground_ml(photo, alpha)
Image.fromarray((np.clip(fg, 0, 1) * 255).astype(np.uint8)).save(out / 'headshot-cutout.webp', 'WEBP', quality=86, method=6)

# 2. Paper: grow the silhouette, trace it, cut it with straight segments, jitter the corners.
H, W = alpha.shape
S = 4  # draw at 4x, save at 2x for a crisp edge


def paper(seed, grow=8, tol=3.2, jitter=1.6, shift=(0, 0)):
    rng = np.random.default_rng(seed)
    m = ndimage.binary_fill_holes(ndimage.binary_dilation(alpha > .43, iterations=grow))
    contour = max(measure.find_contours(np.pad(m, 2).astype(float), .5), key=len) - 2
    poly = measure.approximate_polygon(contour, tolerance=tol)
    poly = poly + rng.normal(0, jitter, poly.shape) + np.array(shift)
    img = Image.new('L', (W * S, H * S), 0)
    ImageDraw.Draw(img).polygon([(x * S, y * S) for y, x in poly], fill=255)
    a = np.asarray(img.resize((W * 2, H * 2), Image.LANCZOS))
    rgba = np.zeros((H * 2, W * 2, 4), np.uint8)
    rgba[..., 3] = a
    return Image.fromarray(rgba)


paper(7).save(out / 'headshot-paper-a.webp', lossless=True)
paper(19, shift=(-1, 1)).save(out / 'headshot-paper-b.webp', lossless=True)
print('wrote', out / 'headshot-cutout.webp', out / 'headshot-paper-a.webp', out / 'headshot-paper-b.webp')
