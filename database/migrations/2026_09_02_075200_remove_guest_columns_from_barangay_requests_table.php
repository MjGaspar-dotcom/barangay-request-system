<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * Removes all guest-specific columns from barangay_requests.
     * Guest data now lives in the guest_requests table.
     */
    public function up(): void
    {
        $columns = [
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
        ];

        $columnsToDrop = array_filter($columns, fn($col) => Schema::hasColumn('barangay_requests', $col));

        if (!empty($columnsToDrop)) {
            Schema::table('barangay_requests', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn(array_values($columnsToDrop));
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('barangay_requests', function (Blueprint $table) {
            $table->string('guest_first_name')->nullable();
            $table->string('guest_middle_name')->nullable();
            $table->string('guest_last_name')->nullable();
            $table->date('guest_birth_date')->nullable();
            $table->enum('guest_gender', ['Male', 'Female', 'Prefer not to say'])->nullable();
            $table->string('guest_civil_status')->nullable();
            $table->string('guest_address')->nullable();
            $table->string('guest_contact_number')->nullable();
            $table->string('guest_email')->nullable();
            $table->string('guest_valid_id_type')->nullable();
            $table->string('guest_valid_id_image')->nullable();
        });
    }
};
