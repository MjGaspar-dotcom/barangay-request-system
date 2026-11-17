<?php

namespace App\Jobs;

use App\Models\BarangayRequest;
use App\Services\PdfTemplateGenerationService;
use App\Services\RequestStatusService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateRequestPdf implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 150;

    public int $uniqueFor = 600;

    public array $backoff = [2, 5];

    public function __construct(
        public int $requestId,
        public bool $regenerate = false
    )
    {
        $this->onConnection('database');
    }

    public function uniqueId(): string
    {
        return (string) $this->requestId;
    }

    public function handle(PdfTemplateGenerationService $generation): void
    {
        $request = BarangayRequest::query()
            ->with(['user', 'documentType'])
            ->findOrFail($this->requestId);

        $request->update([
            'document_generation_status' => 'processing',
            'document_generation_error' => null,
        ]);

        try {
            $generatedDocument = $generation->generate(
                $request,
                $this->regenerate
            );
        } catch (\InvalidArgumentException $exception) {
            $this->recordFailure($exception);

            return;
        }

        $request->refresh();
        $request->update([
            'document_generation_status' => 'completed',
            'document_generation_error' => null,
        ]);

        if ($request->status === RequestStatusService::STATUS_APPROVED) {
            RequestStatusService::markReadyForPickupAfterDocumentGeneration(
                $request,
                $generatedDocument
            );
        }
    }

    public function failed(Throwable $exception): void
    {
        $this->recordFailure($exception);
    }

    private function recordFailure(Throwable $exception): void
    {
        $request = BarangayRequest::query()
            ->with(['user', 'documentType'])
            ->find($this->requestId);

        if (!$request) {
            Log::error('PDF generation failed for a missing request.', [
                'request_id' => $this->requestId,
                'exception' => $exception->getMessage(),
            ]);

            return;
        }

        $request->update([
            'document_generation_status' => 'failed',
            'document_generation_error' => $exception instanceof \InvalidArgumentException
                ? $exception->getMessage()
                : 'PDF generation failed. Check the uploaded template and its field mappings, then retry. If it still fails, check the Laravel and PDF worker logs.',
        ]);

        Log::warning('Queued PDF generation failed for request.', [
            'request_id' => $request->request_id,
            'tracking_number' => $request->tracking_number,
            'exception' => $exception->getMessage(),
        ]);

    }
}
