<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BarangayRequest;
use App\Models\DocumentType;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BarangayRequestWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $staffUser;
    protected Staff $staff;
    protected User $adminUser;
    protected Admin $admin;
    protected DocumentType $documentType;

    protected function setUp(): void
    {
        parent::setUp();

        // Create standard user (verified)
        $this->user = User::factory()->create([
            'email_verified_at' => now(),
            'verification_status' => 'verified',
            'valid_id_type' => 'National ID',
            'valid_id_front' => 'resident-valid-ids/front.jpg',
            'valid_id_back' => 'resident-valid-ids/back.jpg',
        ]);

        // Create admin user
        $this->adminUser = User::factory()->create([
            'email_verified_at' => now(),
            'verification_status' => 'verified',
        ]);
        $this->admin = Admin::create([
            'user_id' => $this->adminUser->user_id,
        ]);

        // Create staff user
        $this->staffUser = User::factory()->create([
            'email_verified_at' => now(),
            'verification_status' => 'verified',
        ]);
        $this->staff = Staff::create([
            'user_id' => $this->staffUser->user_id,
            'assigned_by' => $this->admin->admin_id,
        ]);

        // Create document type
        $this->documentType = DocumentType::create([
            'document_name' => 'Barangay Clearance',
            'description' => 'Clearance for employment',
            'fee' => 50.00,
        ]);
    }

    public function test_registered_user_can_submit_request(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/barangay-requests', [
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Employment Application',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.request.status', 'Pending');

        $this->assertDatabaseHas('barangay_requests', [
            'user_id' => $this->user->user_id,
            'purpose' => 'Employment Application',
            'status' => 'Pending',
        ]);

        $trackingNumber = $response->json('data.request.tracking_number');
        $this->getJson("/api/track/{$trackingNumber}")
            ->assertOk()
            ->assertJsonPath('data.status', 'Pending')
            ->assertJsonPath(
                'data.document_type',
                'Barangay Clearance'
            );
    }

    public function test_public_client_can_list_document_types(): void
    {
        $response = $this->getJson('/api/document-types');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.document_name', 'Barangay Clearance');
    }

    public function test_anonymous_client_cannot_submit_registered_requests(): void
    {
        $this->postJson('/api/barangay-requests', [
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Employment Application',
        ])->assertUnauthorized();
    }

    public function test_staff_can_view_registered_requester_details_and_id_images(): void
    {
        $this->user->update([
            'valid_id_type' => 'National ID',
            'valid_id_front' => 'resident-valid-ids/front.jpg',
            'valid_id_back' => 'resident-valid-ids/back.jpg',
        ]);
        $request = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Employment Application',
            'tracking_number' => 'BR-20261016-STAFF1',
            'status' => 'Pending',
        ]);

        $response = $this->actingAs($this->staffUser)
            ->getJson("/api/barangay-requests/{$request->request_id}");

        $response->assertOk()
            ->assertJsonPath('data.user.user_id', $this->user->user_id)
            ->assertJsonPath('data.user.valid_id_type', 'National ID')
            ->assertJsonPath('data.user.valid_id_front', 'resident-valid-ids/front.jpg')
            ->assertJsonPath('data.user.valid_id_back', 'resident-valid-ids/back.jpg');
    }

    public function test_resident_profile_id_images_are_saved_to_public_storage(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->user)
            ->patch('/api/profile', [
                'valid_id_type' => 'National ID',
                'valid_id_front' => UploadedFile::fake()->create('front.jpg', 100, 'image/jpeg'),
                'valid_id_back' => UploadedFile::fake()->create('back.jpg', 100, 'image/jpeg'),
            ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('data.valid_id_type', 'National ID');

        $user = $this->user->fresh();
        $this->assertStringStartsWith('resident-valid-ids/', $user->valid_id_front);
        $this->assertStringStartsWith('resident-valid-ids/', $user->valid_id_back);
        Storage::disk('public')->assertExists($user->valid_id_front);
        Storage::disk('public')->assertExists($user->valid_id_back);
    }

    public function test_guest_request_endpoints_are_removed(): void
    {
        $this->assertFalse(Schema::hasTable('guest_requests'));
        $this->assertFalse(Schema::hasColumn('notifications', 'guest_request_id'));

        $this->postJson('/api/guest-requests')
            ->assertNotFound();

        $this->getJson('/api/guest-requests/track/GR-20260904-OLD')
            ->assertNotFound();
    }

    public function test_full_status_lifecycle_for_registered_request(): void
    {
        /** @var BarangayRequest $br */
        $br = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Passport Requirement',
            'tracking_number' => 'BR-20260904-TEST01',
            'status' => 'Pending',
        ]);

        Storage::fake('local');

        // Requirements must be reviewed before an administrator decides.
        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$br->request_id}/requirements/verify", [
                'requirements_complete' => true,
            ])
            ->assertOk();

        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Approved',
            'remarks' => 'Staff cannot make the final decision.',
        ])->assertForbidden();

        // 1. Administrator approves the verified request.
        $resp1 = $this->actingAs($this->adminUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Approved',
            'remarks' => 'Requirements verified; approved for processing.',
        ]);
        $resp1->assertOk()->assertJsonPath('data.status', 'Approved');
        $br->refresh();
        $this->assertNotNull($br->approved_at);

        // 2. Staff starts processing.
        $resp2 = $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Processing',
        ]);
        $resp2->assertStatus(200)->assertJsonPath('data.status', 'Processing');

        // A request cannot be made ready without the prepared and signed files.
        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Ready for Pickup',
        ])->assertStatus(422);

        $this->actingAs($this->staffUser)->post(
            "/api/barangay-requests/{$br->request_id}/documents/prepared",
            ['document' => UploadedFile::fake()->create('prepared.pdf', 100, 'application/pdf')],
            ['Accept' => 'application/json']
        )->assertOk();

        $this->actingAs($this->adminUser)->post(
            "/api/barangay-requests/{$br->request_id}/documents/authorize",
            ['document' => UploadedFile::fake()->create('signed.pdf', 100, 'application/pdf')],
            ['Accept' => 'application/json']
        )->assertOk();

        $signedDocumentId = $br->fresh()->signed_document_id;
        $this->actingAs($this->user)
            ->getJson("/api/barangay-requests/{$br->request_id}/documents/{$signedDocumentId}/view")
            ->assertOk();

        $anotherResident = User::factory()->create([
            'email_verified_at' => now(),
            'verification_status' => 'verified',
        ]);
        $this->actingAs($anotherResident)
            ->getJson("/api/barangay-requests/{$br->request_id}/documents/{$signedDocumentId}/view")
            ->assertForbidden();

        // 3. Staff marks the authorized document ready.
        $resp3 = $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Ready for Pickup',
        ]);
        $resp3->assertStatus(200)->assertJsonPath('data.status', 'Ready for Pickup');
        $br->refresh();
        $this->assertNotNull($br->ready_for_pickup_at);

        // 4. Release requires the recipient to be recorded.
        $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Completed',
        ])->assertStatus(422);

        $resp4 = $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Completed',
            'recipient_name' => 'Juan Dela Cruz',
        ]);
        $resp4->assertStatus(200)->assertJsonPath('data.status', 'Completed');
        $br->refresh();
        $this->assertNotNull($br->claimed_at);
        $this->assertSame('Juan Dela Cruz', $br->release_recipient_name);
        $this->assertSame($this->staffUser->user_id, $br->released_by);

        $this->assertDatabaseHas('audit_logs', [
            'table_name' => 'barangay_requests',
            'record_id' => $br->request_id,
            'action' => 'document_authorized',
            'user_id' => $this->adminUser->user_id,
        ]);
        $this->actingAs($this->user)
            ->getJson("/api/barangay-requests/{$br->request_id}")
            ->assertOk()
            ->assertJsonFragment(['action' => 'document_authorized'])
            ->assertJsonFragment(['action' => 'request_approved'])
            ->assertJsonFragment(['action' => 'processing_started'])
            ->assertJsonFragment(['action' => 'document_released']);
    }

    public function test_admin_can_approve_registered_requests(): void
    {
        $request = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Admin approval test',
            'tracking_number' => 'BR-20260904-ADMIN1',
            'status' => 'Pending',
        ]);

        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$request->request_id}/requirements/verify", [
                'requirements_complete' => true,
            ])
            ->assertOk();

        $this->actingAs($this->adminUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'Approved',
                'remarks' => 'Verified resident identity and eligibility.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'Approved');
    }

    public function test_additional_requirements_can_be_resubmitted_and_reenter_review(): void
    {
        Storage::fake('local');
        $request = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Employment',
            'tracking_number' => 'BR-20260904-RESUB1',
            'status' => 'Pending',
        ]);

        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$request->request_id}/requirements/verify", [
                'requirements_complete' => false,
            ])
            ->assertOk();

        $this->actingAs($this->adminUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'Approved',
                'remarks' => 'Approval is premature.',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->actingAs($this->adminUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'Additional Requirements',
                'remarks' => 'Please provide proof of residency.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'Additional Requirements');

        $this->actingAs($this->user)->post(
            "/api/barangay-requests/{$request->request_id}/requirements/resubmit",
            [
                'notes' => 'Attached the requested proof of residency.',
                'documents' => [
                    UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf'),
                ],
            ],
            ['Accept' => 'application/json']
        )->assertOk()
            ->assertJsonPath('data.status', 'Pending');

        $this->assertDatabaseHas('barangay_request_documents', [
            'request_id' => $request->request_id,
            'purpose' => 'additional_requirement',
            'original_name' => 'proof.pdf',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'table_name' => 'barangay_requests',
            'record_id' => $request->request_id,
            'action' => 'requirements_resubmitted',
            'user_id' => $this->user->user_id,
        ]);
        $this->assertNull($request->fresh()->verified_at);
    }

    public function test_decision_requires_verification_and_remarks(): void
    {
        $request = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Employment',
            'tracking_number' => 'BR-20260904-VERIFY1',
            'status' => 'Pending',
        ]);

        $this->actingAs($this->adminUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'Approved',
                'remarks' => 'Looks good.',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$request->request_id}/requirements/verify", [
                'requirements_complete' => true,
            ])
            ->assertOk();

        $this->actingAs($this->adminUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'Rejected',
                'remarks' => ' ',
            ])
            ->assertStatus(422);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        /** @var BarangayRequest $br */
        $br = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Test',
            'tracking_number' => 'BR-20260904-TEST02',
            'status' => 'Pending',
        ]);

        // Pending -> Completed is invalid
        $response = $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Completed',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_client_cannot_override_service_timestamps(): void
    {
        /** @var BarangayRequest $br */
        $br = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Test',
            'tracking_number' => 'BR-20260904-TEST03',
            'status' => 'Pending',
        ]);

        $fakeTimestamp = '2020-01-01 00:00:00';

        $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Approved',
            'approved_at' => $fakeTimestamp,
        ]);

        $br->refresh();
        $this->assertNotEquals($fakeTimestamp, $br->approved_at?->format('Y-m-d H:i:s'));
    }

    public function test_staff_requests_endpoint_returns_registered_requests(): void
    {
        BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Reg Test',
            'tracking_number' => 'BR-20260904-UNIQ1',
            'status' => 'Pending',
        ]);

        $response = $this->actingAs($this->staffUser)->getJson('/api/staff/requests');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertSame(
            'BR-20260904-UNIQ1',
            $data[0]['tracking_number']
        );
    }

    public function test_authorization_rules(): void
    {
        // Normal user cannot see all requests
        $response = $this->actingAs($this->user)->getJson('/api/staff/requests');
        $response->assertStatus(403);

        // Normal user cannot view staff list
        $response2 = $this->actingAs($this->user)->getJson('/api/staff');
        $response2->assertStatus(403);

        // Staff user cannot view staff list (Admin only)
        $response3 = $this->actingAs($this->staffUser)->getJson('/api/staff');
        $response3->assertStatus(403);

        // Admin can view staff list
        $response4 = $this->actingAs($this->adminUser)->getJson('/api/staff');
        $response4->assertStatus(200);
    }
}
