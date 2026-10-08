<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGuestRequest;
use App\Http\Requests\UpdateGuestRequest;
use App\Models\GuestRequest;
use App\Services\AuditService;
use App\Services\RequestStatusService;
use Illuminate\Support\Str;
use App\Services\QrCodeService;

class GuestRequestController extends Controller
{
    /**
     * Display a listing of all guest requests.
     * Only accessible by staff and admin.
     *
     * GET /api/guest-requests
     */
    public function index()
    {

        $guestRequests = GuestRequest::with([
            'documentType',
            'verifier',
        ])->get();

        return response()->json([
            'success' => true,
            'data' => $guestRequests,
        ]);
    }

    /**
     * Store a newly created guest request.
     * This is a public endpoint — no authentication required.
     *
     * POST /api/guest-requests
     */
    public function store(StoreGuestRequest $request)
    {
        $validated = $request->validated();

        // Upload the valid ID image.
        $validated['valid_id_image'] = $request
            ->file('valid_id_image')
            ->store('guest-valid-ids', 'public');

        // Generate a unique tracking number for this guest request.
        $validated['tracking_number'] =
            'GR-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));

        // Every new request starts as Pending.
        $validated['status'] = 'Pending';

        $guestRequest = GuestRequest::create($validated);

        //generate QR code for the tracking number
        $qrCode = QrCodeService::generate(
            $guestRequest->tracking_number
        );

        // Audit: log the creation (no user since this is public).
        AuditService::log(
            'created',
            $guestRequest,
            "New guest request submitted by {$guestRequest->first_name} {$guestRequest->last_name} (Tracking: {$guestRequest->tracking_number})"
        );

        // Notify all staff about the new guest request.
        AuditService::notifyAllStaff(
            'new_guest_request',
            'New Guest Request',
            "A new guest request ({$guestRequest->tracking_number}) has been submitted by {$guestRequest->first_name} {$guestRequest->last_name}.",
            null,
            $guestRequest->guest_request_id
        );

        return response()->json([
            'success' => true,
            'message' => 'Guest request submitted successfully.',
            'data' => [
                'request' => $guestRequest,
                'qr_code' => $qrCode,
                'qr_payload' => QrCodeService::payload(
                    $guestRequest->tracking_number
                ),
            ]   
        ], 201);
    }

    /**
     * Display a specific guest request.
     * Only accessible by staff and admin.
     *
     * GET /api/guest-requests/{guestRequest}
     */
    public function show(GuestRequest $guestRequest)
    {

        $guestRequest->load([
            'documentType',
            'verifier',
        ]);

        return response()->json([
            'success' => true,
            'data' => $guestRequest,
        ]);
    }

    /**
     * Update (process) a guest request.
     * Only staff and admin can change the status.
     *
     * PUT/PATCH /api/guest-requests/{guestRequest}
     */
    public function update(UpdateGuestRequest $request, GuestRequest $guestRequest)
    {

        $validated = $request->validated();

        try {
            // If a new status was provided, do the entire update atomically
            // (status + extra fields) inside RequestStatusService.
            if (isset($validated['status'])) {
                $guestRequest = RequestStatusService::updateGuestRequestAtomically(
                    $guestRequest,
                    $validated['status'],
                    $validated,
                    $validated['remarks'] ?? null
                );
            } else {
                // No status change — just update the other fields.
                $guestRequest->update($validated);
            }
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Guest request updated successfully.',
            'data' => $guestRequest->fresh(),
        ]);
    }

    /**
     * Remove a guest request.
     * Only staff and admin can delete.
     *
     * DELETE /api/guest-requests/{guestRequest}
     */
    public function destroy(GuestRequest $guestRequest)
    {

        // Audit: log the deletion before deleting.
        AuditService::log(
            'deleted',
            $guestRequest,
            "Guest request ({$guestRequest->tracking_number}) was deleted."
        );

        $guestRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Guest request deleted successfully.',
        ]);
    }

    /**
     * Track a guest request by tracking number.
     * Public endpoint — anyone with the tracking number can check status.
     *
     * GET /api/guest-requests/track/{tracking_number}
     */

    public function track(string $trackingNumber)
    {
        $guestRequest = GuestRequest::with('documentType')
            ->where('tracking_number', $trackingNumber)
            ->first();

        if (!$guestRequest) {
            return response()->json([
                'success' => false,
                'message' => 'No guest request found with that tracking number.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'tracking_number' => $guestRequest->tracking_number,
                'status' => $guestRequest->status,
                'document' => $guestRequest->documentType->document_name ?? 'Unknown',
                'purpose' => $guestRequest->purpose,
                'submitted_at' => $guestRequest->created_at,
                'remarks' => $guestRequest->remarks,
            ],
        ]);
    }
}
