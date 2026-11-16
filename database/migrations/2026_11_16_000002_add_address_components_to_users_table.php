<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('barangay_name')->nullable();
            $table->string('municipality')->nullable();
            $table->string('province')->nullable();
            $table->string('postal_code', 20)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'barangay_name',
                'municipality',
                'province',
                'postal_code',
            ]);
        });
    }
};
