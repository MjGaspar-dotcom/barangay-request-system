<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBarangayRequest;
use App\Models\AuditLog;
use App\Models\BarangayRequest;
use App\Models\Notification;
use App\Models\Staff;
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
        'user',
        'documentType',
        'verifier.user',
    ]);

    if ($user->staff || $user->admin) {
        $requests = $query->get();
    } else {
        // Normal users can only see their own requests.
        $requests = $query
            ->where('user_id', $user->user_id)
            ->get();
    }
    $requests->each(fn (BarangayRequest $request) => $this->addGuestPresentationFields($request));

    return response()->json([
        'success' => true,
        'data' => $requests
    ]);
}

public function staffIndex(Request $request)
{
    abort_unless($request->user()->staff()->exists() || $request->user()->admin()->exists(), 403);

    return $this->index();
}

public function track(string $trackingNumber)
{
    $request = BarangayRequest::with('documentType')
        ->where('tracking_number', $trackingNumber)
        ->firstOrFail();

    return response()->json([
        'success' => true,
        'data' => [
            'tracking_number' => $request->tracking_number,
            'document' => $request->documentType?->document_name,
            'status' => $request->status,
            'purpose' => $request->purpose,
            'submitted_at' => $request->created_at,
            'remarks' => $request->remarks,
        ],
    ]);
}

    /**
     * Store a newly created barangay request.
     *
     * POST /api/barangay-requests
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'document_type_id' => 'required|exists:document_types,document_type_id',
            'purpose' => 'required|string',

            // Guest fields
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
            'guest_valid_id_image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
        ]);

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
        AuditLog::create([
            'action' => 'created',
            'table_name' => 'barangay_requests',
            'record_id' => $barangayRequest->request_id,
            'description' => "Request {$barangayRequest->tracking_number} was submitted.",
            'ip_address' => $request->ip(),
        ]);

        foreach (Staff::query()->pluck('staff_id') as $staffId) {
            Notification::create([
                'staff_id' => $staffId,
                'request_id' => $barangayRequest->request_id,
                'title' => 'New document request',
                'message' => "Request {$barangayRequest->tracking_number} is awaiting review.",
            ]);
        }

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
        'user',
        'documentType',
        'verifier.user',
    ]);
    $barangayRequest->setAttribute(
        'request_type',
        $barangayRequest->user_id ? 'registered' : 'guest',
    );
    $this->addGuestPresentationFields($barangayRequest);

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
        abort_unless(
            $request->user()->staff()->exists() || $request->user()->admin()->exists(),
            403,
        );

        $validated = $request->validated();
        $previousStatus = $barangayRequest->status;

        if (isset($validated['status']) && $validated['status'] !== $previousStatus) {
            $staffId = $request->user()->staff?->staff_id;
            if ($staffId) {
                $validated['verified_by'] = $staffId;
            }

            if ($validated['status'] === 'Approved') {
                $validated['approved_at'] = now();
                $validated['verified_at'] = now();
            } elseif ($validated['status'] === 'Ready for Pickup') {
                $validated['ready_for_pickup_at'] = now();
            } elseif ($validated['status'] === 'Completed') {
                $validated['claimed_at'] = now();
            } elseif ($validated['status'] === 'Rejected') {
                $validated['verified_at'] = now();
            }
        }

        $barangayRequest->update($validated);
        if ($previousStatus !== $barangayRequest->status) {
            $this->writeAuditLog(
                $request,
                'status_changed',
                $barangayRequest,
                "Request {$barangayRequest->tracking_number} status changed to {$barangayRequest->status}.",
            );

            if ($barangayRequest->user_id) {
                Notification::create([
                    'user_id' => $barangayRequest->user_id,
                    'request_id' => $barangayRequest->request_id,
                    'title' => 'Request status updated',
                    'message' => "Request {$barangayRequest->tracking_number} is now {$barangayRequest->status}.",
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Barangay request updated successfully.',
            'data' => $barangayRequest->fresh(),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, BarangayRequest $barangayRequest)
    {
        abort_unless(
            $request->user()->staff()->exists() || $request->user()->admin()->exists(),
            403,
        );

        $trackingNumber = $barangayRequest->tracking_number;
        $requestId = $barangayRequest->request_id;
        $this->writeAuditLog(
            $request,
            'deleted',
            $barangayRequest,
            "Request {$trackingNumber} was deleted.",
            $requestId,
        );
        $barangayRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barangay request deleted successfully.',
        ]);
    }

    private function addGuestPresentationFields(BarangayRequest $request): void
    {
        $request->setAttribute('request_type', $request->user_id ? 'registered' : 'guest');

        if ($request->user_id === null) {
            $request->setAttribute('first_name', $request->guest_first_name);
            $request->setAttribute('middle_name', $request->guest_middle_name);
            $request->setAttribute('last_name', $request->guest_last_name);
            $request->setAttribute('birth_date', $request->guest_birth_date);
            $request->setAttribute('gender', $request->guest_gender);
            $request->setAttribute('civil_status', $request->guest_civil_status);
            $request->setAttribute('address', $request->guest_address);
            $request->setAttribute('contact_number', $request->guest_contact_number);
            $request->setAttribute('email', $request->guest_email);
            $request->setAttribute('valid_id_type', $request->guest_valid_id_type);
            $request->setAttribute('valid_id_image', $request->guest_valid_id_image);
        }
    }

    private function writeAuditLog(
        Request $request,
        string $action,
        BarangayRequest $barangayRequest,
        string $description,
        ?int $recordId = null,
    ): void {
        \App\Models\AuditLog::create([
            'staff_id' => $request->user()?->staff?->staff_id,
            'action' => $action,
            'table_name' => 'barangay_requests',
            'record_id' => $recordId ?? $barangayRequest->request_id,
            'description' => $description,
            'ip_address' => $request->ip(),
        ]);
    }
}