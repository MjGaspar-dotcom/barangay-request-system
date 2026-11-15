<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_types', function (Blueprint $table) {
            $table->unsignedSmallInteger('processing_time_minutes')->default(10);
        });

        Schema::table('document_types', function (Blueprint $table) {
            $table->dropColumn('processing_days');
        });
    }

    public function down(): void
    {
        Schema::table('document_types', function (Blueprint $table) {
            $table->unsignedTinyInteger('processing_days')->default(1);
        });

        Schema::table('document_types', function (Blueprint $table) {
            $table->dropColumn('processing_time_minutes');
        });
    }
};
