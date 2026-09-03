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
        Schema::table('audit_logs', function (Blueprint $table) {
            // Allow tracking actions by any user, not just staff.
            $table->foreignId('user_id')
                ->nullable()
                ->after('audit_log_id')
                ->constrained('users', 'user_id')
                ->nullOnDelete();

            // Store what changed — old and new values as JSON.
            $table->json('old_values')->nullable()->after('description');
            $table->json('new_values')->nullable()->after('old_values');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'old_values', 'new_values']);
        });
    }
};
