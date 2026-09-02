<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Staff;
use App\Models\BarangayRequest;
use App\Models\GuestRequest;
use Illuminate\Support\Facades\Auth;

class StaffController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Only Admin users can view the staff list.
        if (!$user->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.'
            ], 403);
        }

        $staff = Staff::with([
            'user',
            'admin'
        ])->get();

        return response()->json([
            'success' => true,
            'data' => $staff
        ]);
    }

    public function allRequests()
    {
        $user = Auth::user();

        // Only Staff and Admin can access all requests
        if (!$user->staff && !$user->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.'
            ], 403);
        }

        $registeredRequests = BarangayRequest::with([
            'user',
            'documentType',
            'verifier'
        ])
            ->get()
            ->map(function ($request) {
                return [
                    'request_id' => $request->request_id,
                    'request_type' => 'registered',
                    'tracking_number' => $request->tracking_number,
                    'status' => $request->status,
                    'purpose' => $request->purpose,
                    'remarks' => $request->remarks,
                    'user' => $request->user,
                    'document_type' => $request->documentType,
                    'verified_by' => $request->verifier,
                    'verified_at' => $request->verified_at,
                    'approved_at' => $request->approved_at,
                    'ready_for_pickup_at' => $request->ready_for_pickup_at,
                    'claimed_at' => $request->claimed_at,
                    'created_at' => $request->created_at,
                    'updated_at' => $request->updated_at,
                ];
            });

        $guestRequests = GuestRequest::with([
            'documentType',
            'verifier'
        ])
            ->get()
            ->map(function ($request) {
                return [
                    'request_id' => $request->guest_request_id,
                    'request_type' => 'guest',
                    'tracking_number' => $request->tracking_number,
                    'status' => $request->status,
                    'purpose' => $request->purpose,
                    'remarks' => $request->remarks,
                    'guest' => $request,
                    'document_type' => $request->documentType,
                    'verified_by' => $request->verifier,
                    'verified_at' => $request->verified_at,
                    'approved_at' => $request->approved_at,
                    'ready_for_pickup_at' => $request->ready_for_pickup_at,
                    'claimed_at' => $request->claimed_at,
                    'created_at' => $request->created_at,
                    'updated_at' => $request->updated_at,
                ];
            });

        $requests = $registeredRequests
            ->concat($guestRequests)
            ->sortByDesc('created_at')
            ->values();

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }
}
