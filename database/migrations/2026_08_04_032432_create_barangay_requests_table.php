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
        Schema::create('barangay_requests', function (Blueprint $table) {

            $table->id('request_id');

            /*
            |--------------------------------------------------------------------------
            | Requester
            |--------------------------------------------------------------------------
            */

            // Registered user
            $table->foreignId('user_id')
                ->constrained('users', 'user_id')
                ->cascadeOnDelete();

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
        Schema::dropIfExists('barangay_requests');
    }
};