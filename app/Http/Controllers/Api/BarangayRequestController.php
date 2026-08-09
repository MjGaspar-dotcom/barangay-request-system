<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBarangayRequest;
use App\Models\BarangayRequest;
use Illuminate\Http\Request;
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
        // Get all barangay requests from the database.
        //
        // with() loads the related records at the same time:
        // - user
        // - documentType
        // - verifier
        //
        // This allows the API response to include information
        // about the requester, document type, and verifier.
        $requests = BarangayRequest::with([
            'user',
            'documentType',
            'verifier'
        ])->get();

        // Return the requests as JSON.
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
    public function store(Request $request)
    {
        // Validate the information submitted by the requester.
        //
        // These are the fields a requester is allowed to submit.
        // Processing fields such as status, approved_at, and claimed_at
        // are NOT accepted from the requester.
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,user_id',

            'document_type_id' => 'required|exists:document_types,document_type_id',

            'purpose' => 'required|string',

            // Guest fields are optional because this request
            // may belong to a registered user instead.
            'guest_first_name' => 'nullable|string|max:255',
            'guest_middle_name' => 'nullable|string|max:255',
            'guest_last_name' => 'nullable|string|max:255',
            'guest_birth_date' => 'nullable|date',
            'guest_gender' => 'nullable|in:Male,Female,Prefer not to say',
            'guest_civil_status' => 'nullable|string|max:255',
            'guest_address' => 'nullable|string|max:255',
            'guest_contact_number' => 'nullable|string|max:255',
            'guest_email' => 'nullable|email|max:255',
            'guest_valid_id_type' => 'nullable|string|max:255',
            'guest_valid_id_image' => 'nullable|string|max:255',
        ]);

        // Generate a unique tracking number.
        //
        // Example:
        // BR-20260808-ABC123
        $validated['tracking_number'] =
            'BR-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));

        // New requests always start with Pending status.
        // The requester does not control this value.
        $validated['status'] = 'Pending';

        // Save the request to the database.
        $barangayRequest = BarangayRequest::create($validated);

        // Return the newly created request.
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
    // Return the requested barangay document request as JSON.
    // Include the related document type and user information.
    // Return a 404 response automatically if the request does not exist.
    $barangayRequest -> load([
            'user',
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
    
        //Update an existing barangay document request.
    // Use UpdateBarangayRequest for validation.
    // Only update fields that are allowed by the BarangayRequest model.
    // Preserve the existing request ID and tracking number.
    // Update the request status, remarks, and verification information when provided.
    // Save the changes to the database.
    // Return a JSON response using the project's success/data API structure.

    UpdateBarangayRequest $request,
    BarangayRequest $barangayRequest
) {
    $validated = $request->validated();

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
        //Delete the specified barangay document request.
    // Use the existing BarangayRequest model instance provided by Laravel route model binding.
    // Return a JSON response indicating that the request was deleted successfully.
    $barangayRequest->delete();

    return response()->json([
        'success' => true,
        'message' => 'Barangay request deleted successfully.',
    ]);
    
    }
}