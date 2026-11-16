#!/usr/bin/env python3

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from io import BytesIO
from pathlib import Path

from docx import Document
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import ByteStringObject, ContentStream, TextStringObject
from reportlab.lib.colors import black
from reportlab.lib.colors import white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit


FONT_NAMES = {
    "Helvetica": "Helvetica",
    "Helvetica-Bold": "Helvetica-Bold",
    "Times-Roman": "Times-Roman",
    "Times-Bold": "Times-Bold",
    "Courier": "Courier",
}
PLACEHOLDER_PATTERN = re.compile(
    r"\{\{[A-Z][A-Z0-9_]*\}\}?",
    re.IGNORECASE,
)
DOCX_PLACEHOLDER_PATTERN = re.compile(
    r"\{\{[A-Z][A-Z0-9_]*\}\}",
    re.IGNORECASE,
)


def iter_docx_paragraphs(document):
    seen = set()

    def add_paragraphs(container):
        for paragraph in container.paragraphs:
            paragraph_element = paragraph._p
            if paragraph_element not in seen:
                seen.add(paragraph_element)
                yield paragraph
        for table in container.tables:
            for row in table.rows:
                for cell in row.cells:
                    yield from add_paragraphs(cell)

    yield from add_paragraphs(document)
    for section in document.sections:
        for container in (
            section.header,
            section.footer,
            section.first_page_header,
            section.first_page_footer,
            section.even_page_header,
            section.even_page_footer,
        ):
            yield from add_paragraphs(container)


def load_docx(path):
    try:
        return Document(path)
    except Exception as error:
        raise ValueError(
            "The uploaded DOCX could not be opened as a Word document."
        ) from error


def inspect_docx(path):
    document = load_docx(path)
    placeholders = set()
    for paragraph in iter_docx_paragraphs(document):
        placeholders.update(
            match.group()
            for match in DOCX_PLACEHOLDER_PATTERN.finditer(paragraph.text)
        )

    return {
        "page_count": 1,
        "has_acroform": False,
        "fields": [
            {
                "name": name,
                "type": "/DocxPlaceholder",
                "supported": False,
            }
            for name in sorted(placeholders, key=str.casefold)
        ],
        "pages": [],
    }


def replace_paragraph_placeholders(paragraph, replacements):
    text = paragraph.text
    missing = set()
    matches = list(DOCX_PLACEHOLDER_PATTERN.finditer(text))

    for match in reversed(matches):
        replacement = replacements.get(match.group().casefold())
        if replacement is None:
            missing.add(match.group())
            continue

        runs = paragraph.runs
        offsets = []
        cursor = 0
        for run in runs:
            offsets.append((cursor, cursor + len(run.text)))
            cursor += len(run.text)

        start_run = next(
            (
                index
                for index, (start, end) in enumerate(offsets)
                if start <= match.start() < end
            ),
            None,
        )
        end_run = next(
            (
                index
                for index, (start, end) in enumerate(offsets)
                if start < match.end() <= end
            ),
            None,
        )
        if start_run is None or end_run is None:
            missing.add(match.group())
            continue

        first_run = runs[start_run]
        start_offset = match.start() - offsets[start_run][0]
        end_offset = match.end() - offsets[end_run][0]
        if start_run == end_run:
            first_run.text = (
                first_run.text[:start_offset]
                + str(replacement)
                + first_run.text[end_offset:]
            )
            continue

        first_run.text = first_run.text[:start_offset] + str(replacement)
        for index in range(start_run + 1, end_run):
            runs[index].text = ""
        runs[end_run].text = runs[end_run].text[end_offset:]

    return missing


def find_libreoffice_binary():
    binary = os.environ.get("LIBREOFFICE_BINARY", "soffice")
    executable = shutil.which(binary)
    if executable is None and Path(binary).is_file():
        executable = binary
    if executable is None and os.name == "nt":
        program_files_locations = (
            os.environ.get("ProgramFiles"),
            os.environ.get("ProgramFiles(x86)"),
            r"C:\Program Files",
            r"C:\Program Files (x86)",
        )
        for program_files in dict.fromkeys(program_files_locations):
            if not program_files:
                continue
            candidate = (
                Path(program_files)
                / "LibreOffice"
                / "program"
                / "soffice.exe"
            )
            if candidate.is_file():
                executable = str(candidate)
                break

    return executable


def convert_docx_to_pdf(docx_path, output_path):
    executable = find_libreoffice_binary()
    if executable is None:
        raise ValueError(
            "LibreOffice is required to convert DOCX templates to PDF. "
            "Install LibreOffice and set LIBREOFFICE_BINARY to its executable."
        )

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    converted_path = output.parent / (Path(docx_path).stem + ".pdf")
    for attempt in range(2):
        profile_directory = Path(
            tempfile.mkdtemp(
                prefix="barangayease-lo-",
                dir=output.parent,
            )
        )
        try:
            command = [
                executable,
                f"-env:UserInstallation={profile_directory.as_uri()}",
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                str(output.parent),
                str(docx_path),
            ]
            try:
                result = subprocess.run(
                    command,
                    check=False,
                    capture_output=True,
                    text=True,
                    timeout=90,
                )
            except subprocess.TimeoutExpired as error:
                raise ValueError(
                    "LibreOffice timed out while converting the DOCX."
                ) from error
            if result.returncode != 0:
                detail = (result.stderr or result.stdout).strip()
                if (
                    attempt < 1
                    and "source file could not be loaded" in detail.casefold()
                ):
                    if converted_path.exists():
                        converted_path.unlink()
                    time.sleep(0.5)
                    continue
                raise ValueError(
                    detail or "LibreOffice could not convert the DOCX to PDF."
                )

            if not converted_path.is_file():
                raise ValueError("LibreOffice did not create the converted PDF.")
            if converted_path != output:
                converted_path.replace(output)
            return
        finally:
            shutil.rmtree(profile_directory, ignore_errors=True)


def generate_docx_pdf(input_path, output_path, payload):
    document = load_docx(input_path)
    replacements = {
        str(name).casefold(): str(value).upper()
        for name, value in payload.get("placeholder_values", {}).items()
    }
    missing = set()
    for paragraph in iter_docx_paragraphs(document):
        missing.update(replace_paragraph_placeholders(paragraph, replacements))
    if missing and not payload.get("allow_unmapped", False):
        names = ", ".join(sorted(missing, key=str.casefold))
        raise ValueError(f"Map these DOCX placeholders before generation: {names}")

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        prefix="barangayease-docx-",
        dir=output.parent,
    ) as temporary_directory:
        docx_path = Path(temporary_directory) / f"{output.stem}.docx"
        document.save(docx_path)
        convert_docx_to_pdf(docx_path, output)


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
    for page_number, page in enumerate(reader.pages, start=1):
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

        def find_placeholders(text, cm, tm, font, font_size):
            if not font:
                return

            first_char = int(font.get("/FirstChar", 0))
            widths = font.get("/Widths", [])
            if hasattr(widths, "get_object"):
                widths = widths.get_object()

            def source_width(value):
                width = 0.0
                for character in value:
                    index = ord(character) - first_char
                    if 0 <= index < len(widths):
                        width += float(widths[index])
                    else:
                        width += 500.0
                return width * float(font_size) / 1000.0

            baseline = (
                float(cm[1]) * float(tm[4])
                + float(cm[3]) * float(tm[5])
                + float(cm[5])
            )
            for match in PLACEHOLDER_PATTERN.finditer(text):
                x = (
                    float(cm[0]) * float(tm[4])
                    + float(cm[2]) * float(tm[5])
                    + float(cm[4])
                    + source_width(text[:match.start()])
                )
                page_width = float(box.width)
                page_height = float(box.height)
                relative_x = x - float(box.left)
                relative_y = baseline - float(box.bottom)
                placeholder_width = max(source_width(match.group()), 1.0)
                pages_fields.append({
                    "name": match.group(),
                    "type": "/Placeholder",
                    "supported": False,
                    "page_number": page_number,
                    "x": max(0.0, min(1.0, relative_x / page_width)),
                    "y": max(0.0, min(1.0, (relative_y - float(font_size) * 0.25) / page_height)),
                    "width": max(0.001, min(1.0, placeholder_width / page_width)),
                    "height": max(0.001, min(1.0, float(font_size) * 1.25 / page_height)),
                    "font_size": float(font_size),
                    "font_family": reportlab_font_name(font),
                })

        pages_fields = []
        page.extract_text(visitor_text=find_placeholders)
        form_fields.extend(pages_fields)

    return {
        "page_count": len(reader.pages),
        "has_acroform": any(
            field["type"] in ("/Tx", "/Ch") for field in form_fields
        ),
        "fields": form_fields,
        "pages": pages,
    }


def reportlab_font_name(font):
    base_font = str(font.get("/BaseFont", "")).lower()
    if "times" in base_font:
        return "Times-Bold" if "bold" in base_font else "Times-Roman"
    if "courier" in base_font:
        return "Courier"
    if "bold" in base_font:
        return "Helvetica-Bold"
    return "Helvetica"


def source_text_width(text, font, font_size):
    first_char = int(font.get("/FirstChar", 0))
    widths = font.get("/Widths", [])
    if hasattr(widths, "get_object"):
        widths = widths.get_object()
    width = 0.0
    for character in text:
        index = ord(character) - first_char
        width += float(widths[index]) if 0 <= index < len(widths) else 500.0
    return width * float(font_size) / 1000.0


def text_run_width(text_array, font, font_size):
    first_char = int(font.get("/FirstChar", 0))
    widths = font.get("/Widths", [])
    if hasattr(widths, "get_object"):
        widths = widths.get_object()

    width = 0.0
    for item in text_array:
        if isinstance(item, (int, float)):
            width -= float(item)
            continue
        value = bytes(item).decode("latin-1") if isinstance(item, bytes) else str(item)
        for character in value:
            index = ord(character) - first_char
            width += float(widths[index]) if 0 <= index < len(widths) else 500.0

    return width * float(font_size) / 1000.0


def draw_placeholder_replacements(page, replacements):
    if not replacements:
        return None

    page_box = page.cropbox
    output = BytesIO()
    pdf = canvas.Canvas(
        output,
        pagesize=(float(page_box.width), float(page_box.height)),
        invariant=1,
    )
    replacement_count = 0
    current_text_run = []

    def before_operator(operator, operands, cm, tm):
        if operator == b"TJ" and operands:
            current_text_run[:] = list(operands[0])

    def replace_line(text, cm, tm, font, font_size):
        nonlocal replacement_count
        if not font:
            return

        updated_text = text
        for placeholder, value in replacements.items():
            updated_text = updated_text.replace(placeholder, str(value))
        if updated_text == text:
            return

        page_x = (
            float(cm[0]) * float(tm[4])
            + float(cm[2]) * float(tm[5])
            + float(cm[4])
        )
        baseline = (
            float(cm[1]) * float(tm[4])
            + float(cm[3]) * float(tm[5])
            + float(cm[5])
        )
        x = page_x - float(page_box.left)
        y = baseline - float(page_box.bottom)
        original_width = text_run_width(
            current_text_run,
            font,
            font_size,
        ) if current_text_run else source_text_width(text, font, font_size)
        if original_width <= 0:
            return

        font_name = reportlab_font_name(font)
        padding = 1.5
        available_width = max(original_width - padding * 2, 1.0)
        draw_size = float(font_size)
        while (
            pdfmetrics.stringWidth(updated_text, font_name, draw_size) > available_width
            and draw_size > 6.0
        ):
            draw_size = max(6.0, draw_size - 0.5)
        if pdfmetrics.stringWidth(updated_text, font_name, draw_size) > available_width:
            raise ValueError(
                "Replacement text does not fit on the PDF line containing "
                "a template placeholder."
            )

        pdf.setFillColor(white)
        pdf.rect(
            x - padding,
            y - float(font_size) * 0.28,
            original_width + padding * 2,
            float(font_size) * 1.28,
            stroke=0,
            fill=1,
        )
        pdf.setFillColor(black)
        pdf.setFont(font_name, draw_size)
        pdf.drawString(x, y, updated_text)
        replacement_count += 1

    page.extract_text(
        visitor_text=replace_line,
        visitor_operand_before=before_operator,
    )
    if replacement_count == 0:
        return None
    pdf.save()
    output.seek(0)
    overlay = PdfReader(output, strict=False).pages[0]
    overlay.add_transformation(
        Transformation().translate(float(page_box.left), float(page_box.bottom))
    )
    return overlay


def remove_placeholder_text(page):
    content = page.get_contents()
    if not isinstance(content, ContentStream):
        return

    for operands, operator in content.operations:
        if operator != b"TJ" or not operands:
            continue

        text_array = operands[0]
        fragments = []
        combined_text = ""
        for index, item in enumerate(text_array):
            if isinstance(item, bytes):
                value = item.decode("latin-1")
            elif isinstance(item, str):
                value = str(item)
            else:
                continue
            start = len(combined_text)
            combined_text += value
            fragments.append((index, start, len(combined_text), item, value))

        token_ranges = [
            match.span() for match in PLACEHOLDER_PATTERN.finditer(combined_text)
        ]
        if not token_ranges:
            continue

        for index, start, end, item, value in fragments:
            characters = list(value)
            changed = False
            for token_start, token_end in token_ranges:
                overlap_start = max(start, token_start)
                overlap_end = min(end, token_end)
                for position in range(overlap_start, overlap_end):
                    characters[position - start] = " "
                    changed = True
            if not changed:
                continue
            replacement = "".join(characters)
            text_array[index] = (
                ByteStringObject(replacement.encode("latin-1"))
                if isinstance(item, bytes)
                else TextStringObject(replacement)
            )

    page.replace_contents(content)


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
    placeholder_values = {
        str(name): str(value).upper()
        for name, value in payload.get("placeholder_values", {}).items()
    }

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

    for page in writer.pages:
        placeholder_overlay = draw_placeholder_replacements(
            page,
            placeholder_values,
        )
        if placeholder_overlay is not None:
            remove_placeholder_text(page)
            page.merge_page(placeholder_overlay)

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as stream:
        writer.write(stream)


def main():
    if len(sys.argv) < 3:
        raise ValueError(
            "Usage: worker.py <inspect|generate> <input-file> [output.pdf] [pdf|docx]"
        )

    operation = sys.argv[1]
    input_path = sys.argv[2]
    file_format = sys.argv[3] if operation == "inspect" and len(sys.argv) == 4 else "pdf"
    if operation == "inspect" and len(sys.argv) in (3, 4):
        result = inspect_docx(input_path) if file_format == "docx" else inspect_pdf(input_path)
        sys.stdout.write(json.dumps(result, ensure_ascii=False))
        return
    if operation == "generate" and len(sys.argv) in (4, 5):
        file_format = sys.argv[4] if len(sys.argv) == 5 else "pdf"
        payload = json.load(sys.stdin)
        if file_format == "docx":
            generate_docx_pdf(input_path, sys.argv[3], payload)
        elif file_format == "pdf":
            generate_pdf(input_path, sys.argv[3], payload)
        else:
            raise ValueError("Unsupported template format.")
        return
    raise ValueError("Unsupported PDF worker operation.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        sys.stderr.write(f"{type(error).__name__}: {error}\n")
        sys.exit(1)
