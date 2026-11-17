import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from docx import Document
from PIL import Image, ImageDraw

from . import worker


def create_transparent_logo(directory: Path) -> Path:
    logo_path = directory / "logo.png"
    image = Image.new("RGBA", (80, 80), (255, 0, 0, 0))
    ImageDraw.Draw(image).ellipse((8, 8, 72, 72), fill=(0, 80, 160, 255))
    image.save(logo_path)
    return logo_path


class DocxTemplateTests(unittest.TestCase):
    def create_template(self, path: Path) -> None:
        document = Document()
        paragraph = document.add_paragraph()
        paragraph.add_run("This certifies {{FULL_")
        paragraph.add_run("NAME}} for {{PURPOSE}}.")
        document.add_table(rows=1, cols=1).cell(0, 0).text = "{{BARANGAY_NAME}}"
        document.sections[0].header.paragraphs[0].text = "Issued by {{BARANGAY_NAME}}"
        document.save(path)

    def test_converter_finds_standard_windows_installation(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            executable = (
                Path(temporary_directory)
                / "LibreOffice"
                / "program"
                / "soffice.exe"
            )
            executable.parent.mkdir(parents=True)
            executable.touch()

            with (
                patch.dict(
                    os.environ,
                    {
                        "LIBREOFFICE_BINARY": "soffice",
                        "ProgramFiles": temporary_directory,
                    },
                ),
                patch.object(worker.shutil, "which", return_value=None),
            ):
                self.assertEqual(
                    str(executable),
                    worker.find_libreoffice_binary(),
                )

    def test_converter_finds_default_path_without_program_files_environment(self) -> None:
        executable = Path(
            r"C:\Program Files\LibreOffice\program\soffice.exe"
        )

        def is_installed_executable(path: Path) -> bool:
            return path == executable

        with (
            patch.dict(
                os.environ,
                {"LIBREOFFICE_BINARY": "soffice"},
                clear=True,
            ),
            patch.object(worker.os, "name", "nt"),
            patch.object(worker.shutil, "which", return_value=None),
            patch.object(Path, "is_file", is_installed_executable),
        ):
            self.assertEqual(
                str(executable),
                worker.find_libreoffice_binary(),
            )

    def test_converter_retries_transient_source_load_failures(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            source_path = directory / "template.docx"
            source_path.touch()
            output_path = directory / "generated.pdf"
            attempts = 0

            def fake_conversion(command, **kwargs):
                nonlocal attempts
                attempts += 1
                if attempts < 2:
                    return worker.subprocess.CompletedProcess(
                        command,
                        1,
                        "",
                        "Error: source file could not be loaded",
                    )

                converted_path = (
                    Path(command[command.index("--outdir") + 1])
                    / "template.pdf"
                )
                converted_path.write_bytes(b"%PDF-1.4")
                return worker.subprocess.CompletedProcess(command, 0, "", "")

            with (
                patch.object(worker.shutil, "which", return_value="soffice"),
                patch.object(
                    worker.subprocess,
                    "run",
                    side_effect=fake_conversion,
                ),
                patch.object(worker.time, "sleep") as sleep,
            ):
                worker.convert_docx_to_pdf(source_path, output_path)

            self.assertEqual(2, attempts)
            self.assertEqual(1, sleep.call_count)
            self.assertEqual(b"%PDF-1.4", output_path.read_bytes())

    def test_converter_keeps_libreoffice_profile_with_output_workspace(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            source_path = directory / "template.docx"
            source_path.touch()
            output_path = directory / "generated.pdf"
            with (
                patch.object(worker.shutil, "which", return_value="soffice"),
                patch.object(
                    worker.subprocess,
                    "run",
                    side_effect=lambda command, **kwargs: (
                        (directory / "template.pdf").write_bytes(b"%PDF-1.4")
                        and worker.subprocess.CompletedProcess(
                            command,
                            0,
                            "",
                            "",
                        )
                    ),
                ),
                patch.object(
                    worker.tempfile,
                    "mkdtemp",
                    wraps=worker.tempfile.mkdtemp,
                ) as create_profile,
            ):
                worker.convert_docx_to_pdf(source_path, output_path)

            self.assertEqual(directory, create_profile.call_args.kwargs["dir"])
            self.assertEqual(b"%PDF-1.4", output_path.read_bytes())

    def test_converter_does_not_retry_unrelated_errors(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            source_path = directory / "template.docx"
            source_path.touch()
            command = ["soffice"]
            with (
                patch.object(worker.shutil, "which", return_value="soffice"),
                patch.object(
                    worker.subprocess,
                    "run",
                    return_value=worker.subprocess.CompletedProcess(
                        command,
                        1,
                        "",
                        "LibreOffice is unavailable",
                    ),
                ) as run,
            ):
                with self.assertRaisesRegex(
                    ValueError,
                    "LibreOffice is unavailable",
                ):
                    worker.convert_docx_to_pdf(
                        source_path,
                        directory / "generated.pdf",
                    )

            run.assert_called_once()

    def test_inspection_finds_placeholders_in_paragraphs_tables_and_headers(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "template.docx"
            self.create_template(path)

            inspection = worker.inspect_docx(path)

        self.assertEqual(
            {
                "{{FULL_NAME}}",
                "{{PURPOSE}}",
                "{{BARANGAY_NAME}}",
            },
            {field["name"] for field in inspection["fields"]},
        )
        self.assertTrue(all(field["type"] == "/DocxPlaceholder" for field in inspection["fields"]))

    def test_inspection_keeps_distinct_placeholders_across_docx_parts(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "template.docx"
            document = Document()
            document.add_paragraph("Body {{BODY_FIELD}}")
            document.add_table(rows=1, cols=1).cell(0, 0).text = "{{TABLE_FIELD}}"
            document.sections[0].header.paragraphs[0].text = "{{HEADER_FIELD}}"
            document.sections[0].footer.paragraphs[0].text = "{{FOOTER_FIELD}}"
            document.save(path)

            expected = {
                "{{BODY_FIELD}}",
                "{{TABLE_FIELD}}",
                "{{HEADER_FIELD}}",
                "{{FOOTER_FIELD}}",
            }
            for _ in range(10):
                inspection = worker.inspect_docx(path)
                self.assertEqual(
                    expected,
                    {field["name"] for field in inspection["fields"]},
                )

    def test_generation_replaces_split_placeholders_before_pdf_conversion(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            template_path = directory / "template.docx"
            output_path = directory / "generated.pdf"
            self.create_template(template_path)
            original_template = template_path.read_bytes()

            def fake_conversion(command, **kwargs):
                generated_docx = Path(command[-1])
                filled = Document(generated_docx)
                self.assertEqual(
                    "This certifies AVERY SANTOS for SCHOOL ENROLLMENT.",
                    filled.paragraphs[0].text,
                )
                self.assertEqual(
                    "BARANGAY AURORA",
                    filled.tables[0].cell(0, 0).text,
                )
                self.assertEqual(
                    "Issued by BARANGAY AURORA",
                    filled.sections[0].header.paragraphs[0].text,
                )
                converted_path = Path(command[command.index("--outdir") + 1])
                pdf = worker.canvas.Canvas(
                    str(converted_path / "generated.pdf")
                )
                pdf.drawString(72, 720, "Generated certificate")
                pdf.save()
                return worker.subprocess.CompletedProcess(command, 0, "", "")

            with (
                patch.object(worker.shutil, "which", return_value="soffice"),
                patch.object(worker.subprocess, "run", side_effect=fake_conversion),
            ):
                worker.generate_docx_pdf(
                    template_path,
                    output_path,
                    {
                        "placeholder_values": {
                            "{{FULL_NAME}}": "Avery Santos",
                            "{{PURPOSE}}": "School enrollment",
                            "{{BARANGAY_NAME}}": "Barangay Aurora",
                        }
                    },
                )

            generated = worker.PdfReader(output_path)
            self.assertEqual(2, len(generated.pages[0].images))
            self.assertEqual(original_template, template_path.read_bytes())
            self.assertFalse(output_path.with_suffix(".docx").exists())

    def test_generation_adds_transparent_brand_logo_to_converted_pdf(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            template_path = directory / "template.docx"
            output_path = directory / "generated.pdf"
            logo_path = create_transparent_logo(directory)
            self.create_template(template_path)
            original_template = template_path.read_bytes()

            def fake_conversion(command, **kwargs):
                converted_path = Path(command[command.index("--outdir") + 1])
                pdf = worker.canvas.Canvas(str(converted_path / "generated.pdf"))
                pdf.drawString(72, 720, "Generated certificate")
                pdf.save()
                return worker.subprocess.CompletedProcess(command, 0, "", "")

            with (
                patch.object(worker.shutil, "which", return_value="soffice"),
                patch.object(worker.subprocess, "run", side_effect=fake_conversion),
            ):
                worker.generate_docx_pdf(
                    template_path,
                    output_path,
                    {
                        "allow_unmapped": True,
                        "brand_logo_path": str(logo_path),
                    },
                )

            generated = worker.PdfReader(output_path)
            logo_images = generated.pages[0].images
            self.assertEqual(2, len(logo_images))
            for logo_image in logo_images:
                self.assertIn(
                    "/SMask",
                    logo_image.indirect_reference.get_object(),
                )
            self.assertEqual(
                "Generated certificate",
                generated.pages[0].extract_text().strip(),
            )
            self.assertEqual(
                original_template,
                template_path.read_bytes(),
            )

    def test_preview_converts_a_copy_without_overwriting_source_docx(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            template_path = directory / "template.docx"
            output_path = directory / "template.pdf"
            self.create_template(template_path)
            original_template = template_path.read_bytes()

            def fake_conversion(command, **kwargs):
                converted_docx = Path(command[-1])
                self.assertNotEqual(template_path, converted_docx)
                self.assertEqual(original_template, template_path.read_bytes())
                converted_path = Path(command[command.index("--outdir") + 1])
                (converted_path / f"{converted_docx.stem}.pdf").write_bytes(
                    b"%PDF-1.4"
                )
                return worker.subprocess.CompletedProcess(command, 0, "", "")

            with (
                patch.object(worker.shutil, "which", return_value="soffice"),
                patch.object(worker.subprocess, "run", side_effect=fake_conversion),
            ):
                worker.generate_docx_pdf(
                    template_path,
                    output_path,
                    {
                        "allow_unmapped": True,
                        "brand_logo_path": None,
                    },
                )

            self.assertEqual(b"%PDF-1.4", output_path.read_bytes())
            self.assertEqual(original_template, template_path.read_bytes())

    def test_pdf_generation_uppercases_placeholder_values_only(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            template_path = directory / "template.pdf"
            output_path = directory / "generated.pdf"
            document = worker.canvas.Canvas(str(template_path))
            document.drawString(72, 720, "Resident: {{FULL_NAME}}")
            document.save()

            worker.generate_pdf(
                template_path,
                output_path,
                {"placeholder_values": {"{{FULL_NAME}}": "Avery Santos"}},
            )

            generated_text = " ".join(
                page.extract_text() or ""
                for page in worker.PdfReader(output_path).pages
            )
            self.assertIn("AVERY SANTOS", generated_text)
            self.assertNotIn("Avery Santos", generated_text)
            self.assertEqual(
                2,
                len(worker.PdfReader(output_path).pages[0].images),
            )

    def test_pdf_generation_adds_logo_only_to_first_page_at_top_center(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            template_path = directory / "template.pdf"
            output_path = directory / "generated.pdf"
            logo_path = create_transparent_logo(directory)
            document = worker.canvas.Canvas(str(template_path))
            document.drawString(72, 720, "First page")
            document.showPage()
            document.drawString(72, 720, "Second page")
            document.save()

            worker.generate_pdf(
                template_path,
                output_path,
                {"brand_logo_path": str(logo_path)},
            )

            generated = worker.PdfReader(output_path)
            first_page = generated.pages[0]
            self.assertEqual(2, len(generated.pages))
            self.assertEqual(2, len(first_page.images))
            self.assertEqual(1, len(generated.pages[1].images))
            for image in first_page.images:
                self.assertIn("/SMask", image.indirect_reference.get_object())
            self.assertIn(
                "/SMask",
                generated.pages[1].images[0].indirect_reference.get_object(),
            )

            watermark = worker.draw_brand_watermark(first_page, logo_path)
            watermark_resources = watermark["/Resources"].get_object()
            alpha_values = [
                float(state.get_object()["/ca"])
                for state in watermark_resources["/ExtGState"].values()
            ]
            self.assertIn(0.12, alpha_values)
            watermark_operations = worker.ContentStream(
                watermark.get_contents(),
                generated,
            ).operations
            watermark_transforms = [
                operands
                for operands, operator in watermark_operations
                if operator == b"cm"
            ]
            watermark_transform = next(
                [float(value) for value in transform]
                for transform in watermark_transforms
                if float(transform[0]) > 36.0
                and float(transform[3]) == float(transform[0])
            )
            watermark_size = min(
                float(first_page.cropbox.width) * 0.54,
                float(first_page.cropbox.height) * 0.43,
            )
            self.assertAlmostEqual(watermark_size, watermark_transform[0], places=2)
            self.assertAlmostEqual(
                (float(first_page.cropbox.width) - watermark_size) / 2,
                watermark_transform[4],
                places=2,
            )
            self.assertAlmostEqual(
                (float(first_page.cropbox.height) - watermark_size) / 2,
                watermark_transform[5],
                places=2,
            )

            overlay = worker.draw_brand_logo(first_page, logo_path)
            operations = worker.ContentStream(
                overlay.get_contents(),
                generated,
            ).operations
            image_transforms = [
                operands for operands, operator in operations if operator == b"cm"
            ]
            image_transform = next(
                [
                    float(value) for value in transform
                ]
                for transform in image_transforms
                if float(transform[0]) == 36.0
                and float(transform[3]) == 36.0
            )
            self.assertAlmostEqual(
                (float(first_page.cropbox.width) - 36.0) / 2,
                image_transform[4],
                places=2,
            )
            self.assertAlmostEqual(
                float(first_page.cropbox.height) - 54.0,
                image_transform[5],
                places=2,
            )

    def test_project_webp_logo_asset_can_be_embedded(self) -> None:
        logo_path = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "public"
            / "assets"
            / "images"
            / "logo.webp"
        )
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            template_path = directory / "template.pdf"
            output_path = directory / "generated.pdf"
            document = worker.canvas.Canvas(str(template_path))
            document.drawString(72, 720, "Barangay document")
            document.save()

            worker.generate_pdf(
                template_path,
                output_path,
                {"brand_logo_path": str(logo_path)},
            )

            page = worker.PdfReader(output_path).pages[0]
            self.assertEqual(2, len(page.images))
            for image in page.images:
                self.assertIn("/SMask", image.indirect_reference.get_object())

    def test_generation_rejects_unmapped_placeholders(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            template_path = Path(temporary_directory) / "template.docx"
            self.create_template(template_path)

            with self.assertRaisesRegex(ValueError, r"\{\{FULL_NAME\}\}"):
                worker.generate_docx_pdf(
                    template_path,
                    Path(temporary_directory) / "generated.pdf",
                    {"placeholder_values": {}},
                )


if __name__ == "__main__":
    unittest.main()
