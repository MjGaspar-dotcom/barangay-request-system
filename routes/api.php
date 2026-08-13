<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BarangayRequestController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\AuthController;



Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working'
    ]);
});

Route::post('/login', [AuthController::class, 'login'])->name('login');

// Guest request are public; other request actions require login
Route::post(
    '/barangay-requests',
    [BarangayRequestController::class,'store']
);

Route::middleware('auth:sanctum')->group(function(){

// View all Barangay Request
Route::get(
    '/barangay-requests',
    [BarangayRequestController::class, 'index']
);

// View one barangay request.
Route::get(
    '/barangay-requests/{barangayRequest}',
    [BarangayRequestController::class,'show']
);

 // Update a barangay request.
  Route::put(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'update']
    );

// Partially update a barangay request.
    Route::patch(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'update']
    );
// Delete a barangay request.
    Route::delete(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'destroy']
    );


});




Route::apiResource(
    'document-types',
    DocumentTypeController::class
);


