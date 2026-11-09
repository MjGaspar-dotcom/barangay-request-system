<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Models\User;
use App\Services\GoogleIdTokenVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class AuthController extends Controller
{
    // POST /api/login
    public function login(Request $request)
    {
        $start = microtime(true);

        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        Log::info('LOGIN STEP 1 validation', [
            'time' => microtime(true) - $start,
        ]);

        $user = User::where('username', $validated['username'])->first();

        Log::info('LOGIN STEP 2 user query', [
            'time' => microtime(true) - $start,
        ]);

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid username or password.',
            ], 401);
        }

        Log::info('LOGIN STEP 3 password check', [
            'time' => microtime(true) - $start,
        ]);

        $role = $this->resolveRole($user);

        Log::info('LOGIN STEP 4 role resolution', [
            'time' => microtime(true) - $start,
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        Log::info('LOGIN STEP 5 token creation', [
            'time' => microtime(true) - $start,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'token' => $token,
            'role' => $role,
            'data' => $user,
        ]);
    }

    // POST /api/auth/google
    public function google(Request $request, GoogleIdTokenVerifier $verifier)
    {
        if (empty(config('services.google.client_ids'))) {
            return response()->json([
                'message' => 'Google sign-in is not configured on the server.',
            ], 503);
        }

        $validated = $request->validate([
            'id_token' => ['required', 'string', 'max:8192'],
        ]);

        try {
            $claims = $verifier->verify($validated['id_token']);
        } catch (RuntimeException) {
            Log::error('Google ID token verification service is unavailable.');

            return response()->json([
                'message' => 'Google sign-in is temporarily unavailable.',
            ], 503);
        }

        if ($claims === null) {
            return response()->json([
                'message' => 'The Google account could not be verified.',
            ], 401);
        }

        $email = strtolower($claims['email']);
        $googleId = $claims['sub'];

        $user = User::where('google_id', $googleId)->first()
            ?? User::whereRaw('LOWER(email) = ?', [$email])->first();

        if ($user !== null) {
            if ($user->admin || $user->staff) {
                return response()->json([
                    'message' => 'Google sign-in is only available for resident accounts.',
                ], 403);
            }

            if ($user->google_id !== null && $user->google_id !== $googleId) {
                return response()->json([
                    'message' => 'This email is linked to a different Google account.',
                ], 409);
            }

            $user->google_id = $googleId;
            $user->email_verified_at ??= now();
            $user->save();

            return $this->googleLoginResponse($user);
        }

        if (User::withTrashed()->whereRaw('LOWER(email) = ?', [$email])->exists()) {
            return response()->json([
                'message' => 'This email belongs to an inactive account. Contact the barangay office for help.',
            ], 409);
        }

        $profileFields = [
            'first_name',
            'last_name',
            'birth_date',
            'gender',
            'civil_status',
            'address',
            'contact_number',
        ];

        if (array_diff($profileFields, array_keys($request->all())) !== []) {
            return response()->json([
                'requires_profile' => true,
                'email' => $email,
                'first_name' => $claims['given_name'] ?? '',
                'last_name' => $claims['family_name'] ?? '',
            ]);
        }

        $profile = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'birth_date' => ['required', 'date', 'before_or_equal:today'],
            'gender' => ['required', 'string', 'in:Male,Female,Prefer not to say'],
            'civil_status' => ['required', 'string', 'in:Single,Married,Separated,Divorced,Widowed'],
            'address' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
        ]);

        $user = User::create([
            ...$profile,
            'username' => $this->availableGoogleUsername($email),
            'password' => Hash::make(Str::random(64)),
            'email' => $email,
            'google_id' => $googleId,
            'email_verified_at' => now(),
            'verification_status' => 'pending',
        ]);

        return $this->googleLoginResponse($user, 201);
    }

    private function availableGoogleUsername(string $email): string
    {
        $localPart = explode('@', $email, 2)[0];
        $base = trim(preg_replace('/[^A-Za-z0-9_-]+/', '-', $localPart), '-_');
        $base = substr($base === '' ? 'resident' : $base, 0, 230);
        $username = $base;
        $suffix = 1;

        while (User::withTrashed()->where('username', $username)->exists()) {
            $username = $base.'-'.$suffix++;
        }

        return $username;
    }

    private function googleLoginResponse(User $user, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Google sign-in successful.',
            'token' => $user->createToken('google-api-token')->plainTextToken,
            'role' => 'user',
            'data' => $user,
        ], $status);
    }

    // POST /api/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    // GET /api/user
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
        if ($user->admin) {
            return 'admin';
        }
        if ($user->staff) {
            return 'staff';
        }

        return 'user';
    }
}
