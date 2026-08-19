<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Staff;
use Illuminate\Support\Facades\Auth;
class StaffController extends Controller
{
   public function index()
{
    $user = Auth::user();

    // Only Admin users can view the staff list.
    if (!$user->admin) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized.'
        ], 403);
    }

    $staff = Staff::with([
        'user',
        'admin'
    ])->get();

    return response()->json([
        'success' => true,
        'data' => $staff
    ]);
}
}
