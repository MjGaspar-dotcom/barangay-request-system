<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\StoreUserRequest;

class AuthController extends Controller
{
    // POST /api/login
    public function login(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $validated['username'])->first();

        // Invalid credentials → 401
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid username or password.',
            ], 401);
        }

        $role = $this->resolveRole($user);
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'token' => $token,
            'role' => $role,
            'data' => $user,
        ]);
    }

    // POST /api/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    // GET /api/user — used by frontend to restore session after page refresh
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'role' => $this->resolveRole($user),
            'data' => $user,
        ]);
    }

    // POST /api/register
    public function register(StoreUserRequest $request)
    {
        $validated = $request->validated();

        $user = User::create([
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'birth_date' => $validated['birth_date'],
            'gender' => $validated['gender'],
            'civil_status' => $validated['civil_status'],
            'address' => $validated['address'],
            'contact_number' => $validated['contact_number'],
            'email' => $validated['email'],
            'verification_status' => 'pending',
        ]);

        return response()->json([
            'message' => 'User registered successfully.',
            'data' => $user,
        ], 201);
    }

    // Checks admin → staff → user in order. Returns the matching role string.
    private function resolveRole(User $user): string
    {
        if ($user->admin)
            return 'admin';
        if ($user->staff)
            return 'staff';
        return 'user';
    }
}