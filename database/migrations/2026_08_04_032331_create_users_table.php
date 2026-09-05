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

            // Authentication
            $table->string('username')->unique();
            $table->string('password');
            $table->rememberToken();

            // Profile
            $table->string('profile_picture')->nullable();

            // Personal information
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');

            $table->date('birth_date');
            $table->string('gender');
            $table->string('civil_status');

            // Contact information
            $table->string('address');
            $table->string('contact_number');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();

            // Valid ID
            // Nullable because admin/staff accounts
            // do not necessarily require resident ID information.
            $table->string('valid_id_type')->nullable();
            $table->string('valid_id_front')->nullable();
            $table->string('valid_id_back')->nullable();

            // Account verification
            $table->enum('verification_status', [
                'pending',
                'verified',
                'rejected',
            ])->default('pending');

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
