<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\AuditLog;
use App\Models\BarangayRequest;
use App\Models\BarangaySettings;
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

        BarangaySettings::query()->whereKey(1)->update([
            'municipality' => 'Test Municipality',
            'province' => 'Test Province',
            'punong_barangay_name' => 'Test Punong Barangay',
            'seal_path' => 'barangay-seals/test-seal.png',
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
            ->assertJsonPath('data.request.status', 'request_submitted');

        $this->assertDatabaseHas('barangay_requests', [
            'user_id' => $this->user->user_id,
            'purpose' => 'Employment Application',
            'status' => 'request_submitted',
        ]);

        $trackingNumber = $response->json('data.request.tracking_number');
        $this->getJson("/api/track/{$trackingNumber}")
            ->assertOk()
            ->assertJsonPath('data.status', 'request_submitted')
            ->assertJsonPath(
                'data.document_type',
                'Barangay Clearance'
            );
    }

    public function test_registered_user_can_submit_supporting_documents_with_request(): void
    {
        Storage::fake('local');

        $response = $this->actingAs($this->user)->post(
            '/api/barangay-requests',
            [
                'document_type_id' => $this->documentType->document_type_id,
                'purpose' => 'Employment Application',
                'supporting_documents' => [
                    UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf'),
                ],
            ],
            ['Accept' => 'application/json']
        );

        $response->assertCreated()
            ->assertJsonPath('data.request.status', 'request_submitted');

        $request = BarangayRequest::where(
            'tracking_number',
            $response->json('data.request.tracking_number')
        )->firstOrFail();
        $document = $request->documents()->firstOrFail();

        $this->assertSame('additional_requirement', $document->purpose);
        Storage::disk('local')->assertExists($document->storage_path);
    }

    public function test_resident_can_replace_and_delete_owned_supporting_documents(): void
    {
        Storage::fake('local');

        $response = $this->actingAs($this->user)->post(
            '/api/barangay-requests',
            [
                'document_type_id' => $this->documentType->document_type_id,
                'purpose' => 'Employment Application',
                'supporting_documents' => [
                    UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf'),
                ],
            ],
            ['Accept' => 'application/json']
        );
        $response->assertCreated();

        $request = BarangayRequest::where(
            'tracking_number',
            $response->json('data.request.tracking_number')
        )->firstOrFail();
        $document = $request->documents()->firstOrFail();
        $oldPath = $document->storage_path;

        $otherResident = User::factory()->create(['verification_status' => 'verified']);
        $this->actingAs($otherResident)->getJson(
            "/api/barangay-requests/{$request->request_id}/documents/{$document->request_document_id}/view"
        )->assertForbidden();

        $this->actingAs($otherResident)->post(
            "/api/barangay-requests/{$request->request_id}/documents/{$document->request_document_id}",
            [
                '_method' => 'PUT',
                'document' => UploadedFile::fake()->create(
                    'unauthorized.pdf',
                    100,
                    'application/pdf'
                ),
            ],
            ['Accept' => 'application/json']
        )->assertForbidden();

        $replacementResponse = $this->actingAs($this->user)->post(
            "/api/barangay-requests/{$request->request_id}/documents/{$document->request_document_id}",
            [
                '_method' => 'PUT',
                'document' => UploadedFile::fake()->create(
                    'replacement.pdf',
                    100,
                    'application/pdf'
                ),
            ],
            ['Accept' => 'application/json']
        );
        $replacementResponse->assertOk()
            ->assertJsonPath('data.original_name', 'replacement.pdf');

        $document->refresh();
        $this->assertNotSame($oldPath, $document->storage_path);
        $this->assertSame('local', $document->storage_disk);
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($document->storage_path);

        $this->actingAs($this->user)->deleteJson(
            "/api/barangay-requests/{$request->request_id}/documents/{$document->request_document_id}"
        )->assertOk();
        $this->assertDatabaseMissing('barangay_request_documents', [
            'request_document_id' => $document->request_document_id,
        ]);
        Storage::disk('local')->assertMissing($document->storage_path);
    }

    public function test_public_client_can_list_document_types(): void
    {
        $response = $this->getJson('/api/document-types');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.document_name', 'Barangay Clearance')
            ->assertJsonPath('data.0.processing_time_minutes', 10)
            ->assertJsonPath('data.0.min_age', null)
            ->assertJsonPath('data.0.max_age', null);
    }

    public function test_admin_can_update_document_type_processing_time(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/document-types/{$this->documentType->document_type_id}", [
                'document_name' => 'Barangay Clearance',
                'description' => 'Clearance for employment',
                'processing_time_minutes' => 10,
                'min_age' => 18,
                'max_age' => 24,
                'is_active' => true,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.processing_time_minutes', 10)
            ->assertJsonPath('data.min_age', 18)
            ->assertJsonPath('data.max_age', 24);

        $this->assertDatabaseHas('document_types', [
            'document_type_id' => $this->documentType->document_type_id,
            'processing_time_minutes' => 10,
            'min_age' => 18,
            'max_age' => 24,
        ]);
    }

    public function test_admin_cannot_save_an_invalid_document_age_range(): void
    {
        $this->actingAs($this->adminUser)
            ->putJson("/api/document-types/{$this->documentType->document_type_id}", [
                'document_name' => 'Barangay Clearance',
                'description' => 'Clearance for employment',
                'processing_time_minutes' => 10,
                'min_age' => 30,
                'max_age' => 18,
                'is_active' => true,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('max_age');
    }

    public function test_anonymous_client_cannot_submit_registered_requests(): void
    {
        $this->postJson('/api/barangay-requests', [
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Employment Application',
        ])->assertUnauthorized();
    }

    public function test_unverified_resident_cannot_submit_request(): void
    {
        $unverified = User::factory()->create([
            'email_verified_at' => now(),
            'verification_status' => 'pending',
        ]);

        $this->actingAs($unverified)->postJson('/api/barangay-requests', [
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Employment Application',
        ])->assertForbidden();
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
            'status' => 'request_submitted',
        ]);

        $response = $this->actingAs($this->staffUser)
            ->getJson("/api/barangay-requests/{$request->request_id}");

        $response->assertOk()
            ->assertJsonPath('data.user.user_id', $this->user->user_id)
            ->assertJsonPath('data.user.valid_id_type', 'National ID')
            ->assertJsonPath(
                'data.user.valid_id_front_url',
                fn ($url) => is_string($url) && str_contains($url, '/api/users/')
            )
            ->assertJsonPath(
                'data.user.valid_id_back_url',
                fn ($url) => is_string($url) && str_contains($url, '/api/users/')
            );
    }

    public function test_resident_profile_id_images_survive_logout_and_relogin(): void
    {
        Storage::fake('local');

        $response = $this->actingAs($this->user)
            ->post('/api/profile', [
                '_method' => 'PATCH',
                'valid_id_type' => 'National ID',
                'valid_id_front' => UploadedFile::fake()->create('front.jpg', 100, 'image/jpeg'),
                'valid_id_back' => UploadedFile::fake()->create('back.jpg', 100, 'image/jpeg'),
            ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('data.valid_id_type', 'National ID')
            ->assertJsonPath(
                'data.valid_id_front_url',
                fn ($url) => is_string($url) && str_contains($url, '/api/users/')
            )
            ->assertJsonPath(
                'data.valid_id_back_url',
                fn ($url) => is_string($url) && str_contains($url, '/api/users/')
            );

        $user = $this->user->fresh();
        $this->assertStringStartsWith('resident-valid-ids/', $user->valid_id_front);
        $this->assertStringStartsWith('resident-valid-ids/', $user->valid_id_back);
        $this->assertSame('local', $user->valid_id_front_disk);
        $this->assertSame('front.jpg', $user->valid_id_front_original_name);
        Storage::disk('local')->assertExists($user->valid_id_front);
        Storage::disk('local')->assertExists($user->valid_id_back);

        $this->app['auth']->forgetGuards();
        $credentials = [
            'username' => $this->user->username,
            'password' => 'password',
        ];
        $login = $this->postJson('/api/login', $credentials)
            ->assertOk()
            ->assertJsonPath(
                'data.valid_id_front_url',
                fn ($url) => is_string($url) && str_contains($url, '/api/users/')
            )
            ->assertJsonPath(
                'data.valid_id_back_url',
                fn ($url) => is_string($url) && str_contains($url, '/api/users/')
            );

        $this->get($login->json('data.valid_id_front_url'))
            ->assertOk()
            ->assertHeader('Content-Type', 'image/jpeg');
        $this->actingAs(User::factory()->create())->getJson(
            "/api/users/{$user->user_id}/files/valid_id_front"
        )->assertForbidden();

        $this->app['auth']->forgetGuards();
        $this->withToken($login->json('token'))
            ->postJson('/api/logout')
            ->assertOk();

        $this->postJson('/api/login', $credentials)
            ->assertOk()
            ->assertJsonPath(
                'data.valid_id_front_url',
                fn ($url) => is_string($url) && str_contains($url, '/api/users/')
            )
            ->assertJsonPath(
                'data.valid_id_back_url',
                fn ($url) => is_string($url) && str_contains($url, '/api/users/')
            );

        Storage::disk('local')->assertExists($user->valid_id_front);
    }

    public function test_admin_rejection_removes_resident_id_documents(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('resident-valid-ids/front.jpg', 'front image');
        Storage::disk('public')->put('resident-valid-ids/back.jpg', 'back image');

        $this->user->update([
            'valid_id_type' => 'National ID',
            'valid_id_front' => 'resident-valid-ids/front.jpg',
            'valid_id_back' => 'resident-valid-ids/back.jpg',
            'verification_status' => 'pending',
        ]);

        $this->actingAs($this->adminUser)
            ->patchJson("/api/admin/users/{$this->user->user_id}/verification", [
                'verification_status' => 'rejected',
            ])
            ->assertOk()
            ->assertJsonPath('data.valid_id_type', null)
            ->assertJsonPath('data.valid_id_front_url', null)
            ->assertJsonPath('data.valid_id_back_url', null);

        Storage::disk('public')->assertMissing('resident-valid-ids/front.jpg');
        Storage::disk('public')->assertMissing('resident-valid-ids/back.jpg');
    }

    public function test_admin_reset_removes_resident_id_documents(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('resident-valid-ids/front.jpg', 'front image');
        Storage::disk('public')->put('resident-valid-ids/back.jpg', 'back image');

        $this->user->update([
            'valid_id_type' => 'National ID',
            'valid_id_front' => 'resident-valid-ids/front.jpg',
            'valid_id_back' => 'resident-valid-ids/back.jpg',
            'verification_status' => 'verified',
        ]);

        $this->actingAs($this->adminUser)
            ->patchJson("/api/admin/users/{$this->user->user_id}/verification", [
                'verification_status' => 'pending',
            ])
            ->assertOk()
            ->assertJsonPath('data.verification_status', 'pending')
            ->assertJsonPath('data.valid_id_front_url', null)
            ->assertJsonPath('data.valid_id_back_url', null);

        Storage::disk('public')->assertMissing('resident-valid-ids/front.jpg');
        Storage::disk('public')->assertMissing('resident-valid-ids/back.jpg');
    }

    public function test_admin_account_deletion_removes_resident_id_documents(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('resident-valid-ids/front.jpg', 'front image');
        Storage::disk('public')->put('resident-valid-ids/back.jpg', 'back image');

        $this->user->update([
            'valid_id_type' => 'National ID',
            'valid_id_front' => 'resident-valid-ids/front.jpg',
            'valid_id_back' => 'resident-valid-ids/back.jpg',
        ]);

        $this->actingAs($this->adminUser)
            ->deleteJson("/api/admin/users/{$this->user->user_id}")
            ->assertOk();

        $deletedUser = User::withTrashed()->findOrFail($this->user->user_id);
        $this->assertNotNull($deletedUser->deleted_at);
        $this->assertNull($deletedUser->valid_id_type);
        $this->assertNull($deletedUser->valid_id_front);
        $this->assertNull($deletedUser->valid_id_back);
        Storage::disk('public')->assertMissing('resident-valid-ids/front.jpg');
        Storage::disk('public')->assertMissing('resident-valid-ids/back.jpg');
    }

    public function test_resident_profile_picture_is_saved_to_private_storage(): void
    {
        Storage::fake('local');

        $response = $this->actingAs($this->user)
            ->post('/api/profile', [
                '_method' => 'PATCH',
                'profile_picture' => UploadedFile::fake()->create(
                    'profile.jpg',
                    100,
                    'image/jpeg'
                ),
            ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath(
                'data.profile_picture_url',
                fn ($url) => is_string($url) && str_contains($url, '/api/users/')
            );

        $profilePicture = $this->user->fresh()->profile_picture;
        $this->assertStringStartsWith('resident-profile-pictures/', $profilePicture);
        Storage::disk('local')->assertExists($profilePicture);
    }

    public function test_upload_migration_preserves_files_already_on_the_target_disk(): void
    {
        Storage::fake('local');
        config([
            'filesystems.private_upload_disk' => 'local',
            'filesystems.legacy_valid_id_disk' => 'local',
            'filesystems.legacy_request_document_disk' => 'local',
        ]);

        $response = $this->actingAs($this->user)->post(
            '/api/barangay-requests',
            [
                'document_type_id' => $this->documentType->document_type_id,
                'purpose' => 'Employment Application',
                'supporting_documents' => [
                    UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf'),
                ],
            ],
            ['Accept' => 'application/json']
        );
        $response->assertCreated();

        $request = BarangayRequest::where(
            'tracking_number',
            $response->json('data.request.tracking_number')
        )->firstOrFail();
        $document = $request->documents()->firstOrFail();
        $document->storage_disk = null;
        $document->save();

        $this->artisan('uploads:migrate-to-persistent-storage')
            ->assertExitCode(0);

        Storage::disk('local')->assertExists($document->storage_path);
        $this->assertSame('local', $document->fresh()->storage_disk);
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
        $this->actingAs($this->user)->postJson('/api/barangay-requests', [
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Passport Requirement',
        ])->assertCreated();
        $br = BarangayRequest::where('purpose', 'Passport Requirement')->firstOrFail();

        // The resident's mobile account verification is sufficient to approve.
        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$br->request_id}", [
                'status' => 'approved',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
        $br->refresh();
        $this->assertNotNull($br->approved_at);
        $this->assertSame($this->staffUser->user_id, $br->decision_by);

        // A document cannot be printed before it is generated for pickup.
        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$br->request_id}/generated-document/print")
            ->assertStatus(422);
        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$br->request_id}", [
                'status' => 'completed',
                'recipient_name' => 'Juan Dela Cruz',
            ])->assertStatus(422);

        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$br->request_id}", [
                'status' => 'ready_for_pickup',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'ready_for_pickup');
        $br->refresh();
        $this->assertNotNull($br->ready_for_pickup_at);
        $this->assertSame('barangay_clearance', $br->document_template_identifier);
        $this->assertNotEmpty($br->document_number);
        $this->assertSame(
            'Barangay Clearance',
            $br->generated_document_data['document_type']
        );
        $documentNumber = $br->document_number;

        $this->actingAs($this->staffUser)
            ->getJson("/api/barangay-requests/{$br->request_id}/generated-document")
            ->assertOk()
            ->assertJsonPath('data.document.document_number', $documentNumber)
            ->assertJsonPath('data.print_count', 0);

        // Printing/reprinting is logged and leaves the request ready for pickup.
        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$br->request_id}/generated-document/print")
            ->assertOk()
            ->assertJsonPath('data.action', 'document_printed');
        $this->actingAs($this->adminUser)
            ->postJson("/api/barangay-requests/{$br->request_id}/generated-document/print")
            ->assertOk()
            ->assertJsonPath('data.action', 'document_reprinted');
        $br->refresh();
        $this->assertSame('ready_for_pickup', $br->status);
        $this->assertSame($documentNumber, $br->document_number);
        $this->assertDatabaseHas('audit_logs', [
            'table_name' => 'barangay_requests',
            'record_id' => $br->request_id,
            'action' => 'document_reprinted',
            'user_id' => $this->adminUser->user_id,
        ]);

        $resp4 = $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'completed',
            'recipient_name' => 'Juan Dela Cruz',
        ]);
        $resp4->assertStatus(200)->assertJsonPath('data.status', 'completed');
        $br->refresh();
        $this->assertNotNull($br->claimed_at);
        $this->assertSame('Juan Dela Cruz', $br->release_recipient_name);
        $this->assertSame($this->staffUser->user_id, $br->released_by);

        $this->actingAs($this->staffUser)
            ->postJson("/api/barangay-requests/{$br->request_id}/generated-document/print")
            ->assertStatus(422);

        $this->assertDatabaseHas('audit_logs', [
            'table_name' => 'barangay_requests',
            'record_id' => $br->request_id,
            'action' => 'document_generated',
            'user_id' => $this->staffUser->user_id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'table_name' => 'barangay_requests',
            'record_id' => $br->request_id,
            'action' => 'document_previewed',
            'user_id' => $this->staffUser->user_id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'table_name' => 'barangay_requests',
            'record_id' => $br->request_id,
            'action' => 'document_reprinted',
            'user_id' => $this->adminUser->user_id,
        ]);
        $this->actingAs($this->user)
            ->getJson("/api/barangay-requests/{$br->request_id}")
            ->assertOk()
            ->assertJsonFragment(['action' => 'document_generated'])
            ->assertJsonFragment(['action' => 'request_approved'])
            ->assertJsonFragment(['action' => 'document_printed'])
            ->assertJsonFragment(['action' => 'document_reprinted'])
            ->assertJsonFragment(['action' => 'document_released']);
    }

    public function test_admin_can_approve_registered_requests(): void
    {
        $request = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Admin approval test',
            'tracking_number' => 'BR-20260904-ADMIN1',
            'status' => 'request_submitted',
        ]);

        $this->actingAs($this->adminUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'approved',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_staff_and_admin_can_reject_with_a_reason_and_without_feedback(): void
    {
        $staffRequest = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Employment rejection by staff',
            'tracking_number' => 'BR-20261112-REJ001',
            'status' => 'request_submitted',
        ]);
        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$staffRequest->request_id}", [
                'status' => 'rejected',
                'rejection_reason' => 'Other',
                'rejection_other' => 'Residency documents are not valid for this address.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Other')
            ->assertJsonPath('data.rejection_other', 'Residency documents are not valid for this address.')
            ->assertJsonPath('data.remarks', null);

        $adminRequest = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Employment rejection by admin',
            'tracking_number' => 'BR-20261112-REJ002',
            'status' => 'request_submitted',
        ]);
        $this->actingAs($this->adminUser)
            ->putJson("/api/barangay-requests/{$adminRequest->request_id}", [
                'status' => 'rejected',
                'rejection_reason' => 'Incomplete Requirements',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.remarks', null);

        $this->actingAs($this->user)
            ->getJson("/api/barangay-requests/{$staffRequest->request_id}")
            ->assertOk()
            ->assertJsonPath('data.rejection_reason', 'Other')
            ->assertJsonPath('data.remarks', null);
        $this->assertDatabaseHas('notifications', [
            'request_id' => $staffRequest->request_id,
            'user_id' => $this->user->user_id,
            'type' => 'request_status_changed',
        ]);
    }

    public function test_approval_and_rejection_do_not_require_remarks(): void
    {
        $request = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Employment',
            'tracking_number' => 'BR-20260904-VERIFY1',
            'status' => 'request_submitted',
        ]);

        $this->actingAs($this->adminUser)
            ->putJson("/api/barangay-requests/{$request->request_id}", [
                'status' => 'approved',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $rejectionRequest = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Employment rejection validation',
            'tracking_number' => 'BR-20260904-VERIFY2',
            'status' => 'request_submitted',
        ]);

        $this->actingAs($this->staffUser)
            ->putJson("/api/barangay-requests/{$rejectionRequest->request_id}", [
                'status' => 'rejected',
                'rejection_reason' => 'Other',
                'rejection_other' => 'Not valid',
            ])
            ->assertOk()
            ->assertJsonPath('data.remarks', null);

        $invalidReasonRequest = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Invalid rejection reason',
            'tracking_number' => 'BR-20260904-VERIFY3',
            'status' => 'request_submitted',
        ]);
        $this->actingAs($this->adminUser)
            ->putJson("/api/barangay-requests/{$invalidReasonRequest->request_id}", [
                'status' => 'rejected',
                'rejection_reason' => 'Not a valid reason',
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
            'status' => 'request_submitted',
        ]);

        // Request Submitted -> Completed is invalid
        $response = $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'completed',
            'recipient_name' => 'Juan Dela Cruz',
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
            'status' => 'request_submitted',
        ]);

        $fakeTimestamp = '2020-01-01 00:00:00';

        $this->actingAs($this->staffUser)->putJson("/api/barangay-requests/{$br->request_id}", [
            'status' => 'approved',
            'approved_at' => $fakeTimestamp,
        ])->assertOk()
            ->assertJsonPath('data.status', 'approved');

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
            'status' => 'request_submitted',
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

    public function test_staff_cannot_submit_resident_requests_or_change_their_role(): void
    {
        $this->actingAs($this->staffUser)
            ->postJson('/api/barangay-requests', [
                'document_type_id' => $this->documentType->document_type_id,
                'purpose' => 'Staff account submission attempt',
            ])
            ->assertForbidden();

        $this->actingAs($this->staffUser)
            ->patchJson('/api/profile', ['role' => 'admin'])
            ->assertForbidden();

        $this->actingAs($this->staffUser)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('role', 'staff');

        $this->assertDatabaseMissing('barangay_requests', [
            'purpose' => 'Staff account submission attempt',
        ]);
    }

    public function test_authorization_rules(): void
    {
        // Normal user cannot see all requests
        $response = $this->actingAs($this->user)->getJson('/api/staff/requests');
        $response->assertStatus(403);

        $this->actingAs($this->user)
            ->getJson('/api/staff/dashboard-stats')
            ->assertForbidden();

        // Normal user cannot view staff list
        $response2 = $this->actingAs($this->user)->getJson('/api/staff');
        $response2->assertStatus(403);

        // Staff user cannot view staff list (Admin only)
        $response3 = $this->actingAs($this->staffUser)->getJson('/api/staff');
        $response3->assertStatus(403);

        foreach ([
            '/api/admin/stats',
            '/api/admin/users',
            '/api/admin/staff',
            '/api/admin/barangay-settings',
            '/api/admin/recent-activity',
            '/api/audit-logs',
            '/api/admin/analytics/document-request-trends',
        ] as $adminEndpoint) {
            $this->actingAs($this->staffUser)
                ->getJson($adminEndpoint)
                ->assertForbidden();
        }

        $request = BarangayRequest::create([
            'user_id' => $this->user->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Staff deletion attempt',
            'tracking_number' => 'BR-20260904-DEL001',
            'status' => 'request_submitted',
        ]);
        $this->actingAs($this->staffUser)
            ->deleteJson("/api/barangay-requests/{$request->request_id}")
            ->assertForbidden();
        $this->assertDatabaseHas('barangay_requests', [
            'request_id' => $request->request_id,
        ]);

        // Admin can view staff list
        $response4 = $this->actingAs($this->adminUser)->getJson('/api/staff');
        $response4->assertStatus(200);
    }

    public function test_staff_can_view_dashboard_summary_counts(): void
    {
        $response = $this->actingAs($this->staffUser)
            ->getJson('/api/staff/dashboard-stats')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'total_registered_requests',
                    'total_residents',
                    'total_staff',
                    'active_document_types',
                    'total_audit_logs',
                ],
            ])
            ->assertJsonPath('data.total_registered_requests', 0)
            ->assertJsonPath('data.total_residents', 1)
            ->assertJsonPath('data.total_staff', 1);

        foreach ([
            'active_document_types',
            'total_audit_logs',
        ] as $countField) {
            $this->assertIsInt($response->json("data.{$countField}"));
        }
    }

    public function test_staff_can_view_read_only_operational_admin_pages(): void
    {
        AuditLog::create([
            'user_id' => $this->staffUser->user_id,
            'staff_id' => $this->staff->staff_id,
            'action' => 'request_approved',
            'table_name' => 'barangay_requests',
            'record_id' => 1,
            'description' => 'A request was approved.',
            'ip_address' => '192.0.2.1',
            'new_values' => ['status' => 'approved'],
        ]);
        AuditLog::create([
            'user_id' => $this->adminUser->user_id,
            'action' => 'settings_updated',
            'table_name' => 'barangay_settings',
            'record_id' => 1,
            'description' => 'Settings were changed.',
        ]);

        $activity = $this->actingAs($this->staffUser)
            ->getJson('/api/staff/recent-activity')
            ->assertOk()
            ->json('data.data');

        $this->assertCount(1, $activity);
        $this->assertSame('barangay_requests', $activity[0]['table_name']);
        $this->assertArrayNotHasKey('ip_address', $activity[0]);
        $this->assertArrayNotHasKey('new_values', $activity[0]);

        $this->actingAs($this->staffUser)
            ->getJson('/api/staff/barangay-settings')
            ->assertNotFound();

        $this->actingAs($this->staffUser)
            ->putJson('/api/admin/barangay-settings', [
                'barangay_name' => 'Unauthorized update',
            ])
            ->assertForbidden();

        $this->actingAs($this->staffUser)
            ->postJson('/api/document-types', [
                'document_name' => 'Unauthorized document type',
                'processing_time_minutes' => 10,
            ])
            ->assertForbidden();
    }
}
