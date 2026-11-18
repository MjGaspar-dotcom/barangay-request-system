<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\DocumentGenerationProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BarangayOfficialsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_official_names_without_changing_other_council_members(): void
    {
        $adminUser = User::factory()->create();
        Admin::create(['user_id' => $adminUser->user_id]);

        $profile = DocumentGenerationProfile::query()->findOrFail(1);
        $profile->update([
            'punong_barangay_name' => 'Old Captain',
            'council_roster' => [
                ['name' => 'Council Member', 'position' => 'Council Member'],
                ['name' => 'Old Secretary', 'position' => 'Barangay Secretary'],
            ],
        ]);

        $this->actingAs($adminUser)
            ->getJson('/api/admin/barangay-officials')
            ->assertOk()
            ->assertJsonPath('data.captain_name', 'Old Captain')
            ->assertJsonPath('data.secretary_name', 'Old Secretary');

        $response = $this->actingAs($adminUser)->putJson(
            '/api/admin/barangay-officials',
            [
                'captain_name' => 'New Captain',
                'secretary_name' => 'New Secretary',
            ]
        );

        $response->assertOk()
            ->assertJsonPath('message', 'Barangay officials updated.')
            ->assertJsonPath('data.captain_name', 'New Captain')
            ->assertJsonPath('data.secretary_name', 'New Secretary');

        $profile->refresh();
        $this->assertSame('New Captain', $profile->punong_barangay_name);
        $this->assertSame([
            ['name' => 'Council Member', 'position' => 'Council Member'],
            ['name' => 'New Secretary', 'position' => 'Barangay Secretary'],
        ], $profile->council_roster);
    }

    public function test_official_names_require_valid_person_name_characters(): void
    {
        $adminUser = User::factory()->create();
        Admin::create(['user_id' => $adminUser->user_id]);

        $profile = DocumentGenerationProfile::query()->findOrFail(1);
        $profile->update([
            'punong_barangay_name' => 'Current Captain',
            'council_roster' => [
                ['name' => 'Current Secretary', 'position' => 'Barangay Secretary'],
            ],
        ]);

        $this->actingAs($adminUser)
            ->putJson('/api/admin/barangay-officials', [
                'captain_name' => 'Invalid; Name',
                'secretary_name' => '   ',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['captain_name', 'secretary_name']);

        $profile->refresh();
        $this->assertSame('Current Captain', $profile->punong_barangay_name);
        $this->assertSame('Current Secretary', $profile->council_roster[0]['name']);
    }
}
