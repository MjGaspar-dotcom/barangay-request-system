<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserVerificationRequest extends FormRequest
{
    /**
     * Only admins can change a user's verification status.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && $user->admin !== null
            && $user->admin->exists;
    }

    /**
     * Validation rules for verification status updates.
     */
    public function rules(): array
    {
        return [
            'verification_status' => [
                'required',
                'string',
                'in:pending,verified,rejected',
            ],
        ];
    }
}
