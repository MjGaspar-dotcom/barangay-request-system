<?php

namespace App\Services;

use App\Exceptions\PdfProcessingException;
use App\Models\DocumentTemplate;
use App\Models\DocumentTemplateFieldMapping;
use App\Models\DocumentTemplateVersion;
use App\Models\DocumentType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class DocumentTemplateService
{
    public function __construct(
        private readonly PdfWorkerService $pdfWorker,
        private readonly DocumentTemplateDataFieldService $dataFields
    ) {
    }

    public function upload(
        DocumentType $documentType,
        UploadedFile $file
    ): DocumentTemplateVersion {
        $this->validatePdfFile($file);
        $inspection = $this->pdfWorker->inspect($file->getRealPath());
        $diskName = config('filesystems.private_upload_disk');
        $path = sprintf(
            'document-templates/%s/%s.pdf',
            $documentType->document_type_id,
            Str::uuid()
        );
        $stream = fopen($file->getRealPath(), 'rb');

        if ($stream === false) {
            throw new RuntimeException('The uploaded PDF could not be opened.');
        }

        try {
            if (!Storage::disk($diskName)->put($path, $stream)) {
                throw new RuntimeException('The uploaded PDF could not be stored.');
            }
        } finally {
            fclose($stream);
        }

        try {
            return DB::transaction(function () use (
                $documentType,
                $file,
                $inspection,
                $diskName,
                $path
            ): DocumentTemplateVersion {
                $template = DocumentTemplate::withTrashed()
                    ->where('document_type_id', $documentType->document_type_id)
                    ->lockForUpdate()
                    ->first();

                if (!$template) {
                    $template = DocumentTemplate::create([
                        'document_type_id' => $documentType->document_type_id,
                    ]);
                } elseif ($template->trashed()) {
                    $template->restore();
                    $template->update(['deleted_by' => null]);
                }

                $uploadedAt = now();
                $activeVersion = $template->versions()
                    ->where('is_active', true)
                    ->lockForUpdate()
                    ->first();
                if ($activeVersion) {
                    $activeVersion->update([
                        'is_active' => false,
                        'replaced_at' => $uploadedAt,
                        'replaced_by' => Auth::id(),
                    ]);
                }

                $versionNumber = (int) $template->versions()
                    ->lockForUpdate()
                    ->max('version_number') + 1;
                if ($versionNumber > 65535) {
                    throw new RuntimeException(
                        'The document template has reached its version limit.'
                    );
                }

                $version = $template->versions()->create([
                    'version_number' => $versionNumber,
                    'storage_disk' => $diskName,
                    'storage_path' => $path,
                    'original_name' => basename($file->getClientOriginalName()),
                    'mime_type' => 'application/pdf',
                    'file_size' => $file->getSize(),
                    'sha256' => hash_file('sha256', $file->getRealPath()),
                    'page_count' => $inspection['page_count'],
                    'has_acroform' => $inspection['has_acroform'],
                    'is_active' => true,
                    'uploaded_by' => Auth::id(),
                ]);

                AuditService::log(
                    $activeVersion ? 'document_template_replaced' : 'document_template_uploaded',
                    $documentType,
                    $activeVersion
                        ? "Uploaded version {$versionNumber} of {$documentType->document_name}."
                        : "Uploaded a PDF template for {$documentType->document_name}.",
                    $activeVersion
                        ? ['template_version_id' => $activeVersion->template_version_id]
                        : [],
                    [
                        'template_version_id' => $version->template_version_id,
                        'version_number' => $versionNumber,
                        'uploaded_by' => Auth::id(),
                    ]
                );

                return $version->load('uploader');
            });
        } catch (Throwable $exception) {
            Storage::disk($diskName)->delete($path);
            throw $exception;
        }
    }

    public function saveMappings(
        DocumentTemplateVersion $version,
        array $mappings
    ): void {
        if (!$version->is_active || $version->template?->trashed()) {
            throw new \InvalidArgumentException(
                'Only the active template version can be configured.'
            );
        }

        $disk = Storage::disk($version->storage_disk);
        if (!$disk->exists($version->storage_path)) {
            throw new PdfProcessingException(
                'The original PDF template is no longer available.'
            );
        }

        $templateBytes = $disk->get($version->storage_path);
        if (!is_string($templateBytes)) {
            throw new PdfProcessingException(
                'The original PDF template could not be read from storage.'
            );
        }
        $localPath = $this->copyToTemporaryFile($templateBytes, '.pdf');
        try {
            $inspection = $this->pdfWorker->inspect($localPath);
        } finally {
            @unlink($localPath);
        }

        $formFields = collect($inspection['fields'])
            ->filter(fn (array $field): bool => $field['supported'])
            ->pluck('name')
            ->all();
        $fieldNames = [];

        foreach ($mappings as $mapping) {
            $name = $mapping['field_name'];
            if (in_array($name, $fieldNames, true)) {
                throw new \InvalidArgumentException(
                    'Each PDF field can only have one system data mapping.'
                );
            }
            $fieldNames[] = $name;

            if (
                $mapping['field_type'] === 'acroform' &&
                !in_array($name, $formFields, true)
            ) {
                throw new \InvalidArgumentException(
                    "The PDF does not contain a supported form field named '{$name}'."
                );
            }

            if ($mapping['field_type'] === 'overlay') {
                if ($mapping['page_number'] > $inspection['page_count']) {
                    throw new \InvalidArgumentException(
                        "Field '{$name}' refers to a page that is not in the PDF."
                    );
                }
                if (
                    $mapping['x'] + $mapping['width'] > 1 ||
                    $mapping['y'] + $mapping['height'] > 1
                ) {
                    throw new \InvalidArgumentException(
                        "Field '{$name}' extends beyond the PDF page."
                    );
                }
            }
        }

        DB::transaction(function () use ($version, $mappings): void {
            $version->mappings()->delete();
            $version->mappings()->createMany($mappings);
        });
    }

    public function delete(DocumentType $documentType): void
    {
        DB::transaction(function () use ($documentType): void {
            $template = DocumentTemplate::withTrashed()
                ->where('document_type_id', $documentType->document_type_id)
                ->lockForUpdate()
                ->firstOrFail();
            if ($template->trashed()) {
                throw new \InvalidArgumentException(
                    'There is no active PDF template to delete.'
                );
            }

            $template->versions()
                ->where('is_active', true)
                ->update(['is_active' => false]);
            $template->update(['deleted_by' => Auth::id()]);
            $template->delete();

            AuditService::log(
                'document_template_deleted',
                $documentType,
                "Deactivated the PDF template for {$documentType->document_name}.",
                [],
                ['deleted_by' => Auth::id()]
            );
        });
    }

    public function fieldCatalog(): array
    {
        return $this->dataFields->catalog();
    }

    private function validatePdfFile(UploadedFile $file): void
    {
        if (strtolower($file->getClientOriginalExtension()) !== 'pdf') {
            throw new \InvalidArgumentException('Choose a file with a .pdf extension.');
        }

        if ($file->getMimeType() !== 'application/pdf') {
            throw new \InvalidArgumentException(
                'The uploaded file must have the application/pdf MIME type.'
            );
        }

        $handle = fopen($file->getRealPath(), 'rb');
        if ($handle === false) {
            throw new RuntimeException('The uploaded PDF could not be opened.');
        }
        try {
            $signature = fread($handle, 5);
        } finally {
            fclose($handle);
        }

        if ($signature !== '%PDF-') {
            throw new \InvalidArgumentException(
                'The uploaded file does not have a valid PDF signature.'
            );
        }
    }

    private function copyToTemporaryFile(string $contents, string $extension): string
    {
        $path = tempnam(sys_get_temp_dir(), 'barangayease-pdf-');
        if ($path === false) {
            throw new RuntimeException('Could not create a temporary PDF file.');
        }

        $temporaryPath = $path.$extension;
        if (file_put_contents($temporaryPath, $contents) === false) {
            @unlink($path);
            throw new RuntimeException('Could not prepare the PDF for processing.');
        }
        @unlink($path);

        return $temporaryPath;
    }
}
