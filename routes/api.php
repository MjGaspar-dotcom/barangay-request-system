<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminStaffController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarangayRequestController;
use App\Http\Controllers\Api\DocumentRequestTrendController;
use App\Http\Controllers\Api\DocumentTemplateController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OcrTestController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/ocr/test', [OcrTestController::class, 'test'])
    ->middleware(['auth:sanctum', 'admin.only', 'throttle:10,1']);

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

Route::get(
    '/users/{user}/files/{field}',
    [UserController::class, 'showFile']
)->middleware('signed')->name('api.user-file');

Route::middleware('auth:sanctum')->group(function () {

    // Current authenticated user — returns user data WITH role.
    // Used by AuthContext on page refresh to restore the session.
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/recommendations', [RecommendationController::class, 'index']);

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::patch('/profile/password', [AuthController::class, 'updatePassword']);

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
    Route::patch(
        '/barangay-requests/{barangayRequest}/business-details',
        [BarangayRequestController::class, 'updateBusinessDetails']
    );
    Route::patch(
        '/barangay-requests/{barangayRequest}/solo-parent-details',
        [BarangayRequestController::class, 'updateSoloParentDetails']
    );

    Route::get(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'show']
    );
    Route::get(
        '/barangay-requests/{barangayRequest}/generated-document',
        [BarangayRequestController::class, 'showGeneratedDocument']
    );
    Route::get(
        '/barangay-requests/{barangayRequest}/generated-document/file',
        [BarangayRequestController::class, 'showGeneratedDocumentFile']
    );

    Route::put(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'update']
    );

    Route::patch(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'update']
    );

    Route::get(
        '/barangay-requests/{barangayRequest}/documents/{document}/view',
        [BarangayRequestController::class, 'showDocument']
    );
    Route::put(
        '/barangay-requests/{barangayRequest}/documents/{document}',
        [BarangayRequestController::class, 'replaceSupportingDocument']
    );
    Route::delete(
        '/barangay-requests/{barangayRequest}/documents/{document}',
        [BarangayRequestController::class, 'deleteSupportingDocument']
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

    Route::get('/staff/dashboard-stats', [StaffController::class, 'dashboardStats']);
    Route::get('/staff/requests', [StaffController::class, 'allRequests']);
    Route::get('/staff/recent-activity', [AdminUserController::class, 'recentActivity']);
    Route::post(
        '/barangay-requests/{barangayRequest}/approve-and-prepare',
        [BarangayRequestController::class, 'approveAndPrepareForPickup']
    );
    Route::get(
        '/barangay-requests/{barangayRequest}/template-preview',
        [BarangayRequestController::class, 'showTemplatePreview']
    );
    Route::get(
        '/barangay-requests/{barangayRequest}/template-preview/file',
        [BarangayRequestController::class, 'showTemplatePreviewFile']
    );
    Route::post(
        '/barangay-requests/{barangayRequest}/documents/prepared',
        [BarangayRequestController::class, 'storePreparedDocument']
    );
    Route::post(
        '/barangay-requests/{barangayRequest}/documents/{document}/print',
        [BarangayRequestController::class, 'recordDocumentPrint']
    );
    Route::post(
        '/barangay-requests/{barangayRequest}/generated-document/generate',
        [BarangayRequestController::class, 'generateDocument']
    );
    Route::get(
        '/barangay-requests/{barangayRequest}/generated-documents',
        [BarangayRequestController::class, 'showGeneratedDocumentHistory']
    );
    Route::post(
        '/barangay-requests/{barangayRequest}/generated-document/print',
        [BarangayRequestController::class, 'recordGeneratedDocumentPrint']
    );
    Route::get(
        '/barangay-requests/{barangayRequest}/generated-documents/{generatedDocument}/file',
        [BarangayRequestController::class, 'showGeneratedDocumentVersionFile']
    );

});

// ==========================
// ADMIN ONLY
// ==========================

Route::middleware(['auth:sanctum', 'admin.only'])->group(function () {

    Route::get('/admin/document-templates', [DocumentTemplateController::class, 'index']);
    Route::get(
        '/admin/document-templates/{documentType}',
        [DocumentTemplateController::class, 'show']
    );
    Route::post(
        '/admin/document-templates/{documentType}/versions',
        [DocumentTemplateController::class, 'store']
    );
    Route::delete(
        '/admin/document-templates/{documentType}',
        [DocumentTemplateController::class, 'destroy']
    );
    Route::put(
        '/admin/document-template-versions/{version}/mappings',
        [DocumentTemplateController::class, 'saveMappings']
    );
    Route::get(
        '/admin/document-template-versions/{version}/file',
        [DocumentTemplateController::class, 'file']
    );

    Route::get('/staff', [StaffController::class, 'index']);
    Route::get('/admin/stats', [AdminController::class, 'stats']);
    Route::delete(
        '/barangay-requests/{barangayRequest}',
        [BarangayRequestController::class, 'destroy']
    );

    Route::get('/admin/recommendations', [RecommendationController::class, 'adminIndex']);
    Route::post('/admin/recommendations', [RecommendationController::class, 'store']);
    Route::put('/admin/recommendations/{recommendation}', [RecommendationController::class, 'update']);
    Route::delete('/admin/recommendations/{recommendation}', [RecommendationController::class, 'destroy']);

    // --------------------------------------------------
    // Manage Document Types
    // --------------------------------------------------
    Route::post('/document-types', [DocumentTypeController::class, 'store']);
    Route::put('/document-types/{id}', [DocumentTypeController::class, 'update']);
    Route::delete('/document-types/{id}', [DocumentTypeController::class, 'destroy']);

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
