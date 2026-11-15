<?php

namespace App\Services;

use App\Models\BarangayRequest;
use App\Models\AuditLog;
use App\Models\Staff;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RequestStatusService
{
    public const STATUS_REQUEST_SUBMITTED = 'request_submitted';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_READY_FOR_PICKUP = 'ready_for_pickup';
    public const STATUS_COMPLETED = 'completed';

    public const REJECTION_REASONS = [
        'Incomplete Requirements',
        'Invalid or Incorrect Information',
        'Unverified Residency',
        'Duplicate Request',
        'Document Requirements Not Met',
        'Other',
    ];

    public const ALL_STATUSES = [
        self::STATUS_REQUEST_SUBMITTED,
        self::STATUS_APPROVED,
        self::STATUS_REJECTED,
        self::STATUS_READY_FOR_PICKUP,
        self::STATUS_COMPLETED,
    ];

    private const ALLOWED_TRANSITIONS = [
        self::STATUS_REQUEST_SUBMITTED => [
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
        ],
        self::STATUS_APPROVED => [self::STATUS_READY_FOR_PICKUP],
        self::STATUS_REJECTED => [],
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
        $rejectionReason = $additionalFields['rejection_reason'] ?? null;
        $rejectionOther = $additionalFields['rejection_other'] ?? null;

        return DB::transaction(function () use (
            $request,
            $newStatus,
            $remarks,
            $recipientName,
            $rejectionReason,
            $rejectionOther
        ): BarangayRequest {
            $request = BarangayRequest::query()
                ->lockForUpdate()
                ->findOrFail($request->request_id);
            $oldStatus = $request->status;

            if ($newStatus === self::STATUS_APPROVED) {
                self::assertTransitionAllowed($oldStatus, $newStatus);

                self::assertResidentIdVerified($request);

                $now = now();
                $request->update([
                    'status' => self::STATUS_APPROVED,
                    'approved_at' => $now,
                    'decision_by' => Auth::id(),
                    'decision_at' => $now,
                    'remarks' => $remarks !== null ? trim($remarks) : null,
                    'rejection_reason' => null,
                    'rejection_other' => null,
                ]);

                AuditService::log(
                    'request_approved',
                    $request,
                    'Request approved and awaiting official document generation.',
                    ['status' => $oldStatus],
                    [
                        'decision' => self::STATUS_APPROVED,
                        'status' => self::STATUS_APPROVED,
                        'remarks' => $remarks !== null ? trim($remarks) : null,
                        'decision_by' => Auth::id(),
                        'decision_at' => $now->toISOString(),
                    ]
                );
                NotificationService::requestStatusChanged(
                    $request,
                    $oldStatus,
                    self::STATUS_APPROVED,
                    $remarks
                );

                return $request->fresh();
            }

            if ($newStatus === self::STATUS_REJECTED) {
                self::assertTransitionAllowed($oldStatus, $newStatus);

                if (!in_array($rejectionReason, self::REJECTION_REASONS, true)) {
                    throw new \InvalidArgumentException(
                        'Select a valid reason for rejecting this request.'
                    );
                }

                if (
                    $rejectionReason === 'Other' &&
                    (!is_string($rejectionOther) || trim($rejectionOther) === '')
                ) {
                    throw new \InvalidArgumentException(
                        'Explain the Other rejection reason.'
                    );
                }

                $now = now();
                $otherExplanation = $rejectionReason === 'Other'
                    ? trim($rejectionOther)
                    : null;
                $request->update([
                    'status' => self::STATUS_REJECTED,
                    'remarks' => null,
                    'rejection_reason' => $rejectionReason,
                    'rejection_other' => $otherExplanation,
                    'decision_by' => Auth::id(),
                    'decision_at' => $now,
                ]);

                AuditService::log(
                    'request_rejected',
                    $request,
                    'Request rejected: ' . $rejectionReason . '.',
                    ['status' => $oldStatus],
                    [
                        'decision' => self::STATUS_REJECTED,
                        'rejection_reason' => $rejectionReason,
                        'rejection_other' => $otherExplanation,
                        'remarks' => null,
                        'decision_by' => Auth::id(),
                        'decision_at' => $now->toISOString(),
                    ]
                );
                NotificationService::requestStatusChanged(
                    $request,
                    $oldStatus,
                    self::STATUS_REJECTED,
                    null,
                    $rejectionReason . ($otherExplanation ? ': ' . $otherExplanation : '')
                );

                return $request->fresh();
            }

            if ($newStatus === self::STATUS_READY_FOR_PICKUP) {
                self::assertTransitionAllowed($oldStatus, $newStatus);
                if (!$request->approved_at) {
                    throw new \InvalidArgumentException(
                        'Approve the request before marking it ready for pickup.'
                    );
                }
                $readyAt = CarbonImmutable::now();
                $documentIssuedAt = CarbonImmutable::now('Asia/Manila');
                app(DocumentGenerationService::class)
                    ->generateForReadyPickup(
                        $request,
                        $documentIssuedAt
                    );
                $request->update([
                    'status' => self::STATUS_READY_FOR_PICKUP,
                    'ready_for_pickup_at' => $readyAt,
                ]);
            } elseif ($newStatus === self::STATUS_COMPLETED) {
                self::assertTransitionAllowed($oldStatus, $newStatus);
                $request->update([
                    'status' => self::STATUS_COMPLETED,
                    'claimed_at' => now(),
                    'release_recipient_name' => is_string($recipientName) &&
                        trim($recipientName) !== ''
                            ? trim($recipientName)
                            : null,
                    'released_by' => Auth::id(),
                ]);
            } else {
                throw new \InvalidArgumentException(
                    'Request changes must use an available workflow action.'
                );
            }

            $action = $newStatus === self::STATUS_COMPLETED
                ? 'document_released'
                : 'ready_for_pickup';
            AuditService::logStatusChange(
                $request,
                $oldStatus,
                $newStatus,
                null,
                $action
            );
            NotificationService::requestStatusChanged(
                $request,
                $oldStatus,
                $newStatus
            );

            return $request->fresh();
        });
    }

    public static function approveAndPrepareForPickup(
        BarangayRequest $request,
        ?string $remarks = null
    ): BarangayRequest {
        return DB::transaction(function () use ($request, $remarks): BarangayRequest {
            $request = BarangayRequest::query()
                ->lockForUpdate()
                ->findOrFail($request->request_id);
            $oldStatus = $request->status;

            self::assertTransitionAllowed(
                $oldStatus,
                self::STATUS_APPROVED
            );
            self::assertResidentIdVerified($request);
            $approvedAt = now();
            $request->update([
                'status' => self::STATUS_APPROVED,
                'approved_at' => $approvedAt,
                'decision_by' => Auth::id(),
                'decision_at' => $approvedAt,
                'remarks' => $remarks !== null ? trim($remarks) : null,
                'rejection_reason' => null,
                'rejection_other' => null,
            ]);

            AuditService::log(
                'request_approved',
                $request,
                'Request approved for official document generation.',
                ['status' => $oldStatus],
                [
                    'status' => self::STATUS_APPROVED,
                    'decision_by' => Auth::id(),
                    'decision_at' => $approvedAt->toISOString(),
                    'remarks' => $remarks !== null ? trim($remarks) : null,
                ]
            );

            $readyAt = now();
            app(DocumentGenerationService::class)->generateForReadyPickup(
                $request,
                CarbonImmutable::now('Asia/Manila')
            );
            $request->update([
                'status' => self::STATUS_READY_FOR_PICKUP,
                'ready_for_pickup_at' => $readyAt,
            ]);

            AuditService::logStatusChange(
                $request,
                self::STATUS_APPROVED,
                self::STATUS_READY_FOR_PICKUP,
                null,
                'ready_for_pickup'
            );
            NotificationService::requestStatusChanged(
                $request,
                $oldStatus,
                self::STATUS_READY_FOR_PICKUP,
                $remarks
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
            if ($request->status !== self::STATUS_REQUEST_SUBMITTED) {
                throw new \InvalidArgumentException(
                    'A document can only be prepared during processing and approval.'
                );
            }

            $documentId = $request->documents()
                ->where('purpose', 'prepared_document')
                ->orderByDesc('request_document_id')
                ->value('request_document_id');
            if (!$documentId) {
                throw new \InvalidArgumentException(
                    'Upload the prepared document before recording its preparation.'
                );
            }

            $request->update([
                'document_prepared_at' => now(),
                'document_prepared_by' => Auth::id(),
                'prepared_document_id' => $documentId,
            ]);

            AuditService::log(
                'document_prepared',
                $request,
                'The requested document was prepared and uploaded.'
            );

            return $request->fresh();
        });
    }

    public static function recordGeneratedDocumentPrint(
        BarangayRequest $request
    ): string {
        return DB::transaction(function () use ($request): string {
            $request = BarangayRequest::query()
                ->lockForUpdate()
                ->findOrFail($request->request_id);

            if ($request->status !== self::STATUS_READY_FOR_PICKUP) {
                throw new \InvalidArgumentException(
                    'Only requests ready for pickup can be printed.'
                );
            }
            if (!$request->document_number || !$request->generated_document_data) {
                throw new \InvalidArgumentException(
                    'Generate the official document before printing.'
                );
            }

            $printEvents = AuditLog::query()
                ->where('table_name', 'barangay_requests')
                ->where('record_id', $request->request_id)
                ->whereIn('action', ['document_printed', 'document_reprinted'])
                ->get(['new_values']);
            $printCount = $printEvents->filter(
                fn (AuditLog $event): bool =>
                    ($event->new_values['document_number'] ?? null) ===
                    $request->document_number
            )->count();
            $action = $printCount > 0
                ? 'document_reprinted'
                : 'document_printed';

            AuditService::log(
                $action,
                $request,
                $action === 'document_reprinted'
                    ? "The generated document {$request->document_number} was reprinted."
                    : "The generated document {$request->document_number} was sent for printing.",
                [],
                [
                    'document_number' => $request->document_number,
                    'print_number' => $printCount + 1,
                ]
            );

            return $action;
        });
    }

    public static function recordDocumentPrint(
        BarangayRequest $request,
        int $documentId
    ): void {
        DB::transaction(function () use ($request, $documentId): void {
            $request = BarangayRequest::query()
                ->lockForUpdate()
                ->findOrFail($request->request_id);

            if ($request->status !== self::STATUS_READY_FOR_PICKUP) {
                throw new \InvalidArgumentException(
                    'Only documents for requests ready for pickup can be printed.'
                );
            }
            if (
                $request->prepared_document_id !== $documentId ||
                !$request->documents()
                    ->whereKey($documentId)
                    ->where('purpose', 'prepared_document')
                    ->exists()
            ) {
                throw new \InvalidArgumentException(
                    'The selected document is not the approved request document.'
                );
            }

            $printCount = AuditLog::query()
                ->where('table_name', 'barangay_requests')
                ->where('record_id', $request->request_id)
                ->whereIn('action', ['document_printed', 'document_reprinted'])
                ->count();
            $isReprint = $printCount > 0;
            AuditService::log(
                $isReprint ? 'document_reprinted' : 'document_printed',
                $request,
                $isReprint
                    ? 'The prepared request document was reprinted.'
                    : 'The prepared request document was sent for printing.',
                [],
                [
                    'request_document_id' => $documentId,
                    'print_number' => $printCount + 1,
                ]
            );
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

    private static function assertResidentIdVerified(
        BarangayRequest $request
    ): void {
        $request->loadMissing('user');
        $resident = $request->user;
        if (!$resident || $resident->verification_status !== 'verified') {
            throw new \InvalidArgumentException(
                'The resident account is not verified. Review the mobile ID in resident verification first.'
            );
        }
        if (
            !is_string($resident->valid_id_front) ||
            trim($resident->valid_id_front) === ''
        ) {
            throw new \InvalidArgumentException(
                'The resident mobile profile does not contain an ID image.'
            );
        }
    }

    private static function assertTransitionAllowed(string $from, string $to): void
    {
        if (!in_array($to, self::ALL_STATUSES, true)) {
            throw new \InvalidArgumentException('Unknown request status.');
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
        return in_array($status, [
            self::STATUS_REJECTED,
            self::STATUS_COMPLETED,
        ], true);
    }
}
