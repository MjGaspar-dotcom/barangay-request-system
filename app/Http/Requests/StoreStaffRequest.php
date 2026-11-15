<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffRequest extends FormRequest
{
    /**
     * Only authenticated admins can create staff.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && $user->admin !== null
            && $user->admin->exists;
    }

    /**
     * @return array<string, \Illuminate\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
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
                'max:255',
            ],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'birth_date' => ['required', 'date', 'before_or_equal:today'],
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
            'address' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],
        ];
    }

    /**
     * Human-readable messages for staff form validation.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.required' => 'Enter a username.',
            'username.alpha_dash' => 'Use only letters, numbers, dashes, and underscores for the username.',
            'username.unique' => 'That username is already in use.',
            'password.required' => 'Enter a password.',
            'password.min' => 'Use a password with at least 8 characters.',
            'password.max' => 'Use a password with no more than 255 characters.',
            'first_name.required' => "Enter the staff member's first name.",
            'last_name.required' => "Enter the staff member's last name.",
            'birth_date.required' => 'Select a birth date.',
            'birth_date.date' => 'Enter a valid birth date.',
            'birth_date.before_or_equal' => 'Birth date cannot be in the future.',
            'gender.required' => 'Select a gender.',
            'gender.in' => 'Select a valid gender.',
            'civil_status.required' => 'Select a civil status.',
            'civil_status.in' => 'Select a valid civil status.',
            'address.required' => 'Enter an address.',
            'contact_number.required' => 'Enter a contact number.',
            'email.required' => 'Enter an email address.',
            'email.email' => 'Enter a valid email address.',
            'email.unique' => 'That email address is already in use.',
        ];
    }
}
