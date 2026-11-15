<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use App\Services\RequestStatusService;

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
            'status' => [
                'required',
                'in:' . implode(',', [
                    RequestStatusService::STATUS_APPROVED,
                    RequestStatusService::STATUS_REJECTED,
                    RequestStatusService::STATUS_READY_FOR_PICKUP,
                    RequestStatusService::STATUS_COMPLETED,
                ]),
            ],
            'remarks' => 'nullable|string|max:2000',
            'rejection_reason' => [
                'required_if:status,' . RequestStatusService::STATUS_REJECTED,
                'nullable',
                'in:' . implode(',', RequestStatusService::REJECTION_REASONS),
            ],
            'rejection_other' => 'nullable|string|max:2000',
            'recipient_name' => 'nullable|string|max:255',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (
                $this->input('rejection_reason') === 'Other' &&
                $this->input('status') === RequestStatusService::STATUS_REJECTED &&
                (!is_string($this->input('rejection_other')) ||
                    trim($this->input('rejection_other')) === '')
            ) {
                $validator->errors()->add(
                    'rejection_other',
                    'Explain the Other rejection reason.'
                );
            }
        });
    }
}
