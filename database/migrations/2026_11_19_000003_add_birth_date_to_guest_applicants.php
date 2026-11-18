<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            Schema::hasTable('guest_applicants') &&
            ! Schema::hasColumn('guest_applicants', 'birth_date')
        ) {
            Schema::table('guest_applicants', function (Blueprint $table): void {
                $table->date('birth_date')->nullable()->after('last_name');
            });
        }
    }

    public function down(): void
    {
        if (
            Schema::hasTable('guest_applicants') &&
            Schema::hasColumn('guest_applicants', 'birth_date')
        ) {
            Schema::table('guest_applicants', function (Blueprint $table): void {
                $table->dropColumn('birth_date');
            });
        }
    }
};
