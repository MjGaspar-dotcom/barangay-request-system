<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationReadTest extends TestCase
{
    use RefreshDatabase;

    public function test_resident_can_mark_owned_notification_as_read(): void
    {
        $resident = User::factory()->create();
        $otherResident = User::factory()->create();
        $notification = Notification::create([
            'user_id' => $resident->user_id,
            'type' => 'request_status_changed',
            'title' => 'Request update',
            'message' => 'Your request is ready.',
            'is_read' => false,
        ]);

        $this->actingAs($otherResident)
            ->patchJson("/api/notifications/{$notification->notification_id}/read")
            ->assertForbidden();

        $this->assertDatabaseHas('notifications', [
            'notification_id' => $notification->notification_id,
            'is_read' => false,
            'read_at' => null,
        ]);

        $this->actingAs($resident)
            ->patchJson("/api/notifications/{$notification->notification_id}/read")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('notifications', [
            'notification_id' => $notification->notification_id,
            'is_read' => true,
        ]);
        $this->assertNotNull($notification->fresh()->read_at);

        $this->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 0);
    }

    public function test_mark_all_as_read_only_updates_the_authenticated_resident(): void
    {
        $resident = User::factory()->create();
        $otherResident = User::factory()->create();
        $notifications = collect([$resident, $resident])->map(
            fn (User $user) => Notification::create([
                'user_id' => $user->user_id,
                'type' => 'request_status_changed',
                'title' => 'Request update',
                'message' => 'Your request has changed.',
                'is_read' => false,
            ])
        );
        $otherNotification = Notification::create([
            'user_id' => $otherResident->user_id,
            'type' => 'request_status_changed',
            'title' => 'Private update',
            'message' => 'This belongs to another resident.',
            'is_read' => false,
        ]);

        $this->actingAs($resident)
            ->patchJson('/api/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('success', true);

        foreach ($notifications as $notification) {
            $this->assertDatabaseHas('notifications', [
                'notification_id' => $notification->notification_id,
                'is_read' => true,
            ]);
        }
        $this->assertDatabaseHas('notifications', [
            'notification_id' => $otherNotification->notification_id,
            'is_read' => false,
        ]);
    }
}
