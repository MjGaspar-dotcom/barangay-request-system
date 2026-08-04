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
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id');

            $table->string('username')->unique();
            $table->string('profile_picture')->nullable();
            $table->string('password');

            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');

            $table->date('birth_date');
            $table->string('gender');
            $table->string('civil_status');

            $table->string('address');
            $table->string('contact_number');

            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();

            $table->string('valid_id_type');
            $table->string('valid_id_front');
            $table->string('valid_id_back')->nullable();

            $table->rememberToken();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};