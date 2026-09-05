<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\BarangayRequest;
use App\Models\GuestRequest;

class BulkRequestSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = database_path('seeders/test_requests.csv');

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

            $user = User::where('username', $data['username'])->first();

            if (!$user) {
                $this->command->warn("User not found: {$data['username']} - skipping");
                $skipped++;
                continue;
            }

            // Create registered request
            BarangayRequest::create([
                'user_id' => $user->user_id,
                'document_type_id' => $data['document_type_id'],
                'tracking_number' => 'BR-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6)),
                'purpose' => $data['purpose'],
                'status' => $data['status'],
            ]);

            $count++;
        }

        fclose($file);

        $this->command->info("Bulk request import complete:");
        $this->command->info("  - Created: {$count}");
        $this->command->info("  - Skipped: {$skipped}");
    }
}
