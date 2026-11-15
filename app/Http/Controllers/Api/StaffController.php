<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use App\Models\AuditLog;
use App\Models\DocumentType;
use App\Models\Staff;
use App\Models\BarangayRequest;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class StaffController extends Controller
{
    public function dashboardStats()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_registered_requests' => BarangayRequest::count(),
                'total_residents' => User::whereDoesntHave('admin')
                    ->whereDoesntHave('staff')
                    ->count(),
                'total_staff' => Staff::count(),
                'active_document_types' => DocumentType::where('is_active', true)
                    ->count(),
                'total_audit_logs' => AuditLog::count(),
            ],
        ]);
    }

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
        $requests = BarangayRequest::with([
            'user',
            'documentType',
            'verifier',
            'workflowMigrationIssue',
        ])
            ->get()
            ->map(function ($request) {
                return [
                    'request_id'          => $request->request_id,
                    'tracking_number'     => $request->tracking_number,
                    'status'              => $request->status,
                    'purpose'             => $request->purpose,
                    'remarks'             => $request->remarks,
                    'rejection_reason'    => $request->rejection_reason,
                    'decision_by'         => $request->decision_by,
                    'decision_at'         => $request->decision_at,
                    'document_prepared_at'=> $request->document_prepared_at,
                    'prepared_document_id'=> $request->prepared_document_id,
                    'workflow_migration_issue' => $request->workflowMigrationIssue,
                    'user'                => $request->user,
                    'document_type'       => $request->documentType,
                    'verified_by'         => $request->verifier,
                    'verified_at'         => $request->verified_at,
                    'approved_at'         => $request->approved_at,
                    'ready_for_pickup_at' => $request->ready_for_pickup_at,
                    'claimed_at'          => $request->claimed_at,
                    'created_at'          => $request->created_at,
                    'updated_at'          => $request->updated_at,
                ];
            })
            ->sortByDesc('created_at')
            ->values();

        return response()->json([
            'success' => true,
            'data'    => $requests,
        ]);
    }
}
