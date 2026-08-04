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
       Schema::create('requests', function (Blueprint $table) {
    $table->id('request_id');

    /*
    |--------------------------------------------------------------------------
    | Requester
    |--------------------------------------------------------------------------
    */

    // Registered resident (NULL if guest)
    $table->foreignId('user_id')
          ->nullable()
          ->constrained('users', 'user_id')
          ->nullOnDelete();

    /*
    |--------------------------------------------------------------------------
    | Guest Information (only when user_id is NULL)
    |--------------------------------------------------------------------------
    */

    $table->string('guest_first_name')->nullable();
    $table->string('guest_middle_name')->nullable();
    $table->string('guest_last_name')->nullable();

    $table->date('guest_birth_date')->nullable();
    $table->string('guest_gender')->nullable();
    $table->string('guest_civil_status')->nullable();

    $table->string('guest_address')->nullable();
    $table->string('guest_contact_number')->nullable();
    $table->string('guest_email')->nullable();

    $table->string('guest_valid_id_type')->nullable();
    $table->string('guest_valid_id_image')->nullable();

    /*
    |--------------------------------------------------------------------------
    | Request Details
    |--------------------------------------------------------------------------
    */

    $table->foreignId('document_type_id')
          ->constrained('document_types', 'document_type_id')
          ->cascadeOnDelete();

    $table->text('purpose');

    /*
    |--------------------------------------------------------------------------
    | Processing
    |--------------------------------------------------------------------------
    */

    $table->enum('status', [
        'Pending',
        'Approved',
        'Rejected',
        'Completed',
    ])->default('Pending');

    $table->text('remarks')->nullable();

    $table->foreignId('verified_by')
          ->nullable()
          ->constrained('staff', 'staff_id')
          ->nullOnDelete();

    $table->timestamp('verified_at')->nullable();

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
        Schema::dropIfExists('requests');
    }
};
