<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBarangayRequest  extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Allow this request for now
        // Authorization can be restricted later using
        // Authentication and User Roles 
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // request processing status
            'status' => 'sometimes|in:Pending,Additional Requirements,Approved,Rejected,Processing,Ready for Pickup,Completed',

            'remarks' => 'sometimes|nullable|string|max:2000',
            'recipient_name' => 'sometimes|required|string|max:255',
        ];
    }
}
