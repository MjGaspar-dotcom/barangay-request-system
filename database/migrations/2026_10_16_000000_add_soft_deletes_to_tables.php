<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * Adds soft-delete support (deleted_at column) to the core tables.
     * Models must also use the SoftDeletes trait for this to take effect.
     */
    public function up(): void
    {
        Schema::table('barangay_requests', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('guest_requests', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('document_types', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('barangay_requests', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('guest_requests', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('document_types', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
