<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_change_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);

        $this->actingAs($user)
            ->patchJson('/api/profile/password', [
                'current_password' => 'old-password',
                'new_password' => 'new-password',
                'new_password_confirmation' => 'new-password',
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertTrue(
            Hash::check('new-password', $user->fresh()->password)
        );
    }

    public function test_password_change_rejects_an_incorrect_current_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);

        $this->actingAs($user)
            ->patchJson('/api/profile/password', [
                'current_password' => 'incorrect-password',
                'new_password' => 'new-password',
                'new_password_confirmation' => 'new-password',
            ])
            ->assertUnprocessable();

        $this->assertTrue(
            Hash::check('old-password', $user->fresh()->password)
        );
    }

    public function test_password_change_requires_matching_confirmation(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);

        $this->actingAs($user)
            ->patchJson('/api/profile/password', [
                'current_password' => 'old-password',
                'new_password' => 'new-password',
                'new_password_confirmation' => 'different-password',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('new_password');

        $this->assertTrue(
            Hash::check('old-password', $user->fresh()->password)
        );
    }
}
