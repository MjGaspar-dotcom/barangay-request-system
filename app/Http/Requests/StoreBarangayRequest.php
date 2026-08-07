<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
        return [

            /*
            |--------------------------------------------------------------------------
            | Guest Information
            |--------------------------------------------------------------------------
            */

            'guest_first_name' => [
                'required',
                'string',
                'max:100',
            ],

            'guest_middle_name' => [
                'nullable',
                'string',
                'max:100',
            ],

            'guest_last_name' => [
                'required',
                'string',
                'max:100',
            ],

            'guest_birth_date' => [
                'required',
                'date',
            ],

            'guest_gender' => [
                'required',
                'in:Male,Female,Prefer not to say',
            ],

            'guest_civil_status' => [
                'required',
                'string',
                'max:50',
            ],

            'guest_address' => [
                'required',
                'string',
                'max:255',
            ],

            'guest_contact_number' => [
                'required',
                'string',
                'max:20',
            ],

            'guest_email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'guest_valid_id_type' => [
                'required',
                'string',
                'max:100',
            ],

            'guest_valid_id_image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png',
                'max:2048',
            ],

            /*
            |--------------------------------------------------------------------------
            | Request Information
            |--------------------------------------------------------------------------
            */

            'document_type_id' => [
                'required',
                'exists:document_types,document_type_id',
            ],

            'purpose' => [
                'required',
                'string',
                'max:500',
            ],

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