<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            [
                'username' => 'admin',
                'notifications' => [
                    [
                        'type' => 'dashboard_update',
                        'title' => 'Dashboard data is ready',
                        'message' => 'Audit activity and system notifications are available on your dashboard.',
                    ],
                    [
                        'type' => 'audit_log_created',
                        'title' => 'Audit logging is enabled',
                        'message' => 'Administrative and staff actions are recorded in the audit log.',
                    ],
                ],
            ],
            [
                'username' => 'staff',
                'notifications' => [
                    [
                        'type' => 'new_request_for_staff',
                        'title' => 'Request queue is ready',
                        'message' => 'New document requests will appear in your request queue.',
                    ],
                    [
                        'type' => 'dashboard_update',
                        'title' => 'Dashboard notifications enabled',
                        'message' => 'Request updates and system notices will appear here.',
                    ],
                ],
            ],
            [
                'username' => 'resident',
                'notifications' => [
                    [
                        'type' => 'dashboard_update',
                        'title' => 'Welcome to Barangay Document System',
                        'message' => 'You will receive updates here when your document requests change status.',
                    ],
                ],
            ],
        ];

        foreach ($accounts as $account) {
            $user = User::where('username', $account['username'])->first();

            if (!$user) {
                throw new RuntimeException(
                    "User account '{$account['username']}' must be seeded before notifications."
                );
            }

            foreach ($account['notifications'] as $data) {
                Notification::firstOrCreate(
                    [
                        'user_id' => $user->user_id,
                        'type' => $data['type'],
                        'title' => $data['title'],
                    ],
                    [
                        'staff_id' => $user->staff?->staff_id,
                        'message' => $data['message'],
                        'is_read' => false,
                    ],
                );
            }
        }
    }
}
