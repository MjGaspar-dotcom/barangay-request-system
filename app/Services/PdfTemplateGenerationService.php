<?php

namespace App\Services;

use App\Models\BarangayRequest;
use App\Models\DocumentTemplate;
use App\Models\DocumentTemplateVersion;
use App\Models\GeneratedDocument;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class PdfTemplateGenerationService
{
    public function __construct(
        private readonly PdfWorkerService $pdfWorker,
        private readonly DocumentTemplateDataFieldService $dataFields
    ) {
    }

    public function current(BarangayRequest $request): ?GeneratedDocument
    {
        return $request->generatedDocuments()->first();
    }

    public function activeTemplateFor(BarangayRequest $request): ?DocumentTemplateVersion
    {
        $request->loadMissing('documentType');
        if (!$request->documentType) {
            return null;
        }

        return DocumentTemplate::query()
            ->where('document_type_id', $request->document_type_id)
            ->with(['activeVersion.mappings'])
            ->first()
            ?->activeVersion;
    }

    public function generate(
        BarangayRequest $request,
        bool $regenerate = false
    ): GeneratedDocument {
        $storedPath = null;
        $storedDisk = null;

        try {
            return DB::transaction(function () use (
                $request,
                $regenerate,
                &$storedPath,
                &$storedDisk
            ): GeneratedDocument {
                $request = BarangayRequest::query()
                    ->with(['user', 'documentType'])
                    ->lockForUpdate()
                    ->findOrFail($request->request_id);

                if (!in_array($request->status, [
                    RequestStatusService::STATUS_REQUEST_SUBMITTED,
                    RequestStatusService::STATUS_APPROVED,
                    RequestStatusService::STATUS_READY_FOR_PICKUP,
                ], true)) {
                    throw new \InvalidArgumentException(
                        'A PDF can only be generated for a request being processed or ready for pickup.'
                    );
                }
                if (
                    !$request->user ||
                    $request->user->verification_status !== 'verified' ||
                    !is_string($request->user->valid_id_front) ||
                    trim($request->user->valid_id_front) === ''
                ) {
                    throw new \InvalidArgumentException(
                        'The resident account and ID must be verified before generating an official PDF.'
                    );
                }

                $current = $request->generatedDocuments()->first();
                if ($current && !$regenerate) {
                    return $current;
                }
                if ($request->status === RequestStatusService::STATUS_COMPLETED) {
                    throw new \InvalidArgumentException(
                        'A completed request cannot have its document regenerated.'
                    );
                }

                $templateVersion = $this->activeTemplateFor($request);
                if (!$templateVersion) {
                    throw new \InvalidArgumentException(
                        'No active PDF template is uploaded for this document type.'
                    );
                }
                $mappings = $templateVersion->mappings;
                if ($mappings->isEmpty()) {
                    throw new \InvalidArgumentException(
                        'The Administrator must configure at least one PDF field mapping before generation.'
                    );
                }

                $issuedAt = CarbonImmutable::now('Asia/Manila');
                $documentNumber = $request->document_number
                    ?: $this->nextDocumentNumber($issuedAt);
                $values = $this->dataFields->values(
                    $request,
                    $documentNumber,
                    $issuedAt
                );
                $formValues = [];
                $overlays = [];
                $mappedValues = [];

                foreach ($mappings as $mapping) {
                    $value = $values[$mapping->system_field] ?? null;
                    if ($mapping->is_required && ($value === null || trim($value) === '')) {
                        throw new \InvalidArgumentException(
                            "Required information for '{$mapping->field_name}' is missing. "
                            .'Complete the resident, request, or barangay information before generating.'
                        );
                    }

                    $value = $value === null ? '' : (string) $value;
                    $mappedValues[$mapping->system_field] = $value;

                    if ($mapping->field_type === 'acroform') {
                        $formValues[$mapping->field_name] = $value;
                        continue;
                    }

                    $overlays[] = [
                        'field_name' => $mapping->field_name,
                        'page_number' => $mapping->page_number,
                        'x' => $mapping->x,
                        'y' => $mapping->y,
                        'width' => $mapping->width,
                        'height' => $mapping->height,
                        'font_size' => $mapping->font_size,
                        'font_family' => $mapping->font_family,
                        'text_align' => $mapping->text_align,
                        'value' => $value,
                    ];
                }

                $templateDisk = Storage::disk($templateVersion->storage_disk);
                if (!$templateDisk->exists($templateVersion->storage_path)) {
                    throw new \InvalidArgumentException(
                        'The active PDF template file is missing from storage.'
                    );
                }

                $temporaryDirectory = $this->createTemporaryDirectory();
                $inputPath = $temporaryDirectory.DIRECTORY_SEPARATOR.'template.pdf';
                $outputPath = $temporaryDirectory.DIRECTORY_SEPARATOR.'generated.pdf';
                try {
                    $templateBytes = $templateDisk->get($templateVersion->storage_path);
                    if (
                        !is_string($templateBytes) ||
                        file_put_contents($inputPath, $templateBytes) === false
                    ) {
                        throw new RuntimeException('The PDF template could not be prepared for generation.');
                    }

                    $this->pdfWorker->generate(
                        $inputPath,
                        $outputPath,
                        [
                            'form_values' => $formValues,
                            'overlays' => $overlays,
                        ]
                    );
                    $generatedBytes = file_get_contents($outputPath);
                    if ($generatedBytes === false || $generatedBytes === '') {
                        throw new RuntimeException('The generated PDF could not be read.');
                    }

                    $storedDisk = config('filesystems.private_upload_disk');
                    $storedPath = sprintf(
                        'generated-documents/%s/%s.pdf',
                        $request->request_id,
                        Str::uuid()
                    );
                    if (!Storage::disk($storedDisk)->put($storedPath, $generatedBytes)) {
                        throw new RuntimeException('The generated PDF could not be stored.');
                    }
                } finally {
                    $this->removeTemporaryDirectory($temporaryDirectory);
                }

                $versionNumber = (int) $request->generatedDocuments()
                    ->lockForUpdate()
                    ->max('version_number') + 1;
                $snapshot = [
                    'document_type' => $request->documentType?->document_name,
                    'document_number' => $documentNumber,
                    'tracking_number' => $request->tracking_number,
                    'template_version_id' => $templateVersion->template_version_id,
                    'template_version' => $templateVersion->version_number,
                    'issued_at' => $issuedAt->toISOString(),
                    'mapped_values' => $mappedValues,
                ];

                $generatedDocument = GeneratedDocument::create([
                    'request_id' => $request->request_id,
                    'template_version_id' => $templateVersion->template_version_id,
                    'version_number' => $versionNumber,
                    'document_number' => $documentNumber,
                    'storage_disk' => $storedDisk,
                    'storage_path' => $storedPath,
                    'original_name' => sprintf(
                        '%s-%s-v%d.pdf',
                        Str::slug($request->documentType?->document_name ?? 'barangay-document'),
                        $documentNumber,
                        $versionNumber
                    ),
                    'mime_type' => 'application/pdf',
                    'file_size' => strlen($generatedBytes),
                    'sha256' => hash('sha256', $generatedBytes),
                    'data_snapshot' => $snapshot,
                    'generated_by' => Auth::id(),
                    'generated_at' => $issuedAt->utc(),
                ]);

                $request->update([
                    'document_number' => $documentNumber,
                    'generated_document_data' => [
                        'template_identifier' => 'uploaded_pdf_template',
                        'template_version' => (string) $templateVersion->version_number,
                        'document_type' => $request->documentType?->document_name,
                        'document_number' => $documentNumber,
                        'tracking_number' => $request->tracking_number,
                        'issued_at' => $issuedAt->toISOString(),
                        'mapped_values' => $mappedValues,
                    ],
                    'document_template_identifier' => 'uploaded_pdf_template',
                    'document_template_version' => (string) $templateVersion->version_number,
                    'document_generated_at' => $issuedAt->utc(),
                    'document_generated_by' => Auth::id(),
                ]);

                AuditService::log(
                    $current ? 'document_regenerated' : 'document_generated',
                    $request,
                    $current
                        ? "Regenerated document {$documentNumber} as version {$versionNumber}."
                        : "Generated document {$documentNumber}.",
                    $current
                        ? ['generated_document_id' => $current->generated_document_id]
                        : [],
                    [
                        'generated_document_id' => $generatedDocument->generated_document_id,
                        'version_number' => $versionNumber,
                        'template_version_id' => $templateVersion->template_version_id,
                        'document_number' => $documentNumber,
                    ]
                );

                return $generatedDocument->load('templateVersion');
            });
        } catch (Throwable $exception) {
            if ($storedPath && $storedDisk) {
                Storage::disk($storedDisk)->delete($storedPath);
            }
            throw $exception;
        }
    }

    public function mappedSystemFields(DocumentTemplateVersion $version): array
    {
        return $version->mappings
            ->pluck('system_field')
            ->unique()
            ->values()
            ->all();
    }

    private function nextDocumentNumber(CarbonImmutable $issuedAt): string
    {
        $sequenceId = DB::table('barangay_document_number_sequences')
            ->insertGetId([
                'created_at' => $issuedAt,
                'updated_at' => $issuedAt,
            ], 'sequence_id');

        return sprintf('BA-%s-%06d', $issuedAt->format('Y'), $sequenceId);
    }

    private function createTemporaryDirectory(): string
    {
        $directory = sys_get_temp_dir()
            .DIRECTORY_SEPARATOR
            .'barangayease-pdf-'
            .Str::uuid();
        if (!mkdir($directory, 0700, true) && !is_dir($directory)) {
            throw new RuntimeException('Could not create a temporary PDF workspace.');
        }

        return $directory;
    }

    private function removeTemporaryDirectory(string $directory): void
    {
        foreach (glob($directory.DIRECTORY_SEPARATOR.'*') ?: [] as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        if (is_dir($directory)) {
            rmdir($directory);
        }
    }
}
