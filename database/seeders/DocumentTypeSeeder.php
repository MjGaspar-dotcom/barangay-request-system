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
      DB::table('document_types')->insert([
            [
                'document_name' => 'Barangay Clearance',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'document_name' => 'Certificate of Residency',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'document_name' => 'Certificate of Indigency',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
