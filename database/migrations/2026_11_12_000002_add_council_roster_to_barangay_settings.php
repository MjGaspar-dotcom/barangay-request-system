<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangay_settings', function (Blueprint $table): void {
            $table->json('council_roster')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('barangay_settings', function (Blueprint $table): void {
            $table->dropColumn('council_roster');
        });
    }
};
