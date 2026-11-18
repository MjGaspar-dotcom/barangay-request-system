<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            Schema::hasTable('guest_applicants') &&
            Schema::hasColumn('guest_applicants', 'valid_id_type')
        ) {
            Schema::table('guest_applicants', function (Blueprint $table): void {
                $table->string('valid_id_type', 120)->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (
            Schema::hasTable('guest_applicants') &&
            Schema::hasColumn('guest_applicants', 'valid_id_type')
        ) {
            if (DB::table('guest_applicants')->whereNull('valid_id_type')->exists()) {
                throw new RuntimeException(
                    'Guest ID types must be verified before making them mandatory again.'
                );
            }

            Schema::table('guest_applicants', function (Blueprint $table): void {
                $table->string('valid_id_type', 120)->nullable(false)->change();
            });
        }
    }
};
