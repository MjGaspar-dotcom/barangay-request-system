<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DocumentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $documentTypes = [
            'Barangay Clearance' => ['Barangay Clearance'],
            'Certificate of Residency' => ['Certificate of Residency'],
            'Certificate of Indigency' => ['Certificate of Indigency'],
            'Barangay Business Clearance' => ['Barangay Business Clearance'],
            'Certificate of First-Time Job Seeker' => [
                'Certificate of First-Time Job Seeker',
                'First-Time Job Seeker Certificate',
            ],
            'Certificate of Good Moral Character' => [
                'Certificate of Good Moral Character',
            ],
            'Certificate of Low Income' => ['Certificate of Low Income'],
            'Certificate of No Income' => ['Certificate of No Income'],
            'Certificate of Unemployment' => ['Certificate of Unemployment'],
            'Certificate of Actual Residency' => ['Certificate of Actual Residency'],
            'Certificate of Solo Parent' => ['Certificate of Solo Parent'],
            'Certificate of Family Composition' => [
                'Certificate of Family Composition',
            ],
            'Certificate of Appearance' => ['Certificate of Appearance'],
            'Certificate of Blotter' => ['Certificate of Blotter'],
            'Certificate of No Pending Complaint' => [
                'Certificate of No Pending Complaint',
            ],
        ];

        foreach ($documentTypes as $documentName => $existingNames) {
            $exists = DB::table('document_types')
                ->where(function ($query) use ($existingNames): void {
                    foreach ($existingNames as $existingName) {
                        $query->orWhereRaw(
                            'LOWER(document_name) = ?',
                            [mb_strtolower($existingName)]
                        );
                    }
                })
                ->exists();
            if (!$exists) {
                DB::table('document_types')->insert([
                    'document_name' => $documentName,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
