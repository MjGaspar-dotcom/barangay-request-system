<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class BulkUserSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = database_path('seeders/test_users.csv');

        if (!file_exists($csvPath)) {
            $this->command->error("CSV file not found at: {$csvPath}");
            return;
        }

        $file = fopen($csvPath, 'r');
        $header = fgetcsv($file);

        $count = 0;
        $skipped = 0;

        while (($row = fgetcsv($file)) !== false) {
            $data = array_combine($header, $row);

            // Skip if username already exists
            if (User::where('username', $data['username'])->exists()) {
                $skipped++;
                continue;
            }

            User::create([
                'username' => $data['username'],
                'password' => Hash::make('password123'),
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'],
                'last_name' => $data['last_name'],
                'birth_date' => $data['birth_date'],
                'gender' => $data['gender'],
                'civil_status' => $data['civil_status'],
                'address' => $data['address'],
                'contact_number' => $data['contact_number'],
                'email' => $data['email'],
                'verification_status' => $data['verification_status'],
                'valid_id_type' => 'Barangay ID',
            ]);

            $count++;
        }

        fclose($file);

        $this->command->info("Bulk user import complete:");
        $this->command->info("  - Created: {$count}");
        $this->command->info("  - Skipped (duplicate username): {$skipped}");
    }
}
