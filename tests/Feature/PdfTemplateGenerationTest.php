<?php

namespace Tests\Feature;

use App\Models\BarangayRequest;
use App\Models\DocumentTemplate;
use App\Models\DocumentTemplateFieldMapping;
use App\Models\DocumentTemplateVersion;
use App\Models\DocumentType;
use App\Models\GeneratedDocument;
use App\Models\User;
use App\Services\PdfTemplateGenerationService;
use App\Services\PdfWorkerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class PdfTemplateGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_generated_pdfs_are_persisted_as_immutable_versions(): void
    {
        $staffUser = User::factory()->create();
        $resident = User::factory()->create([
            'first_name' => 'Avery',
            'middle_name' => 'Mae',
            'last_name' => 'Santos',
            'verification_status' => 'verified',
            'valid_id_front' => 'ids/verified.jpg',
        ]);
        $documentType = DocumentType::query()
            ->where('document_name', 'Certificate of Residency')
            ->firstOrFail();
        $request = BarangayRequest::create([
            'user_id' => $resident->user_id,
            'document_type_id' => $documentType->document_type_id,
            'purpose' => 'Proof of residence',
            'tracking_number' => 'BR-20261115-PDFTEST',
            'status' => 'ready_for_pickup',
            'approved_at' => now(),
        ]);
        $template = DocumentTemplate::create([
            'document_type_id' => $documentType->document_type_id,
        ]);
        $templateVersion = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 1,
            'storage_disk' => 'local',
            'storage_path' => 'document-templates/residency.pdf',
            'original_name' => 'residency.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 12,
            'sha256' => hash('sha256', '%PDF-1.4'),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);
        DocumentTemplateFieldMapping::create([
            'template_version_id' => $templateVersion->template_version_id,
            'field_name' => 'resident-name',
            'field_type' => 'overlay',
            'system_field' => 'resident.full_name',
            'page_number' => 1,
            'x' => 0.1,
            'y' => 0.1,
            'width' => 0.4,
            'height' => 0.05,
            'font_size' => 12,
            'font_family' => 'Helvetica',
            'text_align' => 'left',
            'is_required' => true,
        ]);

        $disk = config('filesystems.private_upload_disk');
        Storage::fake($disk);
        Storage::disk($disk)->put(
            $templateVersion->storage_path,
            "%PDF-1.4\n"
        );
        $generatedBytes = "%PDF-1.4\nGenerated immutable document.\n";
        $workerCalls = 0;
        $latestTemplatePath = 'document-templates/residency-v2.pdf';
        $this->mock(PdfWorkerService::class, function (MockInterface $mock) use (
            $generatedBytes,
            $latestTemplatePath,
            &$workerCalls
        ): void {
            $mock->shouldReceive('generate')
                ->times(3)
                ->andReturnUsing(function (
                    string $templatePath,
                    string $outputPath,
                    array $payload
                ) use ($generatedBytes, $latestTemplatePath, &$workerCalls): void {
                    $workerCalls++;
                    $this->assertFileExists($templatePath);
                    $this->assertSame(
                        $workerCalls === 1
                            ? "%PDF-1.4\n"
                            : "%PDF-1.4\nLatest template.\n",
                        file_get_contents($templatePath)
                    );
                    $this->assertSame(
                        'Avery Mae Santos',
                        $payload['overlays'][0]['value']
                    );
                    $this->assertSame(
                        base_path('frontend/public/assets/images/logo.webp'),
                        $payload['brand_logo_path']
                    );
                    file_put_contents($outputPath, $generatedBytes);
                });
        });

        $this->actingAs($staffUser);
        $generation = app(PdfTemplateGenerationService::class);
        $firstVersion = $generation->generate($request);
        $sameVersion = $generation->generate($request);
        $this->assertSame(
            'center-watermark-v1',
            $firstVersion->data_snapshot['branding_version']
        );

        $templateVersion->update(['is_active' => false]);
        $latestTemplateVersion = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 2,
            'storage_disk' => 'local',
            'storage_path' => $latestTemplatePath,
            'original_name' => 'residency-v2.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 28,
            'sha256' => hash('sha256', "%PDF-1.4\nLatest template.\n"),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);
        DocumentTemplateFieldMapping::create([
            'template_version_id' => $latestTemplateVersion->template_version_id,
            'field_name' => 'resident-name',
            'field_type' => 'overlay',
            'system_field' => 'resident.full_name',
            'page_number' => 1,
            'x' => 0.1,
            'y' => 0.1,
            'width' => 0.4,
            'height' => 0.05,
            'font_size' => 12,
            'font_family' => 'Helvetica',
            'text_align' => 'left',
            'is_required' => true,
        ]);
        Storage::disk($disk)->put(
            $latestTemplatePath,
            "%PDF-1.4\nLatest template.\n"
        );

        $latestTemplateDocument = $generation->generate($request);
        $sameLatestTemplateDocument = $generation->generate($request);
        $thirdVersion = $generation->generate($request, true);

        $this->assertSame(
            $firstVersion->generated_document_id,
            $sameVersion->generated_document_id
        );
        $this->assertSame(
            $latestTemplateDocument->generated_document_id,
            $sameLatestTemplateDocument->generated_document_id
        );
        $this->assertSame(1, $firstVersion->version_number);
        $this->assertSame(2, $latestTemplateDocument->version_number);
        $this->assertSame(3, $thirdVersion->version_number);
        $this->assertSame(3, GeneratedDocument::query()->count());
        $this->assertSame(
            $latestTemplateVersion->template_version_id,
            $latestTemplateDocument->template_version_id
        );
        $this->assertNotSame($firstVersion->storage_path, $latestTemplateDocument->storage_path);
        $this->assertNotSame($latestTemplateDocument->storage_path, $thirdVersion->storage_path);
        $this->assertSame(
            'Avery Mae Santos',
            $thirdVersion->data_snapshot['mapped_values']['resident.full_name']
        );
        $this->assertSame(hash('sha256', $generatedBytes), $thirdVersion->sha256);
        Storage::disk($disk)->assertExists($firstVersion->storage_path);
        Storage::disk($disk)->assertExists($latestTemplateDocument->storage_path);
        Storage::disk($disk)->assertExists($thirdVersion->storage_path);
    }

    public function test_docx_templates_generate_missing_pdf_for_completed_legacy_request(): void
    {
        $staffUser = User::factory()->create();
        $resident = User::factory()->create([
            'first_name' => 'Avery',
            'middle_name' => 'Mae',
            'last_name' => 'Santos',
            'verification_status' => 'verified',
            'valid_id_front' => 'ids/verified.jpg',
        ]);
        $documentType = DocumentType::query()
            ->where('document_name', 'Certificate of Residency')
            ->firstOrFail();
        $request = BarangayRequest::create([
            'user_id' => $resident->user_id,
            'document_type_id' => $documentType->document_type_id,
            'purpose' => 'School enrollment',
            'tracking_number' => 'BR-20261115-DOCXTEST',
            'status' => 'completed',
            'approved_at' => now(),
        ]);
        $disk = config('filesystems.private_upload_disk');
        Storage::fake($disk);
        $template = DocumentTemplate::create([
            'document_type_id' => $documentType->document_type_id,
        ]);
        $templateVersion = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 1,
            'storage_disk' => $disk,
            'storage_path' => 'document-templates/residency.docx',
            'original_name' => 'residency.docx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'file_size' => 12,
            'sha256' => hash('sha256', 'DOCX template'),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);
        DocumentTemplateFieldMapping::create([
            'template_version_id' => $templateVersion->template_version_id,
            'field_name' => '{{FULL_NAME}}',
            'field_type' => 'docx_placeholder',
            'system_field' => 'resident.first_name',
            'is_required' => true,
        ]);

        Storage::disk($disk)->put(
            $templateVersion->storage_path,
            'DOCX template fixture'
        );
        $generatedBytes = "%PDF-1.4\nGenerated from DOCX.\n";
        $inspection = [
            'page_count' => 1,
            'has_acroform' => false,
            'fields' => [
                [
                    'name' => '{{FULL_NAME}}',
                    'type' => '/DocxPlaceholder',
                    'supported' => false,
                ],
                [
                    'name' => '{{EFFECTIVE_DATE}}',
                    'type' => '/DocxPlaceholder',
                    'supported' => false,
                ],
            ],
            'pages' => [],
        ];
        $this->mock(PdfWorkerService::class, function (MockInterface $mock) use (
            $generatedBytes,
            $inspection
        ): void {
            $mock->shouldReceive('inspect')
                ->times(3)
                ->with(Mockery::type('string'), 'docx')
                ->andReturn($inspection);
            $mock->shouldReceive('generate')
                ->once()
                ->andReturnUsing(function (
                    string $templatePath,
                    string $outputPath,
                    array $payload,
                    string $format
                ) use ($generatedBytes): void {
                    $this->assertSame('docx', $format);
                    $this->assertSame(
                        'AVERY',
                        $payload['placeholder_values']['{{FULL_NAME}}']
                    );
                    $this->assertNotEmpty(
                        $payload['placeholder_values']['{{EFFECTIVE_DATE}}']
                    );
                    $this->assertSame(
                        base_path('frontend/public/assets/images/logo.webp'),
                        $payload['brand_logo_path']
                    );
                    file_put_contents($outputPath, $generatedBytes);
                });
        });

        $this->actingAs($staffUser);
        $generated = app(PdfTemplateGenerationService::class)->generate($request);

        $this->assertSame('application/pdf', $generated->mime_type);
        $this->assertSame('uploaded_pdf_template', $request->fresh()->document_template_identifier);
        Storage::disk($disk)->assertExists($generated->storage_path);
        $generation = app(PdfTemplateGenerationService::class);
        $this->assertSame(
            $generated->generated_document_id,
            $generation->generate($request)->generated_document_id
        );
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage(
            'A completed request cannot have its document regenerated.'
        );
        $generation->generate($request, true);
    }

    public function test_watermark_command_adds_a_new_version_and_is_idempotent(): void
    {
        $staffUser = User::factory()->create();
        $resident = User::factory()->create([
            'verification_status' => 'verified',
            'valid_id_front' => 'ids/verified.jpg',
        ]);
        $documentType = DocumentType::query()
            ->where('document_name', 'Certificate of Residency')
            ->firstOrFail();
        $request = BarangayRequest::create([
            'user_id' => $resident->user_id,
            'document_type_id' => $documentType->document_type_id,
            'purpose' => 'Proof of residence',
            'tracking_number' => 'BR-20261117-WATERMARK',
            'document_number' => 'BA-2026-099001',
            'status' => 'completed',
            'approved_at' => now(),
        ]);
        $template = DocumentTemplate::create([
            'document_type_id' => $documentType->document_type_id,
        ]);
        $templateVersion = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 1,
            'storage_disk' => 'local',
            'storage_path' => 'document-templates/residency.pdf',
            'original_name' => 'residency.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 12,
            'sha256' => hash('sha256', '%PDF-1.4'),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);

        $disk = config('filesystems.private_upload_disk');
        Storage::fake($disk);
        $sourceBytes = "%PDF-1.4\nOriginal PDF.\n";
        $brandedBytes = "%PDF-1.4\nWatermarked PDF.\n";
        $sourcePath = sprintf(
            'generated-documents/%s/source.pdf',
            $request->request_id
        );
        Storage::disk($disk)->put($sourcePath, $sourceBytes);
        $source = GeneratedDocument::create([
            'request_id' => $request->request_id,
            'template_version_id' => $templateVersion->template_version_id,
            'version_number' => 1,
            'document_number' => $request->document_number,
            'storage_disk' => $disk,
            'storage_path' => $sourcePath,
            'original_name' => 'certificate-of-residency-BA-2026-099001-v1.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => strlen($sourceBytes),
            'sha256' => hash('sha256', $sourceBytes),
            'data_snapshot' => [
                'document_type' => 'Certificate of Residency',
                'document_number' => $request->document_number,
            ],
            'generated_by' => $staffUser->user_id,
            'generated_at' => now(),
        ]);

        $this->mock(PdfWorkerService::class, function (MockInterface $mock) use (
            $sourceBytes,
            $brandedBytes
        ): void {
            $mock->shouldReceive('generate')
                ->once()
                ->andReturnUsing(function (
                    string $templatePath,
                    string $outputPath,
                    array $payload,
                    string $format
                ) use ($sourceBytes, $brandedBytes): void {
                    $this->assertSame($sourceBytes, file_get_contents($templatePath));
                    $this->assertSame('pdf', $format);
                    $this->assertTrue($payload['watermark_only']);
                    $this->assertSame(
                        base_path('frontend/public/assets/images/logo.webp'),
                        $payload['brand_logo_path']
                    );
                    file_put_contents($outputPath, $brandedBytes);
                });
        });

        $this->artisan('documents:watermark-existing')
            ->assertExitCode(0);

        $latest = $request->fresh()->generatedDocuments()->firstOrFail();
        $this->assertNotSame($source->generated_document_id, $latest->generated_document_id);
        $this->assertSame(2, $latest->version_number);
        $this->assertSame(
            'center-watermark-v1',
            $latest->data_snapshot['branding_version']
        );
        $this->assertSame(hash('sha256', $brandedBytes), $latest->sha256);
        $this->assertSame(
            $sourceBytes,
            Storage::disk($disk)->get($sourcePath)
        );
        Storage::disk($disk)->assertExists($latest->storage_path);

        $this->artisan('documents:watermark-existing')
            ->assertExitCode(0);
        $this->assertCount(2, $request->fresh()->generatedDocuments);
    }
}
