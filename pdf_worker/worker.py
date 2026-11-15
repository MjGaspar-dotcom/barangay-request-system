#!/usr/bin/env python3

import json
import sys
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter, Transformation
from reportlab.lib.colors import black
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit


FONT_NAMES = {
    "Helvetica": "Helvetica",
    "Helvetica-Bold": "Helvetica-Bold",
    "Times-Roman": "Times-Roman",
    "Courier": "Courier",
}


def load_pdf(path):
    reader = PdfReader(path, strict=False)
    if reader.is_encrypted:
        raise ValueError("Encrypted PDF files are not supported.")
    if not reader.pages:
        raise ValueError("The PDF contains no pages.")
    return reader


def inspect_pdf(path):
    reader = load_pdf(path)
    fields = reader.get_fields() or {}
    form_fields = []
    for name, field in fields.items():
        field_type = str(field.get("/FT", ""))
        form_fields.append({
            "name": str(name),
            "type": field_type,
            "supported": field_type in ("/Tx", "/Ch"),
        })

    pages = []
    for page in reader.pages:
        box = page.cropbox
        pages.append({
            "width": float(box.width),
            "height": float(box.height),
            "rotation": int(page.get("/Rotate", 0) or 0) % 360,
            "view_box": [
                float(box.left),
                float(box.bottom),
                float(box.right),
                float(box.top),
            ],
        })

    return {
        "page_count": len(reader.pages),
        "has_acroform": bool(form_fields),
        "fields": form_fields,
        "pages": pages,
    }


def draw_overlay(page, fields):
    page_box = page.cropbox
    page_width = float(page_box.width)
    page_height = float(page_box.height)
    left = float(page_box.left)
    bottom = float(page_box.bottom)
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=(page_width, page_height), invariant=1)

    for field in fields:
        value = str(field["value"])
        if not value:
            continue

        x = float(field["x"]) * page_width
        y = float(field["y"]) * page_height
        width = float(field["width"]) * page_width
        height = float(field["height"]) * page_height
        font_name = FONT_NAMES.get(field["font_family"], "Helvetica")
        font_size = float(field["font_size"])
        minimum_size = 6.0
        padding = 1.0
        available_width = max(width - 2 * padding, 1)

        lines = simpleSplit(value, font_name, font_size, available_width)
        while (
            len(lines) * font_size * 1.2 > max(height, font_size)
            and font_size > minimum_size
        ):
            font_size = max(minimum_size, font_size - 0.5)
            lines = simpleSplit(value, font_name, font_size, available_width)

        line_height = font_size * 1.2
        if len(lines) * line_height > max(height, line_height):
            raise ValueError(
                f"Text for field '{field['field_name']}' does not fit its configured area."
            )

        pdf.setFillColor(black)
        pdf.setFont(font_name, font_size)
        alignment = field["text_align"]
        start_y = y + height - font_size

        for index, line in enumerate(lines):
            line_y = start_y - index * line_height
            if alignment == "center":
                pdf.drawCentredString(x + width / 2, line_y, line)
            elif alignment == "right":
                pdf.drawRightString(x + width - padding, line_y, line)
            else:
                pdf.drawString(x + padding, line_y, line)

    pdf.save()
    output.seek(0)
    overlay = PdfReader(output, strict=False).pages[0]
    overlay.add_transformation(Transformation().translate(left, bottom))
    return overlay


def generate_pdf(input_path, output_path, payload):
    reader = load_pdf(input_path)
    writer = PdfWriter(clone_from=reader)
    form_values = payload.get("form_values", {})

    if form_values:
        supported_fields = {
            name for name, field in (reader.get_fields() or {}).items()
            if str(field.get("/FT", "")) in ("/Tx", "/Ch")
        }
        unsupported = sorted(set(form_values) - supported_fields)
        if unsupported:
            raise ValueError(
                "The PDF has unsupported or missing form fields: "
                + ", ".join(unsupported)
            )
        writer.update_page_form_field_values(
            None,
            form_values,
            auto_regenerate=False,
        )

    overlays_by_page = {}
    for field in payload.get("overlays", []):
        page_index = int(field["page_number"]) - 1
        if page_index < 0 or page_index >= len(writer.pages):
            raise ValueError(f"Field '{field['field_name']}' refers to an invalid page.")
        overlays_by_page.setdefault(page_index, []).append(field)

    for page_index, fields in overlays_by_page.items():
        overlay = draw_overlay(writer.pages[page_index], fields)
        writer.pages[page_index].merge_page(overlay)

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as stream:
        writer.write(stream)


def main():
    if len(sys.argv) < 3:
        raise ValueError("Usage: worker.py <inspect|generate> <input.pdf> [output.pdf]")

    operation = sys.argv[1]
    input_path = sys.argv[2]
    if operation == "inspect":
        result = inspect_pdf(input_path)
        sys.stdout.write(json.dumps(result, ensure_ascii=False))
        return
    if operation == "generate" and len(sys.argv) == 4:
        payload = json.load(sys.stdin)
        generate_pdf(input_path, sys.argv[3], payload)
        return
    raise ValueError("Unsupported PDF worker operation.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        sys.stderr.write(f"{type(error).__name__}: {error}\n")
        sys.exit(1)
