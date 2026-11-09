<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('guest_requests')) {
            $storage = Storage::disk('public');

            DB::table('guest_requests')
                ->select('guest_request_id', 'valid_id_image')
                ->orderBy('guest_request_id')
                ->chunkById(100, function ($requests) use ($storage): void {
                    foreach ($requests as $request) {
                        if (
                            is_string($request->valid_id_image) &&
                            str_starts_with($request->valid_id_image, 'guest-valid-ids/')
                        ) {
                            $path = $request->valid_id_image;
                            if (
                                $storage->exists($path) &&
                                !$storage->delete($path)
                            ) {
                                throw new RuntimeException(
                                    "Unable to delete guest ID image: {$path}"
                                );
                            }
                        }
                    }
                }, 'guest_request_id');
        }

        if (
            Schema::hasTable('notifications') &&
            Schema::hasColumn('notifications', 'guest_request_id')
        ) {
            DB::table('notifications')
                ->whereNotNull('guest_request_id')
                ->delete();

            Schema::table('notifications', function (Blueprint $table): void {
                $table->dropForeign(['guest_request_id']);
                $table->dropColumn('guest_request_id');
            });
        }

        Schema::dropIfExists('guest_requests');
    }

    public function down(): void
    {
        // Guest request data and uploaded IDs removed by up() cannot be restored.
        Schema::create('guest_requests', function (Blueprint $table): void {
            $table->id('guest_request_id');
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
            $table->index(
                ['created_at', 'deleted_at'],
                'guest_requests_analytics_created_deleted_index'
            );
        });

        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table): void {
                $table->foreignId('guest_request_id')
                    ->nullable()
                    ->after('request_id')
                    ->constrained('guest_requests', 'guest_request_id')
                    ->cascadeOnDelete();
            });
        }
    }
};
