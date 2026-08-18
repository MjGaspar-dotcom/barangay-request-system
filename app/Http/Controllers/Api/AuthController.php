<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Login a user.
     *
     * POST /api/login
     */
    public function login(Request $request)
    {
        // Validate the login information.
        //
        // The user must provide:
        // - username
        // - password
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Find the user using the username.
        $user = User::where(
            'username',
            $validated['username']
        )->first();

        // Check if the user exists AND
        // if the provided password matches
        // the hashed password in the database.
        if (!$user || !Hash::check(
            $validated['password'],
            $user->password
        )) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid username or password.'
            ], 401);
        }
            // Determine role
        if ($user->admin) {
            $role = 'admin';
        } elseif ($user->staff) {
            $role = 'staff';
        } else {
            $role = 'user';
        }

        // Create a Sanctum API token for the authenticated user.
        $token = $user->createToken(
                'api-token')->plainTextToken;

        // Return successful login information.
        //
        // Do NOT return the password.
        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'token' => $token,
            'role' => $role,
            'data' => $user
        ]);
    }

public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();

    return response()->json([
        'message' => 'Logged out successfully'
    ]);
}

}