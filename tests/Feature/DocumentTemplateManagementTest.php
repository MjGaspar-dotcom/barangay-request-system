<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\DocumentTemplate;
use App\Models\DocumentTemplateVersion;
use App\Models\DocumentType;
use App\Models\Staff;
use App\Models\User;
use App\Services\PdfWorkerService;
use Database\Seeders\DocumentTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class DocumentTemplateManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $staffUser;
    private User $resident;
    private DocumentType $documentType;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create();
        $admin = Admin::create(['user_id' => $this->adminUser->user_id]);
        $this->staffUser = User::factory()->create();
        Staff::create([
            'user_id' => $this->staffUser->user_id,
            'assigned_by' => $admin->admin_id,
        ]);
        $this->resident = User::factory()->create();
        $this->documentType = DocumentType::query()
            ->where('document_name', 'Certificate of Residency')
            ->firstOrFail();

        Storage::fake(config('filesystems.private_upload_disk'));
    }

    public function test_uploaded_pdf_templates_auto_map_standard_barangay_fields(): void
    {
        $this->seed(DocumentTypeSeeder::class);
        $inspection = [
            'page_count' => 1,
            'has_acroform' => true,
            'fields' => [
                ['name' => 'resident_full_name', 'type' => '/Tx', 'supported' => true],
                ['name' => 'barangay_name', 'type' => '/Tx', 'supported' => true],
                [
                    'name' => '{{BUSINESS_NAME}}',
                    'type' => '/Placeholder',
                    'supported' => false,
                    'page_number' => 1,
                    'x' => 0.2,
                    'y' => 0.4,
                    'width' => 0.3,
                    'height' => 0.02,
                    'font_size' => 12,
                    'font_family' => 'Times-Roman',
                ],
                ['name' => 'custom_notes', 'type' => '/Tx', 'supported' => true],
            ],
            'pages' => [[
                'width' => 612,
                'height' => 792,
                'rotation' => 0,
                'view_box' => [0, 0, 612, 792],
            ]],
        ];

        $this->mock(PdfWorkerService::class, function (MockInterface $mock) use ($inspection): void {
            $mock->shouldReceive('inspect')
                ->once()
                ->with(Mockery::type('string'), 'pdf')
                ->andReturn($inspection);
        });

        $upload = UploadedFile::fake()->createWithContent(
            'residency.pdf',
            "%PDF-1.4\n% PDF template fixture\n"
        );

        $this->actingAs($this->adminUser)
            ->postJson(
                "/api/admin/document-templates/{$this->documentType->document_type_id}/versions",
                ['file' => $upload]
            )
            ->assertCreated();

        $version = DocumentTemplateVersion::query()->firstOrFail();

        $this->assertDatabaseHas('document_template_field_mappings', [
            'template_version_id' => $version->template_version_id,
            'field_name' => 'resident_full_name',
            'system_field' => 'resident.full_name',
        ]);
        $this->assertDatabaseHas('document_template_field_mappings', [
            'template_version_id' => $version->template_version_id,
            'field_name' => 'barangay_name',
            'system_field' => 'barangay.name',
        ]);
        $this->assertDatabaseHas('document_template_field_mappings', [
            'template_version_id' => $version->template_version_id,
            'field_name' => '{{BUSINESS_NAME}}',
            'field_type' => 'overlay',
            'system_field' => 'request.business_name',
            'page_number' => 1,
        ]);
        $this->assertDatabaseMissing('document_template_field_mappings', [
            'template_version_id' => $version->template_version_id,
            'field_name' => 'custom_notes',
        ]);
    }

    public function test_only_administrators_can_upload_and_map_private_templates(): void
    {
        $this->seed(DocumentTypeSeeder::class);
        $inspection = [
            'page_count' => 1,
            'has_acroform' => false,
            'fields' => [],
            'pages' => [[
                'width' => 612,
                'height' => 792,
                'rotation' => 0,
                'view_box' => [0, 0, 612, 792],
            ]],
        ];
        $this->mock(PdfWorkerService::class, function (MockInterface $mock) use ($inspection): void {
            $mock->shouldReceive('inspect')
                ->twice()
                ->with(Mockery::type('string'), 'pdf')
                ->andReturn($inspection);
        });

        $templatesUrl = '/api/admin/document-templates';
        $this->actingAs($this->resident)
            ->getJson($templatesUrl)
            ->assertForbidden();
        $this->actingAs($this->staffUser)
            ->getJson($templatesUrl)
            ->assertForbidden();
        $documentTypesResponse = $this->actingAs($this->adminUser)
            ->getJson($templatesUrl)
            ->assertOk();
        $documentTypeNames = array_column(
            $documentTypesResponse->json('data.document_types'),
            'document_name'
        );
        $this->assertEqualsCanonicalizing([
            'Barangay Clearance',
            'Certificate of Residency',
            'Certificate of Indigency',
            'Barangay Business Clearance',
            'Certificate of First-Time Job Seeker',
            'Certificate of Good Moral Character',
            'Certificate of Low Income',
            'Certificate of No Income',
            'Certificate of Unemployment',
            'Certificate of Actual Residency',
            'Certificate of Solo Parent',
            'Certificate of Family Composition',
            'Certificate of Appearance',
            'Certificate of Blotter',
            'Certificate of No Pending Complaint',
        ], $documentTypeNames);
        $this->assertCount(15, array_unique($documentTypeNames));
        $this->actingAs($this->adminUser)
            ->getJson("{$templatesUrl}/{$this->documentType->document_type_id}")
            ->assertOk()
            ->assertJsonPath('data.template_status', 'missing')
            ->assertJsonPath('data.active_version', null);

        $upload = UploadedFile::fake()->createWithContent(
            'residency.pdf',
            "%PDF-1.4\n% PDF template fixture\n"
        );
        $uploadResponse = $this->actingAs($this->adminUser)
            ->postJson(
                "{$templatesUrl}/{$this->documentType->document_type_id}/versions",
                ['file' => $upload]
            )
            ->assertCreated();

        $template = DocumentTemplate::query()
            ->where('document_type_id', $this->documentType->document_type_id)
            ->firstOrFail();
        $version = DocumentTemplateVersion::query()
            ->where('template_id', $template->template_id)
            ->firstOrFail();

        $this->assertSame(
            $version->template_version_id,
            $uploadResponse->json('data.version.template_version_id')
        );
        Storage::disk($version->storage_disk)->assertExists($version->storage_path);

        $this->actingAs($this->staffUser)
            ->putJson(
                "/api/admin/document-template-versions/{$version->template_version_id}/mappings",
                ['fields' => []]
            )
            ->assertForbidden();

        $this->actingAs($this->adminUser)
            ->putJson(
                "/api/admin/document-template-versions/{$version->template_version_id}/mappings",
                ['fields' => [[
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
                ]]]
            )
            ->assertOk()
            ->assertJsonPath('data.mappings.0.system_field', 'resident.full_name');

        $this->assertDatabaseHas('document_template_field_mappings', [
            'template_version_id' => $version->template_version_id,
            'field_name' => 'resident-name',
            'system_field' => 'resident.full_name',
        ]);
    }

    public function test_uploaded_docx_templates_auto_map_and_allow_configuring_placeholders(): void
    {
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
                    'name' => '{{PURPOSE}}',
                    'type' => '/DocxPlaceholder',
                    'supported' => false,
                ],
                [
                    'name' => '{{STREET_NAME}}',
                    'type' => '/DocxPlaceholder',
                    'supported' => false,
                ],
                [
                    'name' => '{{CUSTOM_FIELD}}',
                    'type' => '/DocxPlaceholder',
                    'supported' => false,
                ],
            ],
            'pages' => [],
        ];

        $this->mock(PdfWorkerService::class, function (MockInterface $mock) use ($inspection): void {
            $mock->shouldReceive('inspect')
                ->times(3)
                ->with(Mockery::type('string'), 'docx')
                ->andReturn($inspection);
        });

        $upload = UploadedFile::fake()->createWithContent(
            'residency.docx',
            'DOCX test fixture'
        );
        $response = $this->actingAs($this->adminUser)
            ->postJson(
                "/api/admin/document-templates/{$this->documentType->document_type_id}/versions",
                ['file' => $upload]
            )
            ->assertCreated();
        $versionId = $response->json('data.version.template_version_id');

        $this->assertDatabaseHas('document_template_field_mappings', [
            'template_version_id' => $versionId,
            'field_name' => '{{FULL_NAME}}',
            'field_type' => 'docx_placeholder',
            'system_field' => 'resident.full_name',
        ]);
        $this->assertDatabaseHas('document_template_field_mappings', [
            'template_version_id' => $versionId,
            'field_name' => '{{PURPOSE}}',
            'system_field' => 'request.purpose',
        ]);
        $this->assertDatabaseHas('document_template_field_mappings', [
            'template_version_id' => $versionId,
            'field_name' => '{{STREET_NAME}}',
            'system_field' => 'resident.street_name',
        ]);

        $fields = [
            [
                'field_name' => '{{FULL_NAME}}',
                'field_type' => 'docx_placeholder',
                'system_field' => 'resident.full_name',
                'is_required' => true,
            ],
            [
                'field_name' => '{{PURPOSE}}',
                'field_type' => 'docx_placeholder',
                'system_field' => 'request.purpose',
                'is_required' => true,
            ],
            [
                'field_name' => '{{STREET_NAME}}',
                'field_type' => 'docx_placeholder',
                'system_field' => 'resident.street_name',
                'is_required' => true,
            ],
            [
                'field_name' => '{{CUSTOM_FIELD}}',
                'field_type' => 'docx_placeholder',
                'system_field' => 'barangay.name',
                'is_required' => true,
            ],
        ];

        $this->actingAs($this->adminUser)
            ->putJson(
                "/api/admin/document-template-versions/{$versionId}/mappings",
                ['fields' => array_slice($fields, 0, 3)]
            )
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Map every DOCX placeholder before saving: {{CUSTOM_FIELD}}'
            );

        $this->actingAs($this->adminUser)
            ->putJson(
                "/api/admin/document-template-versions/{$versionId}/mappings",
                ['fields' => $fields]
            )
            ->assertOk();

        $this->assertDatabaseHas('document_template_field_mappings', [
            'template_version_id' => $versionId,
            'field_name' => '{{CUSTOM_FIELD}}',
            'system_field' => 'barangay.name',
        ]);
    }
}
