<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\Admin;
use App\Models\User;
use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('admin:create', function () {
    $input = [
        'username' => text('Username', required: true),
        'email' => text('Email address', required: true),
        'first_name' => text('First name', required: true),
        'middle_name' => text('Middle name (optional)'),
        'last_name' => text('Last name', required: true),
        'birth_date' => text('Birth date (YYYY-MM-DD)', required: true),
        'gender' => text('Gender', required: true),
        'civil_status' => text('Civil status', required: true),
        'address' => text('Address', required: true),
        'contact_number' => text('Contact number', required: true),
        'password' => password('Password (minimum 12 characters)', required: true),
        'password_confirmation' => password('Confirm password', required: true),
    ];

    $validator = Validator::make($input, [
        'username' => ['required', 'string', 'max:255', 'unique:users,username'],
        'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
        'first_name' => ['required', 'string', 'max:255'],
        'middle_name' => ['nullable', 'string', 'max:255'],
        'last_name' => ['required', 'string', 'max:255'],
        'birth_date' => ['required', 'date_format:Y-m-d'],
        'gender' => ['required', 'string', 'max:255'],
        'civil_status' => ['required', 'string', 'max:255'],
        'address' => ['required', 'string', 'max:255'],
        'contact_number' => ['required', 'string', 'max:255'],
        'password' => ['required', 'string', 'min:12', 'confirmed'],
    ]);

    if ($validator->fails()) {
        foreach ($validator->errors()->all() as $error) {
            $this->error($error);
        }

        return 1;
    }

    DB::transaction(function () use ($input): void {
        $user = User::create([
            'username' => $input['username'],
            'password' => Hash::make($input['password']),
            'first_name' => $input['first_name'],
            'middle_name' => $input['middle_name'] ?: null,
            'last_name' => $input['last_name'],
            'birth_date' => $input['birth_date'],
            'gender' => $input['gender'],
            'civil_status' => $input['civil_status'],
            'address' => $input['address'],
            'contact_number' => $input['contact_number'],
            'email' => $input['email'],
            'verification_status' => 'verified',
        ]);

        Admin::create(['user_id' => $user->user_id]);
    });

    $this->info("Administrator account '{$input['username']}' created.");
})->purpose('Create an administrator account using secure interactive prompts');
