<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGuestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Guest submissions are always public — no auth required.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for a new guest request.
     * All personal information is required — the dedicated table
     * means there is no reason for these fields to be nullable.
     */
    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'gender' => 'required|in:Male,Female,Prefer not to say',
            'civil_status' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'contact_number' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'valid_id_type' => 'required|string|max:255',
            'valid_id_image' => 'required|image|mimes:jpg,jpeg,png|max:5120',

            'document_type_id' => 'required|exists:document_types,document_type_id',
            'purpose' => 'required|string',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'First name is required.',
            'last_name.required' => 'Last name is required.',
            'birth_date.required' => 'Birth date is required.',
            'gender.required' => 'Gender is required.',
            'civil_status.required' => 'Civil status is required.',
            'address.required' => 'Address is required.',
            'contact_number.required' => 'Contact number is required.',
            'valid_id_type.required' => 'Please select your valid ID type.',
            'valid_id_image.required' => 'Please upload a valid ID image.',
            'valid_id_image.image' => 'The valid ID must be an image.',
            'valid_id_image.max' => 'The valid ID image must not exceed 5MB.',
            'document_type_id.required' => 'Please select a document type.',
            'document_type_id.exists' => 'The selected document type is invalid.',
            'purpose.required' => 'Purpose is required.',
        ];
    }
}
