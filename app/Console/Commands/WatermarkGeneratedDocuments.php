<?php

namespace App\Console\Commands;

use App\Models\BarangayRequest;
use App\Models\GeneratedDocument;
use App\Services\AuditService;
use App\Services\PdfWorkerService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class WatermarkGeneratedDocuments extends Command
{
    private const BRANDING_VERSION = 'center-watermark-v1';

    protected $signature = 'documents:watermark-existing {--dry-run}';

    protected $description = 'Create watermarked versions of existing generated PDFs.';

    public function __construct(
        private readonly PdfWorkerService $pdfWorker
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $logoPath = base_path('frontend/public/assets/images/logo.webp');
        if (! is_file($logoPath)) {
            $this->error("The configured document logo is missing: {$logoPath}");

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $updated = 0;
        $skipped = 0;
        $failed = 0;
        $requests = BarangayRequest::query()
            ->whereHas('generatedDocuments')
            ->with([
                'generatedDocuments' => static fn ($query) => $query->orderByDesc('version_number'),
            ])
            ->orderBy('request_id')
            ->get();

        foreach ($requests as $request) {
            $current = $request->generatedDocuments->first();
            if (! $current) {
                continue;
            }

            if (
                ($current->data_snapshot['branding_version'] ?? null) ===
                self::BRANDING_VERSION
            ) {
                $skipped++;

                continue;
            }

            if ($dryRun) {
                $this->line(
                    "Would watermark request #{$request->request_id} "
                    ."from version {$current->version_number}."
                );
                $updated++;

                continue;
            }

            try {
                if ($this->createWatermarkedVersion($request, $current, $logoPath)) {
                    $updated++;
                } else {
                    $skipped++;
                }
            } catch (Throwable $exception) {
                $this->error(
                    "Request #{$request->request_id}: {$exception->getMessage()}"
                );
                $failed++;
            }
        }

        $this->info(sprintf(
            '%s %d request(s); %d already branded; %d failed.',
            $dryRun ? 'Would watermark' : 'Watermarked',
            $updated,
            $skipped,
            $failed
        ));

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }

    private function createWatermarkedVersion(
        BarangayRequest $request,
        GeneratedDocument $source,
        string $logoPath
    ): bool {
        $disk = Storage::disk($source->storage_disk);
        if (! $disk->exists($source->storage_path)) {
            throw new RuntimeException('The current generated PDF is missing.');
        }

        $sourceBytes = $disk->get($source->storage_path);
        if (! is_string($sourceBytes) || $sourceBytes === '') {
            throw new RuntimeException('The current generated PDF is empty.');
        }

        $temporaryDirectory = sys_get_temp_dir()
            .DIRECTORY_SEPARATOR
            .'barangayease-watermark-'
            .Str::uuid();
        if (! mkdir($temporaryDirectory, 0700, true) && ! is_dir($temporaryDirectory)) {
            throw new RuntimeException('Could not create a temporary PDF workspace.');
        }

        $storedPath = null;
        try {
            $inputPath = $temporaryDirectory.DIRECTORY_SEPARATOR.'source.pdf';
            $outputPath = $temporaryDirectory.DIRECTORY_SEPARATOR.'branded.pdf';
            if (file_put_contents($inputPath, $sourceBytes) === false) {
                throw new RuntimeException('The source PDF could not be prepared.');
            }

            $this->pdfWorker->generate(
                $inputPath,
                $outputPath,
                [
                    'brand_logo_path' => $logoPath,
                    'watermark_only' => true,
                ],
                'pdf'
            );
            $generatedBytes = file_get_contents($outputPath);
            if (! is_string($generatedBytes) || $generatedBytes === '') {
                throw new RuntimeException('The watermarked PDF could not be read.');
            }

            $storedPath = sprintf(
                'generated-documents/%s/%s.pdf',
                $request->request_id,
                Str::uuid()
            );
            if (! $disk->put($storedPath, $generatedBytes)) {
                throw new RuntimeException('The watermarked PDF could not be stored.');
            }

            $created = DB::transaction(function () use (
                $request,
                $source,
                $storedPath,
                $generatedBytes
            ): bool {
                $lockedRequest = BarangayRequest::query()
                    ->lockForUpdate()
                    ->findOrFail($request->request_id);
                $latest = GeneratedDocument::query()
                    ->where('request_id', $request->request_id)
                    ->lockForUpdate()
                    ->orderByDesc('version_number')
                    ->firstOrFail();

                if (
                    ($latest->data_snapshot['branding_version'] ?? null) ===
                    self::BRANDING_VERSION
                ) {
                    return false;
                }
                if (
                    (int) $latest->generated_document_id !==
                    (int) $source->generated_document_id
                ) {
                    throw new RuntimeException(
                        'The current PDF changed during watermarking; rerun the command.'
                    );
                }

                $versionNumber = (int) $latest->version_number + 1;
                $generatedAt = now();
                $snapshot = $source->data_snapshot ?? [];
                $snapshot['branding_version'] = self::BRANDING_VERSION;
                $fileName = pathinfo($source->original_name, PATHINFO_FILENAME);
                $fileName = preg_replace('/-v\d+$/i', '', $fileName) ?: $fileName;

                $brandedDocument = GeneratedDocument::create([
                    'request_id' => $request->request_id,
                    'template_version_id' => $source->template_version_id,
                    'version_number' => $versionNumber,
                    'document_number' => $source->document_number,
                    'storage_disk' => $source->storage_disk,
                    'storage_path' => $storedPath,
                    'original_name' => sprintf(
                        '%s-v%d.pdf',
                        $fileName ?: 'barangay-document',
                        $versionNumber
                    ),
                    'mime_type' => 'application/pdf',
                    'file_size' => strlen($generatedBytes),
                    'sha256' => hash('sha256', $generatedBytes),
                    'data_snapshot' => $snapshot,
                    'generated_by' => $source->generated_by,
                    'generated_at' => $generatedAt,
                ]);

                $lockedRequest->update([
                    'document_generated_at' => $generatedAt,
                ]);

                AuditService::log(
                    'document_regenerated',
                    $brandedDocument,
                    "Added the centered transparent logo watermark as version {$versionNumber}.",
                    [
                        'generated_document_id' => $source->generated_document_id,
                        'version_number' => $source->version_number,
                    ],
                    [
                        'generated_document_id' => $brandedDocument->generated_document_id,
                        'version_number' => $versionNumber,
                        'branding_version' => self::BRANDING_VERSION,
                    ]
                );

                return true;
            });

            if (! $created) {
                $disk->delete($storedPath);
                $storedPath = null;

                return false;
            }

            $storedPath = null;

            return true;
        } finally {
            if ($storedPath && $disk->exists($storedPath)) {
                $disk->delete($storedPath);
            }
            foreach (glob($temporaryDirectory.DIRECTORY_SEPARATOR.'*') ?: [] as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            if (is_dir($temporaryDirectory)) {
                rmdir($temporaryDirectory);
            }
        }
    }
}
