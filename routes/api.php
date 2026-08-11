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

Route::post('/login', [AuthController::class, 'login']);

Route::apiResource(
    'barangay-requests',
    BarangayRequestController::class
);

Route::apiResource(
    'document-types',
    DocumentTypeController::class
);


