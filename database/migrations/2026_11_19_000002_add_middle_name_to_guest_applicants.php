<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('guest_applicants')) {
            return;
        }

        Schema::table('guest_applicants', function (Blueprint $table): void {
            if (! Schema::hasColumn('guest_applicants', 'middle_name')) {
                $table->string('middle_name')->nullable()->after('first_name');
            }
            if (! Schema::hasColumn('guest_applicants', 'no_middle_name')) {
                $table->boolean('no_middle_name')->default(false)->after('middle_name');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('guest_applicants')) {
            return;
        }

        Schema::table('guest_applicants', function (Blueprint $table): void {
            $columns = array_filter([
                Schema::hasColumn('guest_applicants', 'middle_name') ? 'middle_name' : null,
                Schema::hasColumn('guest_applicants', 'no_middle_name') ? 'no_middle_name' : null,
            ]);
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
