<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BarangayRequest;
use App\Models\DocumentType;
use App\Models\GuestRequest;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BarangayAndGuestRequestWorkflowTest extends TestCase
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

    public function test_guest_can_submit_request_and_track_it(): void
    {
        Storage::fake('public');
        $file = UploadedFile::fake()->create('id.jpg', 100, 'image/jpeg');

        $response = $this->postJson('/api/guest-requests', [
            'document_type_id' => $this->documentType->document_type_id,
            'first_name' => 'Juan',
            'middle_name' => 'Dela',
            'last_name' => 'Cruz',
            'birth_date' => '1995-05-15',
            'gender' => 'Male',
            'civil_status' => 'Single',
            'address' => '123 Main St',
            'contact_number' => '09123456789',
            'email' => 'juan@example.com',
            'valid_id_type' => 'National ID',
            'valid_id_image' => $file,
            'purpose' => 'Business Permit Application',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.request.status', 'Pending');

        $trackingNumber = $response->json('data.request.tracking_number');
        $this->assertStringStartsWith('GR-', $trackingNumber);

        // Track guest request
        $trackResponse = $this->getJson("/api/guest-requests/track/{$trackingNumber}");
        $trackResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'Pending');
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

    public function test_unified_staff_requests_endpoint_returns_registered_and_guest(): void
    {
        BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Reg Test',
            'tracking_number' => 'BR-20260904-UNIQ1',
            'status' => 'Pending',
        ]);

        GuestRequest::create([
            'first_name' => 'Maria',
            'last_name' => 'Clara',
            'birth_date' => '1998-01-01',
            'gender' => 'Female',
            'civil_status' => 'Single',
            'address' => 'QC',
            'contact_number' => '09181234567',
            'valid_id_type' => 'Passport',
            'valid_id_image' => 'guest-valid-ids/fake.jpg',
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Guest Test',
            'tracking_number' => 'GR-20260904-UNIQ2',
            'status' => 'Pending',
        ]);

        $response = $this->actingAs($this->staffUser)->getJson('/api/staff/requests');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertCount(2, $data);

        $types = collect($data)->pluck('request_type')->toArray();
        $this->assertContains('registered', $types);
        $this->assertContains('guest', $types);
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
