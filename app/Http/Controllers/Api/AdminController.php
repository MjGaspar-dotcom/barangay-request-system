<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\BarangayRequest;
use App\Models\GuestRequest;
use App\Models\DocumentType;
use App\Models\Staff;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * GET /api/admin/stats
     *
     * Aggregate numbers used on the admin dashboard.
     */
    public function stats(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if (!$user->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access only.'
            ], 403);
        }

        $pendingRequests = BarangayRequest::where('status', 'Pending')->count();
        $completedRequests = BarangayRequest::where('status', 'Completed')->count();
        $guestPending = GuestRequest::where('status', 'Pending')->count();
        $guestCompleted = GuestRequest::where('status', 'Completed')->count();

        $registeredResidents = User::whereDoesntHave('admin')
            ->whereDoesntHave('staff')
            ->count();

        $verifiedResidents = User::where('verification_status', 'verified')
            ->whereDoesntHave('admin')
            ->whereDoesntHave('staff')
            ->count();

        $pendingVerifications = User::where('verification_status', 'pending')
            ->whereDoesntHave('admin')
            ->whereDoesntHave('staff')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => User::count(),
                'total_residents' => $registeredResidents,
                'verified_residents' => $verifiedResidents,
                'pending_verifications' => $pendingVerifications,
                'total_staff' => Staff::count(),
                'pending_requests' => $pendingRequests,
                'completed_requests' => $completedRequests,
                'guest_pending' => $guestPending,
                'guest_completed' => $guestCompleted,
                'document_types' => DocumentType::count(),
                'active_document_types' => DocumentType::where('is_active', true)->count(),
                'total_registered_requests' => BarangayRequest::count(),
                'total_guest_requests' => GuestRequest::count(),
                'total_audit_logs' => AuditLog::count(),
            ]
        ]);
    }
}
