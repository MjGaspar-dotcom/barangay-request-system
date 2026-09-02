<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGuestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Only staff and admin are allowed to update guest requests,
     * but authorization is handled in the controller.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for updating a guest request.
     * Only staff/admin fields are updatable — personal info is read-only after submission.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Request processing status
            'status' => 'sometimes|in:Pending,Processing,Approved,Ready for Pickup,Rejected,Completed',

            // Staff/Admin remarks about the request
            'remarks' => 'sometimes|nullable|string',

            // Staff member who verified the status
            'verified_by' => 'sometimes|nullable|exists:staff,staff_id',

            // Date and time when the request was verified
            'verified_at' => 'sometimes|nullable|date',

            // Date and time when approved
            'approved_at' => 'sometimes|nullable|date',

            // Date and time when the document became ready
            'ready_for_pickup_at' => 'sometimes|nullable|date',

            // Date and time when the resident claimed the document
            'claimed_at' => 'sometimes|nullable|date',
        ];
    }
}
