<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            foreach (['profile_picture', 'valid_id_front', 'valid_id_back'] as $field) {
                $table->string("{$field}_disk")->nullable();
                $table->string("{$field}_original_name")->nullable();
                $table->string("{$field}_mime_type", 100)->nullable();
                $table->timestamp("{$field}_uploaded_at")->nullable();
            }
        });

        Schema::table('barangay_request_documents', function (Blueprint $table): void {
            $table->string('storage_disk')->nullable()->after('storage_path');
        });
    }

    public function down(): void
    {
        Schema::table('barangay_request_documents', function (Blueprint $table): void {
            $table->dropColumn('storage_disk');
        });

        Schema::table('users', function (Blueprint $table): void {
            foreach (['profile_picture', 'valid_id_front', 'valid_id_back'] as $field) {
                $table->dropColumn([
                    "{$field}_disk",
                    "{$field}_original_name",
                    "{$field}_mime_type",
                    "{$field}_uploaded_at",
                ]);
            }
        });
    }
};
