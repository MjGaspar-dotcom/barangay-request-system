<?php

namespace App\Http\Requests;

use App\Models\DocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBarangayRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Only authenticated users can submit a barangay request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for a registered-user barangay request.
     * Personal info comes from the authenticated user's profile. Residents
     * may also attach supporting documents with their request.
     */
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
            'document_type_id' => 'required|exists:document_types,document_type_id',
            'purpose' => 'required|string',
            'request_data' => 'nullable|array:business_name,business_address,business_activity,number_of_children',
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
            'request_data.business_activity' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'request_data.number_of_children' => [
                Rule::requiredIf($isSoloParentCertificate),
                'nullable',
                'integer',
                'min:1',
            ],
            'supporting_documents' => 'sometimes|array|max:5',
            'supporting_documents.*' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'document_type_id.required' => 'Please select a document type.',
            'document_type_id.exists' => 'The selected document type is invalid.',
            'purpose.required' => 'Purpose is required.',
            'request_data.number_of_children.required' => 'Enter the number of children for a Solo Parent certificate.',
            'request_data.number_of_children.min' => 'The number of children must be at least one.',
        ];
    }
}
