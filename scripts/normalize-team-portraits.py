from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
TEAM = ROOT / "assets" / "team"
CANVAS_SIZE = (1200, 900)


def studio_background() -> Image.Image:
    width, height = CANVAS_SIZE
    y, x = np.mgrid[0:height, 0:width]
    distance = np.sqrt(((x - width * 0.5) / width) ** 2 + ((y - height * 0.42) / height) ** 2)
    light = np.clip(1 - distance * 1.35, 0, 1)[..., None]
    edge = np.array([52, 50, 46], dtype=np.float32)
    center = np.array([91, 86, 76], dtype=np.float32)
    pixels = edge + (center - edge) * light
    return Image.fromarray(np.uint8(np.clip(pixels, 0, 255)), "RGB")


def place_complete_photo(source: Path, destination: Path) -> None:
    photo = Image.open(source).convert("RGB")
    photo.thumbnail(CANVAS_SIZE, Image.Resampling.LANCZOS)
    canvas = studio_background()
    x = (CANVAS_SIZE[0] - photo.width) // 2
    y = (CANVAS_SIZE[1] - photo.height) // 2
    feather = min(48, photo.width // 8, photo.height // 8)
    mask_pixels = np.ones((photo.height, photo.width), dtype=np.float32)
    ramp = np.linspace(0, 1, feather, dtype=np.float32)
    mask_pixels[:feather] *= ramp[:, None]
    mask_pixels[-feather:] *= ramp[::-1, None]
    mask_pixels[:, :feather] *= ramp[None, :]
    mask_pixels[:, -feather:] *= ramp[None, ::-1]
    mask = Image.fromarray(np.uint8(mask_pixels * 255), "L").filter(ImageFilter.GaussianBlur(1.5))
    canvas.paste(photo, (x, y), mask)
    canvas.save(destination, quality=94, optimize=True, progressive=True)


def replace_flat_background(
    source: Path,
    destination: Path,
    *,
    halo_band: int = 21,
    halo_brightness: float = 150,
    halo_regions: tuple[tuple[int, int, int, int], ...] = (),
) -> None:
    photo = Image.open(source).convert("RGB")
    pixels = np.asarray(photo, dtype=np.float32)
    patch = 40
    corners = np.concatenate([
        pixels[:patch, :patch].reshape(-1, 3),
        pixels[:patch, -patch:].reshape(-1, 3),
    ])
    background_color = np.median(corners, axis=0)
    red, green, blue = pixels[..., 0], pixels[..., 1], pixels[..., 2]
    green_signal = np.minimum(green - red, green - blue)
    brightness = pixels.mean(axis=2)
    background_strength = np.clip((green_signal - 1.5) / 7, 0, 1) * np.clip((brightness - 95) / 90, 0, 1)
    color_distance = np.linalg.norm(pixels - background_color, axis=2)
    background_strength *= np.clip((54 - color_distance) / 30, 0, 1)
    alpha = 1 - background_strength

    # The source portraits already contain a pale matte around hair and
    # shoulders. Contract only the outer silhouette so skin, clothing, and
    # facial detail are never classified by color.
    mask = Image.fromarray(np.uint8(alpha * 255), "L")
    mask = mask.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.GaussianBlur(0.45))
    alpha = np.asarray(mask, dtype=np.float32) / 255

    # Some originals have a wider near-white fringe baked into the hair edge.
    # Remove only pale neutral/green pixels in the outer contour, explicitly
    # excluding warm skin and red-brown hair as well as the blue shirt.
    inner = np.asarray(mask.filter(ImageFilter.MinFilter(halo_band)), dtype=np.float32) / 255
    outer_band = np.clip(alpha - inner, 0, 1)
    chroma = pixels.max(axis=2) - pixels.min(axis=2)
    pale_neutral = (
        (brightness > halo_brightness)
        & (green >= red - 5)
        & ((blue - red) < 12)
        & (chroma < 42)
    )
    halo_strength = np.clip((brightness - halo_brightness) / 20, 0, 1) * outer_band * pale_neutral

    # A few supplied cutouts contain a broad matte patch rather than a thin
    # outline. Limit that cleanup to its known source-image area so internal
    # highlights and clothing stay untouched.
    for left, top, right, bottom in halo_regions:
        region = np.zeros_like(alpha)
        region[top:bottom, left:right] = 1
        regional_pale = (brightness > halo_brightness) & (chroma < 55)
        regional_halo = np.clip((brightness - halo_brightness) / 20, 0, 1) * regional_pale * region
        halo_strength = np.maximum(halo_strength, regional_halo)

    alpha *= 1 - halo_strength

    foreground = Image.fromarray(np.uint8(pixels), "RGB")
    mask = Image.fromarray(np.uint8(alpha * 255), "L")
    scale = min(CANVAS_SIZE[0] / photo.width, CANVAS_SIZE[1] / photo.height)
    size = (round(photo.width * scale), round(photo.height * scale))
    foreground = foreground.resize(size, Image.Resampling.LANCZOS)
    mask = mask.resize(size, Image.Resampling.LANCZOS)

    canvas = studio_background()
    position = ((CANVAS_SIZE[0] - size[0]) // 2, CANVAS_SIZE[1] - size[1])
    canvas.paste(foreground, position, mask)
    canvas.save(destination, quality=94, optimize=True, progressive=True)


portrait_mattes = {
    # This source has a broad pale matte baked into the flyaway hair.
    "siqian-chen": {
        "halo_band": 31,
        "halo_brightness": 140,
        "halo_regions": ((220, 170, 450, 540),),
    },
    "yue-jin": {},
    "yirao-wang": {},
    "jinhui-zhou": {"halo_band": 31, "halo_brightness": 145},
}

for name, matte_options in portrait_mattes.items():
    replace_flat_background(
        TEAM / f"{name}-studio.jpg",
        TEAM / f"{name}-dark-studio.jpg",
        **matte_options,
    )

place_complete_photo(TEAM / "ziying-portrait-original.jpg", TEAM / "ziying-dark-studio.jpg")
place_complete_photo(TEAM / "xiaofang-tan-portrait-original.jpg", TEAM / "xiaofang-tan-dark-studio.jpg")

print("Created six 4:3 team portraits with a consistent dark studio background.")
