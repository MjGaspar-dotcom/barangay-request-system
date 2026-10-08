<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBarangayRequest;
use App\Http\Requests\UpdateBarangayRequest;
use App\Models\BarangayRequest;
use App\Services\AuditService;
use App\Services\RequestStatusService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\GuestRequest;
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
     * Guests must use POST /api/guest-requests instead.
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
                'qr_code' => $qrCode,
                'qr_payload' => QrCodeService::payload(
                    $barangayRequest->tracking_number
                ),
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

        $barangayRequest->load([
            'documentType',
            'verifier',
        ]);

        return response()->json([
            'success' => true,
            'data' => $barangayRequest,
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
            // If a new status was provided, do the entire update atomically
            // (status + extra fields) inside RequestStatusService.
            if (isset($validated['status'])) {
                $barangayRequest = RequestStatusService::updateBarangayRequestAtomically(
                    $barangayRequest,
                    $validated['status'],
                    $validated,
                    $validated['remarks'] ?? null
                );
            } else {
                // No status change — just update the other fields.
                $barangayRequest->update($validated);
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

    /**
     * Remove the specified resource from storage.
     *
     * DELETE /api/barangay-requests/{barangayRequest}
     */
    public function destroy(BarangayRequest $barangayRequest)
    {
        $user = Auth::user();

        // Defense-in-depth: route is also protected by staff.or.admin middleware.
        if (!$user->staff && !$user->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Staff or Admin can delete requests.',
            ], 403);
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
    // Track a barangay request by its tracking number.
    // Track a barangay or guest request by its tracking number.
    public function track(string $trackingNumber)
    {
        // Check registered user's request first.
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

        // Check guest request.
        $guestRequest = GuestRequest::with('documentType')
            ->where('tracking_number', $trackingNumber)
            ->first();

        if ($guestRequest) {
            return response()->json([
                'success' => true,
                'data' => [
                    'tracking_number' => $guestRequest->tracking_number,
                    'status' => $guestRequest->status,
                    'document_type' => $guestRequest->documentType?->document_name,
                    'purpose' => $guestRequest->purpose,
                    'submitted_at' => $guestRequest->created_at,
                    'remarks' => $guestRequest->remarks,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Request not found.',
        ], 404);
    }
}
