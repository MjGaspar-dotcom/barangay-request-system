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
                    file_put_contents($outputPath, $generatedBytes);
                });
        });

        $this->actingAs($staffUser);
        $generation = app(PdfTemplateGenerationService::class);
        $firstVersion = $generation->generate($request);
        $sameVersion = $generation->generate($request);

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
            'system_field' => 'resident.full_name',
            'is_required' => true,
        ]);

        Storage::disk($disk)->put(
            $templateVersion->storage_path,
            'DOCX template fixture'
        );
        $generatedBytes = "%PDF-1.4\nGenerated from DOCX.\n";
        $this->mock(PdfWorkerService::class, function (MockInterface $mock) use ($generatedBytes): void {
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
                        'AVERY MAE SANTOS',
                        $payload['placeholder_values']['{{FULL_NAME}}']
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
}
