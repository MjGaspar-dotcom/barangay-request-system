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
        $this->mock(PdfWorkerService::class, function (MockInterface $mock) use ($generatedBytes): void {
            $mock->shouldReceive('generate')
                ->twice()
                ->andReturnUsing(function (
                    string $templatePath,
                    string $outputPath,
                    array $payload
                ) use ($generatedBytes): void {
                    $this->assertFileExists($templatePath);
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
        $secondVersion = $generation->generate($request, true);

        $this->assertSame(
            $firstVersion->generated_document_id,
            $sameVersion->generated_document_id
        );
        $this->assertSame(1, $firstVersion->version_number);
        $this->assertSame(2, $secondVersion->version_number);
        $this->assertSame(2, GeneratedDocument::query()->count());
        $this->assertNotSame($firstVersion->storage_path, $secondVersion->storage_path);
        $this->assertSame(
            'Avery Mae Santos',
            $secondVersion->data_snapshot['mapped_values']['resident.full_name']
        );
        $this->assertSame(hash('sha256', $generatedBytes), $secondVersion->sha256);
        Storage::disk($disk)->assertExists($firstVersion->storage_path);
        Storage::disk($disk)->assertExists($secondVersion->storage_path);
    }
}
