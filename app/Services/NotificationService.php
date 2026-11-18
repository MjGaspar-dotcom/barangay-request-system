<?php

namespace App\Services;

use App\Models\BarangayRequest;
use App\Models\Notification;
use App\Models\Staff;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class NotificationService
{

    public static function requestStatusChanged(
        BarangayRequest $request,
        string $oldStatus,
        string $newStatus,
        ?string $remarks = null,
        ?string $rejectionReason = null
    ): void
    {
        $documentName = $request->documentType->document_name ?? 'document';
        $statusLabels = [
            'request_submitted' => 'Request Submitted',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'ready_for_pickup' => 'Ready for Pickup',
            'completed' => 'Completed',
        ];
        $newStatusLabel = $statusLabels[$newStatus] ?? $newStatus;
        $isReadyForPickup = $newStatus === 'ready_for_pickup';
        $title = $isReadyForPickup
            ? 'Document Ready for Pickup'
            : "Request {$newStatusLabel}";
        $message = $isReadyForPickup
            ? "Your {$documentName} request ({$request->tracking_number}) is ready for pickup at the barangay office."
            : trim(
                "Your {$documentName} request ({$request->tracking_number}) is now {$newStatusLabel}. " .
                ($rejectionReason ? "Reason: {$rejectionReason}. " : '') .
                ($remarks ? "Feedback: {$remarks}" : '')
            );

        if ($request->user_id !== null) {
            Notification::create([
                'type' => 'request_status_changed',
                'user_id' => $request->user_id,
                'request_id' => $request->request_id,
                'title' => $title,
                'message' => $message,
            ]);
        }
    }

    /**
     * Notify all staff about a new request.
     */
    public static function newRequestForStaff(BarangayRequest $request): void
    {
        $staffMembers = Staff::with('user')->get();

        $documentName = $request->documentType->document_name ?? 'document';

        foreach ($staffMembers as $staff) {
            Notification::create([
                'type' => 'new_request_for_staff',
                'user_id' => $staff->user_id,
                'staff_id' => $staff->staff_id,
                'request_id' => $request->request_id,
                'title' => 'New Request Submitted',
                'message' => "A new {$documentName} request ({$request->tracking_number}) has been submitted.",
            ]);
        }
    }
}
