<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStaffRequest;
use App\Models\Staff;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminStaffController extends Controller
{
    /**
     * GET /api/admin/staff
     *
     * Returns every staff account. Admin-only.
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

        $staff = Staff::with(['user', 'admin.user'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Staff $member) {
                $assignedBy = null;

                if ($member->admin && $member->admin->user) {
                    $assignedBy = "{$member->admin->user->first_name} {$member->admin->user->last_name}";
                }

                return [
                    'staff_id' => $member->staff_id,
                    'user_id' => $member->user_id,
                    'assigned_by' => $member->assigned_by,
                    'assigned_by_name' => $assignedBy,
                    'created_at' => $member->created_at,
                    'user' => $member->user,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $staff,
        ]);
    }

    /**
     * POST /api/admin/staff
     *
     * Creates a new staff account by inserting a User and a Staff
     * record in a single transaction. The new account is assigned
     * to the currently logged-in admin.
     */
    public function store(StoreStaffRequest $request)
    {
        $admin = $request->user();

        $validated = $request->validated();

        [$user, $staff] = DB::transaction(function () use ($validated, $admin) {
            $user = User::create([
                'username' => $validated['username'],
                'password' => Hash::make($validated['password']),
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'birth_date' => $validated['birth_date'],
                'gender' => $validated['gender'],
                'civil_status' => $validated['civil_status'],
                'address' => $validated['address'],
                'contact_number' => $validated['contact_number'],
                'email' => $validated['email'],
                'verification_status' => 'verified',
            ]);

            $staff = Staff::create([
                'user_id' => $user->user_id,
                'assigned_by' => $admin->admin->admin_id,
            ]);

            AuditService::log(
                'created',
                $staff,
                "Admin {$admin->first_name} {$admin->last_name} created a new staff account for {$user->first_name} {$user->last_name} (Username: {$user->username})."
            );

            return [$user, $staff];
        });

        $staff->load(['user', 'admin.user']);

        return response()->json([
            'success' => true,
            'message' => 'Staff account created successfully.',
            'data' => [
                'staff_id' => $staff->staff_id,
                'user_id' => $user->user_id,
                'user' => $user,
                'assigned_by' => $admin->admin->admin_id,
            ],
        ], 201);
    }

    /**
     * DELETE /api/admin/staff/{staff}
     *
     * Removes a staff record AND the underlying user account.
     * Cascades through the foreign-key constraints configured in
     * the staff and users migrations.
     */
    public function destroy(Request $request, Staff $staff)
    {
        $admin = $request->user();

        if (!$admin || !$admin->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access only.',
            ], 403);
        }

        $user = $staff->user;
        $userName = $user
            ? "{$user->first_name} {$user->last_name}"
            : 'Unknown';
        $username = $user?->username ?? 'N/A';

        AuditService::log(
            'deleted',
            $staff,
            "Admin {$admin->first_name} {$admin->last_name} removed staff account for {$userName} (Username: {$username})."
        );

        DB::transaction(function () use ($staff, $user) {
            // Removing the staff record leaves the user in place;
            // deleting the user cascades the staff record via FK.
            if ($user) {
                $user->delete();
            } else {
                $staff->delete();
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Staff account removed successfully.',
        ]);
    }
}
