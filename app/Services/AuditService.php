<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Log an action to the audit_logs table.
     *
     * @param  string  $action       e.g. 'created', 'updated', 'deleted', 'status_changed'
     * @param  Model   $model        The model that was affected
     * @param  string  $description  Human-readable description
     * @param  array   $oldValues    Previous values (for updates)
     * @param  array   $newValues    New values (for updates)
     */
    public static function log(
        string $action,
        Model $model,
        string $description,
        array $oldValues = [],
        array $newValues = []
    ): AuditLog {
        $user = Auth::user();

        return AuditLog::create([
            'user_id' => $user?->user_id,
            'staff_id' => $user?->staff?->staff_id,
            'action' => $action,
            'table_name' => $model->getTable(),
            'record_id' => $model->getKey(),
            'description' => $description,
            'old_values' => $oldValues ?: null,
            'new_values' => $newValues ?: null,
            'ip_address' => Request::ip(),
        ]);
    }

    /**
     * Log a status change — the most common audit event.
     */
    public static function logStatusChange(
        Model $model,
        string $oldStatus,
        string $newStatus
    ): AuditLog {
        $user = Auth::user();
        $userName = $user ? "{$user->first_name} {$user->last_name}" : 'System';
        $table = $model->getTable();
        $id = $model->getKey();

        return self::log(
            'status_changed',
            $model,
            "{$userName} changed {$table} #{$id} status from {$oldStatus} to {$newStatus}",
            ['status' => $oldStatus],
            ['status' => $newStatus]
        );
    }

    /**
     * Send a notification to a specific user.
     */
    public static function notify(
        string $type,
        int $userId,
        string $title,
        string $message,
        ?int $requestId = null,
        ?int $guestRequestId = null
    ): Notification {
        $user = Auth::user();

        return Notification::create([
            'type' => $type,
            'user_id' => $userId,
            'staff_id' => $user?->staff?->staff_id,
            'request_id' => $requestId,
            'guest_request_id' => $guestRequestId,
            'title' => $title,
            'message' => $message,
        ]);
    }

    /**
     * Notify all staff members about an event (e.g., new request submitted).
     */
    public static function notifyAllStaff(
        string $type,
        string $title,
        string $message,
        ?int $requestId = null,
        ?int $guestRequestId = null
    ): void {
        $staffMembers = Staff::with('user')->get();

        foreach ($staffMembers as $staff) {
            Notification::create([
                'type' => $type,
                'user_id' => $staff->user_id,
                'staff_id' => $staff->staff_id,
                'request_id' => $requestId,
                'guest_request_id' => $guestRequestId,
                'title' => $title,
                'message' => $message,
            ]);
        }
    }
}
