<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BarangayRequest;
use App\Models\DocumentType;
use App\Models\Staff;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentRequestTrendTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $staffUser;
    private User $resident;
    private DocumentType $documentType;

    protected function setUp(): void
    {
        parent::setUp();

        CarbonImmutable::setTestNow('2026-11-06 15:00:00');
        $this->adminUser = User::factory()->create();
        Admin::create(['user_id' => $this->adminUser->user_id]);

        $this->staffUser = User::factory()->create();
        Staff::create([
            'user_id' => $this->staffUser->user_id,
            'assigned_by' => Admin::query()->value('admin_id'),
        ]);
        $this->resident = User::factory()->create();
        $this->documentType = DocumentType::create([
            'document_name' => 'Barangay Clearance',
            'description' => 'Certificate',
            'fee' => 50,
        ]);
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_daily_trends_fill_empty_days(): void
    {
        $this->createRegisteredRequest('2026-11-06 08:00:00');
        $this->createRegisteredRequest('2026-11-02 12:00:00');
        $this->createRegisteredRequest('2026-10-30 12:00:00');

        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/admin/analytics/document-request-trends?period=daily');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.start_date', '2026-10-31')
            ->assertJsonPath('data.end_date', '2026-11-06')
            ->assertJsonPath('data.summary.total_requests', 2)
            ->assertJsonPath('data.summary.average_requests', 0.29)
            ->assertJsonPath('data.summary.peak_period.period', '2026-11-02')
            ->assertJsonPath('data.summary.peak_period.count', 1)
            ->assertJsonPath('data.points.0.count', 0)
            ->assertJsonPath('data.points.6.count', 1);

        $this->assertCount(7, $response->json('data.points'));
    }

    public function test_weekly_monthly_and_yearly_filters_return_chronological_zero_filled_periods(): void
    {
        $this->createRegisteredRequest('2025-01-03 12:00:00');
        $this->createRegisteredRequest('2026-11-06 12:00:00');

        $weekly = $this->actingAs($this->adminUser)
            ->getJson('/api/admin/analytics/document-request-trends?period=weekly');
        $weekly->assertOk()
            ->assertJsonPath('data.summary.total_requests', 1)
            ->assertJsonPath('data.points.7.period', '2026-11-02')
            ->assertJsonPath('data.points.7.count', 1);
        $this->assertCount(8, $weekly->json('data.points'));

        $monthly = $this->getJson(
            '/api/admin/analytics/document-request-trends?period=monthly'
        );
        $monthly->assertOk()->assertJsonPath('data.summary.total_requests', 1);
        $this->assertCount(12, $monthly->json('data.points'));

        $yearly = $this->getJson(
            '/api/admin/analytics/document-request-trends?period=yearly'
        );
        $yearly->assertOk()
            ->assertJsonPath('data.points.0.period', '2025-01-01')
            ->assertJsonPath('data.points.0.count', 1)
            ->assertJsonPath('data.points.1.period', '2026-01-01')
            ->assertJsonPath('data.points.1.count', 1);
    }

    public function test_custom_range_comparison_and_soft_deleted_records_are_handled(): void
    {
        $this->createRegisteredRequest('2026-11-01 10:00:00');
        $this->createRegisteredRequest('2026-10-30 10:00:00');
        $this->createRegisteredRequest('2026-11-03 10:00:00');
        $deleted = $this->createRegisteredRequest('2026-11-02 10:00:00');
        $deleted->delete();

        $response = $this->actingAs($this->adminUser)->getJson(
            '/api/admin/analytics/document-request-trends'
                . '?period=custom&start_date=2026-11-01&end_date=2026-11-03'
        );

        $response->assertOk()
            ->assertJsonPath('data.summary.total_requests', 2)
            ->assertJsonPath('data.summary.comparison.previous_start_date', '2026-10-29')
            ->assertJsonPath('data.summary.comparison.previous_end_date', '2026-10-31')
            ->assertJsonPath('data.summary.comparison.previous_total', 1)
            ->assertJsonPath('data.summary.comparison.percentage', 100)
            ->assertJsonPath('data.summary.comparison.direction', 'increase')
            ->assertJsonPath('data.points.1.count', 0)
            ->assertJsonPath('data.points.2.count', 1);
        $this->assertCount(3, $response->json('data.points'));
    }

    public function test_custom_range_validation_and_empty_previous_period_are_reported_safely(): void
    {
        $this->actingAs($this->adminUser)->getJson(
            '/api/admin/analytics/document-request-trends'
                . '?period=custom&start_date=2025-01-01&end_date=2026-11-06'
        )->assertUnprocessable()
            ->assertJsonValidationErrors('end_date');

        $response = $this->getJson(
            '/api/admin/analytics/document-request-trends?period=daily'
        );
        $response->assertOk()
            ->assertJsonPath('data.summary.total_requests', 0)
            ->assertJsonPath('data.summary.peak_period', null)
            ->assertJsonPath(
                'data.summary.comparison.direction',
                'no_previous_data'
            )
            ->assertJsonPath('data.summary.comparison.percentage', null);
    }

    public function test_only_authenticated_administrators_can_view_trends(): void
    {
        $this->getJson('/api/admin/analytics/document-request-trends?period=daily')
            ->assertUnauthorized();

        $this->actingAs($this->staffUser)
            ->getJson('/api/admin/analytics/document-request-trends?period=daily')
            ->assertForbidden();

        $this->actingAs($this->resident)
            ->getJson('/api/admin/analytics/document-request-trends?period=daily')
            ->assertForbidden();
    }

    private function createRegisteredRequest(string $createdAt): BarangayRequest
    {
        $request = new BarangayRequest([
            'user_id' => $this->resident->user_id,
            'document_type_id' => $this->documentType->document_type_id,
            'purpose' => 'Analytics test',
            'tracking_number' => 'BR-' . bin2hex(random_bytes(6)),
            'status' => 'Pending',
        ]);
        $request->created_at = CarbonImmutable::parse($createdAt);
        $request->updated_at = CarbonImmutable::parse($createdAt);
        $request->save();

        return $request;
    }

}
