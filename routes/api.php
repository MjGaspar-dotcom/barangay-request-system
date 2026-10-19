<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BarangayRequestController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AdminApiController;
use App\Http\Controllers\Api\NotificationController;


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
// PUBLIC REQUEST
// ==========================

// Guest and registered-user request submission
Route::post(
    '/barangay-requests',
    [BarangayRequestController::class, 'store']
);
Route::get(
    '/barangay-requests/track/{trackingNumber}',
    [BarangayRequestController::class, 'track']
);

// ==========================
// PROTECTED API
// ==========================

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/staff', [StaffController::class, 'index']);
    Route::get('/staff/requests', [BarangayRequestController::class, 'staffIndex']);

    Route::get('/admin/stats', [AdminApiController::class, 'stats']);
    Route::get('/admin/users', [AdminApiController::class, 'users']);
    Route::patch('/admin/users/{user}/verification', [AdminApiController::class, 'updateVerification']);
    Route::delete('/admin/users/{user}', [AdminApiController::class, 'deleteUser']);
    Route::get('/admin/staff', [StaffController::class, 'index']);
    Route::post('/admin/staff', [AdminApiController::class, 'createStaff']);
    Route::delete('/admin/staff/{staff}', [AdminApiController::class, 'deleteStaff']);
    Route::get('/admin/recent-activity', [AdminApiController::class, 'recentActivity']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);

    // Current authenticated user
    Route::get('/user', function (Request $request) {
        return response()->json([
            'success' => true,
            'data' => $request->user(),
        ]);
    });

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);


    // Barangay Requests
    Route::get(
        '/barangay-requests',
        [BarangayRequestController::class, 'index']
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


    // Document Types
    Route::apiResource(
        'document-types',
        DocumentTypeController::class
    );

    // User Profile Update
    Route::patch('/profile', [UserController::class, 'updateProfile']);
    
});