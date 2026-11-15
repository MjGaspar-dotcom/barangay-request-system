<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangay_requests', function (Blueprint $table): void {
            $table->string('document_number', 40)->nullable()->unique();
            $table->json('generated_document_data')->nullable();
            $table->string('document_template_identifier', 100)->nullable();
            $table->string('document_template_version', 40)->nullable();
            $table->timestamp('document_generated_at')->nullable();
            $table->foreignId('document_generated_by')
                ->nullable()
                ->constrained('users', 'user_id')
                ->nullOnDelete();
            $table->timestamp('indigency_verified_at')->nullable();
            $table->foreignId('indigency_verified_by')
                ->nullable()
                ->constrained('users', 'user_id')
                ->nullOnDelete();
        });

        Schema::create('barangay_document_number_sequences', function (Blueprint $table): void {
            $table->bigIncrements('sequence_id');
            $table->timestamps();
        });

        Schema::create('barangay_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('barangay_name', 150);
            $table->string('municipality', 150)->nullable();
            $table->string('province', 150)->nullable();
            $table->string('punong_barangay_name', 255)->nullable();
            $table->string('seal_path')->nullable();
            $table->string('office_address', 255)->nullable();
            $table->string('contact_information', 255)->nullable();
            $table->timestamps();
        });

        DB::table('barangay_settings')->insert([
            'id' => 1,
            'barangay_name' => 'Barangay Aurora',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('barangay_settings');
        Schema::dropIfExists('barangay_document_number_sequences');
        Schema::table('barangay_requests', function (Blueprint $table): void {
            $table->dropForeign(['document_generated_by']);
            $table->dropForeign(['indigency_verified_by']);
            $table->dropUnique(['document_number']);
            $table->dropColumn([
                'document_number',
                'generated_document_data',
                'document_template_identifier',
                'document_template_version',
                'document_generated_at',
                'document_generated_by',
                'indigency_verified_at',
                'indigency_verified_by',
            ]);
        });
    }
};
