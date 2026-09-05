<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            [
                'username' => 'resident',
            ],
            [
                'password' => Hash::make('password123'),

                'first_name' => 'Juan',
                'middle_name' => null,
                'last_name' => 'Dela Cruz',

                'birth_date' => '1995-06-20',
                'gender' => 'Male',
                'civil_status' => 'Single',

                'address' => '123 Main Street, Barangay San Fabian',
                'contact_number' => '09192222222',
                'email' => 'resident@barangay.local',

                // Test resident verification data
                'valid_id_type' => 'Barangay ID',
                'valid_id_front' => 'seed/valid_id_front.jpg',
                'valid_id_back' => null,

                'verification_status' => 'verified',
            ],
        );
    }
}