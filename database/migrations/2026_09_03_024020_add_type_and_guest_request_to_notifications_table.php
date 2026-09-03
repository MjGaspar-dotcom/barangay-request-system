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
        Schema::table('notifications', function (Blueprint $table) {
            // Notification type for filtering (e.g., status_update, new_request, etc.)
            $table->string('type')->default('general')->after('notification_id');

            // Support linking to guest requests too.
            $table->foreignId('guest_request_id')
                ->nullable()
                ->after('request_id')
                ->constrained('guest_requests', 'guest_request_id')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['guest_request_id']);
            $table->dropColumn(['type', 'guest_request_id']);
        });
    }
};
