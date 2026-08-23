<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    /**
     * Registration is a public endpoint, so no authentication
     * is required before creating a new user account.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validate the information required to create a user account.
     *
     * Valid ID information is intentionally excluded here.
     * Users will provide their ID later for verification.
     */
    public function rules(): array
    {
        return [
            // Account information
            'username' => [
                'required',
                'string',
                'max:255',
                'alpha_dash',
                'unique:users,username',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],

            // Basic personal information
            'first_name' => [
                'required',
                'string',
                'max:255',
            ],

            'middle_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'last_name' => [
                'required',
                'string',
                'max:255',
            ],

            'birth_date' => [
                'required',
                'date',
                'before_or_equal:today',
            ],

            'gender' => [
                'required',
                'string',
                'max:50',
                'in:Male,Female,Prefer not to say',
            ],

            'civil_status' => [
                'required',
                'string',
                'max:50',
                'in:Single,Married,Separated,Divorced,Widowed',
            ],

            'address' => [
                'required',
                'string',
                'max:255',
            ],

            'contact_number' => [
                'required',
                'string',
                'max:20',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],
        ];
    }

    /**
     * Custom validation messages for common registration errors.
     */
    public function messages(): array
    {
        return [
            'username.required' => 'Username is required.',
            'username.unique' => 'This username is already taken.',

            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters long.',
            'password.confirmed' => 'Password confirmation does not match.',

            'first_name.required' => 'First name is required.',
            'last_name.required' => 'Last name is required.',

            'birth_date.required' => 'Birth date is required.',
            'birth_date.before_or_equal' => 'Birth date cannot be in the future.',

            'gender.required' => 'Gender is required.',
            'civil_status.required' => 'Civil status is required.',

            'address.required' => 'Address is required.',
            'contact_number.required' => 'Contact number is required.',

            'email.required' => 'Email is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email is already registered.',
        ];
    }
}
