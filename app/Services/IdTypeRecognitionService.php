<?php

namespace App\Services;

use Dunn\LaravelOcr\Facades\Ocr;
use Dunn\LaravelOcr\Exceptions\OcrProcessingException;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;

class IdTypeRecognitionService
{
    public function detectFromPath(string $imagePath): ?string
    {
        $idType = $this->detectFromImage($imagePath);
        if ($idType !== null) {
            return $idType;
        }

        $temporaryBase = tempnam(sys_get_temp_dir(), 'id-type-ocr-');
        if ($temporaryBase === false) {
            throw new OcrProcessingException(
                'A temporary image could not be created for ID recognition.'
            );
        }
        $preprocessedPath = $temporaryBase.'.png';
        @unlink($temporaryBase);

        try {
            $process = new Process([
                config('document_templates.python_binary', 'python'),
                base_path('pdf_worker/preprocess_id_image.py'),
                $imagePath,
                $preprocessedPath,
            ]);
            $process->setTimeout(15);
            $process->mustRun();

            return $this->detectFromImage($preprocessedPath);
        } catch (ProcessFailedException|ProcessTimedOutException $exception) {
            throw new OcrProcessingException(
                'The uploaded ID image could not be prepared for recognition.',
                previous: $exception
            );
        } finally {
            @unlink($preprocessedPath);
        }
    }

    private function detectFromImage(string $imagePath): ?string
    {
        $rawText = Ocr::image($imagePath)
            ->language((string) config('ocr.default_language', 'eng'))
            ->timeout(30)
            ->run();

        return OcrParsingService::parse($rawText)['id_type'];
    }
}
