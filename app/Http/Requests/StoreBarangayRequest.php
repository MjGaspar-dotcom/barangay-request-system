<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
        return [
            'document_type_id' => 'required|exists:document_types,document_type_id',
            'purpose' => 'required|string',
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
        ];
    }
}