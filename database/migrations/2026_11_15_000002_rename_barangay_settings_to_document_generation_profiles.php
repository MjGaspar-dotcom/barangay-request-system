<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('barangay_settings')) {
            if (Schema::hasTable('document_generation_profiles')) {
                throw new \RuntimeException(
                    'Both barangay settings and document generation profile tables exist.'
                );
            }

            Schema::rename('barangay_settings', 'document_generation_profiles');

            return;
        }

        if (!Schema::hasTable('document_generation_profiles')) {
            throw new \RuntimeException(
                'The document generation configuration table could not be found.'
            );
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('document_generation_profiles')) {
            if (Schema::hasTable('barangay_settings')) {
                throw new \RuntimeException(
                    'Both document generation profile and barangay settings tables exist.'
                );
            }

            Schema::rename('document_generation_profiles', 'barangay_settings');

            return;
        }

        if (!Schema::hasTable('barangay_settings')) {
            throw new \RuntimeException(
                'The barangay settings table could not be found.'
            );
        }
    }
};
