<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_only_requires_a_street_name_for_the_resident_address(): void
    {
        $response = $this->postJson('/api/register', [
            'username' => 'street-only-resident',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'first_name' => 'Test',
            'last_name' => 'Resident',
            'birth_date' => '2000-01-01',
            'gender' => 'Prefer not to say',
            'civil_status' => 'Single',
            'street_name' => 'Main Street',
            'contact_number' => '09123456789',
            'email' => 'street-only@example.com',
        ]);

        $response->assertCreated()
            ->assertJsonPath(
                'data.address',
                'Main Street, Barangay Aurora, Alicia, Isabela, 3306'
            )
            ->assertJsonPath('data.street_name', 'Main Street');

        $this->assertDatabaseHas('users', [
            'email' => 'street-only@example.com',
            'barangay_name' => 'Barangay Aurora',
            'municipality' => 'Alicia',
            'province' => 'Isabela',
            'postal_code' => '3306',
        ]);
    }

    public function test_profile_address_update_requires_only_street_name_and_keeps_location_static(): void
    {
        $user = User::factory()->create([
            'street_name' => 'Old Street',
            'address' => 'Old Street, Somewhere Else',
        ]);

        $this->actingAs($user)
            ->patchJson('/api/profile', [
                'street_name' => 'New Street',
                'barangay_name' => 'Different Barangay',
                'municipality' => 'Different City',
                'province' => 'Different Province',
                'postal_code' => '0000',
            ])
            ->assertOk()
            ->assertJsonPath(
                'data.address',
                'New Street, Barangay Aurora, Alicia, Isabela, 3306'
            );

        $this->assertSame(
            'Barangay Aurora',
            $user->fresh()->barangay_name
        );
        $this->assertSame('Alicia', $user->fresh()->municipality);
        $this->assertSame('Isabela', $user->fresh()->province);
        $this->assertSame('3306', $user->fresh()->postal_code);
    }
}