<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\RequestStatusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     *
     * GET /api/notifications
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Notification::where('user_id', $user->user_id);
        if ($request->boolean('new_request_toasts')) {
            $query
                ->where('type', 'new_request')
                ->where('is_read', false)
                ->whereHas(
                    'request',
                    fn ($requestQuery) => $requestQuery->where(
                        'status',
                        RequestStatusService::STATUS_REQUEST_SUBMITTED
                    )
                );
        }

        $notifications = $query->orderByDesc('created_at')->paginate(30);

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Get only unread notifications count.
     *
     * GET /api/notifications/unread-count
     */
    public function unreadCount()
    {
        $user = Auth::user();

        $count = Notification::where('user_id', $user->user_id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => ['unread_count' => $count],
        ]);
    }

    /**
     * Mark a single notification as read.
     *
     * PATCH /api/notifications/{notification}/read
     */
    public function markAsRead(Notification $notification)
    {
        $user = Auth::user();

        if ($notification->user_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    /**
     * Mark all notifications as read for the authenticated user.
     *
     * PATCH /api/notifications/read-all
     */
    public function markAllAsRead()
    {
        $user = Auth::user();

        Notification::where('user_id', $user->user_id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }
}
