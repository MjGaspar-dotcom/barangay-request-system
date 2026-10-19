<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BarangayRequest;
use App\Models\DocumentType;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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
    }

    public function test_anyone_can_list_document_types(): void
    {
        $response = $this->getJson('/api/document-types');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.document_name', 'Barangay Clearance');
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

        // 1. Staff approves request (Pending -> Approved)
        $resp1 = $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Approved',
            'remarks' => 'Approved by staff',
        ]);
        $resp1->assertStatus(200)->assertJsonPath('data.status', 'Approved');
        $br->refresh();
        $this->assertNotNull($br->approved_at);

        // 2. Staff processes request (Approved -> Processing)
        $resp2 = $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Processing',
        ]);
        $resp2->assertStatus(200)->assertJsonPath('data.status', 'Processing');

        // 3. Staff sets Ready for Pickup (Processing -> Ready for Pickup)
        $resp3 = $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Ready for Pickup',
        ]);
        $resp3->assertStatus(200)->assertJsonPath('data.status', 'Ready for Pickup');
        $br->refresh();
        $this->assertNotNull($br->ready_for_pickup_at);

        // 4. Staff completes request (Ready for Pickup -> Completed)
        $resp4 = $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'Completed',
        ]);
        $resp4->assertStatus(200)->assertJsonPath('data.status', 'Completed');
        $br->refresh();
        $this->assertNotNull($br->claimed_at);
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
            BarangayRequest::query()->value('request_id'),
            $data[0]['request_id']
        );
    }

    public function test_guest_request_endpoint_is_not_available(): void
    {
        $this->postJson('/api/guest-requests')->assertNotFound();
        $this->getJson('/api/guest-requests/track/GR-20260904-UNIQ2')->assertNotFound();
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
