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
    private const DOCX_MIME_TYPE =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    public function __construct(
        private readonly PdfWorkerService $pdfWorker,
        private readonly DocumentTemplateDataFieldService $dataFields
    ) {
    }

    public function upload(
        DocumentType $documentType,
        UploadedFile $file
    ): DocumentTemplateVersion {
        $format = $this->validateTemplateFile($file);
        $inspection = $this->pdfWorker->inspect($file->getRealPath(), $format);
        if (
            $format === 'docx' &&
            collect($inspection['fields'] ?? [])
                ->where('type', '/DocxPlaceholder')
                ->isEmpty()
        ) {
            throw new \InvalidArgumentException(
                'Add at least one {{PLACEHOLDER}} tag to the DOCX template before uploading it.'
            );
        }
        $diskName = config('filesystems.private_upload_disk');
        $path = sprintf(
            'document-templates/%s/%s.%s',
            $documentType->document_type_id,
            Str::uuid(),
            $format
        );
        $stream = fopen($file->getRealPath(), 'rb');

        if ($stream === false) {
            throw new RuntimeException('The uploaded template could not be opened.');
        }

        try {
            if (!Storage::disk($diskName)->put($path, $stream)) {
                throw new RuntimeException('The uploaded template could not be stored.');
            }
        } finally {
            fclose($stream);
        }

        try {
            return DB::transaction(function () use (
                $documentType,
                $file,
                $format,
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
                    'mime_type' => $format === 'docx'
                        ? self::DOCX_MIME_TYPE
                        : 'application/pdf',
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
                        : "Uploaded a {$format} template for {$documentType->document_name}.",
                    $activeVersion
                        ? ['template_version_id' => $activeVersion->template_version_id]
                        : [],
                    [
                        'template_version_id' => $version->template_version_id,
                        'version_number' => $versionNumber,
                        'uploaded_by' => Auth::id(),
                    ]
                );

                $this->autoMapFields($version, $inspection);

                return $version->fresh()->load('uploader');
            });
        } catch (Throwable $exception) {
            Storage::disk($diskName)->delete($path);
            throw $exception;
        }
    }

    public function autoMapFields(DocumentTemplateVersion $version, ?array $inspection = null): int
    {
        if ($inspection === null) {
            $disk = Storage::disk($version->storage_disk);
            if (!$disk->exists($version->storage_path)) {
                return 0;
            }

            $templateBytes = $disk->get($version->storage_path);
            if (!is_string($templateBytes)) {
                return 0;
            }

            $format = $this->formatForVersion($version);
            $temporaryPath = $this->copyToTemporaryFile(
                $templateBytes,
                '.'.$format
            );
            try {
                $inspection = $this->pdfWorker->inspect($temporaryPath, $format);
            } finally {
                @unlink($temporaryPath);
            }
        }

        $mappings = [];
        foreach (($inspection['fields'] ?? []) as $field) {
            $fieldName = is_string($field['name'] ?? null) ? trim($field['name']) : '';
            if ($fieldName === '') {
                continue;
            }

            $systemField = $this->matchSystemField($fieldName);
            if ($systemField === null) {
                continue;
            }

            $isDocxPlaceholder = ($field['type'] ?? null) === '/DocxPlaceholder';
            $isPlaceholder = ($field['type'] ?? null) === '/Placeholder';
            $mapping = [
                'field_name' => $fieldName,
                'field_type' => $isDocxPlaceholder
                    ? 'docx_placeholder'
                    : ($field['supported'] ? 'acroform' : 'overlay'),
                'system_field' => $systemField,
                'is_required' => true,
            ];
            if ($isPlaceholder) {
                $mapping = array_merge($mapping, [
                    'page_number' => (int) ($field['page_number'] ?? 1),
                    'x' => (float) ($field['x'] ?? 0),
                    'y' => (float) ($field['y'] ?? 0),
                    'width' => (float) ($field['width'] ?? 0.01),
                    'height' => (float) ($field['height'] ?? 0.01),
                    'font_size' => (float) ($field['font_size'] ?? 12),
                    'font_family' => $field['font_family'] ?? 'Helvetica',
                ]);
            }
            $mappings[] = $mapping;
        }

        if ($mappings === []) {
            return 0;
        }

        $uniqueMappings = [];
        $seenFields = [];
        foreach ($mappings as $mapping) {
            $fieldName = $mapping['field_name'];
            if (isset($seenFields[$fieldName])) {
                continue;
            }
            $seenFields[$fieldName] = true;
            $uniqueMappings[] = $mapping;
        }

        return DB::transaction(function () use ($version, $uniqueMappings): int {
            $version->newQuery()
                ->whereKey($version->getKey())
                ->lockForUpdate()
                ->firstOrFail();
            $existingFieldNames = $version->mappings()
                ->pluck('field_name')
                ->all();
            $newMappings = array_values(array_filter(
                $uniqueMappings,
                fn (array $mapping): bool =>
                    !in_array($mapping['field_name'], $existingFieldNames, true)
            ));

            if ($newMappings !== []) {
                $version->mappings()->createMany($newMappings);
            }

            return count($newMappings);
        });
    }

    private function matchSystemField(string $fieldName): ?string
    {
        $normalized = $this->normalizeFieldName($fieldName);
        if ($normalized === '') {
            return null;
        }

        $matchers = [
            'resident.first_name' => ['firstname', 'first_name', 'firstnameresident', 'residentfirst', 'residentfirst_name'],
            'resident.middle_name' => ['middlename', 'middle_name', 'residentmiddle', 'residentmiddle_name'],
            'resident.last_name' => ['lastname', 'last_name', 'surename', 'familyname', 'residentlast', 'residentlast_name'],
            'resident.full_name' => ['fullname', 'full_name', 'residentname', 'residentfull', 'residentfull_name', 'name', 'complete_name'],
            'resident.age' => ['age', 'residentage'],
            'resident.birth_date' => ['birthdate', 'birth_date', 'dob', 'dateofbirth', 'residentbirth', 'birth'],
            'resident.sex' => ['sex', 'gender', 'residentsex'],
            'resident.civil_status' => ['civilstatus', 'civil_status', 'status', 'maritalstatus'],
            'resident.contact_number' => ['contactnumber', 'contact_number', 'mobilenumber', 'phone', 'telno', 'contact'],
            'resident.address' => ['address', 'homeaddress', 'completeaddress', 'residentaddress'],
            'resident.street_name' => ['streetname', 'street_name', 'street'],
            'resident.resident_id' => ['residentid', 'resident_id', 'residentnumber', 'residentno', 'idnumber'],
            'request.document_type' => ['documenttype', 'document_type', 'requestdocumenttype', 'typeofdocument'],
            'request.purpose' => ['purpose', 'requestpurpose', 'reason', 'purposeofapplication'],
            'request.request_date' => ['requestdate', 'datefiled', 'request_date', 'filingdate'],
            'request.approval_date' => ['approvaldate', 'approveddate', 'approval_date', 'approvedon'],
            'request.issuance_date' => [
                'issuedate',
                'issuance_date',
                'issuedon',
                'dateissued',
                'effectivedate',
                'effective_date',
            ],
            'request.control_number' => ['controlnumber', 'control_number', 'controlno', 'documentnumber', 'docno'],
            'request.reference_number' => ['trackingnumber', 'tracking_number', 'refnumber', 'reference_number', 'trackingno'],
            'request.remarks' => ['remarks', 'comments', 'comment'],
            'barangay.name' => ['barangayname', 'barangay_name', 'barangay', 'nameofbarangay'],
            'barangay.municipality' => ['municipality', 'citymunicipality', 'town'],
            'barangay.province' => ['province', 'provincial'],
            'barangay.address' => ['barangayaddress', 'officeaddress', 'addressbarangay', 'barangayoffice'],
            'barangay.captain' => ['punongbarangay', 'punong_barangay', 'barangaycaptain', 'captain', 'chairman'],
            'barangay.secretary' => ['barangaysecretary', 'secretary', 'secretaryname'],
            'request.business_name' => ['businessname', 'nameofbusiness', 'business'],
            'request.business_address' => ['businessaddress', 'businesslocation'],
            'request.business_activity' => ['businessactivity', 'natureofbusiness', 'businessnature'],
            'request.number_of_children' => ['numberofchildren', 'childcount'],
        ];

        foreach ($matchers as $systemField => $aliases) {
            foreach ($aliases as $alias) {
                if ($this->normalizeFieldName((string) $alias) === $normalized) {
                    return $systemField;
                }
            }
        }

        return null;
    }

    private function normalizeFieldName(string $fieldName): string
    {
        $normalized = preg_replace('/[^a-z0-9]+/i', '', strtolower(trim($fieldName))) ?? '';
        return $normalized;
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
                'The original document template is no longer available.'
            );
        }

        $templateBytes = $disk->get($version->storage_path);
        if (!is_string($templateBytes)) {
            throw new PdfProcessingException(
                'The original document template could not be read from storage.'
            );
        }
        $format = $this->formatForVersion($version);
        $localPath = $this->copyToTemporaryFile(
            $templateBytes,
            '.'.$format
        );
        try {
            $inspection = $this->pdfWorker->inspect($localPath, $format);
        } finally {
            @unlink($localPath);
        }

        $docxPlaceholders = collect($inspection['fields'] ?? [])
            ->filter(fn (array $field): bool =>
                ($field['type'] ?? null) === '/DocxPlaceholder'
            )
            ->pluck('name')
            ->all();
        $formFields = collect($inspection['fields'])
            ->filter(fn (array $field): bool => $field['supported'])
            ->pluck('name')
            ->all();
        $fieldNames = [];
        $mappedDocxPlaceholders = [];

        foreach ($mappings as $mapping) {
            $name = $mapping['field_name'];
            if (in_array($name, $fieldNames, true)) {
                throw new \InvalidArgumentException(
                    'Each template field can only have one system data mapping.'
                );
            }
            $fieldNames[] = $name;

            if ($format === 'docx') {
                if (
                    $mapping['field_type'] !== 'docx_placeholder' ||
                    !in_array($name, $docxPlaceholders, true)
                ) {
                    throw new \InvalidArgumentException(
                        "The DOCX template does not contain a placeholder named '{$name}'."
                    );
                }
                $mappedDocxPlaceholders[] = $name;
                continue;
            }

            if ($mapping['field_type'] === 'docx_placeholder') {
                throw new \InvalidArgumentException(
                    'DOCX placeholder mappings can only be used with DOCX templates.'
                );
            }

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

        if ($format === 'docx') {
            $unmapped = array_values(array_diff(
                $docxPlaceholders,
                $mappedDocxPlaceholders
            ));
            if ($unmapped !== []) {
                throw new \InvalidArgumentException(
                    'Map every DOCX placeholder before saving: '
                    .implode(', ', $unmapped)
                );
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
                    'There is no active document template to delete.'
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
                "Deactivated the document template for {$documentType->document_name}.",
                [],
                ['deleted_by' => Auth::id()]
            );
        });
    }

    public function fieldCatalog(): array
    {
        return $this->dataFields->catalog();
    }

    private function validateTemplateFile(UploadedFile $file): string
    {
        $format = strtolower($file->getClientOriginalExtension());
        if (!in_array($format, ['pdf', 'docx'], true)) {
            throw new \InvalidArgumentException(
                'Choose a PDF or DOCX template file.'
            );
        }

        if ($format === 'docx') {
            return $format;
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

        return $format;
    }

    private function formatForVersion(DocumentTemplateVersion $version): string
    {
        return strtolower(pathinfo($version->original_name, PATHINFO_EXTENSION))
            === 'docx'
                ? 'docx'
                : 'pdf';
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
