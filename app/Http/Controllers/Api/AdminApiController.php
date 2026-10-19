<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BarangayRequest;
use App\Models\DocumentType;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminApiController extends Controller
{
    public function stats(Request $request)
    {
        abort_unless($request->user()->admin()->exists(), 403);

        $requests = BarangayRequest::query();

        return response()->json([
            'success' => true,
            'data' => [
                'total_registered_requests' => (clone $requests)->whereNotNull('user_id')->count(),
                'total_guest_requests' => (clone $requests)->whereNull('user_id')->count(),
                'total_residents' => User::whereDoesntHave('staff')
                    ->whereDoesntHave('admin')
                    ->count(),
                'total_staff' => Staff::count(),
                'active_document_types' => DocumentType::where('is_active', true)->count(),
                'total_audit_logs' => AuditLog::count(),
                'completed_requests' => (clone $requests)
                    ->whereNotNull('user_id')
                    ->where('status', 'Completed')
                    ->count(),
                'guest_completed' => (clone $requests)
                    ->whereNull('user_id')
                    ->where('status', 'Completed')
                    ->count(),
                'pending_requests' => (clone $requests)
                    ->whereNotNull('user_id')
                    ->whereIn('status', ['Pending', 'Approved'])
                    ->count(),
                'guest_pending' => (clone $requests)
                    ->whereNull('user_id')
                    ->whereIn('status', ['Pending', 'Approved'])
                    ->count(),
            ],
        ]);
    }

    public function users(Request $request)
    {
        abort_unless($request->user()->admin()->exists(), 403);

        $users = User::withCount('requests')
            ->with(['staff', 'admin'])
            ->latest()
            ->get()
            ->map(function (User $user) {
                $user->role = $user->admin
                    ? 'admin'
                    : ($user->staff ? 'staff' : 'user');
                $user->total_requests = $user->requests_count;
                unset($user->staff, $user->admin, $user->requests_count);

                return $user;
            });

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function updateVerification(Request $request, User $user)
    {
        abort_unless($request->user()->admin()->exists(), 403);
        abort_if($user->staff()->exists() || $user->admin()->exists(), 422, 'Only resident accounts can be verified.');

        $validated = $request->validate([
            'verification_status' => ['required', Rule::in(['pending', 'verified', 'rejected'])],
        ]);

        $user->update($validated);

        $this->writeAuditLog(
            $request,
            'verification_updated',
            'users',
            $user->user_id,
            "Verification status for {$user->username} set to {$validated['verification_status']}.",
        );

        return response()->json([
            'success' => true,
            'message' => 'Verification status updated.',
            'data' => $user->fresh(),
        ]);
    }

    public function deleteUser(Request $request, User $user)
    {
        abort_unless($request->user()->admin()->exists(), 403);
        abort_if(
            $user->user_id === $request->user()->user_id ||
                $user->staff()->exists() ||
                $user->admin()->exists(),
            422,
            'Only resident accounts other than the current administrator can be deleted.',
        );

        $userId = $user->user_id;
        $username = $user->username;

        DB::transaction(function () use ($user) {
            $user->delete();
        });

        $this->writeAuditLog(
            $request,
            'deleted',
            'users',
            $userId,
            "Resident account {$username} was deleted.",
        );

        return response()->json([
            'success' => true,
            'message' => 'User account deleted.',
        ]);
    }

    public function createStaff(Request $request)
    {
        $admin = $request->user()->admin;
        abort_unless($admin, 403);

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'birth_date' => ['required', 'date'],
            'gender' => ['required', 'string', 'max:255'],
            'civil_status' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        ]);

        $staff = DB::transaction(function () use ($validated, $admin) {
            $user = User::create([
                ...$validated,
                'password' => Hash::make($validated['password']),
                'verification_status' => 'verified',
                'valid_id_type' => null,
                'valid_id_front' => null,
            ]);

            return Staff::create([
                'user_id' => $user->user_id,
                'assigned_by' => $admin->admin_id,
            ])->load(['user', 'admin.user']);
        });

        $this->writeAuditLog(
            $request,
            'created',
            'staff',
            $staff->staff_id,
            "Staff account for {$staff->user->first_name} {$staff->user->last_name} was created.",
        );

        return response()->json([
            'success' => true,
            'message' => 'Staff account created.',
            'data' => $staff,
        ], 201);
    }

    public function deleteStaff(Request $request, Staff $staff)
    {
        abort_unless($request->user()->admin()->exists(), 403);

        $staffId = $staff->staff_id;
        $user = $staff->user;
        $staffName = trim(($user?->first_name ?? '') . ' ' . ($user?->last_name ?? ''));

        DB::transaction(function () use ($staff, $user) {
            $staff->delete();
            $user?->delete();
        });

        $this->writeAuditLog(
            $request,
            'deleted',
            'staff',
            $staffId,
            "Staff account for {$staffName} was deleted.",
        );

        return response()->json([
            'success' => true,
            'message' => 'Staff account deleted.',
        ]);
    }

    public function recentActivity(Request $request)
    {
        abort_unless($request->user()->admin()->exists(), 403);

        $query = AuditLog::with('staff.user')->latest();
        if ($request->filled('action') && $request->input('action') !== 'all') {
            $query->where('action', $request->input('action'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->paginate($request->integer('per_page', 25)),
        ]);
    }

    private function writeAuditLog(
        Request $request,
        string $action,
        string $table,
        int $recordId,
        string $description,
    ): void {
        AuditLog::create([
            'staff_id' => $request->user()->staff?->staff_id,
            'action' => $action,
            'table_name' => $table,
            'record_id' => $recordId,
            'description' => $description,
            'ip_address' => $request->ip(),
        ]);
    }
}
