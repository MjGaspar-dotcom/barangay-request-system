<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StaffSeeder extends Seeder
{
    public function run(): void
    {
        // Make sure the admin account exists first.
        $adminUser = User::where('username', 'admin')->first();

        if (!$adminUser) {
            throw new \RuntimeException(
                'Admin account not found. Run AdminSeeder before StaffSeeder.'
            );
        }

        $admin = Admin::where(
            'user_id',
            $adminUser->user_id
        )->first();

        if (!$admin) {
            throw new \RuntimeException(
                'Admin record not found. Run AdminSeeder before StaffSeeder.'
            );
        }

        // Create or update staff user account.
        $user = User::updateOrCreate(
            [
                'username' => 'staff',
            ],
            [
                'password' => Hash::make('password123'),

                'first_name' => 'Barangay',
                'middle_name' => null,
                'last_name' => 'Staff',

                'birth_date' => '1992-05-15',
                'gender' => 'Female',
                'civil_status' => 'Single',

                'address' => 'Barangay Hall',
                'contact_number' => '09171111111',
                'email' => 'staff@barangay.local',

                'valid_id_type' => null,
                'valid_id_front' => null,
                'valid_id_back' => null,

                'verification_status' => 'verified',
            ],
        );

        // Create or update staff record.
        Staff::updateOrCreate(
            [
                'user_id' => $user->user_id,
            ],
            [
                'assigned_by' => $admin->admin_id,
            ],
        );
    }
}