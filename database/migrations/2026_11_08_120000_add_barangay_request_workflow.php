<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE barangay_requests MODIFY COLUMN status ENUM('Pending', 'Additional Requirements', 'Approved', 'Rejected', 'Processing', 'Ready for Pickup', 'Completed') NOT NULL DEFAULT 'Pending'");
        }

        Schema::table('barangay_requests', function (Blueprint $table): void {
            $table->timestamp('processing_started_at')->nullable();
            $table->foreignId('processing_by')
                ->nullable()
                ->constrained('users', 'user_id')
                ->nullOnDelete();
            $table->timestamp('document_prepared_at')->nullable();
            $table->foreignId('document_prepared_by')
                ->nullable()
                ->constrained('users', 'user_id')
                ->nullOnDelete();
            $table->timestamp('document_signed_at')->nullable();
            $table->foreignId('document_signed_by')
                ->nullable()
                ->constrained('users', 'user_id')
                ->nullOnDelete();
            $table->string('release_recipient_name')->nullable();
            $table->foreignId('released_by')
                ->nullable()
                ->constrained('users', 'user_id')
                ->nullOnDelete();
        });

        Schema::create('barangay_request_documents', function (Blueprint $table): void {
            $table->id('request_document_id');
            $table->foreignId('request_id')
                ->constrained('barangay_requests', 'request_id')
                ->cascadeOnDelete();
            $table->foreignId('uploaded_by')
                ->nullable()
                ->constrained('users', 'user_id')
                ->nullOnDelete();
            $table->enum('purpose', [
                'additional_requirement',
                'prepared_document',
                'signed_document',
            ]);
            $table->string('original_name');
            $table->string('storage_path');
            $table->string('mime_type', 100);
            $table->timestamps();

            $table->index(['request_id', 'purpose']);
        });

        Schema::table('barangay_requests', function (Blueprint $table): void {
            $table->foreignId('prepared_document_id')
                ->nullable()
                ->constrained('barangay_request_documents', 'request_document_id')
                ->nullOnDelete();
            $table->foreignId('signed_document_id')
                ->nullable()
                ->constrained('barangay_request_documents', 'request_document_id')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('barangay_requests', function (Blueprint $table): void {
            $table->dropForeign(['prepared_document_id']);
            $table->dropForeign(['signed_document_id']);
            $table->dropColumn(['prepared_document_id', 'signed_document_id']);
        });
        Schema::dropIfExists('barangay_request_documents');
        DB::table('barangay_requests')
            ->where('status', 'Additional Requirements')
            ->update(['status' => 'Pending']);

        Schema::table('barangay_requests', function (Blueprint $table): void {
            $table->dropForeign(['processing_by']);
            $table->dropForeign(['document_prepared_by']);
            $table->dropForeign(['document_signed_by']);
            $table->dropForeign(['released_by']);
            $table->dropColumn([
                'processing_started_at',
                'processing_by',
                'document_prepared_at',
                'document_prepared_by',
                'document_signed_at',
                'document_signed_by',
                'release_recipient_name',
                'released_by',
            ]);
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE barangay_requests MODIFY COLUMN status ENUM('Pending', 'Processing', 'Approved', 'Ready for Pickup', 'Rejected', 'Completed') NOT NULL DEFAULT 'Pending'");
        }
    }
};
