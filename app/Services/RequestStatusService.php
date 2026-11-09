<?php

namespace App\Services;

use App\Models\BarangayRequest;
use App\Models\Staff;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RequestStatusService
{
    public const STATUS_PENDING = 'Pending';
    public const STATUS_ADDITIONAL_REQUIREMENTS = 'Additional Requirements';
    public const STATUS_APPROVED = 'Approved';
    public const STATUS_REJECTED = 'Rejected';
    public const STATUS_PROCESSING = 'Processing';
    public const STATUS_READY_FOR_PICKUP = 'Ready for Pickup';
    public const STATUS_COMPLETED = 'Completed';

    public const ALL_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_ADDITIONAL_REQUIREMENTS,
        self::STATUS_APPROVED,
        self::STATUS_REJECTED,
        self::STATUS_PROCESSING,
        self::STATUS_READY_FOR_PICKUP,
        self::STATUS_COMPLETED,
    ];

    private const ALLOWED_TRANSITIONS = [
        self::STATUS_PENDING => [
            self::STATUS_ADDITIONAL_REQUIREMENTS,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
        ],
        self::STATUS_ADDITIONAL_REQUIREMENTS => [],
        self::STATUS_APPROVED => [self::STATUS_PROCESSING],
        self::STATUS_REJECTED => [],
        self::STATUS_PROCESSING => [self::STATUS_READY_FOR_PICKUP],
        self::STATUS_READY_FOR_PICKUP => [self::STATUS_COMPLETED],
        self::STATUS_COMPLETED => [],
    ];

    public static function updateBarangayRequestStatus(
        BarangayRequest $request,
        string $newStatus,
        ?string $remarks = null
    ): BarangayRequest {
        return self::updateBarangayRequestAtomically(
            $request,
            $newStatus,
            [],
            $remarks
        );
    }

    public static function updateBarangayRequestAtomically(
        BarangayRequest $request,
        string $newStatus,
        array $additionalFields = [],
        ?string $remarks = null
    ): BarangayRequest {
        $recipientName = $additionalFields['recipient_name'] ?? null;
        if ($newStatus === self::STATUS_COMPLETED &&
            (!is_string($recipientName) || trim($recipientName) === '')) {
            throw new \InvalidArgumentException(
                'Record the recipient name before completing the request.'
            );
        }

        if ($newStatus !== self::STATUS_COMPLETED && $recipientName !== null) {
            throw new \InvalidArgumentException(
                'A recipient name can only be recorded when completing a released request.'
            );
        }

        return DB::transaction(function () use ($request, $newStatus, $remarks, $recipientName): BarangayRequest {
            $request = BarangayRequest::query()
                ->lockForUpdate()
                ->findOrFail($request->request_id);
            $oldStatus = $request->status;
            self::assertTransitionAllowed($oldStatus, $newStatus);

            if (in_array($newStatus, [
                self::STATUS_APPROVED,
                self::STATUS_ADDITIONAL_REQUIREMENTS,
                self::STATUS_REJECTED,
            ], true)) {
                if (!$request->verified_at) {
                    throw new \InvalidArgumentException(
                        'Verify the resident requirements before making a decision.'
                    );
                }

                if (!is_string($remarks) || trim($remarks) === '') {
                    throw new \InvalidArgumentException(
                        'Administrative remarks are required before making this decision.'
                    );
                }

                if (
                    $newStatus === self::STATUS_APPROVED &&
                    !$request->requirements_complete
                ) {
                    throw new \InvalidArgumentException(
                        'The requirements must be recorded as complete before approval.'
                    );
                }

                if (
                    $newStatus === self::STATUS_ADDITIONAL_REQUIREMENTS &&
                    $request->requirements_complete
                ) {
                    throw new \InvalidArgumentException(
                        'Mark the requirements incomplete before requesting additional documents.'
                    );
                }
            }

            if (
                $newStatus === self::STATUS_READY_FOR_PICKUP &&
                (
                    !$request->document_signed_at ||
                    !$request->prepared_document_id ||
                    !$request->signed_document_id ||
                    !$request->documents()
                        ->whereKey($request->prepared_document_id)
                        ->where('purpose', 'prepared_document')
                        ->exists() ||
                    !$request->documents()
                        ->whereKey($request->signed_document_id)
                        ->where('purpose', 'signed_document')
                        ->exists()
                )
            ) {
                throw new \InvalidArgumentException(
                    'Upload the prepared and authorized signed document before marking this request ready for pickup.'
                );
            }

            $now = now();
            $updateData = ['status' => $newStatus];

            if (
                $remarks !== null &&
                in_array($newStatus, [
                    self::STATUS_APPROVED,
                    self::STATUS_ADDITIONAL_REQUIREMENTS,
                    self::STATUS_REJECTED,
                ], true)
            ) {
                $updateData['remarks'] = trim($remarks);
            }

            if ($newStatus === self::STATUS_APPROVED) {
                $updateData['approved_at'] = $now;
            } elseif ($newStatus === self::STATUS_PROCESSING) {
                $updateData['processing_started_at'] = $now;
                $updateData['processing_by'] = Auth::id();
            } elseif ($newStatus === self::STATUS_READY_FOR_PICKUP) {
                $updateData['ready_for_pickup_at'] = $now;
            } elseif ($newStatus === self::STATUS_COMPLETED) {
                $updateData['claimed_at'] = $now;
                $updateData['release_recipient_name'] = trim($recipientName);
                $updateData['released_by'] = Auth::id();
            }

            $request->update($updateData);
            $auditAction = match ($newStatus) {
                self::STATUS_APPROVED => 'request_approved',
                self::STATUS_ADDITIONAL_REQUIREMENTS =>
                    'additional_requirements_requested',
                self::STATUS_REJECTED => 'request_rejected',
                self::STATUS_PROCESSING => 'processing_started',
                self::STATUS_READY_FOR_PICKUP => 'ready_for_pickup',
                self::STATUS_COMPLETED => 'document_released',
                default => 'status_changed',
            };
            AuditService::logStatusChange(
                $request,
                $oldStatus,
                $newStatus,
                $remarks,
                $auditAction
            );
            NotificationService::requestStatusChanged(
                $request,
                $oldStatus,
                $newStatus,
                $remarks
            );

            return $request->fresh();
        });
    }

    public static function verifyRequirements(
        BarangayRequest $request,
        bool $requirementsComplete
    ): BarangayRequest {
        return DB::transaction(function () use (
            $request,
            $requirementsComplete
        ): BarangayRequest {
            $request = BarangayRequest::query()
                ->lockForUpdate()
                ->findOrFail($request->request_id);
            if ($request->status !== self::STATUS_PENDING) {
                throw new \InvalidArgumentException(
                    'Requirements can only be verified while a request is pending.'
                );
            }

            if ($request->verified_at) {
                throw new \InvalidArgumentException(
                    'Requirements have already been verified for this review.'
                );
            }

            $staff = Auth::user()?->staff;
            $request->update([
                'verified_by' => $staff?->staff_id,
                'verified_at' => now(),
                'requirements_complete' => $requirementsComplete,
            ]);

            AuditService::log(
                'requirements_verified',
                $request,
                'Resident requirements were reviewed and verified.',
                [],
                [
                    'verified_at' => now()->toISOString(),
                    'requirements_complete' => $requirementsComplete,
                ]
            );

            return $request->fresh();
        });
    }

    public static function resubmitRequirements(
        BarangayRequest $request,
        string $notes
    ): BarangayRequest {
        return DB::transaction(function () use ($request, $notes): BarangayRequest {
            $request = BarangayRequest::query()
                ->lockForUpdate()
                ->findOrFail($request->request_id);
            if ($request->status !== self::STATUS_ADDITIONAL_REQUIREMENTS) {
                throw new \InvalidArgumentException(
                    'Additional requirements can only be resubmitted when requested by staff.'
                );
            }

            $oldStatus = $request->status;
            $request->update([
                'status' => self::STATUS_PENDING,
                'remarks' => trim($notes),
                'verified_by' => null,
                'verified_at' => null,
                'requirements_complete' => false,
            ]);

            AuditService::logStatusChange(
                $request,
                $oldStatus,
                self::STATUS_PENDING,
                $notes,
                'requirements_resubmitted'
            );
            NotificationService::requestStatusChanged(
                $request,
                $oldStatus,
                self::STATUS_PENDING,
                $notes
            );
            AuditService::notifyAllStaff(
                'requirements_resubmitted',
                'Additional Requirements Submitted',
                "The resident submitted additional requirements for request {$request->tracking_number}.",
                $request->request_id
            );

            return $request->fresh();
        });
    }

    public static function markDocumentPrepared(BarangayRequest $request): BarangayRequest
    {
        return DB::transaction(function () use ($request): BarangayRequest {
            $request = BarangayRequest::query()
                ->lockForUpdate()
                ->findOrFail($request->request_id);
            if ($request->status !== self::STATUS_PROCESSING) {
                throw new \InvalidArgumentException(
                    'A document can only be prepared while the request is processing.'
                );
            }

            $request->update([
                'document_prepared_at' => now(),
                'document_prepared_by' => Auth::id(),
                'document_signed_at' => null,
                'document_signed_by' => null,
                'prepared_document_id' => $request->documents()
                    ->where('purpose', 'prepared_document')
                    ->orderByDesc('request_document_id')
                    ->value('request_document_id'),
                'signed_document_id' => null,
            ]);

            AuditService::log(
                'document_prepared',
                $request,
                'A prepared document was uploaded for review.'
            );

            return $request->fresh();
        });
    }

    public static function authorizeDocument(BarangayRequest $request): BarangayRequest
    {
        return DB::transaction(function () use ($request): BarangayRequest {
            $request = BarangayRequest::query()
                ->lockForUpdate()
                ->findOrFail($request->request_id);
            if ($request->status !== self::STATUS_PROCESSING) {
                throw new \InvalidArgumentException(
                    'A document can only be authorized while the request is processing.'
                );
            }

            if (
                !$request->document_prepared_at ||
                !$request->prepared_document_id ||
                !$request->documents()
                    ->whereKey($request->prepared_document_id)
                    ->where('purpose', 'prepared_document')
                    ->exists()
            ) {
                throw new \InvalidArgumentException(
                    'Upload and review the prepared document before authorization.'
                );
            }

            if ($request->document_signed_at) {
                throw new \InvalidArgumentException(
                    'This document has already been authorized.'
                );
            }

            $signedDocumentId = $request->documents()
                ->where('purpose', 'signed_document')
                ->orderByDesc('request_document_id')
                ->value('request_document_id');
            if (!$signedDocumentId) {
                throw new \InvalidArgumentException(
                    'Upload the signed document as part of the authorization action.'
                );
            }

            $request->update([
                'document_signed_at' => now(),
                'document_signed_by' => Auth::id(),
                'signed_document_id' => $signedDocumentId,
            ]);

            AuditService::log(
                'document_authorized',
                $request,
                'An administrator authorized and uploaded the signed document.'
            );

            return $request->fresh();
        });
    }

    public static function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::ALLOWED_TRANSITIONS[$from] ?? [], true);
    }

    public static function nextAllowedStatuses(string $current): array
    {
        return self::ALLOWED_TRANSITIONS[$current] ?? [];
    }

    private static function assertTransitionAllowed(string $from, string $to): void
    {
        if (!in_array($to, self::ALL_STATUSES, true)) {
            throw new \InvalidArgumentException(
                'Unknown request status. Allowed: ' . implode(', ', self::ALL_STATUSES)
            );
        }

        if (!self::canTransition($from, $to)) {
            throw new \InvalidArgumentException(
                "Invalid status transition from \"{$from}\" to \"{$to}\"."
            );
        }
    }

    public static function currentStaff(): ?Staff
    {
        return Auth::user()?->staff;
    }

    public static function isFinalStatus(string $status): bool
    {
        return empty(self::ALLOWED_TRANSITIONS[$status] ?? []);
    }
}
