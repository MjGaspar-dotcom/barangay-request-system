<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminStaffController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarangayRequestController;
use App\Http\Controllers\Api\DocumentRequestTrendController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OcrTestController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\UserController;
use App\Services\QrCodeService;
use Illuminate\Support\Facades\Route;

Route::post('/ocr/test', [OcrTestController::class, 'test']);

Route::get('/test-qr', function () {
    return response(
        QrCodeService::generate('BRGY-2026-TEST01')
    )->header('Content-Type', 'image/svg+xml');
});

Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working',
    ]);
});

// Document types are needed by mobile and web clients when submitting a
// request. Management actions remain protected below.
Route::get(
    '/document-types',
    [DocumentTypeController::class, 'index']
);

// ==========================
// AUTHENTICATION
// ==========================

Route::post('/login', [AuthController::class, 'login'])
    ->name('login');

Route::post('/auth/google', [AuthController::class, 'google'])
    ->middleware('throttle:10,1')
    ->name('auth.google');

Route::post('/register', [AuthController::class, 'register'])
    ->name('register');

// Track a registered request by tracking number.
Route::get(
    '/track/{trackingNumber}',
    [BarangayRequestController::class, 'track']
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

    Route::post(
        '/barangay-requests/{barangayRequest}/requirements/resubmit',
        [BarangayRequestController::class, 'resubmitRequirements']
    );
    Route::get(
        '/barangay-requests/{barangayRequest}/documents/{document}/view',
        [BarangayRequestController::class, 'showDocument']
    );

    // --------------------------------------------------
    // Document Types
    // --------------------------------------------------

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
    Route::post(
        '/barangay-requests/{barangayRequest}/requirements/verify',
        [BarangayRequestController::class, 'verifyRequirements']
    );
    Route::post(
        '/barangay-requests/{barangayRequest}/documents/prepared',
        [BarangayRequestController::class, 'storePreparedDocument']
    );

    // Delete is staff/admin only — moved out of the registered-user route group.
    Route::delete(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'destroy']
    );

    // Admin statistics — only admin users
    Route::get('/admin/stats', [AdminController::class, 'stats']);
});

// ==========================
// ADMIN ONLY
// ==========================

Route::middleware(['auth:sanctum', 'admin.only'])->group(function () {

    Route::post(
        '/barangay-requests/{barangayRequest}/documents/authorize',
        [BarangayRequestController::class, 'authorizeDocument']
    );

    Route::get(
        '/admin/analytics/document-request-trends',
        DocumentRequestTrendController::class
    );

    // --------------------------------------------------
    // Manage Users
    // --------------------------------------------------
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::get('/admin/users/{user}', [AdminUserController::class, 'show']);
    Route::patch(
        '/admin/users/{user}/verification',
        [AdminUserController::class, 'updateVerification']
    );
    Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy']);

    // --------------------------------------------------
    // Manage Staff
    // --------------------------------------------------
    Route::get('/admin/staff', [AdminStaffController::class, 'index']);
    Route::post('/admin/staff', [AdminStaffController::class, 'store']);
    Route::delete('/admin/staff/{staff}', [AdminStaffController::class, 'destroy']);

    // --------------------------------------------------
    // Recent Activity (audit logs)
    // --------------------------------------------------
    Route::get('/admin/recent-activity', [AdminUserController::class, 'recentActivity']);

    // --------------------------------------------------
    // Audit Logs (detailed view)
    // --------------------------------------------------
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/{auditLog}', [AuditLogController::class, 'show']);
});
