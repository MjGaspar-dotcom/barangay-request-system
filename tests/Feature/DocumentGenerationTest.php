<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BarangayRequest;
use App\Models\BarangaySettings;
use App\Models\DocumentType;
use App\Models\Staff;
use App\Models\User;
use App\Services\DocumentGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
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

        BarangaySettings::query()->whereKey(1)->update([
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

    public function test_supported_document_templates_generate_persistent_snapshots(): void
    {
        $templates = [
            'Barangay Clearance' => 'barangay_clearance',
            'Certificate of Residency' => 'certificate_of_residency',
            'Certificate of Indigency' => 'certificate_of_indigency',
        ];
        $numbers = [];

        foreach ($templates as $name => $template) {
            $documentType = DocumentType::create([
                'document_name' => $name,
                'description' => $name,
            ]);
            $request = $this->readyRequest($documentType, $template);

            $this->actingAs($this->staffUser);
            $generated = app(DocumentGenerationService::class)
                ->generateForReadyPickup($request);

            $this->assertSame($template, $generated->document_template_identifier);
            $this->assertSame($name, $generated->generated_document_data['document_type']);
            $this->assertSame('Maria Santos Dela Cruz', $generated->generated_document_data['resident']['full_name']);
            $this->assertSame('1990-04-15', $generated->generated_document_data['resident']['birth_date']);
            $this->assertSame('12 Sample Street, Barangay Aurora', $generated->generated_document_data['resident']['address']);
            $this->assertSame(
                'Test Municipality',
                $generated->generated_document_data['barangay']['municipality']
            );
            $this->assertSame(
                'Test Council Member',
                $generated->generated_document_data['barangay']['council_roster'][0]['name']
            );
            $this->assertSame($generated->document_number, $generated->generated_document_data['document_number']);
            $this->assertMatchesRegularExpression('/^BA-\d{4}-\d{6}$/', $generated->document_number);
            $this->assertNotContains($generated->document_number, $numbers);
            $numbers[] = $generated->document_number;

            $repeated = app(DocumentGenerationService::class)
                ->generateForReadyPickup($generated);
            $this->assertSame($generated->document_number, $repeated->document_number);
            $this->assertSame(
                1,
                \App\Models\AuditLog::query()
                    ->where('record_id', $generated->request_id)
                    ->where('action', 'document_generated')
                    ->count()
            );
        }

    }

    public function test_official_document_generation_does_not_require_a_barangay_seal(): void
    {
        BarangaySettings::query()->whereKey(1)->update(['seal_path' => null]);
        $documentType = DocumentType::create([
            'document_name' => 'Barangay Clearance',
            'description' => 'Barangay clearance',
        ]);
        $request = $this->readyRequest($documentType, 'no-seal');

        $this->actingAs($this->staffUser);
        $generated = app(DocumentGenerationService::class)
            ->generateForReadyPickup($request);

        $this->assertNull($generated->generated_document_data['barangay']['seal_path']);
    }

    public function test_staff_can_complete_pickup_without_entering_a_recipient_name(): void
    {
        $documentType = DocumentType::create([
            'document_name' => 'Barangay Clearance',
            'description' => 'Barangay clearance',
        ]);
        $request = $this->readyRequest($documentType, 'complete-pickup');

        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'completed',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.release_recipient_name', null);

        $request->refresh();
        $this->assertNotNull($request->claimed_at);
        $this->assertSame($this->staffUser->user_id, $request->released_by);
    }

    public function test_indigency_can_be_approved_without_manual_checkbox_confirmation(): void
    {
        $documentType = DocumentType::create([
            'document_name' => 'Certificate of Indigency',
            'description' => 'Indigency certificate',
        ]);
        $request = $this->submittedRequest($documentType, 'indigency-explicit');

        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$request->request_id}/approve-and-prepare")
            ->assertOk()
            ->assertJsonPath('data.status', 'ready_for_pickup')
            ->assertJsonPath('data.document_template_identifier', 'certificate_of_indigency');

        $request->refresh();
        $this->assertNull($request->indigency_verified_at);
    }

    public function test_approval_uses_mobile_account_verification_without_request_level_id_check(): void
    {
        $documentType = DocumentType::create([
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

    public function test_template_preview_is_marked_as_unissued_until_generation(): void
    {
        $documentType = DocumentType::create([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'draft-preview');

        $this->actingAs($this->staffUser)
            ->getJson("/api/barangay-requests/{$request->request_id}/template-preview")
            ->assertOk()
            ->assertJsonPath('data.document.template_identifier', 'barangay_clearance')
            ->assertJsonPath('data.document.is_preview', true)
            ->assertJsonPath(
                'data.document.document_number',
                'To be assigned'
            );
    }

    public function test_new_document_types_have_their_own_templates(): void
    {
        $templates = [
            'Barangay Business Clearance' => 'barangay_business_clearance',
            'Certificate of First-Time Job Seeker' => 'certificate_of_first_time_job_seeker',
            'Certificate of Good Moral Character' => 'certificate_of_good_moral_character',
            'Certificate of Low Income' => 'certificate_of_low_income',
            'Certificate of No Income' => 'certificate_of_no_income',
            'Certificate of Unemployment' => 'certificate_of_unemployment',
            'Certificate of Actual Residency' => 'certificate_of_actual_residency',
            'Certificate of Solo Parent' => 'certificate_of_solo_parent',
            'Certificate of Family Composition' => 'certificate_of_family_composition',
            'Certificate of Appearance' => 'certificate_of_appearance',
            'Certificate of Blotter' => 'certificate_of_blotter',
            'Certificate of No Pending Complaint' => 'certificate_of_no_pending_complaint',
        ];

        $this->actingAs($this->staffUser);
        foreach ($templates as $name => $template) {
            $documentType = DocumentType::create([
                'document_name' => $name,
                'description' => "Document service description for {$name}.",
            ]);
            $request = $this->submittedRequest(
                $documentType,
                'template-'.str_replace(' ', '-', strtolower($name))
            );

            $this->getJson(
                "/api/barangay-requests/{$request->request_id}/template-preview"
            )
                ->assertOk()
                ->assertJsonPath('data.document.template_identifier', $template)
                ->assertJsonPath('data.document.document_type', $name)
                ->assertJsonPath(
                    'data.document.template_description',
                    "Document service description for {$name}."
                );
        }

        $customType = DocumentType::create([
            'document_name' => 'Custom Barangay Certificate',
            'description' => 'Custom service description.',
        ]);
        $customRequest = $this->submittedRequest($customType, 'custom-template');
        $this->getJson(
            "/api/barangay-requests/{$customRequest->request_id}/template-preview"
        )
            ->assertOk()
            ->assertJsonPath(
                'data.document.template_identifier',
                'custom_barangay_document'
            );
    }

    public function test_request_with_a_new_template_can_be_approved_without_extra_confirmation(): void
    {
        $documentType = DocumentType::create([
            'document_name' => 'Certificate of Good Moral Character',
            'description' => 'School or employment requirements',
        ]);
        $request = $this->submittedRequest($documentType, 'review-required');

        $this->actingAs($this->staffUser)
            ->postJson(
                "/api/barangay-requests/{$request->request_id}/approve-and-prepare"
            )
            ->assertOk()
            ->assertJsonPath('data.status', 'ready_for_pickup')
            ->assertJsonPath(
                'data.document_template_identifier',
                'certificate_of_good_moral_character'
            );

        $request->refresh();
        $this->assertSame('ready_for_pickup', $request->status);
        $this->assertArrayNotHasKey(
            'requires_barangay_review',
            $request->generated_document_data
        );
        $this->assertArrayNotHasKey(
            'template_review',
            $request->generated_document_data
        );
    }

    public function test_approval_rejects_unverified_or_missing_mobile_ids(): void
    {
        $documentType = DocumentType::create([
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
        $documentType = DocumentType::create([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'uploaded-id-no-type');
        $this->resident->update(['valid_id_type' => null]);

        $this->actingAs($this->staffUser)
            ->postJson(
                "/api/barangay-requests/{$request->request_id}/approve-and-prepare"
            )
            ->assertOk()
            ->assertJsonPath('data.status', 'ready_for_pickup');
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

    public function test_approval_rechecks_the_current_mobile_id_verification_status(): void
    {
        $documentType = DocumentType::create([
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

    public function test_approve_and_prepare_generates_document_and_notifies_resident_to_pick_up(): void
    {
        $documentType = DocumentType::create([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'approve-and-pickup');

        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$request->request_id}/approve-and-prepare")
            ->assertOk()
            ->assertJsonPath('data.status', 'ready_for_pickup')
            ->assertJsonPath('data.document_template_identifier', 'barangay_clearance');

        $request->refresh();
        $this->assertNotNull($request->approved_at);
        $this->assertNotNull($request->ready_for_pickup_at);
        $this->assertNotEmpty($request->document_number);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->resident->user_id,
            'request_id' => $request->request_id,
            'type' => 'request_status_changed',
            'title' => 'Document Ready for Pickup',
        ]);
        $notification = \App\Models\Notification::query()
            ->where('request_id', $request->request_id)
            ->where('user_id', $this->resident->user_id)
            ->firstOrFail();
        $this->assertStringContainsString('Barangay Clearance', $notification->message);
        $this->assertStringContainsString('ready for pickup at the barangay office', $notification->message);
    }

    public function test_approve_and_prepare_rolls_back_if_required_barangay_details_are_missing(): void
    {
        BarangaySettings::query()->whereKey(1)->update(['province' => null]);
        $documentType = DocumentType::create([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance',
        ]);
        $request = $this->submittedRequest($documentType, 'approval-missing-settings');

        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$request->request_id}/approve-and-prepare")
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $request->refresh();
        $this->assertSame('request_submitted', $request->status);
        $this->assertNull($request->approved_at);
        $this->assertNull($request->document_number);
        $this->assertDatabaseMissing('notifications', [
            'request_id' => $request->request_id,
            'title' => 'Document Ready for Pickup',
        ]);
    }

    public function test_missing_barangay_configuration_prevents_ready_transition_atomically(): void
    {
        BarangaySettings::query()->whereKey(1)->update(['province' => null]);
        $documentType = DocumentType::create([
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
        $this->assertStringContainsString('province', $response->json('message'));

        $request->refresh();
        $this->assertSame('approved', $request->status);
        $this->assertNull($request->document_number);
        $this->assertDatabaseCount('barangay_document_number_sequences', 0);
    }

    public function test_only_staff_and_admin_can_access_generated_documents(): void
    {
        $documentType = DocumentType::create([
            'document_name' => 'Certificate of Residency',
            'description' => 'Residency certificate',
        ]);
        $request = $this->readyRequest($documentType, 'private-document');
        $this->actingAs($this->staffUser);
        $generated = app(DocumentGenerationService::class)
            ->generateForReadyPickup($request);

        $this->actingAs($this->resident)
            ->getJson("/api/barangay-requests/{$generated->request_id}/generated-document")
            ->assertForbidden();

        $this->actingAs($this->staffUser)
            ->getJson("/api/barangay-requests/{$generated->request_id}/generated-document")
            ->assertOk()
            ->assertJsonPath('data.document.document_type', 'Certificate of Residency');
    }

    public function test_admin_can_update_barangay_settings_without_a_seal_upload(): void
    {
        Storage::fake('public');
        $settings = BarangaySettings::query()->findOrFail(1);
        $oldPath = $settings->seal_path;
        Storage::disk('public')->put($oldPath, 'old-seal');

        $this->actingAs($this->adminUser)
            ->post('/api/admin/barangay-settings', [
                '_method' => 'PUT',
                'barangay_name' => 'Barangay Aurora',
                'municipality' => 'Alicia',
                'province' => 'Isabela',
                'punong_barangay_name' => 'Configured Official',
                'office_address' => 'Municipal Road',
                'contact_information' => '09123456789',
                'council_roster' => "Council Member | Sangguniang Barangay Member\nSecretary | Barangay Secretary",
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.municipality', 'Alicia')
            ->assertJsonPath('data.province', 'Isabela')
            ->assertJsonPath('data.council_roster.0.name', 'Council Member')
            ->assertJsonPath('data.council_roster.1.position', 'Barangay Secretary');

        $settings->refresh();
        $this->assertSame($oldPath, $settings->seal_path);
        Storage::disk('public')->assertExists($oldPath);
        Storage::disk('public')->assertExists($settings->seal_path);
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
