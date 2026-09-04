<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('barangay_requests')) {
            return;
        }

        // 1. Delete or handle any legacy records where user_id IS NULL
        DB::table('barangay_requests')->whereNull('user_id')->delete();

        // 2. Update status ENUM to support all 6 statuses on MySQL
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE barangay_requests MODIFY COLUMN status ENUM('Pending', 'Processing', 'Approved', 'Ready for Pickup', 'Rejected', 'Completed') NOT NULL DEFAULT 'Pending'");

            // Drop foreign key before changing user_id to NOT NULL
            Schema::table('barangay_requests', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });

            DB::statement("ALTER TABLE barangay_requests MODIFY COLUMN user_id BIGINT UNSIGNED NOT NULL");

            Schema::table('barangay_requests', function (Blueprint $table) {
                $table->foreign('user_id')->references('user_id')->on('users')->cascadeOnDelete();
            });
        }

        // 3. Drop obsolete guest columns if they still exist in the table
        Schema::table('barangay_requests', function (Blueprint $table) {
            $columnsToDrop = array_filter([
                'guest_first_name',
                'guest_middle_name',
                'guest_last_name',
                'guest_birth_date',
                'guest_gender',
                'guest_civil_status',
                'guest_address',
                'guest_contact_number',
                'guest_email',
                'guest_valid_id_type',
                'guest_valid_id_image',
            ], fn($col) => Schema::hasColumn('barangay_requests', $col));

            if (!empty($columnsToDrop)) {
                $table->dropColumn(array_values($columnsToDrop));
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE barangay_requests MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected', 'Completed') NOT NULL DEFAULT 'Pending'");
            DB::statement("ALTER TABLE barangay_requests MODIFY COLUMN user_id BIGINT UNSIGNED NULL");
        }
    }
};
