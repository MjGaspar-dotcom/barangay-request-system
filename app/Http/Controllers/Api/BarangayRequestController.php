<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBarangayRequest;
use App\Http\Requests\UpdateBarangayRequest;
use App\Models\BarangayRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

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
            'verifier'
        ]);

        // Staff can see all barangay requests.
        if ($user->staff) {
            $requests = $query->get();
        } else {
            // Normal users can only see their own requests.
            $requests = $query
                ->where('user_id', $user->user_id)
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }

    /**
     * Store a newly created barangay request.
     *
     * POST /api/barangay-requests
     */
    public function store(StoreBarangayRequest $request)
    {
        $validated = $request->validated();

        // Automatically associate the request with
        // the authenticated user when a valid Sanctum token exists.
        $user = Auth::guard('sanctum')->user();

        if ($user) {
            $validated['user_id'] = $user->user_id;
        } else {
            $validated['user_id'] = null;
        }

        // Upload guest ID image if provided.
        if ($request->hasFile('guest_valid_id_image')) {
            $validated['guest_valid_id_image'] = $request
                ->file('guest_valid_id_image')
                ->store('valid-ids', 'public');
        }

        // Generate tracking number.
        $validated['tracking_number'] =
            'BR-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));

        // Every new request starts as Pending.
        $validated['status'] = 'Pending';

        $barangayRequest = BarangayRequest::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Barangay request created successfully.',
            'data' => $barangayRequest
        ], 201);
    }

    /**
     * Display the specified resource.
     *
     * GET /api/barangay-requests/{id}
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
                    'message' => 'Unauthorized.'
                ], 403);
            }
        }

        $barangayRequest->load([
            'documentType',
            'verifier'
        ]);

        return response()->json([
            'success' => true,
            'data' => $barangayRequest
        ]);
    }
    /**
     * Update the specified resource in storage.
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

        // Check status transition if a new status was provided.
        if (isset($validated['status'])) {
            $currentStatus = $barangayRequest->status;
            $newStatus = $validated['status'];

            // Request status workflow:
            // Pending → Approved → Processing → Ready for Pickup → Completed
            // Pending can also be Rejected.
            // Rejected and Completed are final statuses.
            $allowedTransitions = [
                'Pending' => ['Approved', 'Rejected'],
                'Approved' => ['Processing'],
                'Processing' => ['Ready for Pickup'],
                'Ready for Pickup' => ['Completed'],
                'Rejected' => [],
                'Completed' => [],
            ];

            // Prevent changing to the same status.
            if ($currentStatus === $newStatus) {
                return response()->json([
                    'success' => false,
                    'message' => "Request is already {$currentStatus}.",
                ], 422);
            }

            // Prevent invalid status transitions.
            if (!in_array($newStatus, $allowedTransitions[$currentStatus] ?? [])) {
                return response()->json([
                    'success' => false,
                    'message' => "Invalid status transition from {$currentStatus} to {$newStatus}.",
                ], 422);
            }

            // Automatically record important timestamps.
            if ($newStatus === 'Approved') {
                $validated['approved_at'] = now();
            }

            if ($newStatus === 'Ready for Pickup') {
                $validated['ready_for_pickup_at'] = now();
            }

            if ($newStatus === 'Completed') {
                $validated['claimed_at'] = now();
            }
        }

        $barangayRequest->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Barangay request updated successfully.',
            'data' => $barangayRequest->fresh(),
        ]);
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BarangayRequest $barangayRequest)
    {
        $barangayRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barangay request deleted successfully.',
        ]);
    }
}
