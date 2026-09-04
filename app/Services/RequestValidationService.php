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

        // Check for duplicate pending request
        $existing = BarangayRequest::where('user_id', $user->id)
            ->where('document_type_id', $documentTypeId)
            ->whereIn('status', ['pending', 'processing'])
            ->first();

        if ($existing) {
            $errors[] = "You already have a pending request for this document.";
        }

        return $errors;
    }

    /**
     * Check if user account is verified before allowing requests.
     */
    public static function isUserVerified(User $user): bool
    {
        return (bool) $user->is_verified;
    }
}