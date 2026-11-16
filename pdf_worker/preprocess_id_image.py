import sys
from pathlib import Path

from PIL import Image, ImageOps


def preprocess(source: Path, destination: Path) -> None:
    with Image.open(source) as opened_image:
        image = ImageOps.autocontrast(opened_image.convert("L"))
        image = image.point(lambda pixel: 255 if pixel > 100 else 0)

        scale = min(2, 3000 / max(image.width, image.height))
        if scale != 1:
            image = image.resize(
                (round(image.width * scale), round(image.height * scale)),
                Image.Resampling.LANCZOS,
            )

        image.save(destination, format="PNG")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: preprocess_id_image.py INPUT OUTPUT")

    preprocess(Path(sys.argv[1]), Path(sys.argv[2]))
