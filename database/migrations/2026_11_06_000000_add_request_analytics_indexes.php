<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('barangay_requests', function (Blueprint $table) {
            $table->index(
                ['created_at', 'deleted_at'],
                'barangay_requests_analytics_created_deleted_index'
            );
        });

    }

    public function down(): void
    {
        Schema::table('barangay_requests', function (Blueprint $table) {
            $table->dropIndex('barangay_requests_analytics_created_deleted_index');
        });

    }
};
