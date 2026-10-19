<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangay_requests', function (Blueprint $table) {
            $table->string('status')->default('Pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('barangay_requests', function (Blueprint $table) {
            $table->enum('status', [
                'Pending',
                'Approved',
                'Rejected',
                'Completed',
            ])->default('Pending')->change();
        });
    }
};
