<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;

class AuditLogController extends Controller
{
    /**
     * Display a listing of all audit logs.
     * Only accessible by admin.
     *
     * GET /api/audit-logs
     */
    public function index()
    {
        $user = auth()->user();

        if (!$user->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Admin can view audit logs.',
            ], 403);
        }

        $logs = AuditLog::with(['user', 'staff'])
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    /**
     * Display a specific audit log entry.
     *
     * GET /api/audit-logs/{auditLog}
     */
    public function show(AuditLog $auditLog)
    {
        $user = auth()->user();

        if (!$user->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Admin can view audit logs.',
            ], 403);
        }

        $auditLog->load(['user', 'staff']);

        return response()->json([
            'success' => true,
            'data' => $auditLog,
        ]);
    }
}
