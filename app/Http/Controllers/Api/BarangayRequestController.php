<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exceptions\PdfProcessingException;
use App\Http\Requests\StoreBarangayRequest;
use App\Http\Requests\UpdateBarangayRequest;
use App\Models\BarangayRequest;
use App\Models\BarangayRequestDocument;
use App\Models\AuditLog;
use App\Models\GeneratedDocument;
use App\Models\User;
use App\Services\AuditService;
use App\Services\DocumentGenerationService;
use App\Services\PdfTemplateGenerationService;
use App\Services\RequestValidationService;
use App\Services\RequestStatusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\QrCodeService;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\HeaderUtils;

class BarangayRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * GET /api/barangay-requests
     */
    public function index()
    {
        $user = Auth::user();

        $query = BarangayRequest::with([
            'documentType',
            'verifier',
            'workflowMigrationIssue',
        ]);

        // Staff and Admin can see all barangay requests.
        if ($user->staff && !$user->admin) {
            $requests = $query->get();
        } else {
            // Normal users can only see their own requests.
            $requests = $query
                ->where('user_id', $user->user_id)
                ->get();
            $requests->each(function (BarangayRequest $request): void {
                $request->setAttribute(
                    'qr_code',
                    QrCodeService::generate($request->tracking_number)
                );
            });
        }

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Store a newly created barangay request.
     * Only authenticated (registered) users can submit here.
     *
     * POST /api/barangay-requests
     */
    public function store(StoreBarangayRequest $request)
    {
        $user = Auth::user();

        if ($user->staff || $user->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Only resident accounts can submit a barangay request.',
            ], 403);
        }

        // Only verified residents can submit a barangay request.
        if ($user->verification_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only verified users can submit a barangay request.',
            ], 403);
        }


        $validated = $request->validated();

        $supportingDocuments = $validated['supporting_documents'] ?? [];
        unset($validated['supporting_documents']);

        // Associate the request with the authenticated user.
        $validated['user_id'] = Auth::id();

        // Generate a unique tracking number.
        $validated['tracking_number'] =
            'BR-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));

        $validated['status'] = RequestStatusService::STATUS_REQUEST_SUBMITTED;

        $storedFiles = [];
        $documentTypeId = (int) $validated['document_type_id'];
        $userId = (int) $user->user_id;
        try {
            $barangayRequest = DB::transaction(function () use (
                $validated,
                $supportingDocuments,
                $documentTypeId,
                $userId,
                &$storedFiles
            ) {
                $resident = User::query()->lockForUpdate()->findOrFail($userId);
                if (!RequestValidationService::isUserVerified($resident)) {
                    abort(403, 'Only verified residents can submit a request.');
                }

                $duplicateErrors = RequestValidationService::canUserSubmitRequest(
                    $resident,
                    $documentTypeId
                );
                if ($duplicateErrors) {
                    throw ValidationException::withMessages([
                        'document_type_id' => $duplicateErrors,
                    ]);
                }

                $barangayRequest = BarangayRequest::create($validated);
                $this->storeDocuments(
                    $barangayRequest,
                    $supportingDocuments,
                    'additional_requirement',
                    $storedFiles
                );

                return $barangayRequest;
            });
        } catch (\Throwable $exception) {
            $this->deleteStoredFiles($storedFiles);
            throw $exception;
        }

        //create QR code for the tracking number
        $qrCode = QrCodeService::generate(
            $barangayRequest->tracking_number
        );

        // Audit: log the creation.
        AuditService::log(
            'request_submitted',
            $barangayRequest,
            "New barangay request submitted (Tracking: {$barangayRequest->tracking_number})"
        );

        // Notify all staff about the new request.
        AuditService::notifyAllStaff(
            'new_request',
            'New Barangay Request',
            "A new document request ({$barangayRequest->tracking_number}) has been submitted and is awaiting processing.",
            $barangayRequest->request_id
        );

        return response()->json([
            'success' => true,
            'message' => 'Barangay request created successfully.',
            'data' => [
                'request' => $barangayRequest,
                'qr_code' => $qrCode
            ]
        ], 201);
    }

    /**
     * Display the specified resource.
     *
     * GET /api/barangay-requests/{barangayRequest}
     */
    public function show(BarangayRequest $barangayRequest)
    {
        $user = Auth::user();

        // Staff and Admin can view any request.
        // Regular users can only view their own requests.
        if (!$user->staff && !$user->admin) {
            if ($barangayRequest->user_id !== $user->user_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized.',
                ], 403);
            }
        }

        $relations = [
            'documentType',
            'verifier',
            'documents',
            'workflowMigrationIssue',
        ];

        if ($user->staff || $user->admin) {
            $relations[] = 'user';
        }

        $barangayRequest->load($relations);
        $history = AuditLog::with(['user', 'staff.user'])
            ->where('table_name', 'barangay_requests')
            ->where('record_id', $barangayRequest->request_id)
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => array_merge($barangayRequest->toArray(), [
                'history' => $history,
            ]),
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * PUT/PATCH /api/barangay-requests/{barangayRequest}
     */
    public function update(
        UpdateBarangayRequest $request,
        BarangayRequest $barangayRequest
    ) {
        $user = Auth::user();

        // Only Staff and Admin can process barangay requests.
        if (!$user->staff && !$user->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Staff or Admin can process requests.',
            ], 403);
        }

        $validated = $request->validated();

        try {
            if (isset($validated['status'])) {
                $barangayRequest = RequestStatusService::updateBarangayRequestAtomically(
                    $barangayRequest,
                    $validated['status'],
                    $validated,
                    $validated['remarks'] ?? null
                );
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Request changes must be recorded through a workflow action.',
                ], 422);
            }
        } catch (\InvalidArgumentException|PdfProcessingException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Barangay request updated successfully.',
            'data' => $barangayRequest->fresh(),
        ]);
    }

    public function approveAndPrepareForPickup(
        Request $request,
        BarangayRequest $barangayRequest
    ) {
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:2000',
        ]);

        try {
            $updated = RequestStatusService::approveAndPrepareForPickup(
                $barangayRequest,
                $validated['remarks'] ?? null
            );
        } catch (\InvalidArgumentException|PdfProcessingException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Request approved. The generated document is ready for pickup.',
            'data' => $updated,
        ]);
    }

    public function showTemplatePreview(BarangayRequest $barangayRequest)
    {
        try {
            $document = app(DocumentGenerationService::class)
                ->getTemplatePreviewData($barangayRequest);
        } catch (\InvalidArgumentException|PdfProcessingException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }

        $pdfGeneration = app(PdfTemplateGenerationService::class);
        $activeVersion = $pdfGeneration->activeTemplateFor($barangayRequest);

        return response()->json([
            'success' => true,
            'data' => [
                'document' => $document,
                'pdf_template' => $activeVersion ? [
                    'template_version_id' => $activeVersion->template_version_id,
                    'version_number' => $activeVersion->version_number,
                    'filename' => $activeVersion->original_name,
                    'page_count' => $activeVersion->page_count,
                    'has_acroform' => $activeVersion->has_acroform,
                    'mapping_count' => $activeVersion->mappings->count(),
                ] : null,
            ],
        ]);
    }

    public function generateDocument(
        Request $request,
        BarangayRequest $barangayRequest
    )
    {
        $validated = $request->validate([
            'regenerate' => 'sometimes|boolean',
        ]);

        try {
            $pdfGeneration = app(PdfTemplateGenerationService::class);
            if ($pdfGeneration->activeTemplateFor($barangayRequest)) {
                $generatedDocument = $pdfGeneration->generate(
                    $barangayRequest,
                    (bool) ($validated['regenerate'] ?? false)
                );

                return response()->json([
                    'success' => true,
                    'message' => $generatedDocument->version_number > 1
                        ? 'PDF document regenerated.'
                        : 'PDF document generated.',
                    'data' => [
                        'is_pdf' => true,
                        'generated_document_id' => $generatedDocument->generated_document_id,
                        'version_number' => $generatedDocument->version_number,
                        'document_number' => $generatedDocument->document_number,
                        'template_version_id' => $generatedDocument->template_version_id,
                        'generated_at' => $generatedDocument->generated_at,
                    ],
                ]);
            }

            if (
                $barangayRequest->status !== RequestStatusService::STATUS_READY_FOR_PICKUP ||
                !$barangayRequest->approved_at
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active PDF template is uploaded for this document type.',
                ], 422);
            }

            $generatedRequest = app(DocumentGenerationService::class)
                ->generateForReadyPickup($barangayRequest);
        } catch (\InvalidArgumentException|PdfProcessingException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Official document generated.',
            'data' => [
                'is_pdf' => false,
                'document_number' => $generatedRequest->document_number,
                'template_identifier' => $generatedRequest->document_template_identifier,
                'template_version' => $generatedRequest->document_template_version,
                'generated_at' => $generatedRequest->document_generated_at,
            ],
        ]);
    }

    public function showGeneratedDocument(
        BarangayRequest $barangayRequest
    ) {
        if (!$this->canViewGeneratedDocument($barangayRequest)) {
            return response()->json([
                'success' => false,
                'message' => 'The generated document is unavailable.',
            ], 404);
        }

        $pdfGeneration = app(PdfTemplateGenerationService::class);
        $generatedPdf = $pdfGeneration->current($barangayRequest);

        if ($generatedPdf) {
            AuditService::log(
                'document_previewed',
                $barangayRequest,
                "The generated PDF {$generatedPdf->document_number} was previewed.",
                [],
                [
                    'generated_document_id' => $generatedPdf->generated_document_id,
                    'version_number' => $generatedPdf->version_number,
                ]
            );
            $printCount = \App\Models\AuditLog::query()
                ->where('table_name', 'barangay_requests')
                ->where('record_id', $barangayRequest->request_id)
                ->whereIn('action', ['document_printed', 'document_reprinted'])
                ->get(['new_values'])
                ->filter(
                    fn (\App\Models\AuditLog $event): bool =>
                        isset($event->new_values['generated_document_id'])
                            ? (int) $event->new_values['generated_document_id'] ===
                                $generatedPdf->generated_document_id
                            : ($event->new_values['document_number'] ?? null) ===
                                $generatedPdf->document_number
                )
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'is_pdf' => true,
                    'document' => $generatedPdf->data_snapshot,
                    'generated_document' => [
                        'generated_document_id' => $generatedPdf->generated_document_id,
                        'version_number' => $generatedPdf->version_number,
                        'document_number' => $generatedPdf->document_number,
                        'template_version_id' => $generatedPdf->template_version_id,
                        'generated_at' => $generatedPdf->generated_at,
                    ],
                    'print_count' => $printCount,
                ],
            ]);
        }

        try {
            $documentData = app(DocumentGenerationService::class)
                ->getGeneratedData($barangayRequest);
        } catch (\InvalidArgumentException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 404);
        }

        AuditService::log(
            'document_previewed',
            $barangayRequest,
            "The generated document {$barangayRequest->document_number} was previewed.",
            [],
            ['document_number' => $barangayRequest->document_number]
        );
        $printCount = \App\Models\AuditLog::query()
            ->where('table_name', 'barangay_requests')
            ->where('record_id', $barangayRequest->request_id)
            ->whereIn('action', ['document_printed', 'document_reprinted'])
            ->get(['new_values'])
            ->filter(
                fn (\App\Models\AuditLog $event): bool =>
                    ($event->new_values['document_number'] ?? null) ===
                    $barangayRequest->document_number
            )
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'document' => $documentData,
                'print_count' => $printCount,
            ],
        ]);
    }

    public function showGeneratedDocumentHistory(
        BarangayRequest $barangayRequest
    ) {
        $documents = $barangayRequest->generatedDocuments()
            ->with('templateVersion')
            ->get()
            ->map(fn (GeneratedDocument $document): array => [
                'generated_document_id' => $document->generated_document_id,
                'version_number' => $document->version_number,
                'document_number' => $document->document_number,
                'template_version_id' => $document->template_version_id,
                'generated_at' => $document->generated_at,
                'original_name' => $document->original_name,
                'file_size' => $document->file_size,
                'sha256' => $document->sha256,
            ]);

        return response()->json([
            'success' => true,
            'data' => ['versions' => $documents],
        ]);
    }

    public function showGeneratedDocumentFile(
        BarangayRequest $barangayRequest
    ) {
        if (!$this->canViewGeneratedDocument($barangayRequest)) {
            return response()->json([
                'success' => false,
                'message' => 'The generated document is unavailable.',
            ], 404);
        }

        $generatedDocument = app(PdfTemplateGenerationService::class)
            ->current($barangayRequest);
        if (!$generatedDocument) {
            return response()->json([
                'success' => false,
                'message' => 'No generated PDF is available for this request.',
            ], 404);
        }

        return $this->streamGeneratedDocument($generatedDocument);
    }

    private function canViewGeneratedDocument(
        BarangayRequest $barangayRequest
    ): bool {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->admin || $user->staff) {
            return true;
        }

        return (int) $barangayRequest->user_id === (int) $user->user_id
            && in_array($barangayRequest->status, [
                RequestStatusService::STATUS_READY_FOR_PICKUP,
                RequestStatusService::STATUS_COMPLETED,
            ], true);
    }

    public function showGeneratedDocumentVersionFile(
        BarangayRequest $barangayRequest,
        GeneratedDocument $generatedDocument
    ) {
        if ($generatedDocument->request_id !== $barangayRequest->request_id) {
            return response()->json([
                'success' => false,
                'message' => 'The selected generated document does not belong to this request.',
            ], 404);
        }

        return $this->streamGeneratedDocument($generatedDocument);
    }

    private function streamGeneratedDocument(GeneratedDocument $generatedDocument)
    {
        $disk = Storage::disk($generatedDocument->storage_disk);
        if (!$disk->exists($generatedDocument->storage_path)) {
            return response()->json([
                'success' => false,
                'message' => 'The generated PDF is missing from storage.',
            ], 404);
        }
        $stream = $disk->readStream($generatedDocument->storage_path);
        if (!is_resource($stream)) {
            return response()->json([
                'success' => false,
                'message' => 'The generated PDF could not be opened.',
            ], 500);
        }

        $disposition = HeaderUtils::makeDisposition(
            'inline',
            $generatedDocument->original_name,
            'barangay-document.pdf'
        );

        return response()->stream(function () use ($stream): void {
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function recordGeneratedDocumentPrint(
        Request $request,
        BarangayRequest $barangayRequest
    ) {
        $validated = $request->validate([
            'generated_document_id' => 'sometimes|integer|min:1',
        ]);

        try {
            $action = RequestStatusService::recordGeneratedDocumentPrint(
                $barangayRequest,
                $validated['generated_document_id'] ?? null
            );
        } catch (\InvalidArgumentException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $action === 'document_reprinted'
                ? 'Reprint activity recorded.'
                : 'Print activity recorded.',
            'data' => ['action' => $action],
        ]);
    }

    public function storePreparedDocument(Request $request, BarangayRequest $barangayRequest)
    {
        $validated = $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $storedFiles = [];
        try {
            DB::transaction(function () use ($validated, $barangayRequest, &$storedFiles): void {
                if ($barangayRequest->status !== RequestStatusService::STATUS_REQUEST_SUBMITTED) {
                    throw new \InvalidArgumentException(
                        'A prepared document can only be uploaded during processing and approval.'
                    );
                }

                $this->storeDocuments(
                    $barangayRequest,
                    [$validated['document']],
                    'prepared_document',
                    $storedFiles
                );
                RequestStatusService::markDocumentPrepared($barangayRequest);
            });
        } catch (\Throwable $e) {
            $this->deleteStoredFiles($storedFiles);
            if ($e instanceof \InvalidArgumentException) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }
            throw $e;
        }

        return response()->json([
            'success' => true,
            'message' => 'Prepared document uploaded for review.',
            'data' => $barangayRequest->fresh()->load('documents'),
        ]);
    }

    public function replaceSupportingDocument(
        Request $request,
        BarangayRequest $barangayRequest,
        BarangayRequestDocument $document
    ) {
        $validation = $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);
        $authorizationError = $this->supportingDocumentAuthorization(
            $request,
            $barangayRequest,
            $document
        );
        if ($authorizationError !== null) {
            return $authorizationError;
        }

        $file = $validation['document'];
        $diskName = config('filesystems.private_upload_disk');
        $path = $file->store(
            "barangay-requests/{$barangayRequest->request_id}",
            $diskName
        );
        if (!is_string($path) || $path === '') {
            throw new \RuntimeException('Unable to store the replacement document.');
        }

        $oldFile = [
            'disk' => $document->storage_disk
                ?: config('filesystems.legacy_request_document_disk'),
            'path' => $document->storage_path,
        ];
        try {
            DB::transaction(function () use (
                $document,
                $file,
                $diskName,
                $path
            ): void {
                $document->update([
                    'uploaded_by' => Auth::id(),
                    'original_name' => $file->getClientOriginalName(),
                    'storage_path' => $path,
                    'storage_disk' => $diskName,
                    'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
                ]);
            });
        } catch (\Throwable $exception) {
            $this->deleteStoredFiles([['disk' => $diskName, 'path' => $path]]);
            throw $exception;
        }

        $this->deleteStoredFiles([$oldFile]);

        return response()->json([
            'success' => true,
            'message' => 'Supporting document replaced successfully.',
            'data' => $document->fresh(),
        ]);
    }

    public function deleteSupportingDocument(
        Request $request,
        BarangayRequest $barangayRequest,
        BarangayRequestDocument $document
    ) {
        $authorizationError = $this->supportingDocumentAuthorization(
            $request,
            $barangayRequest,
            $document
        );
        if ($authorizationError !== null) {
            return $authorizationError;
        }

        $storedFile = [
            'disk' => $document->storage_disk
                ?: config('filesystems.legacy_request_document_disk'),
            'path' => $document->storage_path,
        ];
        DB::transaction(fn () => $document->delete());
        $this->deleteStoredFiles([$storedFile]);

        return response()->json([
            'success' => true,
            'message' => 'Supporting document deleted successfully.',
        ]);
    }

    private function supportingDocumentAuthorization(
        Request $request,
        BarangayRequest $barangayRequest,
        BarangayRequestDocument $document
    ): ?\Illuminate\Http\JsonResponse {
        if (
            $document->request_id !== $barangayRequest->request_id ||
            $document->purpose !== 'additional_requirement'
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Supporting document not found.',
            ], 404);
        }

        if ($barangayRequest->user_id !== $request->user()->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to change this document.',
            ], 403);
        }

        if ($barangayRequest->status !== RequestStatusService::STATUS_REQUEST_SUBMITTED) {
            return response()->json([
                'success' => false,
                'message' => 'Supporting documents can only be changed before processing begins.',
            ], 422);
        }

        return null;
    }

    public function recordDocumentPrint(
        Request $request,
        BarangayRequest $barangayRequest,
        BarangayRequestDocument $document
    ) {
        if ($document->request_id !== $barangayRequest->request_id) {
            return response()->json([
                'success' => false,
                'message' => 'The selected document does not belong to this request.',
            ], 404);
        }

        try {
            RequestStatusService::recordDocumentPrint(
                $barangayRequest,
                $document->request_document_id
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Print activity recorded.',
        ]);
    }

    public function showDocument(
        Request $request,
        BarangayRequest $barangayRequest,
        BarangayRequestDocument $document
    ) {
        $user = $request->user();
        if (
            $document->request_id !== $barangayRequest->request_id ||
            (!$user->staff && !$user->admin &&
                $barangayRequest->user_id !== $user->user_id)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to view this document.',
            ], 403);
        }

        $disk = Storage::disk(
            $document->storage_disk
                ?: config('filesystems.legacy_request_document_disk')
        );
        if (!$disk->exists($document->storage_path)) {
            return response()->json([
                'success' => false,
                'message' => 'The requested document file is unavailable.',
            ], 404);
        }

        if ($document->purpose === 'prepared_document') {
            AuditService::log(
                'document_previewed',
                $barangayRequest,
                'The prepared request document was previewed.',
                [],
                ['request_document_id' => $document->request_document_id]
            );
        }

        $stream = $disk->readStream($document->storage_path);
        if (!is_resource($stream)) {
            throw new \RuntimeException('Unable to read the requested document.');
        }

        return response()->stream(
            function () use ($stream): void {
                try {
                    fpassthru($stream);
                } finally {
                    if (is_resource($stream)) {
                        fclose($stream);
                    }
                }
            },
            200,
            [
                'Content-Type' => $document->mime_type,
                'Content-Disposition' => 'inline; filename="' .
                    addcslashes(
                        preg_replace('/[\r\n]/', '', $document->original_name),
                        '"\\'
                    ) . '"',
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'private, no-store',
            ]
        );
    }

    private function storeDocuments(
        BarangayRequest $barangayRequest,
        array $files,
        string $purpose,
        array &$storedFiles
    ): void {
        $diskName = config('filesystems.private_upload_disk');
        foreach ($files as $file) {
            $path = $file->store(
                "barangay-requests/{$barangayRequest->request_id}",
                $diskName
            );
            if (!is_string($path) || $path === '') {
                throw new \RuntimeException('Unable to store the uploaded request document.');
            }
            $storedFiles[] = ['disk' => $diskName, 'path' => $path];

            BarangayRequestDocument::create([
                'request_id' => $barangayRequest->request_id,
                'uploaded_by' => Auth::id(),
                'purpose' => $purpose,
                'original_name' => $file->getClientOriginalName(),
                'storage_path' => $path,
                'storage_disk' => $diskName,
                'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            ]);
        }
    }

    /**
     * @param array<int, array{disk: string, path: string}> $files
     */
    private function deleteStoredFiles(array $files): void
    {
        foreach ($files as $file) {
            $disk = Storage::disk($file['disk']);
            if ($disk->exists($file['path']) && !$disk->delete($file['path'])) {
                throw new \RuntimeException('Unable to delete a stored upload.');
            }
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * DELETE /api/barangay-requests/{barangayRequest}
     */
    public function destroy(BarangayRequest $barangayRequest)
    {
        $user = Auth::user();

        if (!$user->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can delete requests.',
            ], 403);
        }

        if ($barangayRequest->status !== RequestStatusService::STATUS_REQUEST_SUBMITTED) {
            return response()->json([
                'success' => false,
                'message' => 'Only requests awaiting processing can be deleted.',
            ], 422);
        }

        // Audit: log the deletion before deleting.
        AuditService::log(
            'deleted',
            $barangayRequest,
            "Barangay request ({$barangayRequest->tracking_number}) was deleted."
        );

        $barangayRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barangay request deleted successfully.',
        ]);
    }
    // Track a registered request by its tracking number.
    public function track(string $trackingNumber)
    {
        $request = BarangayRequest::with('documentType')
            ->where('tracking_number', $trackingNumber)
            ->first();

        if (!$request) {
            return response()->json([
                'success' => false,
                'message' => 'Request not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'tracking_number' => $request->tracking_number,
                'status' => $request->status,
                'document_type' => $request->documentType?->document_name,
                'purpose' => $request->purpose,
                'submitted_at' => $request->created_at,
                'remarks' => $request->decision_at ? $request->remarks : null,
                'rejection_reason' => $request->rejection_reason,
                'rejection_other' => $request->rejection_other,
                'decision_at' => $request->decision_at,
            ],
        ]);
    }
}
