import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from docx import Document

from . import worker


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
                (converted_path / "generated.pdf").write_bytes(b"%PDF-1.4")
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

            self.assertEqual(b"%PDF-1.4", output_path.read_bytes())
            self.assertEqual(original_template, template_path.read_bytes())
            self.assertFalse(output_path.with_suffix(".docx").exists())

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
                    {"allow_unmapped": True},
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
