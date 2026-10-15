<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('username', 'admin')->first();
        $staffUser = User::where('username', 'staff')->first();
        $resident = User::where('username', 'resident')->first();
        $staff = $staffUser?->staff;

        if (!$admin || !$staffUser || !$resident || !$staff) {
            throw new RuntimeException(
                'Admin, staff, and resident accounts must be seeded before audit logs.'
            );
        }

        $entries = [
            [
                'action' => 'created',
                'table_name' => 'users',
                'record_id' => $resident->user_id,
                'description' => 'Seeded resident account for dashboard testing.',
                'user_id' => $admin->user_id,
                'staff_id' => null,
                'old_values' => null,
                'new_values' => [
                    'username' => $resident->username,
                    'verification_status' => $resident->verification_status,
                ],
            ],
            [
                'action' => 'created',
                'table_name' => 'users',
                'record_id' => $staffUser->user_id,
                'description' => 'Seeded staff account for dashboard testing.',
                'user_id' => $admin->user_id,
                'staff_id' => null,
                'old_values' => null,
                'new_values' => [
                    'username' => $staffUser->username,
                    'role' => 'staff',
                ],
            ],
            [
                'action' => 'updated',
                'table_name' => 'users',
                'record_id' => $resident->user_id,
                'description' => 'Resident identity verification was approved.',
                'user_id' => $staffUser->user_id,
                'staff_id' => $staff->staff_id,
                'old_values' => ['verification_status' => 'pending'],
                'new_values' => ['verification_status' => 'verified'],
            ],
        ];

        foreach ($entries as $entry) {
            AuditLog::firstOrCreate(
                [
                    'action' => $entry['action'],
                    'table_name' => $entry['table_name'],
                    'record_id' => $entry['record_id'],
                    'description' => $entry['description'],
                ],
                [
                    'user_id' => $entry['user_id'],
                    'staff_id' => $entry['staff_id'],
                    'old_values' => $entry['old_values'],
                    'new_values' => $entry['new_values'],
                ],
            );
        }
    }
}
