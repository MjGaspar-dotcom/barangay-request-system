<?php

namespace App\Http\Requests;

use App\Models\DocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGuestBarangayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $documentType = DocumentType::query()
            ->where('document_type_id', $this->input('document_type_id'))
            ->first();
        $isBusinessClearance = strcasecmp(
            (string) $documentType?->document_name,
            'Barangay Business Clearance'
        ) === 0;
        $isSoloParentCertificate = strcasecmp(
            (string) $documentType?->document_name,
            'Certificate of Solo Parent'
        ) === 0;

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => [
                Rule::requiredIf(fn (): bool => ! $this->boolean('no_middle_name')),
                'nullable',
                'string',
                'max:255',
            ],
            'no_middle_name' => ['required', 'boolean'],
            'last_name' => ['required', 'string', 'max:255'],
            'birth_date' => ['required', 'date', 'before_or_equal:today'],
            'contact_number' => ['required', 'string', 'max:20'],
            'street_name' => ['required', 'string', 'max:255'],
            'valid_id_front' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:5120'],
            'valid_id_back' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:5120'],
            'document_type_id' => ['required', 'exists:document_types,document_type_id'],
            'purpose' => ['required', 'string'],
            'request_data' => ['nullable', 'array:business_name,business_address,business_activity,number_of_children'],
            'request_data.business_name' => [
                Rule::requiredIf($isBusinessClearance),
                'nullable',
                'string',
                'max:255',
            ],
            'request_data.business_address' => [
                Rule::requiredIf($isBusinessClearance),
                'nullable',
                'string',
                'max:500',
            ],
            'request_data.business_activity' => ['sometimes', 'nullable', 'string', 'max:255'],
            'request_data.number_of_children' => [
                Rule::requiredIf($isSoloParentCertificate),
                'nullable',
                'integer',
                'min:1',
            ],
        ];
    }
}
