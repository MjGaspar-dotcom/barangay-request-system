<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            Schema::hasTable('barangay_requests') &&
            Schema::hasColumn('barangay_requests', 'user_id')
        ) {
            if (Schema::getConnection()->getDriverName() === 'mysql') {
                Schema::table('barangay_requests', function (Blueprint $table): void {
                    $table->dropForeign(['user_id']);
                });
                DB::statement('ALTER TABLE barangay_requests MODIFY user_id BIGINT UNSIGNED NULL');
                Schema::table('barangay_requests', function (Blueprint $table): void {
                    $table->foreign('user_id')
                        ->references('user_id')
                        ->on('users')
                        ->cascadeOnDelete();
                });
            } else {
                Schema::table('barangay_requests', function (Blueprint $table): void {
                    $table->foreignId('user_id')->nullable()->change();
                });
            }
        }

        Schema::create('guest_applicants', function (Blueprint $table): void {
            $table->id('guest_applicant_id');
            $table->foreignId('request_id')
                ->unique()
                ->constrained('barangay_requests', 'request_id')
                ->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('contact_number', 20);
            $table->string('street_name');
            $table->string('address');
            $table->string('valid_id_type', 120);
            $table->string('valid_id_front');
            $table->string('valid_id_front_disk', 64);
            $table->string('valid_id_front_original_name');
            $table->string('valid_id_front_mime_type', 100);
            $table->string('valid_id_back');
            $table->string('valid_id_back_disk', 64);
            $table->string('valid_id_back_original_name');
            $table->string('valid_id_back_mime_type', 100);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        if (
            Schema::hasTable('barangay_requests') &&
            DB::table('barangay_requests')->whereNull('user_id')->exists()
        ) {
            throw new RuntimeException(
                'Guest requests must be removed before making request owners mandatory again.'
            );
        }

        Schema::dropIfExists('guest_applicants');

        if (
            Schema::hasTable('barangay_requests') &&
            Schema::hasColumn('barangay_requests', 'user_id')
        ) {
            if (Schema::getConnection()->getDriverName() === 'mysql') {
                Schema::table('barangay_requests', function (Blueprint $table): void {
                    $table->dropForeign(['user_id']);
                });
                DB::statement('ALTER TABLE barangay_requests MODIFY user_id BIGINT UNSIGNED NOT NULL');
                Schema::table('barangay_requests', function (Blueprint $table): void {
                    $table->foreign('user_id')
                        ->references('user_id')
                        ->on('users')
                        ->cascadeOnDelete();
                });
            } else {
                Schema::table('barangay_requests', function (Blueprint $table): void {
                    $table->foreignId('user_id')->nullable(false)->change();
                });
            }
        }
    }
};
