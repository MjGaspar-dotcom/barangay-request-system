<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id('staff_id');

            $table->foreignId('user_id')
                  ->unique()
                  ->constrained('users','user_id')
                  ->cascadeOnDelete();

            $table->foreignId('assigned_by')
                  ->constrained('admins','admin_id')
                  ->cascadeOnDelete();

           

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
