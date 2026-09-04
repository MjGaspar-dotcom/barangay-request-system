<?php

namespace App\Services;

use App\Models\BarangayRequest;
use App\Models\GuestRequest;
use App\Models\Staff;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RequestStatusService
{
    /*
    |--------------------------------------------------------------------------
    | Status Constants
    |--------------------------------------------------------------------------
    |
    | These match the ENUM values stored in the database. The casing is
    | Title Case (e.g. "Pending", "Ready for Pickup") — keep them identical
    | to the migration files.
    |
    */

    public const STATUS_PENDING = 'Pending';
    public const STATUS_APPROVED = 'Approved';
    public const STATUS_PROCESSING = 'Processing';
    public const STATUS_READY_FOR_PICKUP = 'Ready for Pickup';
    public const STATUS_REJECTED = 'Rejected';
    public const STATUS_COMPLETED = 'Completed';

    /**
     * Every status the system supports.
     */
    public const ALL_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_APPROVED,
        self::STATUS_PROCESSING,
        self::STATUS_READY_FOR_PICKUP,
        self::STATUS_REJECTED,
        self::STATUS_COMPLETED,
    ];

    /**
     * Allowed status transitions for both BarangayRequest and GuestRequest.
     *
     * Workflow:
     *   Pending → Approved → Processing → Ready for Pickup → Completed
     *   Pending can also be Rejected.
     *   Rejected and Completed are final — no further changes allowed.
     *   Note: Approved cannot be Rejected (must go through Processing first).
     */
    private const ALLOWED_TRANSITIONS = [
        self::STATUS_PENDING => [
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
        ],
        self::STATUS_APPROVED => [
            self::STATUS_PROCESSING,
        ],
        self::STATUS_PROCESSING => [
            self::STATUS_READY_FOR_PICKUP,
        ],
        self::STATUS_READY_FOR_PICKUP => [
            self::STATUS_COMPLETED,
        ],
        self::STATUS_REJECTED => [],
        self::STATUS_COMPLETED => [],
    ];


    /*
    |--------------------------------------------------------------------------
    | Status Update Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Update a BarangayRequest's status.
     *
     * Handles validation, timestamp updates, audit logging, and
     * notification in a single database transaction.
     *
     * @param  BarangayRequest  $request
     * @param  string           $newStatus
     * @param  string|null      $remarks  Optional remarks to save with the change.
     * @return BarangayRequest            The updated request.
     *
     * @throws \InvalidArgumentException  When the transition is invalid.
     */
    public static function updateBarangayRequestStatus(
        BarangayRequest $request,
        string $newStatus,
        ?string $remarks = null
    ): BarangayRequest {
        $oldStatus = $request->status;

        self::assertTransitionAllowed($oldStatus, $newStatus);

        return DB::transaction(function () use ($request, $oldStatus, $newStatus, $remarks) {

            $updateData = ['status' => $newStatus];

            // Save remarks if provided.
            if ($remarks !== null) {
                $updateData['remarks'] = $remarks;
            }

            // Auto-set the relevant timestamp fields.
            $updateData = array_merge(
                $updateData,
                self::timestampsFor($newStatus)
            );

            $request->update($updateData);

            // Audit log.
            AuditService::logStatusChange($request, $oldStatus, $newStatus);

            // Notify the request owner (the registered user).
            NotificationService::requestStatusChanged(
                $request,
                $oldStatus,
                $newStatus
            );

            return $request->fresh();
        });
    }

    /**
     * Update a GuestRequest's status.
     *
     * Guest requests have no registered user, so the notification is
     * sent to all staff members instead of an individual user.
     *
     * @param  GuestRequest  $request
     * @param  string        $newStatus
     * @param  string|null   $remarks
     * @return GuestRequest  The updated request.
     *
     * @throws \InvalidArgumentException  When the transition is invalid.
     */
    public static function updateGuestRequestStatus(
        GuestRequest $request,
        string $newStatus,
        ?string $remarks = null
    ): GuestRequest {
        $oldStatus = $request->status;

        self::assertTransitionAllowed($oldStatus, $newStatus);

        return DB::transaction(function () use ($request, $oldStatus, $newStatus, $remarks) {

            $updateData = ['status' => $newStatus];

            if ($remarks !== null) {
                $updateData['remarks'] = $remarks;
            }

            $updateData = array_merge(
                $updateData,
                self::timestampsFor($newStatus)
            );

            $request->update($updateData);

            // Audit log.
            AuditService::logStatusChange($request, $oldStatus, $newStatus);

            // Notify all staff — guests don't have accounts.
            NotificationService::guestRequestStatusChanged(
                $request,
                $oldStatus,
                $newStatus
            );

            return $request->fresh();
        });
    }


    /*
    |--------------------------------------------------------------------------
    | Atomic Combined Update
    |--------------------------------------------------------------------------
    */

    /**
     * Atomically update a BarangayRequest's status AND any additional fields
     * in a single database transaction.
     *
     * Use this when the API call combines a status change with other field
     * updates — so either everything succeeds, or nothing does.
     *
     * The status-transition rules (validation, audit, notification) remain
     * owned by RequestStatusService — no logic is duplicated in the controller.
     *
     * @param  BarangayRequest  $request
     * @param  string           $newStatus
     * @param  array            $additionalFields  Non-status fields to update.
     *                                            'status' and 'remarks' are ignored here.
     * @param  string|null      $remarks
     * @return BarangayRequest
     *
     * @throws \InvalidArgumentException  When the transition is invalid.
     */
    public static function updateBarangayRequestAtomically(
        BarangayRequest $request,
        string $newStatus,
        array $additionalFields = [],
        ?string $remarks = null
    ): BarangayRequest {
        $oldStatus = $request->status;

        self::assertTransitionAllowed($oldStatus, $newStatus);

        return DB::transaction(function () use ($request, $oldStatus, $newStatus, $additionalFields, $remarks) {

            $updateData = ['status' => $newStatus];

            if ($remarks !== null) {
                $updateData['remarks'] = $remarks;
            }

            $updateData = array_merge(
                $updateData,
                self::timestampsFor($newStatus)
            );

            $request->update($updateData);

            // Apply additional (non-status) fields inside the same transaction.
            $extras = array_diff_key(
                $additionalFields,
                array_flip(['status', 'remarks', 'approved_at', 'ready_for_pickup_at', 'claimed_at'])
            );
            if (!empty($extras)) {
                $request->update($extras);
            }

            // Audit log.
            AuditService::logStatusChange($request, $oldStatus, $newStatus);

            // Notify the request owner.
            NotificationService::requestStatusChanged(
                $request,
                $oldStatus,
                $newStatus
            );

            return $request->fresh();
        });
    }

    /**
     * Atomically update a GuestRequest's status AND any additional fields
     * in a single database transaction.
     *
     * @param  GuestRequest  $request
     * @param  string        $newStatus
     * @param  array         $additionalFields
     * @param  string|null   $remarks
     * @return GuestRequest
     *
     * @throws \InvalidArgumentException  When the transition is invalid.
     */
    public static function updateGuestRequestAtomically(
        GuestRequest $request,
        string $newStatus,
        array $additionalFields = [],
        ?string $remarks = null
    ): GuestRequest {
        $oldStatus = $request->status;

        self::assertTransitionAllowed($oldStatus, $newStatus);

        return DB::transaction(function () use ($request, $oldStatus, $newStatus, $additionalFields, $remarks) {

            $updateData = ['status' => $newStatus];

            if ($remarks !== null) {
                $updateData['remarks'] = $remarks;
            }

            $updateData = array_merge(
                $updateData,
                self::timestampsFor($newStatus)
            );

            $request->update($updateData);

            $extras = array_diff_key(
                $additionalFields,
                array_flip(['status', 'remarks', 'approved_at', 'ready_for_pickup_at', 'claimed_at'])
            );
            if (!empty($extras)) {
                $request->update($extras);
            }

            // Audit log.
            AuditService::logStatusChange($request, $oldStatus, $newStatus);

            // Notify all staff.
            NotificationService::guestRequestStatusChanged(
                $request,
                $oldStatus,
                $newStatus
            );

            return $request->fresh();
        });
    }


    /*
    |--------------------------------------------------------------------------
    | Validation Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Check if a transition from one status to another is allowed.
     */
    public static function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::ALLOWED_TRANSITIONS[$from] ?? [], true);
    }

    /**
     * Get all statuses the system allows from a given current status.
     *
     * Useful for rendering "next step" buttons in the UI.
     */
    public static function nextAllowedStatuses(string $current): array
    {
        return self::ALLOWED_TRANSITIONS[$current] ?? [];
    }

    /**
     * Throw an exception if the transition is not allowed.
     *
     * @throws \InvalidArgumentException
     */
    private static function assertTransitionAllowed(string $from, string $to): void
    {
        if (!in_array($to, self::ALL_STATUSES, true)) {
            throw new \InvalidArgumentException(
                "Unknown status: \"{$to}\". Allowed: " . implode(', ', self::ALL_STATUSES)
            );
        }

        if ($from === $to) {
            throw new \InvalidArgumentException(
                "Request is already \"{$from}\". No change needed."
            );
        }

        if (!self::canTransition($from, $to)) {
            $allowed = self::nextAllowedStatuses($from);
            $hint = empty($allowed)
                ? "\"{$from}\" is a final status and cannot be changed."
                : "Allowed next statuses from \"{$from}\": " . implode(', ', $allowed) . '.';

            throw new \InvalidArgumentException(
                "Invalid status transition from \"{$from}\" to \"{$to}\". {$hint}"
            );
        }
    }

    /**
     * Return the timestamp fields that should be auto-set for a given status.
     *
     * @return array<string, \Illuminate\Support\Carbon>
     */
    private static function timestampsFor(string $newStatus): array
    {
        $now = now();

        return match ($newStatus) {
            self::STATUS_APPROVED => ['approved_at' => $now],
            self::STATUS_READY_FOR_PICKUP => ['ready_for_pickup_at' => $now],
            self::STATUS_COMPLETED => ['claimed_at' => $now],
            default => [],
        };
    }


    /*
    |--------------------------------------------------------------------------
    | Convenience Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Get the current staff member processing the request (if any).
     */
    public static function currentStaff(): ?Staff
    {
        $user = Auth::user();

        return $user?->staff;
    }

    /**
     * Check whether a status is a "final" status (no further transitions).
     */
    public static function isFinalStatus(string $status): bool
    {
        return empty(self::ALLOWED_TRANSITIONS[$status] ?? []);
    }
}
