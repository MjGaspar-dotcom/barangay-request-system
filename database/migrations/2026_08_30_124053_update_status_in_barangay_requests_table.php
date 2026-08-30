<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Illuminate\Support\Facades\DB::statement("ALTER TABLE barangay_requests MODIFY COLUMN status ENUM('Pending', 'Processing', 'Approved', 'Ready for Pickup', 'Rejected', 'Completed') NOT NULL DEFAULT 'Pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Illuminate\Support\Facades\DB::statement("ALTER TABLE barangay_requests MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected', 'Completed') NOT NULL DEFAULT 'Pending'");
    }
};
