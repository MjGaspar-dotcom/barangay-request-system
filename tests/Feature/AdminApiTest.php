<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\AuditLog;
use App\Models\DocumentType;
use App\Models\Notification;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_and_activity_endpoints_return_data(): void
    {
        $admin = $this->createUser('admin');
        Admin::create(['user_id' => $admin->user_id]);
        DocumentType::create([
            'document_name' => 'Certificate',
            'description' => 'Barangay certificate',
            'processing_days' => 2,
            'is_active' => true,
        ]);
        AuditLog::create([
            'action' => 'created',
            'table_name' => 'barangay_requests',
            'record_id' => 1,
            'description' => 'Request submitted.',
        ]);
        Notification::create([
            'user_id' => $admin->user_id,
            'title' => 'Update',
            'message' => 'A new update is available.',
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/stats')
            ->assertOk()
            ->assertJsonPath('data.active_document_types', 1)
            ->assertJsonPath('data.total_audit_logs', 1);

        $this->getJson('/api/admin/recent-activity')
            ->assertOk()
            ->assertJsonPath('data.data.0.action', 'created');

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('data.data.0.title', 'Update');

        $this->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 1);
    }

    public function test_admin_can_create_staff_and_list_users(): void
    {
        $admin = $this->createUser('admin');
        Admin::create(['user_id' => $admin->user_id]);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/staff', [
            'username' => 'newstaff',
            'password' => 'password123',
            'first_name' => 'New',
            'middle_name' => null,
            'last_name' => 'Staff',
            'birth_date' => '1990-01-01',
            'gender' => 'Male',
            'civil_status' => 'Single',
            'address' => 'Barangay Aurora',
            'contact_number' => '09123456789',
            'email' => 'newstaff@example.test',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.username', 'newstaff');
        $this->assertDatabaseHas('staff', [
            'user_id' => $response->json('data.user.user_id'),
            'assigned_by' => $admin->admin->admin_id,
        ]);
        $this->assertTrue(Hash::check(
            'password123',
            User::findOrFail($response->json('data.user.user_id'))->password,
        ));

        $this->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonFragment(['role' => 'admin'])
            ->assertJsonFragment(['role' => 'staff']);
    }

    public function test_guest_request_submission_can_be_tracked_and_advanced(): void
    {
        $documentType = DocumentType::create([
            'document_name' => 'Certificate',
            'description' => 'Barangay certificate',
            'processing_days' => 2,
            'is_active' => true,
        ]);
        $admin = $this->createUser('admin');
        Admin::create(['user_id' => $admin->user_id]);

        $submission = $this->postJson('/api/barangay-requests', [
            'document_type_id' => $documentType->document_type_id,
            'purpose' => 'Proof of residency',
            'guest_first_name' => 'Guest',
            'guest_last_name' => 'Resident',
            'guest_gender' => 'Male',
            'guest_address' => 'Barangay Aurora',
            'guest_contact_number' => '09123456789',
        ])->assertCreated();

        $trackingNumber = $submission->json('data.tracking_number');
        $requestId = $submission->json('data.request_id');

        $this->getJson("/api/barangay-requests/track/{$trackingNumber}")
            ->assertOk()
            ->assertJsonPath('data.document', 'Certificate')
            ->assertJsonPath('data.status', 'Pending');

        Sanctum::actingAs($admin);
        $this->putJson("/api/barangay-requests/{$requestId}", [
            'status' => 'Processing',
            'remarks' => 'Review in progress.',
        ])->assertOk()
            ->assertJsonPath('data.status', 'Processing');

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'status_changed',
            'record_id' => $requestId,
        ]);
    }

    private function createUser(string $username): User
    {
        return User::create([
            'username' => $username,
            'password' => Hash::make('password123'),
            'first_name' => ucfirst($username),
            'last_name' => 'Test',
            'birth_date' => '1990-01-01',
            'gender' => 'Male',
            'civil_status' => 'Single',
            'address' => 'Barangay Aurora',
            'contact_number' => '09123456789',
            'email' => "{$username}@example.test",
            'valid_id_type' => null,
            'valid_id_front' => null,
            'verification_status' => 'verified',
        ]);
    }
}
