<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('document_templates')) {
            Schema::create('document_templates', function (Blueprint $table): void {
                $table->id('template_id');
                $table->foreignId('document_type_id')
                    ->unique()
                    ->constrained('document_types', 'document_type_id')
                    ->cascadeOnDelete();
                $table->foreignId('deleted_by')
                    ->nullable()
                    ->constrained('users', 'user_id')
                    ->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('document_template_versions')) {
            Schema::create('document_template_versions', function (Blueprint $table): void {
                $table->id('template_version_id');
                $table->foreignId('template_id')
                    ->constrained('document_templates', 'template_id')
                    ->cascadeOnDelete();
                $table->unsignedSmallInteger('version_number');
                $table->string('storage_disk', 50);
                $table->string('storage_path');
                $table->string('original_name');
                $table->string('mime_type', 100);
                $table->unsignedBigInteger('file_size');
                $table->char('sha256', 64);
                $table->unsignedSmallInteger('page_count');
                $table->boolean('has_acroform')->default(false);
                $table->boolean('is_active')->default(true);
                $table->foreignId('uploaded_by')
                    ->nullable()
                    ->constrained('users', 'user_id')
                    ->nullOnDelete();
                $table->timestamp('replaced_at')->nullable();
                $table->foreignId('replaced_by')
                    ->nullable()
                    ->constrained('users', 'user_id')
                    ->nullOnDelete();
                $table->timestamps();

                $table->unique(
                    ['template_id', 'version_number'],
                    'dtv_template_version_unique'
                );
                $table->index(
                    ['template_id', 'is_active'],
                    'dtv_template_active_index'
                );
            });
        }

        if (!Schema::hasTable('document_template_field_mappings')) {
            Schema::create('document_template_field_mappings', function (Blueprint $table): void {
                $table->id('field_mapping_id');
                $table->foreignId('template_version_id')
                    ->constrained('document_template_versions', 'template_version_id')
                    ->cascadeOnDelete();
                $table->string('field_name', 255);
                $table->string('field_type', 20);
                $table->string('system_field', 100);
                $table->unsignedSmallInteger('page_number')->nullable();
                $table->decimal('x', 10, 7)->nullable();
                $table->decimal('y', 10, 7)->nullable();
                $table->decimal('width', 10, 7)->nullable();
                $table->decimal('height', 10, 7)->nullable();
                $table->decimal('font_size', 5, 2)->default(12);
                $table->string('font_family', 30)->default('Helvetica');
                $table->string('text_align', 10)->default('left');
                $table->boolean('is_required')->default(false);
                $table->timestamps();
            });
        }

        if (!Schema::hasIndex(
            'document_template_field_mappings',
            'dtfm_version_field_unique'
        )) {
            Schema::table('document_template_field_mappings', function (Blueprint $table): void {
                $table->unique(
                    ['template_version_id', 'field_name'],
                    'dtfm_version_field_unique'
                );
            });
        }
        if (!Schema::hasIndex(
            'document_template_field_mappings',
            'dtfm_version_type_index'
        )) {
            Schema::table('document_template_field_mappings', function (Blueprint $table): void {
                $table->index(
                    ['template_version_id', 'field_type'],
                    'dtfm_version_type_index'
                );
            });
        }

        if (!Schema::hasTable('generated_documents')) {
            Schema::create('generated_documents', function (Blueprint $table): void {
                $table->id('generated_document_id');
                $table->foreignId('request_id')
                    ->constrained('barangay_requests', 'request_id')
                    ->cascadeOnDelete();
                $table->foreignId('template_version_id')
                    ->constrained('document_template_versions', 'template_version_id')
                    ->restrictOnDelete();
                $table->unsignedInteger('version_number');
                $table->string('document_number', 40)->nullable();
                $table->string('storage_disk', 50);
                $table->string('storage_path');
                $table->string('original_name');
                $table->string('mime_type', 100)->default('application/pdf');
                $table->unsignedBigInteger('file_size');
                $table->char('sha256', 64);
                $table->json('data_snapshot');
                $table->foreignId('generated_by')
                    ->nullable()
                    ->constrained('users', 'user_id')
                    ->nullOnDelete();
                $table->timestamp('generated_at');
                $table->timestamps();

                $table->unique(
                    ['request_id', 'version_number'],
                    'gd_request_version_unique'
                );
                $table->index(
                    ['request_id', 'generated_at'],
                    'gd_request_generated_index'
                );
            });
        }

        $supportedTypes = [
            'Barangay Clearance' => ['Barangay Clearance'],
            'Certificate of Residency' => ['Certificate of Residency'],
            'Certificate of Indigency' => ['Certificate of Indigency'],
            'Barangay Business Clearance' => ['Barangay Business Clearance'],
            'Certificate of First-Time Job Seeker' => [
                'Certificate of First-Time Job Seeker',
                'First-Time Job Seeker Certificate',
            ],
            'Certificate of Good Moral Character' => [
                'Certificate of Good Moral Character',
            ],
            'Certificate of Low Income' => ['Certificate of Low Income'],
            'Certificate of No Income' => ['Certificate of No Income'],
            'Certificate of Unemployment' => ['Certificate of Unemployment'],
            'Certificate of Actual Residency' => ['Certificate of Actual Residency'],
            'Certificate of Solo Parent' => ['Certificate of Solo Parent'],
            'Certificate of Family Composition' => ['Certificate of Family Composition'],
            'Certificate of Appearance' => ['Certificate of Appearance'],
            'Certificate of Blotter' => ['Certificate of Blotter'],
            'Certificate of No Pending Complaint' => [
                'Certificate of No Pending Complaint',
            ],
        ];

        foreach ($supportedTypes as $documentName => $existingNames) {
            $alreadyExists = DB::table('document_types')
                ->where(function ($query) use ($existingNames): void {
                    foreach ($existingNames as $existingName) {
                        $query->orWhereRaw(
                            'LOWER(document_name) = ?',
                            [mb_strtolower($existingName)]
                        );
                    }
                })
                ->exists();
            if (!$alreadyExists) {
                DB::table('document_types')->insert([
                    'document_name' => $documentName,
                    'description' => null,
                    'processing_time_minutes' => 10,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('generated_documents');
        Schema::dropIfExists('document_template_field_mappings');
        Schema::dropIfExists('document_template_versions');
        Schema::dropIfExists('document_templates');
    }
};
