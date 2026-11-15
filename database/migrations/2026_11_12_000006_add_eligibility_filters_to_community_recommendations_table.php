<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_recommendations', function (Blueprint $table): void {
            $table->json('eligible_genders')->nullable();
            $table->json('eligible_civil_statuses')->nullable();
            $table->boolean('requires_verified')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('community_recommendations', function (Blueprint $table): void {
            $table->dropColumn([
                'eligible_genders',
                'eligible_civil_statuses',
                'requires_verified',
            ]);
        });
    }
};
