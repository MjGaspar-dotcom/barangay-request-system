<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\BarangayRequestController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\GuestRequestController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\UserController;


Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working'
    ]);
});


// ==========================
// AUTHENTICATION
// ==========================

Route::post('/login', [AuthController::class, 'login'])
    ->name('login');

Route::post('/register', [AuthController::class, 'register'])
    ->name('register');


// ==========================
// GUEST REQUESTS (Public)
// ==========================

// Submit a new guest request — no login required.
Route::post(
    '/guest-requests',
    [GuestRequestController::class, 'store']
);

// Track a guest request by tracking number — no login required.
Route::get(
    '/guest-requests/track/{trackingNumber}',
    [GuestRequestController::class, 'track']
);


// ==========================
// PROTECTED API
// ==========================

Route::middleware('auth:sanctum')->group(function () {

    // Current authenticated user — returns user data WITH role.
    // Used by AuthContext on page refresh to restore the session.
    Route::get('/user', [AuthController::class, 'me']);

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);


    // --------------------------------------------------
    // Barangay Requests (Registered Users)
    // --------------------------------------------------

    Route::get(
        '/barangay-requests',
        [BarangayRequestController::class, 'index']
    );

    Route::post(
        '/barangay-requests',
        [BarangayRequestController::class, 'store']
    );

    Route::get(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'show']
    );

    Route::put(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'update']
    );

    Route::patch(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'update']
    );

    Route::delete(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'destroy']
    );


    // --------------------------------------------------
    // Document Types
    // --------------------------------------------------

    Route::apiResource(
        'document-types',
        DocumentTypeController::class
    );

    // User Profile Update
    Route::patch('/profile', [UserController::class, 'updateProfile']);


    // --------------------------------------------------
    // Notifications
    // --------------------------------------------------

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

});


// ==========================
// STAFF / ADMIN ONLY
// ==========================

Route::middleware(['auth:sanctum', 'staff.or.admin'])->group(function () {

    Route::get('/staff', [StaffController::class, 'index']);
    Route::get('/staff/requests', [StaffController::class, 'allRequests']);

    // --------------------------------------------------
    // Guest Requests (Staff/Admin management)
    // --------------------------------------------------

    Route::get(
        '/guest-requests',
        [GuestRequestController::class, 'index']
    );

    Route::get(
        '/guest-requests/{guestRequest}',
        [GuestRequestController::class, 'show']
    );

    Route::put(
        '/guest-requests/{guestRequest}',
        [GuestRequestController::class, 'update']
    );

    Route::patch(
        '/guest-requests/{guestRequest}',
        [GuestRequestController::class, 'update']
    );

    Route::delete(
        '/guest-requests/{guestRequest}',
        [GuestRequestController::class, 'destroy']
    );


    // --------------------------------------------------
    // Audit Logs (Admin only — enforced in controller)
    // --------------------------------------------------

    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/{auditLog}', [AuditLogController::class, 'show']);

});