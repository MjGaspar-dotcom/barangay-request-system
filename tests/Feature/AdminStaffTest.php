<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminStaffTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_staff_account(): void
    {
        $adminUser = User::factory()->create();
        $admin = Admin::create([
            'user_id' => $adminUser->user_id,
        ]);

        $response = $this->actingAs($adminUser)->postJson('/api/admin/staff', [
            'username' => 'desk-staff',
            'password' => 'secure-password',
            'first_name' => 'Taylor',
            'middle_name' => null,
            'last_name' => 'Staff',
            'birth_date' => '1990-01-01',
            'gender' => 'Male',
            'civil_status' => 'Single',
            'address' => 'Aurora',
            'contact_number' => '09123456789',
            'email' => 'desk-staff@example.test',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $staffUserId = $response->json('data.user_id');

        $this->assertDatabaseHas('users', [
            'user_id' => $staffUserId,
            'username' => 'desk-staff',
            'email' => 'desk-staff@example.test',
            'verification_status' => 'verified',
        ]);
        $this->assertDatabaseHas('staff', [
            'user_id' => $staffUserId,
            'assigned_by' => $admin->admin_id,
        ]);
    }

    public function test_admin_can_remove_staff_account_from_the_directory(): void
    {
        $adminUser = User::factory()->create();
        $admin = Admin::create([
            'user_id' => $adminUser->user_id,
        ]);
        $staffUser = User::factory()->create();
        $staff = Staff::create([
            'user_id' => $staffUser->user_id,
            'assigned_by' => $admin->admin_id,
        ]);

        $this->actingAs($adminUser)
            ->deleteJson("/api/admin/staff/{$staff->staff_id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('staff', [
            'staff_id' => $staff->staff_id,
        ]);
        $this->assertSoftDeleted('users', [
            'user_id' => $staffUser->user_id,
        ]);

        $this->actingAs($adminUser)
            ->getJson('/api/admin/staff')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_directory_hides_staff_with_a_soft_deleted_user(): void
    {
        $adminUser = User::factory()->create();
        $admin = Admin::create([
            'user_id' => $adminUser->user_id,
        ]);
        $staffUser = User::factory()->create();
        Staff::create([
            'user_id' => $staffUser->user_id,
            'assigned_by' => $admin->admin_id,
        ]);
        $staffUser->delete();

        $this->actingAs($adminUser)
            ->getJson('/api/admin/staff')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_validation_returns_clear_duplicate_account_messages(): void
    {
        $adminUser = User::factory()->create();
        Admin::create([
            'user_id' => $adminUser->user_id,
        ]);
        User::factory()->create([
            'username' => 'existing-staff',
            'email' => 'existing-staff@example.test',
        ]);

        $this->actingAs($adminUser)
            ->postJson('/api/admin/staff', [
                'username' => 'existing-staff',
                'password' => 'secure-password',
                'first_name' => 'Taylor',
                'last_name' => 'Staff',
                'birth_date' => '1990-01-01',
                'gender' => 'Male',
                'civil_status' => 'Single',
                'address' => 'Aurora',
                'contact_number' => '09123456789',
                'email' => 'existing-staff@example.test',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['username', 'email'])
            ->assertJsonPath('errors.username.0', 'That username is already in use.')
            ->assertJsonPath('errors.email.0', 'That email address is already in use.');
    }
}
