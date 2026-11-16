<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\PdfProcessingException;
use App\Http\Controllers\Controller;
use App\Models\DocumentTemplate;
use App\Models\DocumentTemplateVersion;
use App\Models\DocumentType;
use App\Services\DocumentTemplateDataFieldService;
use App\Services\DocumentTemplateService;
use App\Services\PdfWorkerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\HeaderUtils;

class DocumentTemplateController extends Controller
{
    public function __construct(
        private readonly DocumentTemplateService $templates,
        private readonly DocumentTemplateDataFieldService $dataFields,
        private readonly PdfWorkerService $pdfWorker
    ) {
    }

    public function index()
    {
        $documentTypes = DocumentType::query()
            ->orderBy('document_name')
            ->get()
            ->map(function (DocumentType $documentType): array {
                $template = DocumentTemplate::withTrashed()
                    ->where('document_type_id', $documentType->document_type_id)
                    ->with(['versions.uploader'])
                    ->first();

                return [
                    'document_type_id' => $documentType->document_type_id,
                    'document_name' => $documentType->document_name,
                    'description' => $documentType->description,
                    'is_active' => (bool) $documentType->is_active,
                    'template_status' => $this->templateStatus($template),
                    'active_version' => $template && !$template->trashed()
                        ? $this->versionData(
                            $template->versions->firstWhere('is_active', true)
                        )
                        : null,
                    'versions' => $template
                        ? $template->versions->map(
                            fn (DocumentTemplateVersion $version): array =>
                                $this->versionData($version)
                        )->values()
                        : [],
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'document_types' => $documentTypes,
                'field_catalog' => $this->dataFields->catalog(),
            ],
        ]);
    }

    public function show(DocumentType $documentType)
    {
        $template = DocumentTemplate::withTrashed()
            ->where('document_type_id', $documentType->document_type_id)
            ->with(['versions.uploader', 'versions.mappings'])
            ->first();
        $activeVersion = $template && !$template->trashed()
            ? $template->versions->firstWhere('is_active', true)
            : null;
        $formFields = [];
        $pages = [];

        if ($activeVersion) {
            $disk = Storage::disk($activeVersion->storage_disk);
            if (!$disk->exists($activeVersion->storage_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The active document template is missing from storage.',
                ], 404);
            }

            $temporaryPath = tempnam(sys_get_temp_dir(), 'barangayease-template-');
            if ($temporaryPath === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'A temporary template inspection file could not be created.',
                ], 500);
            }
            $format = strtolower(pathinfo($activeVersion->original_name, PATHINFO_EXTENSION))
                === 'docx'
                    ? 'docx'
                    : 'pdf';
            $temporaryTemplatePath = $temporaryPath.'.'.$format;
            @unlink($temporaryPath);
            try {
                $contents = $disk->get($activeVersion->storage_path);
                if (file_put_contents($temporaryTemplatePath, $contents) === false) {
                    return response()->json([
                        'success' => false,
                        'message' => 'The active document template could not be prepared for inspection.',
                    ], 500);
                }
                $inspection = $this->pdfWorker->inspect(
                    $temporaryTemplatePath,
                    $format
                );
                $formFields = $inspection['fields'];
                $pages = $inspection['pages'];
            } catch (PdfProcessingException $exception) {
                return response()->json([
                    'success' => false,
                    'message' => 'The active document template could not be inspected.',
                ], 422);
            } finally {
                @unlink($temporaryTemplatePath);
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'document_type' => [
                    'document_type_id' => $documentType->document_type_id,
                    'document_name' => $documentType->document_name,
                ],
                'template_status' => $this->templateStatus($template),
                'active_version' => $this->versionData($activeVersion),
                'versions' => $template
                    ? $template->versions->map(
                        fn (DocumentTemplateVersion $version): array =>
                            $this->versionData($version)
                    )->values()
                    : [],
                'form_fields' => $formFields,
                'pages' => $pages,
                'field_catalog' => $this->dataFields->catalog(),
            ],
        ]);
    }

    public function store(Request $request, DocumentType $documentType)
    {
        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'max:'.config('document_templates.max_upload_kilobytes', 20480),
            ],
        ]);

        try {
            $version = $this->templates->upload(
                $documentType,
                $validated['file']
            );
        } catch (\InvalidArgumentException|PdfProcessingException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Document template uploaded successfully.',
            'data' => ['version' => $this->versionData($version)],
        ], 201);
    }

    public function saveMappings(
        Request $request,
        DocumentTemplateVersion $version
    ) {
        $fields = $this->dataFields->fieldKeys();
        $validated = Validator::make($request->all(), [
            'fields' => 'required|array|min:1|max:100',
            'fields.*.field_name' => 'required|string|max:255|distinct:strict',
            'fields.*.field_type' => [
                'required',
                Rule::in(['acroform', 'overlay', 'docx_placeholder']),
            ],
            'fields.*.system_field' => ['required', 'string', Rule::in($fields)],
            'fields.*.page_number' => 'nullable|integer|min:1',
            'fields.*.x' => 'nullable|numeric|between:0,1',
            'fields.*.y' => 'nullable|numeric|between:0,1',
            'fields.*.width' => 'nullable|numeric|between:0,1',
            'fields.*.height' => 'nullable|numeric|between:0,1',
            'fields.*.font_size' => 'nullable|numeric|between:6,48',
            'fields.*.font_family' => [
                'nullable',
                Rule::in(['Helvetica', 'Helvetica-Bold', 'Times-Roman', 'Courier']),
            ],
            'fields.*.text_align' => [
                'nullable',
                Rule::in(['left', 'center', 'right']),
            ],
            'fields.*.is_required' => 'required|boolean',
        ])->validate();

        foreach ($validated['fields'] as $index => $field) {
            if ($field['field_type'] === 'overlay') {
                foreach (['page_number', 'x', 'y', 'width', 'height'] as $key) {
                    if (!array_key_exists($key, $field) || $field[$key] === null) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Overlay fields require a page and normalized position and size.',
                            'errors' => ["fields.{$index}.{$key}" => ['This field is required for visual PDF mappings.']],
                        ], 422);
                    }
                }
                if ($field['width'] <= 0 || $field['height'] <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Overlay fields must have a positive width and height.',
                    ], 422);
                }
            }
        }

        try {
            $this->templates->saveMappings($version, $validated['fields']);
        } catch (\InvalidArgumentException|PdfProcessingException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Document template mappings saved.',
            'data' => [
                'mappings' => $version->mappings()->get(),
            ],
        ]);
    }

    public function destroy(DocumentType $documentType)
    {
        try {
            $this->templates->delete($documentType);
        } catch (\InvalidArgumentException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Document template deactivated. Its version history and generated documents were preserved.',
        ]);
    }

    public function file(Request $request, DocumentTemplateVersion $version)
    {
        $disk = Storage::disk($version->storage_disk);
        if (!$disk->exists($version->storage_path)) {
            return response()->json([
                'success' => false,
                'message' => 'The original document template is missing from storage.',
            ], 404);
        }

        $stream = $disk->readStream($version->storage_path);
        if (!is_resource($stream)) {
            return response()->json([
                'success' => false,
                'message' => 'The original document template could not be opened.',
            ], 500);
        }

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';
        $fallbackName = 'document-template-v'.$version->version_number.'.'
            .pathinfo($version->original_name, PATHINFO_EXTENSION);
        $contentDisposition = HeaderUtils::makeDisposition(
            $disposition,
            $version->original_name,
            $fallbackName
        );

        return response()->stream(function () use ($stream): void {
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => $version->mime_type,
            'Content-Disposition' => $contentDisposition,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    private function templateStatus(?DocumentTemplate $template): string
    {
        if (!$template || !$template->versions->isNotEmpty()) {
            return 'missing';
        }
        if ($template->trashed()) {
            return 'deleted';
        }

        return $template->versions->contains(
            fn (DocumentTemplateVersion $version): bool => $version->is_active
        ) ? 'active' : 'missing';
    }

    private function versionData(?DocumentTemplateVersion $version): ?array
    {
        if (!$version) {
            return null;
        }

        $version->loadMissing('uploader');
        return [
            'template_version_id' => $version->template_version_id,
            'version_number' => $version->version_number,
            'filename' => $version->original_name,
            'mime_type' => $version->mime_type,
            'file_size' => $version->file_size,
            'page_count' => $version->page_count,
            'has_acroform' => $version->has_acroform,
            'is_active' => $version->is_active,
            'uploaded_at' => $version->created_at,
            'updated_at' => $version->updated_at,
            'replaced_at' => $version->replaced_at,
            'uploaded_by' => $version->uploader
                ? trim($version->uploader->first_name.' '.$version->uploader->last_name)
                : null,
            'mappings' => $version->relationLoaded('mappings')
                ? $version->mappings
                : [],
        ];
    }
}
