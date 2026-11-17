<?php

namespace Tests\Feature;

use App\Jobs\GenerateRequestPdf;
use App\Models\Admin;
use App\Models\BarangayRequest;
use App\Models\DocumentGenerationProfile;
use App\Models\DocumentTemplate;
use App\Models\DocumentTemplateFieldMapping;
use App\Models\DocumentTemplateVersion;
use App\Models\DocumentType;
use App\Models\GeneratedDocument;
use App\Models\Staff;
use App\Models\User;
use App\Services\DocumentTemplateDataFieldService;
use App\Services\PdfTemplateGenerationService;
use App\Services\PdfWorkerService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class DocumentGenerationTest extends TestCase
{
    use RefreshDatabase;

    private User $resident;

    private User $staffUser;

    private User $adminUser;

    private Staff $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resident = User::factory()->create([
            'first_name' => 'Maria',
            'middle_name' => 'Santos',
            'last_name' => 'Dela Cruz',
            'birth_date' => '1990-04-15',
            'civil_status' => 'Single',
            'street_name' => '12 Sample Street',
            'address' => '12 Sample Street, Barangay Aurora',
            'verification_status' => 'verified',
        ]);
        Storage::fake('public');
        Storage::disk('public')->put('ids/front.jpg', 'mobile-id-image');
        $this->resident->update(['valid_id_front' => 'ids/front.jpg']);
        $this->adminUser = User::factory()->create();
        $admin = Admin::create(['user_id' => $this->adminUser->user_id]);
        $this->staffUser = User::factory()->create();
        $this->staff = Staff::create([
            'user_id' => $this->staffUser->user_id,
            'assigned_by' => $admin->admin_id,
        ]);

        DocumentGenerationProfile::query()->whereKey(1)->update([
            'municipality' => 'Test Municipality',
            'province' => 'Test Province',
            'punong_barangay_name' => 'Test Punong Barangay',
            'seal_path' => 'barangay-seals/test-seal.png',
            'office_address' => 'Test Office',
            'contact_information' => '09123456789',
            'council_roster' => [
                ['name' => 'Test Council Member', 'position' => 'Council Member'],
                ['name' => 'Test Secretary', 'position' => 'Barangay Secretary'],
            ],
        ]);
    }

    public function test_document_generation_profile_preserves_configuration_and_dynamic_field_values(): void
    {
        $profile = DocumentGenerationProfile::query()->findOrFail(1);

        $this->assertFalse(Schema::hasTable('barangay_settings'));
        $this->assertSame('Barangay Aurora', $profile->barangay_name);
        $this->assertSame('Test Municipality', $profile->municipality);
        $this->assertSame('Test Province', $profile->province);
        $this->assertSame('Test Punong Barangay', $profile->punong_barangay_name);
        $this->assertSame(
            [
                ['name' => 'Test Council Member', 'position' => 'Council Member'],
                ['name' => 'Test Secretary', 'position' => 'Barangay Secretary'],
            ],
            $profile->council_roster
        );

        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Barangay clearance',
        ]);
        $request = $this->readyRequest($documentType, 'profile-values');
        $values = app(DocumentTemplateDataFieldService::class)->values(
            $request,
            'BA-2026-000001',
            CarbonImmutable::parse('2026-11-15')
        );

        $this->assertSame('Barangay Aurora', $values['barangay.name']);
        $this->assertSame('12 Sample Street', $values['resident.street_name']);
        $this->assertSame(
            '12 Sample Street, Barangay Aurora',
            $values['resident.address']
        );
        $this->assertSame('Test Municipality', $values['barangay.municipality']);
        $this->assertSame('Test Province', $values['barangay.province']);
        $this->assertSame('36', $values['resident.age']);
        $this->assertSame('Test Office', $values['barangay.address']);
        $this->assertSame('Test Punong Barangay', $values['barangay.captain']);
    }

    public function test_staff_can_complete_pickup_without_entering_a_recipient_name(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Barangay clearance',
        ]);
        $request = $this->readyRequest($documentType, 'complete-pickup');
        $template = DocumentTemplate::create([
            'document_type_id' => $documentType->document_type_id,
        ]);
        $templateVersion = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 1,
            'storage_disk' => 'local',
            'storage_path' => 'document-templates/clearance.pdf',
            'original_name' => 'clearance.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'sha256' => hash('sha256', '%PDF-1.4'),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);
        $generatedDocument = GeneratedDocument::create([
            'request_id' => $request->request_id,
            'template_version_id' => $templateVersion->template_version_id,
            'version_number' => 1,
            'document_number' => 'BA-2026-000001',
            'storage_disk' => 'local',
            'storage_path' => 'generated-documents/clearance.pdf',
            'original_name' => 'clearance.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'sha256' => hash('sha256', '%PDF-1.4'),
            'data_snapshot' => [],
            'generated_at' => now(),
        ]);
        $request->update([
            'document_template_identifier' => 'uploaded_pdf_template',
        ]);

        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'completed',
            ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Print the official PDF before completing this request.'
            );

        $printUrl = "/api/barangay-requests/{$request->request_id}/generated-document/print";
        $this->postJson($printUrl, [
            'generated_document_id' => $generatedDocument->generated_document_id,
        ])
            ->assertOk()
            ->assertJsonPath('data.action', 'document_printed');

        $this->putJson("/api/barangay-requests/{$request->request_id}", [
            'status' => 'completed',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.release_recipient_name', null);

        $request->refresh();
        $this->assertNotNull($request->claimed_at);
        $this->assertSame($this->staffUser->user_id, $request->released_by);

        $this->postJson($printUrl, [
            'generated_document_id' => $generatedDocument->generated_document_id,
        ])
            ->assertOk()
            ->assertJsonPath('data.action', 'document_reprinted');
    }

    public function test_staff_cannot_complete_a_legacy_request_without_a_generated_pdf(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Barangay clearance',
        ]);
        $request = $this->readyRequest($documentType, 'legacy-completion');

        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'completed',
            ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Generate the official PDF from an uploaded template before completing this request.'
            );

        $this->assertSame(
            'ready_for_pickup',
            $request->fresh()->status
        );
    }

    public function test_request_cannot_be_approved_for_pickup_without_an_uploaded_pdf_template(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Certificate of Indigency',
            'description' => 'Indigency certificate',
        ]);
        $request = $this->submittedRequest($documentType, 'indigency-explicit');

        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$request->request_id}/approve-and-prepare")
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment([
                'message' => 'Upload an active PDF template for this document type before marking the request ready for pickup.',
            ]);

        $request->refresh();
        $this->assertSame('request_submitted', $request->status);
        $this->assertNull($request->approved_at);
    }

    public function test_approval_uses_mobile_account_verification_without_request_level_id_check(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'mobile-id');

        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'approved',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.requirements_complete', false);
    }

    public function test_pdf_generation_fails_fast_with_actionable_verification_error(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'verification-reset');
        $request->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);
        $this->resident->update([
            'verification_status' => 'pending',
            'valid_id_front' => null,
        ]);

        (new GenerateRequestPdf($request->request_id))->handle(
            app(PdfTemplateGenerationService::class)
        );

        $request->refresh();
        $this->assertSame('failed', $request->document_generation_status);
        $this->assertSame(
            'The resident account and ID must be verified before generating an official PDF.',
            $request->document_generation_error
        );
    }

    public function test_approved_request_moves_to_ready_when_pdf_generation_succeeds(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'approved-recovery');
        $request->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);
        $template = DocumentTemplate::create([
            'document_type_id' => $documentType->document_type_id,
        ]);
        $templateVersion = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 1,
            'storage_disk' => 'local',
            'storage_path' => 'document-templates/recovery.pdf',
            'original_name' => 'recovery.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'sha256' => hash('sha256', '%PDF-1.4'),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);
        $generatedDocument = GeneratedDocument::create([
            'request_id' => $request->request_id,
            'template_version_id' => $templateVersion->template_version_id,
            'version_number' => 1,
            'document_number' => 'BA-2026-000001',
            'storage_disk' => 'local',
            'storage_path' => 'generated-documents/recovery.pdf',
            'original_name' => 'recovery.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'sha256' => hash('sha256', '%PDF-1.4'),
            'data_snapshot' => [],
            'generated_at' => now(),
        ]);
        $generation = Mockery::mock(PdfTemplateGenerationService::class);
        $generation->shouldReceive('generate')
            ->once()
            ->andReturn($generatedDocument);

        (new GenerateRequestPdf($request->request_id))->handle($generation);

        $request->refresh();
        $this->assertSame('ready_for_pickup', $request->status);
        $this->assertSame('completed', $request->document_generation_status);
        $this->assertNotNull($request->ready_for_pickup_at);
        $this->assertDatabaseHas('notifications', [
            'request_id' => $request->request_id,
            'title' => 'Document Ready for Pickup',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'table_name' => 'barangay_requests',
            'record_id' => $request->request_id,
            'action' => 'ready_for_pickup',
            'new_values->status' => 'ready_for_pickup',
        ]);
    }

    public function test_request_submission_triggers_automatic_generation_for_active_templates(): void
    {
        Queue::fake();
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $template = DocumentTemplate::create([
            'document_type_id' => $documentType->document_type_id,
        ]);
        $version = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 1,
            'storage_disk' => 'local',
            'storage_path' => 'templates/clearance-v1.pdf',
            'original_name' => 'clearance.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'sha256' => hash('sha256', 'template'),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);
        $version->setRelation('mappings', collect([new \stdClass]));

        $mock = Mockery::mock(PdfTemplateGenerationService::class);
        $mock->shouldReceive('activeTemplateFor')
            ->once()
            ->with(Mockery::on(fn ($request) => $request instanceof BarangayRequest && $request->document_type_id === $documentType->document_type_id))
            ->andReturn($version);
        app()->instance(PdfTemplateGenerationService::class, $mock);

        $response = $this->actingAs($this->resident)
            ->postJson('/api/barangay-requests', [
                'document_type_id' => $documentType->document_type_id,
                'purpose' => 'Automatic generation test',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.document_generation_status', 'queued');

        $requestId = $response->json('data.request.request_id');
        $trackingNumber = $response->json('data.request.tracking_number');
        foreach ([$this->staffUser, $this->adminUser] as $recipient) {
            $this->assertDatabaseHas('notifications', [
                'user_id' => $recipient->user_id,
                'request_id' => $requestId,
                'type' => 'new_request',
                'message' => "Maria Dela Cruz submitted a request for Barangay Clearance ({$trackingNumber}) and is awaiting processing.",
            ]);
        }
        Queue::assertPushed(
            GenerateRequestPdf::class,
            fn (GenerateRequestPdf $job): bool => $job->requestId === $requestId
        );
    }

    public function test_business_clearance_placeholders_generate_and_preview_for_the_resident(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Business Clearance',
            'description' => 'Business permit',
        ]);
        $template = DocumentTemplate::create([
            'document_type_id' => $documentType->document_type_id,
        ]);
        $version = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 1,
            'storage_disk' => config('filesystems.private_upload_disk'),
            'storage_path' => 'document-templates/business-clearance.pdf',
            'original_name' => 'barangay_business_clearance.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 12,
            'sha256' => hash('sha256', '%PDF-1.4'),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);
        $fields = [
            '{{BUSINESS_NAME}}' => 'request.business_name',
            '{{FULL_NAME}}' => 'resident.full_name',
            '{{BUSINESS_ADDRESS}}' => 'request.business_address',
            '{{MUNICIPALITY}}' => 'barangay.municipality',
            '{{PROVINCE}}' => 'barangay.province',
            '{{BUSINESS_ACTIVITY}}' => 'request.business_activity',
            '{{ISSUANCE_DATE}}' => 'request.issuance_date',
            '{{PURPOSE}}' => 'request.purpose',
            '{{BARANGAY_SECRETARY}}' => 'barangay.secretary',
            '{{PUNONG_BARANGAY}}' => 'barangay.captain',
            '{{CONTROL_NUMBER}' => 'request.control_number',
        ];
        foreach ($fields as $fieldName => $systemField) {
            DocumentTemplateFieldMapping::create([
                'template_version_id' => $version->template_version_id,
                'field_name' => $fieldName,
                'field_type' => 'overlay',
                'system_field' => $systemField,
                'page_number' => 1,
                'x' => 0.1,
                'y' => 0.1,
                'width' => 0.2,
                'height' => 0.02,
                'font_size' => 12,
                'font_family' => 'Times-Roman',
                'text_align' => 'left',
                'is_required' => true,
            ]);
        }

        $disk = config('filesystems.private_upload_disk');
        Storage::fake($disk);
        Storage::disk($disk)->put($version->storage_path, "%PDF-1.4\n");
        $this->mock(PdfWorkerService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('generate')
                ->once()
                ->andReturnUsing(function (
                    string $templatePath,
                    string $outputPath,
                    array $payload
                ): void {
                    $this->assertFileExists($templatePath);
                    $this->assertSame(
                        'AURORA BAKERY',
                        $payload['placeholder_values']['{{BUSINESS_NAME}}']
                    );
                    $this->assertSame(
                        'MARIA SANTOS DELA CRUZ',
                        $payload['placeholder_values']['{{FULL_NAME}}']
                    );
                    file_put_contents($outputPath, "%PDF-1.4\nGenerated business clearance.\n");
                });
        });

        $response = $this->actingAs($this->resident)
            ->postJson('/api/barangay-requests', [
                'document_type_id' => $documentType->document_type_id,
                'purpose' => 'Business permit',
                'request_data' => [
                    'business_name' => 'Aurora Bakery',
                    'business_address' => '12 Sample Street, Barangay Aurora',
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.document_generation_status', 'queued');

        $requestId = $response->json('data.request.request_id');
        (new GenerateRequestPdf($requestId))->handle(
            app(PdfTemplateGenerationService::class)
        );
        $generatedDocumentId = BarangayRequest::findOrFail($requestId)
            ->generatedDocuments()
            ->firstOrFail()
            ->generated_document_id;
        $this->assertDatabaseHas('barangay_requests', [
            'request_id' => $requestId,
            'request_data->business_name' => 'Aurora Bakery',
        ]);

        $previewResponse = $this->actingAs($this->resident)
            ->getJson("/api/barangay-requests/{$requestId}/generated-document")
            ->assertOk()
            ->assertJsonPath(
                'data.generated_document.generated_document_id',
                $generatedDocumentId
            );
        $this->assertSame(
            'AURORA BAKERY',
            $previewResponse->json('data.document.mapped_values')['request.business_name']
        );
        $this->assertSame(
            '',
            $previewResponse->json('data.document.mapped_values')['request.business_activity']
        );

        $fileResponse = $this->actingAs($this->resident)
            ->get("/api/barangay-requests/{$requestId}/generated-document/file")
            ->assertOk();
        $this->assertSame(
            "%PDF-1.4\nGenerated business clearance.\n",
            $fileResponse->streamedContent()
        );

        $this->actingAs($this->resident)
            ->getJson('/api/barangay-requests')
            ->assertOk()
            ->assertJsonPath('data.0.has_generated_pdf', true);
    }

    public function test_business_clearance_requests_require_business_details(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Business Clearance',
            'description' => 'Business permit',
        ]);

        $this->actingAs($this->resident)
            ->postJson('/api/barangay-requests', [
                'document_type_id' => $documentType->document_type_id,
                'purpose' => 'Business permit',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'request_data.business_name',
                'request_data.business_address',
            ]);
    }

    public function test_solo_parent_requests_require_the_number_of_children(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Certificate of Solo Parent',
            'description' => 'Solo Parent certificate',
        ]);

        $this->actingAs($this->resident)
            ->postJson('/api/barangay-requests', [
                'document_type_id' => $documentType->document_type_id,
                'purpose' => 'Solo Parent certificate',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['request_data.number_of_children']);

        $response = $this->actingAs($this->resident)
            ->postJson('/api/barangay-requests', [
                'document_type_id' => $documentType->document_type_id,
                'purpose' => 'Solo Parent certificate',
                'request_data' => ['number_of_children' => 2],
            ])
            ->assertCreated();

        $this->assertDatabaseHas('barangay_requests', [
            'request_id' => $response->json('data.request.request_id'),
            'request_data->number_of_children' => 2,
        ]);
    }

    public function test_resident_can_add_children_count_to_existing_solo_parent_request_and_generate_pdf(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Certificate of Solo Parent',
            'description' => 'Solo Parent certificate',
        ]);
        $request = $this->submittedRequest($documentType, 'solo-parent-details');
        $template = DocumentTemplate::create([
            'document_type_id' => $documentType->document_type_id,
        ]);
        $version = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 1,
            'storage_disk' => config('filesystems.private_upload_disk'),
            'storage_path' => 'document-templates/solo-parent.docx',
            'original_name' => 'solo-parent.docx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'file_size' => 12,
            'sha256' => hash('sha256', 'DOCX template'),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);
        $disk = config('filesystems.private_upload_disk');
        Storage::fake($disk);
        Storage::disk($disk)->put($version->storage_path, 'DOCX template fixture');

        $inspection = [
            'page_count' => 1,
            'has_acroform' => false,
            'fields' => [[
                'name' => '{{NUMBER_OF_CHILDREN}}',
                'type' => '/DocxPlaceholder',
                'supported' => false,
            ]],
            'pages' => [],
        ];
        $this->mock(PdfWorkerService::class, function (MockInterface $mock) use (
            $inspection
        ): void {
            $mock->shouldReceive('inspect')
                ->twice()
                ->with(Mockery::type('string'), 'docx')
                ->andReturn($inspection);
            $mock->shouldReceive('generate')
                ->once()
                ->andReturnUsing(function (
                    string $templatePath,
                    string $outputPath,
                    array $payload,
                    string $format
                ): void {
                    $this->assertSame('docx', $format);
                    $this->assertSame(
                        '3',
                        $payload['placeholder_values']['{{NUMBER_OF_CHILDREN}}']
                    );
                    file_put_contents($outputPath, "%PDF-1.4\nSolo Parent certificate.\n");
                });
        });

        Queue::fake();
        $otherResident = User::factory()->create([
            'verification_status' => 'verified',
        ]);
        $this->actingAs($otherResident)
            ->patchJson(
                "/api/barangay-requests/{$request->request_id}/solo-parent-details",
                ['number_of_children' => 3]
            )
            ->assertNotFound();

        $this->actingAs($this->resident)
            ->patchJson(
                "/api/barangay-requests/{$request->request_id}/solo-parent-details",
                ['number_of_children' => 0]
            )
            ->assertUnprocessable();

        $this->actingAs($this->resident)
            ->patchJson(
                "/api/barangay-requests/{$request->request_id}/solo-parent-details",
                ['number_of_children' => 3]
            )
            ->assertStatus(202)
            ->assertJsonPath('data.document_generation_status', 'queued');

        $this->assertDatabaseHas('barangay_requests', [
            'request_id' => $request->request_id,
            'request_data->number_of_children' => 3,
        ]);
        $this->assertDatabaseHas('document_template_field_mappings', [
            'template_version_id' => $version->template_version_id,
            'field_name' => '{{NUMBER_OF_CHILDREN}}',
            'system_field' => 'request.number_of_children',
        ]);
        Queue::assertPushed(
            GenerateRequestPdf::class,
            fn (GenerateRequestPdf $job): bool => $job->requestId === $request->request_id
        );

        (new GenerateRequestPdf($request->request_id))->handle(
            app(PdfTemplateGenerationService::class)
        );

        $this->assertDatabaseHas('barangay_requests', [
            'request_id' => $request->request_id,
            'document_generation_status' => 'completed',
        ]);
    }

    public function test_resident_can_complete_business_details_on_an_existing_request_and_get_the_pdf(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Business Clearance',
            'description' => 'Business permit',
        ]);
        $request = $this->submittedRequest($documentType, 'legacy-business-request');
        $template = DocumentTemplate::create([
            'document_type_id' => $documentType->document_type_id,
        ]);
        $version = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 1,
            'storage_disk' => config('filesystems.private_upload_disk'),
            'storage_path' => 'document-templates/business-clearance.pdf',
            'original_name' => 'barangay_business_clearance.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 12,
            'sha256' => hash('sha256', '%PDF-1.4'),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);
        foreach ([
            '{{BUSINESS_NAME}}' => 'request.business_name',
            '{{BUSINESS_ADDRESS}}' => 'request.business_address',
            '{{BUSINESS_ACTIVITY}}' => 'request.business_activity',
        ] as $fieldName => $systemField) {
            DocumentTemplateFieldMapping::create([
                'template_version_id' => $version->template_version_id,
                'field_name' => $fieldName,
                'field_type' => 'overlay',
                'system_field' => $systemField,
                'page_number' => 1,
                'x' => 0.1,
                'y' => 0.1,
                'width' => 0.2,
                'height' => 0.02,
                'font_size' => 12,
                'font_family' => 'Times-Roman',
                'text_align' => 'left',
                'is_required' => true,
            ]);
        }

        $disk = config('filesystems.private_upload_disk');
        Storage::fake($disk);
        Storage::disk($disk)->put($version->storage_path, "%PDF-1.4\n");
        $this->mock(PdfWorkerService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('generate')
                ->once()
                ->andReturnUsing(function (
                    string $templatePath,
                    string $outputPath
                ): void {
                    $this->assertFileExists($templatePath);
                    file_put_contents($outputPath, "%PDF-1.4\nGenerated business clearance.\n");
                });
        });

        Queue::fake();
        $this->actingAs($this->resident)
            ->patchJson(
                "/api/barangay-requests/{$request->request_id}/business-details",
                [
                    'business_name' => 'Aurora Bakery',
                    'business_address' => '12 Sample Street, Barangay Aurora',
                    'business_activity' => 'Retail bakery',
                ]
            )
            ->assertStatus(202)
            ->assertJsonPath('data.document_generation_status', 'queued');

        Queue::assertPushed(
            GenerateRequestPdf::class,
            fn (GenerateRequestPdf $job): bool => $job->requestId === $request->request_id
        );
        (new GenerateRequestPdf($request->request_id))->handle(
            app(PdfTemplateGenerationService::class)
        );

        $this->assertDatabaseHas('barangay_requests', [
            'request_id' => $request->request_id,
            'request_data->business_name' => 'Aurora Bakery',
        ]);
        $this->actingAs($this->resident)
            ->getJson("/api/barangay-requests/{$request->request_id}/generated-document")
            ->assertOk()
            ->assertJsonPath('data.generated_document.version_number', 1);
    }

    public function test_only_the_requesting_resident_can_add_business_details(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Business Clearance',
            'description' => 'Business permit',
        ]);
        $request = $this->submittedRequest($documentType, 'private-business-details');
        $otherResident = User::factory()->create([
            'verification_status' => 'verified',
        ]);

        $this->actingAs($otherResident)
            ->patchJson(
                "/api/barangay-requests/{$request->request_id}/business-details",
                [
                    'business_name' => 'Unauthorized update',
                    'business_address' => 'Unknown',
                    'business_activity' => 'Unknown',
                ]
            )
            ->assertNotFound();

        $this->assertDatabaseMissing('barangay_requests', [
            'request_id' => $request->request_id,
            'request_data->business_name' => 'Unauthorized update',
        ]);
    }

    public function test_template_preview_does_not_render_a_builtin_document(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'draft-preview');

        $this->actingAs($this->staffUser)
            ->getJson("/api/barangay-requests/{$request->request_id}/template-preview")
            ->assertOk()
            ->assertJsonPath('data.pdf_template', null)
            ->assertJsonMissingPath('data.document');
    }

    public function test_staff_can_preview_the_uploaded_pdf_template(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Certificate of No Income',
            'description' => 'No income certificate',
        ]);
        $request = $this->submittedRequest($documentType, 'uploaded-template-preview');
        $template = DocumentTemplate::create([
            'document_type_id' => $documentType->document_type_id,
        ]);
        $disk = config('filesystems.private_upload_disk');
        $version = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 1,
            'storage_disk' => $disk,
            'storage_path' => 'document-templates/no-income.pdf',
            'original_name' => 'no-income.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 12,
            'sha256' => hash('sha256', "%PDF-1.4\n"),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);
        DocumentTemplateFieldMapping::create([
            'template_version_id' => $version->template_version_id,
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
            'is_required' => false,
        ]);
        Storage::fake($disk);
        Storage::disk($disk)->put($version->storage_path, "%PDF-1.4\n");

        $this->actingAs($this->staffUser)
            ->getJson("/api/barangay-requests/{$request->request_id}/template-preview")
            ->assertOk()
            ->assertJsonPath('data.pdf_template.filename', 'no-income.pdf')
            ->assertJsonMissingPath('data.document');

        $response = $this->get(
            "/api/barangay-requests/{$request->request_id}/template-preview/file"
        );
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
        $this->assertSame("%PDF-1.4\n", $response->streamedContent());

        $this->actingAs($this->resident)
            ->getJson("/api/barangay-requests/{$request->request_id}/template-preview")
            ->assertForbidden();
    }

    public function test_good_moral_request_requires_an_uploaded_pdf_template(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Certificate of Good Moral Character',
            'description' => 'School or employment requirements',
        ]);
        $request = $this->submittedRequest($documentType, 'review-required');

        $this->actingAs($this->staffUser)
            ->postJson(
                "/api/barangay-requests/{$request->request_id}/approve-and-prepare"
            )
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $request->refresh();
        $this->assertSame('request_submitted', $request->status);
    }

    public function test_approval_rejects_unverified_or_missing_mobile_ids(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'pending-mobile-id');

        $this->resident->update(['verification_status' => 'pending']);
        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'approved',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->resident->update(['verification_status' => 'verified']);
        $this->resident->update(['valid_id_front' => null]);

        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'approved',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_verified_uploaded_id_does_not_require_a_separate_id_type_label(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'uploaded-id-no-type');
        $this->resident->update(['valid_id_type' => null]);

        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'approved',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_changing_mobile_id_details_returns_account_verification_to_pending(): void
    {
        $this->actingAs($this->resident)
            ->patchJson('/api/profile', [
                'valid_id_type' => 'Passport',
            ])
            ->assertOk()
            ->assertJsonPath('data.verification_status', 'pending')
            ->assertJsonPath(
                'message',
                'Profile updated. Your account verification is pending review because your ID details changed.'
            );

        $this->assertDatabaseHas('audit_logs', [
            'table_name' => 'users',
            'record_id' => $this->resident->user_id,
            'action' => 'verification_updated',
            'new_values->verification_status' => 'pending',
        ]);
    }

    public function test_resident_can_update_street_name_without_changing_complete_address(): void
    {
        $this->actingAs($this->resident)
            ->patchJson('/api/profile', [
                'street_name' => 'Oak Avenue',
            ])
            ->assertOk()
            ->assertJsonPath('data.street_name', 'Oak Avenue')
            ->assertJsonPath('data.address', '12 Sample Street, Barangay Aurora')
            ->assertJsonPath('data.verification_status', 'verified');
    }

    public function test_resident_can_update_structured_address_and_save_complete_address(): void
    {
        $this->actingAs($this->resident)
            ->patchJson('/api/profile', [
                'street_name' => 'Oak Avenue',
                'barangay_name' => 'Barangay Aurora',
                'municipality' => 'Quezon City',
                'province' => 'Metro Manila',
                'postal_code' => '1100',
            ])
            ->assertOk()
            ->assertJsonPath(
                'data.address',
                'Oak Avenue, Barangay Aurora, Quezon City, Metro Manila, 1100'
            )
            ->assertJsonPath('data.barangay_name', 'Barangay Aurora')
            ->assertJsonPath('data.municipality', 'Quezon City')
            ->assertJsonPath('data.province', 'Metro Manila')
            ->assertJsonPath('data.postal_code', '1100');
    }

    public function test_approval_rechecks_the_current_mobile_id_verification_status(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'id-changed-before-approval');

        $this->actingAs($this->resident)
            ->patchJson('/api/profile', [
                'valid_id_type' => 'Passport',
            ])
            ->assertOk()
            ->assertJsonPath('data.verification_status', 'pending');

        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'approved',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_approve_and_prepare_requires_a_pdf_and_rolls_back_without_one(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'approve-and-pickup');
        $template = new DocumentTemplateVersion;
        $pdfGeneration = Mockery::mock(PdfTemplateGenerationService::class);
        $pdfGeneration->shouldReceive('activeTemplateFor')
            ->once()
            ->andReturn($template);
        $pdfGeneration->shouldReceive('current')
            ->once()
            ->andReturn(null);
        app()->instance(PdfTemplateGenerationService::class, $pdfGeneration);

        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$request->request_id}/approve-and-prepare")
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath(
                'message',
                'Generate the official PDF before marking the request ready for pickup.'
            );

        $request->refresh();
        $this->assertSame('request_submitted', $request->status);
        $this->assertNull($request->approved_at);
        $this->assertNull($request->document_number);
        $this->assertDatabaseMissing('notifications', [
            'request_id' => $request->request_id,
            'title' => 'Document Ready for Pickup',
        ]);
    }

    public function test_missing_pdf_template_prevents_ready_transition_atomically(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'missing-config');
        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'approved',
            ])
            ->assertOk();

        $response = $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'ready_for_pickup',
            ]);
        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertStringContainsString(
            'Upload an active PDF template',
            $response->json('message')
        );

        $request->refresh();
        $this->assertSame('approved', $request->status);
        $this->assertNull($request->document_number);
        $this->assertDatabaseCount('barangay_document_number_sequences', 0);
    }

    public function test_legacy_generated_documents_are_no_longer_rendered(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Certificate of Residency',
            'description' => 'Residency certificate',
        ]);
        $request = $this->readyRequest($documentType, 'private-document');
        $request->update([
            'document_number' => 'BA-2026-000001',
            'document_template_identifier' => 'certificate_of_residency',
            'document_template_version' => '1.0',
            'generated_document_data' => [
                'document_type' => 'Certificate of Residency',
                'document_number' => 'BA-2026-000001',
            ],
        ]);

        $this->actingAs($this->resident)
            ->getJson("/api/barangay-requests/{$request->request_id}/generated-document")
            ->assertStatus(410)
            ->assertJsonPath('success', false);

        $otherResident = User::factory()->create([
            'verification_status' => 'verified',
        ]);
        $this->actingAs($otherResident)
            ->getJson("/api/barangay-requests/{$request->request_id}/generated-document")
            ->assertNotFound();

        $this->actingAs($this->staffUser)
            ->getJson("/api/barangay-requests/{$request->request_id}/generated-document")
            ->assertStatus(410);
    }

    public function test_staff_can_retrieve_and_print_only_versions_for_the_request(): void
    {
        $documentType = $this->createDocumentType([
            'document_name' => 'Certificate of Residency',
            'description' => 'Residency certificate',
        ]);
        $request = $this->readyRequest($documentType, 'pdf-version-history');
        $template = DocumentTemplate::create([
            'document_type_id' => $documentType->document_type_id,
        ]);
        $templateVersion = DocumentTemplateVersion::create([
            'template_id' => $template->template_id,
            'version_number' => 1,
            'storage_disk' => 'local',
            'storage_path' => 'templates/residency-v1.pdf',
            'original_name' => 'residency.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'sha256' => hash('sha256', 'template'),
            'page_count' => 1,
            'has_acroform' => false,
            'is_active' => true,
        ]);
        $disk = config('filesystems.private_upload_disk');
        Storage::fake($disk);
        $documents = [];
        foreach ([1 => 'pdf-v1', 2 => 'pdf-v2'] as $version => $contents) {
            $path = "generated-documents/{$request->request_id}/v{$version}.pdf";
            Storage::disk($disk)->put($path, $contents);
            $documents[$version] = GeneratedDocument::create([
                'request_id' => $request->request_id,
                'template_version_id' => $templateVersion->template_version_id,
                'version_number' => $version,
                'document_number' => 'BA-2026-000001',
                'storage_disk' => $disk,
                'storage_path' => $path,
                'original_name' => "residency-v{$version}.pdf",
                'mime_type' => 'application/pdf',
                'file_size' => strlen($contents),
                'sha256' => hash('sha256', $contents),
                'data_snapshot' => ['document_number' => 'BA-2026-000001'],
                'generated_by' => $this->staffUser->user_id,
                'generated_at' => now(),
            ]);
        }

        $this->actingAs($this->resident)
            ->getJson("/api/barangay-requests/{$request->request_id}/generated-documents")
            ->assertForbidden();

        $this->actingAs($this->staffUser)
            ->getJson("/api/barangay-requests/{$request->request_id}/generated-documents")
            ->assertOk()
            ->assertJsonPath('data.versions.0.generated_document_id', $documents[2]->generated_document_id)
            ->assertJsonPath('data.versions.1.version_number', 1);

        $fileResponse = $this->get(
            "/api/barangay-requests/{$request->request_id}/generated-documents/{$documents[1]->generated_document_id}/file"
        );
        $fileResponse->assertOk();
        $this->assertSame('pdf-v1', $fileResponse->streamedContent());

        $anotherRequest = $this->readyRequest($documentType, 'different-pdf-request');
        $this->get(
            "/api/barangay-requests/{$anotherRequest->request_id}/generated-documents/{$documents[1]->generated_document_id}/file"
        )->assertNotFound();

        $printUrl = "/api/barangay-requests/{$request->request_id}/generated-document/print";
        $this->postJson($printUrl, [
            'generated_document_id' => $documents[1]->generated_document_id,
        ])
            ->assertOk()
            ->assertJsonPath('data.action', 'document_printed');
        $this->postJson($printUrl, [
            'generated_document_id' => $documents[1]->generated_document_id,
        ])
            ->assertOk()
            ->assertJsonPath('data.action', 'document_reprinted');
        $this->postJson($printUrl, [
            'generated_document_id' => $documents[2]->generated_document_id,
        ])
            ->assertOk()
            ->assertJsonPath('data.action', 'document_printed');
    }

    public function test_barangay_settings_api_endpoints_are_removed(): void
    {
        $this->actingAs($this->adminUser)
            ->getJson('/api/admin/barangay-settings')
            ->assertNotFound();

        $this->actingAs($this->adminUser)
            ->putJson('/api/admin/barangay-settings', [
                'barangay_name' => 'Should not be accepted',
            ])
            ->assertNotFound();
    }

    private function submittedRequest(
        DocumentType $documentType,
        string $suffix
    ): BarangayRequest {
        return BarangayRequest::create([
            'user_id' => $this->resident->user_id,
            'document_type_id' => $documentType->document_type_id,
            'purpose' => "Testing {$suffix}",
            'tracking_number' => 'BR-20261112-'.strtoupper($suffix),
            'status' => 'request_submitted',
        ]);
    }

    private function readyRequest(
        DocumentType $documentType,
        string $suffix
    ): BarangayRequest {
        return BarangayRequest::create([
            'user_id' => $this->resident->user_id,
            'document_type_id' => $documentType->document_type_id,
            'purpose' => "Testing {$suffix}",
            'tracking_number' => 'BR-20261112-'.strtoupper($suffix),
            'status' => 'ready_for_pickup',
            'verified_at' => now(),
            'requirements_complete' => true,
            'approved_at' => now(),
        ]);
    }
}
