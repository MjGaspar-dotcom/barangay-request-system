<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->ownedNotifications($request)
            ->with('request.documentType')
            ->latest();

        return response()->json([
            'success' => true,
            'data' => $query->paginate($request->integer('per_page', 5)),
        ]);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'unread_count' => $this->ownedNotifications($request)
                    ->where('is_read', false)
                    ->count(),
            ],
        ]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        abort_unless(
            $this->ownedNotifications($request)
                ->whereKey($notification->notification_id)
                ->exists(),
            404,
        );

        if (!$notification->is_read) {
            $notification->forceFill([
                'is_read' => true,
                'read_at' => now(),
            ])->save();
        }

        return response()->json([
            'success' => true,
            'data' => $notification->fresh(),
        ]);
    }

    private function ownedNotifications(Request $request)
    {
        $user = $request->user();
        $staffId = $user->staff?->staff_id;

        return Notification::query()->where(function ($query) use ($user, $staffId) {
            $query->where('user_id', $user->user_id);
            if ($staffId !== null) {
                $query->orWhere('staff_id', $staffId);
            }
        });
    }
}
