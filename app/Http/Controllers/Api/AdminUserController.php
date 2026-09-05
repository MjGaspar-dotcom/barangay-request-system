<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserVerificationRequest;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminUserController extends Controller
{
    /**
     * GET /api/admin/users
     *
     * Returns every user account along with their role information
     * (admin / staff / plain user) and the number of requests
     * each user has submitted.
     */
    public function index(Request $request)
    {
        $admin = $request->user();

        if (!$admin || !$admin->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access only.',
            ], 403);
        }

        $users = User::withCount([
            'requests as total_requests',
        ])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (User $user) {
                $role = 'user';

                if ($user->admin) {
                    $role = 'admin';
                } elseif ($user->staff) {
                    $role = 'staff';
                }

                return [
                    'user_id' => $user->user_id,
                    'username' => $user->username,
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'contact_number' => $user->contact_number,
                    'address' => $user->address,
                    'gender' => $user->gender,
                    'civil_status' => $user->civil_status,
                    'birth_date' => optional($user->birth_date)->format('Y-m-d'),
                    'verification_status' => $user->verification_status,
                    'valid_id_type' => $user->valid_id_type,
                    'valid_id_front' => $user->valid_id_front,
                    'valid_id_back' => $user->valid_id_back,
                    'role' => $role,
                    'total_requests' => (int) ($user->total_requests ?? 0),
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * GET /api/admin/users/{user}
     */
    public function show(Request $request, User $user)
    {
        $admin = $request->user();

        if (!$admin || !$admin->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access only.',
            ], 403);
        }

        $user->loadCount('requests as total_requests');

        $role = 'user';
        if ($user->admin) {
            $role = 'admin';
        } elseif ($user->staff) {
            $role = 'staff';
        }

        $payload = $user->toArray();
        $payload['role'] = $role;
        $payload['total_requests'] = (int) ($user->total_requests ?? 0);

        return response()->json([
            'success' => true,
            'data' => $payload,
        ]);
    }

    /**
     * PATCH /api/admin/users/{user}/verification
     *
     * Updates the verification_status (pending / verified / rejected)
     * of a resident account and writes an audit log.
     */
    public function updateVerification(
        UpdateUserVerificationRequest $request,
        User $user
    ) {
        $admin = $request->user();

        if (!$admin || !$admin->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access only.',
            ], 403);
        }

        // Admins and staff accounts don't carry a verification status.
        if ($user->admin || $user->staff) {
            return response()->json([
                'success' => false,
                'message' => 'Verification status only applies to resident accounts.',
            ], 422);
        }

        $oldStatus = $user->verification_status;
        $newStatus = $request->validated()['verification_status'];

        if ($oldStatus === $newStatus) {
            return response()->json([
                'success' => true,
                'message' => 'Verification status is already up to date.',
                'data' => $user->fresh(),
            ]);
        }

        DB::transaction(function () use ($user, $oldStatus, $newStatus, $admin) {
            $user->update(['verification_status' => $newStatus]);

            AuditService::log(
                'verification_updated',
                $user,
                "{$admin->first_name} {$admin->last_name} changed verification status from \"{$oldStatus}\" to \"{$newStatus}\".",
                ['verification_status' => $oldStatus],
                ['verification_status' => $newStatus]
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Verification status updated successfully.',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * DELETE /api/admin/users/{user}
     *
     * Removes a resident account. Admins and staff cannot be deleted
     * through this endpoint to prevent lockout.
     */
    public function destroy(Request $request, User $user)
    {
        $admin = $request->user();

        if (!$admin || !$admin->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access only.',
            ], 403);
        }

        if ($user->user_id === $admin->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete the account you are currently signed in to.',
            ], 422);
        }

        if ($user->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin accounts cannot be deleted through this endpoint.',
            ], 422);
        }

        if ($user->staff) {
            return response()->json([
                'success' => false,
                'message' => 'Remove the staff assignment before deleting this account.',
            ], 422);
        }

        $userName = "{$user->first_name} {$user->last_name}";

        AuditService::log(
            'deleted',
            $user,
            "Admin {$admin->first_name} {$admin->last_name} deleted resident account \"{$userName}\" (Username: {$user->username})."
        );

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Resident account deleted successfully.',
        ]);
    }

    /**
     * GET /api/admin/recent-activity
     *
     * Returns the most recent audit log entries, optionally filtered
     * by action type. Used by the admin dashboard's "Recent Activity"
     * section and the dedicated Recent Activity page.
     */
    public function recentActivity(Request $request)
    {
        $admin = $request->user();

        if (!$admin || !$admin->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access only.',
            ], 403);
        }

        $perPage = (int) $request->query('per_page', 25);
        $perPage = max(5, min($perPage, 100));

        $action = $request->query('action');

        $query = AuditLog::with(['user', 'staff.user'])
            ->orderByDesc('created_at');

        if ($action) {
            $query->where('action', $action);
        }

        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}
