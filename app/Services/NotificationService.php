<?php

namespace App\Services;

use App\Models\BarangayRequest;
use App\Models\GuestRequest;
use App\Models\Notification;
use App\Models\Staff;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class NotificationService
{

    public static function requestStatusChanged(BarangayRequest $request, string $oldStatus, string $newStatus): void
    {
        $documentName = $request->documentType->document_name ?? 'document';

        Notification::create([
            'type' => 'request_status_changed',
            'user_id' => $request->user_id,
            'request_id' => $request->request_id,
            'title' => "Request {$newStatus}",
            'message' => "Your {$documentName} request ({$request->tracking_number}) status changed from {$oldStatus} to {$newStatus}.",
        ]);
    }

    public static function guestRequestStatusChanged(GuestRequest $request, string $oldStatus, string $newStatus): void
    {
        $documentName = $request->documentType->document_name ?? 'document';

        // Notify all staff — guests don't have user accounts.
        $staffMembers = Staff::with('user')->get();

        foreach ($staffMembers as $staff) {
            Notification::create([
                'type' => 'guest_request_status_changed',
                'user_id' => $staff->user_id,
                'staff_id' => $staff->staff_id,
                'guest_request_id' => $request->guest_request_id,
                'title' => "Guest Request {$newStatus}",
                'message' => "Guest request ({$request->tracking_number}) status changed from {$oldStatus} to {$newStatus}.",
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
