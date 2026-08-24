<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BarangayRequestController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Auth;
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
// PUBLIC REQUEST
// ==========================

// Guest and registered-user request submission
Route::post(
    '/barangay-requests',
    [BarangayRequestController::class, 'store']
);

// ==========================
// PROTECTED API
// ==========================

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/staff', [StaffController::class, 'index']);

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