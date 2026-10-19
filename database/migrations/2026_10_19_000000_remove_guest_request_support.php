<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('notifications') && Schema::hasColumn('notifications', 'guest_request_id')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropConstrainedForeignId('guest_request_id');
            });
        }

        Schema::dropIfExists('guest_requests');
    }

    public function down(): void
    {
        if (!Schema::hasTable('guest_requests')) {
            Schema::create('guest_requests', function (Blueprint $table) {
                $table->id('guest_request_id');
                $table->string('first_name');
                $table->string('middle_name')->nullable();
                $table->string('last_name');
                $table->date('birth_date');
                $table->enum('gender', ['Male', 'Female', 'Prefer not to say']);
                $table->string('civil_status');
                $table->string('address');
                $table->string('contact_number');
                $table->string('email')->nullable();
                $table->string('valid_id_type');
                $table->string('valid_id_image');
                $table->foreignId('document_type_id')
                    ->constrained('document_types', 'document_type_id')
                    ->cascadeOnDelete();
                $table->text('purpose');
                $table->string('tracking_number')->unique();
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
                $table->timestamp('claimed_at')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('notifications') && !Schema::hasColumn('notifications', 'guest_request_id')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->foreignId('guest_request_id')
                    ->nullable()
                    ->after('request_id')
                    ->constrained('guest_requests', 'guest_request_id')
                    ->cascadeOnDelete();
            });
        }
    }
};
