<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreBarangayRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $isGuest = !Auth::guard('sanctum')->check();

        return [
            'document_type_id' => 'required|exists:document_types,document_type_id',
            'purpose' => 'required|string',

            // Guest fields
            'guest_first_name' => $isGuest ? 'required|string|max:255' : 'nullable|string|max:255',
            'guest_middle_name' => 'nullable|string|max:255',
            'guest_last_name' => $isGuest ? 'required|string|max:255' : 'nullable|string|max:255',
            'guest_birth_date' => $isGuest ? 'required|date' : 'nullable|date',
            'guest_gender' => $isGuest ? 'required|in:Male,Female,Prefer not to say' : 'nullable|in:Male,Female,Prefer not to say',
            'guest_civil_status' => $isGuest ? 'required|string|max:255' : 'nullable|string|max:255',
            'guest_address' => $isGuest ? 'required|string|max:255' : 'nullable|string|max:255',
            'guest_contact_number' => $isGuest ? 'required|string|max:255' : 'nullable|string|max:255',
            'guest_email' => 'nullable|email|max:255',
            'guest_valid_id_type' => $isGuest ? 'required|string|max:255' : 'nullable|string|max:255',
            'guest_valid_id_image' => $isGuest ? 'required|image|mimes:jpg,jpeg,png|max:5120' : 'nullable|image|mimes:jpg,jpeg,png|max:5120',
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

            'guest_first_name.required' => 'First name is required.',
            'guest_last_name.required' => 'Last name is required.',

            'guest_birth_date.required' => 'Birth date is required.',

            'guest_gender.required' => 'Gender is required.',

            'guest_civil_status.required' => 'Civil status is required.',

            'guest_address.required' => 'Address is required.',

            'guest_contact_number.required' => 'Contact number is required.',

            'guest_valid_id_type.required' => 'Please select your valid ID type.',

            'guest_valid_id_image.required' => 'Please upload a valid ID.',

            'purpose.required' => 'Purpose is required.',
        ];
    }
}