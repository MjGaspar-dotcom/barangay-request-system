<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBarangayRequest;
use App\Http\Requests\UpdateBarangayRequest;
use App\Models\BarangayRequest;
use App\Models\BarangayRequestDocument;
use App\Models\AuditLog;
use App\Services\AuditService;
use App\Services\RequestStatusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\QrCodeService;

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
        ]);

        // Staff and Admin can see all barangay requests.
        if ($user->staff || $user->admin) {
            $requests = $query->get();
        } else {
            // Normal users can only see their own requests.
            $requests = $query
                ->where('user_id', $user->user_id)
                ->get();
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

        // Only verified residents can submit a barangay request.
        if ($user->verification_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only verified users can submit a barangay request.',
            ], 403);
        }


        $validated = $request->validated();

        // Associate the request with the authenticated user.
        $validated['user_id'] = Auth::id();

        // Generate a unique tracking number.
        $validated['tracking_number'] =
            'BR-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));

        // Every new request starts as Pending.
        $validated['status'] = 'Pending';

        $barangayRequest = BarangayRequest::create($validated);

        //create QR code for the tracking number
        $qrCode = QrCodeService::generate(
            $barangayRequest->tracking_number
        );

        // Audit: log the creation.
        AuditService::log(
            'created',
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
                if (
                    in_array($validated['status'], [
                        RequestStatusService::STATUS_APPROVED,
                        RequestStatusService::STATUS_ADDITIONAL_REQUIREMENTS,
                        RequestStatusService::STATUS_REJECTED,
                    ], true) &&
                    !$user->admin
                ) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Only an administrator can make a request decision.',
                    ], 403);
                }

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
        } catch (\InvalidArgumentException $e) {
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

    public function verifyRequirements(Request $request, BarangayRequest $barangayRequest)
    {
        $validated = $request->validate([
            'requirements_complete' => 'required|boolean',
        ]);

        try {
            $updated = RequestStatusService::verifyRequirements(
                $barangayRequest,
                (bool) $validated['requirements_complete']
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Resident requirements verified.',
            'data' => $updated,
        ]);
    }

    public function resubmitRequirements(Request $request, BarangayRequest $barangayRequest)
    {
        if ($request->user()->user_id !== $barangayRequest->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update this request.',
            ], 403);
        }

        $validated = $request->validate([
            'notes' => 'required|string|min:3|max:2000',
            'documents' => 'required|array|min:1|max:5',
            'documents.*' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $storedPaths = [];
        try {
            DB::transaction(function () use ($validated, $barangayRequest, &$storedPaths): void {
                if (
                    $barangayRequest->status !==
                    RequestStatusService::STATUS_ADDITIONAL_REQUIREMENTS
                ) {
                    throw new \InvalidArgumentException(
                        'This request is not waiting for additional requirements.'
                    );
                }

                $this->storeDocuments(
                    $barangayRequest,
                    $validated['documents'],
                    'additional_requirement',
                    $storedPaths
                );
                RequestStatusService::resubmitRequirements(
                    $barangayRequest,
                    $validated['notes']
                );
            });
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($storedPaths);
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
            'message' => 'Additional requirements submitted for review.',
            'data' => $barangayRequest->fresh()->load('documents'),
        ]);
    }

    public function storePreparedDocument(Request $request, BarangayRequest $barangayRequest)
    {
        $validated = $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $storedPaths = [];
        try {
            DB::transaction(function () use ($validated, $barangayRequest, &$storedPaths): void {
                if ($barangayRequest->status !== RequestStatusService::STATUS_PROCESSING) {
                    throw new \InvalidArgumentException(
                        'A prepared document can only be uploaded while processing.'
                    );
                }

                $this->storeDocuments(
                    $barangayRequest,
                    [$validated['document']],
                    'prepared_document',
                    $storedPaths
                );
                RequestStatusService::markDocumentPrepared($barangayRequest);
            });
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($storedPaths);
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
            'message' => 'Prepared document uploaded for authorization.',
            'data' => $barangayRequest->fresh()->load('documents'),
        ]);
    }

    public function authorizeDocument(Request $request, BarangayRequest $barangayRequest)
    {
        $validated = $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $storedPaths = [];
        try {
            DB::transaction(function () use ($validated, $barangayRequest, &$storedPaths): void {
                if ($barangayRequest->status !== RequestStatusService::STATUS_PROCESSING) {
                    throw new \InvalidArgumentException(
                        'A document can only be authorized while processing.'
                    );
                }

                $this->storeDocuments(
                    $barangayRequest,
                    [$validated['document']],
                    'signed_document',
                    $storedPaths
                );
                RequestStatusService::authorizeDocument($barangayRequest);
            });
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($storedPaths);
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
            'message' => 'Signed document authorized and recorded.',
            'data' => $barangayRequest->fresh()->load('documents'),
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

        $disk = Storage::disk('local');
        if (!$disk->exists($document->storage_path)) {
            return response()->json([
                'success' => false,
                'message' => 'The requested document file is unavailable.',
            ], 404);
        }

        return response()->file($disk->path($document->storage_path), [
            'Content-Type' => $document->mime_type,
            'Content-Disposition' => 'inline; filename="' .
                addcslashes(
                    preg_replace('/[\r\n]/', '', $document->original_name),
                    '"\\'
                ) . '"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    private function storeDocuments(
        BarangayRequest $barangayRequest,
        array $files,
        string $purpose,
        array &$storedPaths
    ): void {
        foreach ($files as $file) {
            $path = $file->store(
                "barangay-requests/{$barangayRequest->request_id}",
                'local'
            );
            if ($path === false) {
                throw new \RuntimeException('Unable to store the uploaded request document.');
            }
            $storedPaths[] = $path;

            BarangayRequestDocument::create([
                'request_id' => $barangayRequest->request_id,
                'uploaded_by' => Auth::id(),
                'purpose' => $purpose,
                'original_name' => $file->getClientOriginalName(),
                'storage_path' => $path,
                'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            ]);
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

        if ($barangayRequest->status !== RequestStatusService::STATUS_PENDING) {
            return response()->json([
                'success' => false,
                'message' => 'Requests with a recorded decision or processing history cannot be deleted.',
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

        if ($request) {
            return response()->json([
                'success' => true,
                'data' => [
                    'tracking_number' => $request->tracking_number,
                    'status' => $request->status,
                    'document_type' => $request->documentType?->document_name,
                    'purpose' => $request->purpose,
                    'submitted_at' => $request->created_at,
                    'remarks' => $request->remarks,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Request not found.',
        ], 404);
    }
}
