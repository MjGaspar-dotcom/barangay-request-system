<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('guest_requests', function (Blueprint $table) {

            $table->id('guest_request_id');

            /*
            |--------------------------------------------------------------------------
            | Guest Personal Information
            |--------------------------------------------------------------------------
            */

            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');

            $table->date('birth_date');

            $table->enum('gender', [
                'Male',
                'Female',
                'Prefer not to say',
            ]);

            $table->string('civil_status');

            $table->string('address');

            $table->string('contact_number');

            $table->string('email')->nullable();

            $table->string('valid_id_type');

            $table->string('valid_id_image');


            /*
            |--------------------------------------------------------------------------
            | Request Details
            |--------------------------------------------------------------------------
            */

            $table->foreignId('document_type_id')
                ->constrained('document_types', 'document_type_id')
                ->cascadeOnDelete();

            $table->text('purpose');

            $table->string('tracking_number')->unique();


            /*
            |--------------------------------------------------------------------------
            | Processing
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'Pending',
                'Approved',
                'Processing',
                'Ready for Pickup',
                'Rejected',
                'Completed',
            ])->default('Pending');

            $table->text('remarks')->nullable();

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('staff', 'staff_id')
                ->nullOnDelete();

            $table->timestamp('verified_at')->nullable();

            $table->timestamp('approved_at')->nullable();

            $table->timestamp('ready_for_pickup_at')->nullable();


            /*
            |--------------------------------------------------------------------------
            | Document Release
            |--------------------------------------------------------------------------
            */

            $table->timestamp('claimed_at')->nullable();


            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guest_requests');
    }
};
