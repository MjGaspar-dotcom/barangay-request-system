<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            [
                'username' => 'admin',
            ],
            [
                'password' => Hash::make('password123'),

                'first_name' => 'System',
                'middle_name' => null,
                'last_name' => 'Administrator',

                'birth_date' => '1985-01-01',
                'gender' => 'Male',
                'civil_status' => 'Single',

                'address' => 'Barangay Hall',
                'contact_number' => '09170000000',
                'email' => 'admin@barangay.local',

                'valid_id_type' => null,
                'valid_id_front' => null,
                'valid_id_back' => null,

                'verification_status' => 'verified',
            ],
        );

        Admin::updateOrCreate(
            [
                'user_id' => $user->user_id,
            ],
            [],
        );
    }
}