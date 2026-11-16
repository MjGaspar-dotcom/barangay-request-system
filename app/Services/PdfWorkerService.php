<?php

namespace App\Services;

use App\Exceptions\PdfProcessingException;
use JsonException;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;

class PdfWorkerService
{
    public function inspect(string $path, string $format = 'pdf'): array
    {
        $process = $this->run(['inspect', $path, $format]);

        try {
            $result = json_decode(
                $process->getOutput(),
                true,
                512,
                JSON_THROW_ON_ERROR
            );
        } catch (JsonException $exception) {
            throw new PdfProcessingException(
                'The PDF processor returned invalid inspection data.',
                0,
                $exception
            );
        }

        if (
            !is_array($result) ||
            !isset($result['page_count'], $result['fields'], $result['pages']) ||
            !is_int($result['page_count']) ||
            $result['page_count'] < 1 ||
            !is_array($result['fields']) ||
            !is_array($result['pages'])
        ) {
            throw new PdfProcessingException(
                'The PDF processor returned incomplete inspection data.'
            );
        }

        return $result;
    }

    public function generate(
        string $templatePath,
        string $outputPath,
        array $payload,
        string $format = 'pdf'
    ): void {
        $json = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        $this->run(['generate', $templatePath, $outputPath, $format], $json);

        if (!is_file($outputPath) || filesize($outputPath) === 0) {
            throw new PdfProcessingException(
                'The document processor did not create a completed PDF.'
            );
        }
    }

    public function previewDocx(string $templatePath, string $outputPath): void
    {
        $this->generate(
            $templatePath,
            $outputPath,
            ['allow_unmapped' => true],
            'docx'
        );
    }

    private function run(array $arguments, ?string $input = null): Process
    {
        $process = new Process(array_merge([
            config('document_templates.python_binary'),
            base_path('pdf_worker/worker.py'),
        ], $arguments));
        $process->setEnv([
            'LIBREOFFICE_BINARY' => config(
                'document_templates.libreoffice_binary',
                'soffice'
            ),
            'TMPDIR' => sys_get_temp_dir(),
            'TMP' => sys_get_temp_dir(),
            'TEMP' => sys_get_temp_dir(),
        ]);
        $process->setWorkingDirectory(base_path());
        $process->setTimeout(
            config('document_templates.worker_timeout_seconds', 120)
        );
        if ($input !== null) {
            $process->setInput($input);
        }

        try {
            $process->mustRun();
        } catch (ProcessFailedException|ProcessTimedOutException $exception) {
            $message = trim($process->getErrorOutput());
            throw new PdfProcessingException(
                $message !== '' ? $message : 'PDF processing failed.',
                0,
                $exception
            );
        }

        return $process;
    }
}
