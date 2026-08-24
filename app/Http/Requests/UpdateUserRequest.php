<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // This request will be used inside an authenticated route.
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()->user_id;

        return [
            // Basic profile information
            'first_name' => ['sometimes', 'string', 'max:255'],
            'middle_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'birth_date' => ['sometimes', 'date', 'before_or_equal:today'],
            'gender' => [
                'sometimes',
                'string',
                'max:50',
                'in:Male,Female,Prefer not to say',
            ],
            'civil_status' => [
                'sometimes',
                'string',
                'max:50',
                'in:Single,Married,Separated,Divorced,Widowed',
            ],
            'address' => ['sometimes', 'string', 'max:255'],
            'contact_number' => ['sometimes', 'string', 'max:20'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                'unique:users,email,' . $userId . ',user_id',
            ],

            // Verification documents
            'valid_id_type' => ['sometimes', 'string', 'max:255'],
            'valid_id_front' => [
                'sometimes',
                'file',
                'image',
                'max:5120',
            ],
            'valid_id_back' => [
                'sometimes',
                'nullable',
                'file',
                'image',
                'max:5120',
            ],
        ];
    }
}