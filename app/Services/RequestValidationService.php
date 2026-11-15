<?php

namespace App\Services;

use App\Models\BarangayRequest;
use App\Models\User;

class RequestValidationService
{
    /**
     * Check if a user is allowed to submit a request.
     * e.g., no pending duplicate requests.
     */
    public static function canUserSubmitRequest(User $user, int $documentTypeId): array
    {
        $errors = [];

        $existing = BarangayRequest::query()
            ->where('user_id', $user->user_id)
            ->where('document_type_id', $documentTypeId)
            ->whereIn('status', [
                RequestStatusService::STATUS_REQUEST_SUBMITTED,
                RequestStatusService::STATUS_APPROVED,
                RequestStatusService::STATUS_READY_FOR_PICKUP,
            ])
            ->exists();

        if ($existing) {
            $errors[] = 'You already have an open request for this document type.';
        }

        return $errors;
    }

    /**
     * Check if user account is verified before allowing requests.
     */
    public static function isUserVerified(User $user): bool
    {
        return $user->verification_status === 'verified';
    }
}