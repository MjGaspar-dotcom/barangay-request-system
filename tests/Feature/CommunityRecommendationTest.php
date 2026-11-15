<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\CommunityRecommendation;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityRecommendationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-11-12 12:00:00');
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_feed_filters_age_and_schedule_and_prioritizes_assistance(): void
    {
        $resident = User::factory()->create(['birth_date' => '2008-11-13']);
        $this->createRecommendation('General update', 'announcement');
        $this->createRecommendation(
            'Teen program',
            'program',
            minAge: 13,
            maxAge: 17,
            priority: 10
        );
        $this->createRecommendation(
            'Teen assistance',
            'government_assistance',
            minAge: 13,
            maxAge: 17,
            priority: 1
        );
        $this->createRecommendation(
            'Young adult program',
            'program',
            minAge: 18,
            maxAge: 24
        );
        $this->createRecommendation(
            'Future program',
            'program',
            startsAt: '2026-11-13'
        );
        $this->createRecommendation(
            'Expired program',
            'program',
            endsAt: '2026-11-11'
        );
        $this->createRecommendation(
            'Inactive program',
            'program',
            isActive: false
        );

        $response = $this->actingAs($resident)->getJson('/api/recommendations');

        $response->assertOk()
            ->assertJsonPath('data.age', 17)
            ->assertJsonPath('data.age_group', 'Teenagers');
        $this->assertSame(
            ['Teen assistance', 'Teen program', 'General update'],
            array_column($response->json('data.recommendations'), 'title')
        );
    }

    public function test_feed_updates_age_group_and_returns_only_general_items_without_birth_date(): void
    {
        $resident = User::factory()->create(['birth_date' => '2008-11-13']);
        $this->createRecommendation(
            'Young adult help',
            'government_assistance',
            minAge: 18,
            maxAge: 24
        );
        $this->createRecommendation('General service', 'service');
        $this->createRecommendation(
            'Senior program',
            'program',
            minAge: 60
        );

        $this->actingAs($resident)
            ->getJson('/api/recommendations')
            ->assertOk()
            ->assertJsonPath('data.age_group', 'Teenagers')
            ->assertJsonPath('data.recommendations.0.title', 'General service');

        $resident->update(['birth_date' => '2008-11-12']);
        $this->getJson('/api/recommendations')
            ->assertOk()
            ->assertJsonPath('data.age', 18)
            ->assertJsonPath('data.age_group', 'Young Adults')
            ->assertJsonPath(
                'data.recommendations.0.title',
                'Young adult help'
            );

        $resident->update(['birth_date' => null]);
        $response = $this->getJson('/api/recommendations');
        $response->assertOk()
            ->assertJsonPath('data.age', null)
            ->assertJsonPath('data.age_group', null);
        $this->assertSame(
            ['General service'],
            array_column($response->json('data.recommendations'), 'title')
        );
    }

    public function test_feed_maps_all_age_group_boundaries_and_excludes_underage_specific_items(): void
    {
        $resident = User::factory()->create();
        $this->createRecommendation(
            'Underage-specific program',
            'program',
            minAge: 0,
            maxAge: 12
        );
        $this->createRecommendation('General service', 'service');

        foreach ([
            12 => null,
            13 => 'Teenagers',
            17 => 'Teenagers',
            18 => 'Young Adults',
            24 => 'Young Adults',
            25 => 'Adults',
            34 => 'Adults',
            35 => 'Middle-aged Adults',
            49 => 'Middle-aged Adults',
            50 => 'Older Adults',
            59 => 'Older Adults',
            60 => 'Senior Citizens',
        ] as $age => $ageGroup) {
            $resident->update([
                'birth_date' => CarbonImmutable::today()
                    ->subYears($age)
                    ->toDateString(),
            ]);

            $response = $this->actingAs($resident)
                ->getJson('/api/recommendations')
                ->assertOk()
                ->assertJsonPath('data.age', $age)
                ->assertJsonPath('data.age_group', $ageGroup);

            $titles = array_column(
                $response->json('data.recommendations'),
                'title'
            );
            $this->assertContains('General service', $titles);
            $this->assertNotContains('Underage-specific program', $titles);
        }
    }

    public function test_feed_enforces_profile_eligibility_filters(): void
    {
        $resident = User::factory()->create([
            'birth_date' => '2000-01-01',
            'gender' => 'Female',
            'civil_status' => 'Single',
            'verification_status' => 'pending',
        ]);
        $this->createRecommendation('General program', 'program');
        $this->createRecommendation(
            'Eligible program',
            'program',
            eligibleGenders: ['Female'],
            eligibleCivilStatuses: ['Single']
        );
        $this->createRecommendation(
            'Gender mismatch',
            'program',
            eligibleGenders: ['Male']
        );
        $this->createRecommendation(
            'Civil status mismatch',
            'program',
            eligibleCivilStatuses: ['Widowed']
        );
        $this->createRecommendation(
            'Verified residents only',
            'program',
            requiresVerified: true
        );

        $response = $this->actingAs($resident)
            ->getJson('/api/recommendations')
            ->assertOk();
        $this->assertSame(
            ['Eligible program', 'General program'],
            array_column($response->json('data.recommendations'), 'title')
        );

        $resident->update(['verification_status' => 'verified']);
        $response = $this->getJson('/api/recommendations')->assertOk();
        $this->assertSame(
            [
                'Eligible program',
                'General program',
                'Verified residents only',
            ],
            array_column($response->json('data.recommendations'), 'title')
        );
    }

    public function test_recommendation_management_is_admin_only_and_persists_catalog_entries(): void
    {
        $resident = User::factory()->create();
        $this->actingAs($resident)
            ->postJson('/api/admin/recommendations', $this->validPayload())
            ->assertForbidden();

        $adminUser = User::factory()->create();
        Admin::create(['user_id' => $adminUser->user_id]);

        $response = $this->actingAs($adminUser)->postJson(
            '/api/admin/recommendations',
            $this->validPayload()
        );
        $response->assertCreated()
            ->assertJsonPath('data.title', 'Youth education grant')
            ->assertJsonPath('data.category', 'government_assistance');

        $id = $response->json('data.id');
        $this->assertDatabaseHas('community_recommendations', [
            'id' => $id,
            'title' => 'Youth education grant',
            'min_age' => 18,
            'max_age' => 24,
        ]);
        $storedRecommendation = CommunityRecommendation::findOrFail($id);
        $this->assertSame(['Female'], $storedRecommendation->eligible_genders);
        $this->assertSame(
            ['Single'],
            $storedRecommendation->eligible_civil_statuses
        );
        $this->assertTrue($storedRecommendation->requires_verified);

        $this->putJson(
            "/api/admin/recommendations/{$id}",
            [...$this->validPayload(), 'min_age' => 30, 'max_age' => 20]
        )->assertUnprocessable()
            ->assertJsonValidationErrors('max_age');

        $this->deleteJson("/api/admin/recommendations/{$id}")
            ->assertOk();
        $this->assertSoftDeleted('community_recommendations', ['id' => $id]);
    }

    public function test_recommendation_feed_requires_authentication(): void
    {
        $this->getJson('/api/recommendations')->assertUnauthorized();
    }

    private function createRecommendation(
        string $title,
        string $category,
        ?int $minAge = null,
        ?int $maxAge = null,
        int $priority = 0,
        ?string $startsAt = null,
        ?string $endsAt = null,
        bool $isActive = true,
        ?array $eligibleGenders = null,
        ?array $eligibleCivilStatuses = null,
        bool $requiresVerified = false
    ): CommunityRecommendation {
        return CommunityRecommendation::create([
            'title' => $title,
            'description' => "{$title} description",
            'category' => $category,
            'min_age' => $minAge,
            'max_age' => $maxAge,
            'eligible_genders' => $eligibleGenders ?? null,
            'eligible_civil_statuses' => $eligibleCivilStatuses ?? null,
            'requires_verified' => $requiresVerified,
            'priority' => $priority,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'is_active' => $isActive,
        ]);
    }

    private function validPayload(): array
    {
        return [
            'title' => 'Youth education grant',
            'description' => 'Official program description.',
            'category' => 'government_assistance',
            'eligibility' => 'Residents enrolled in school.',
            'min_age' => 18,
            'max_age' => 24,
            'eligible_genders' => ['Female'],
            'eligible_civil_statuses' => ['Single'],
            'requires_verified' => true,
            'priority' => 100,
            'starts_at' => null,
            'ends_at' => null,
            'is_active' => true,
        ];
    }
}
