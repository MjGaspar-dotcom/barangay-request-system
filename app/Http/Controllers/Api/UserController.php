<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\UpdateUserRequest;

class UserController extends Controller
{
    public function updateProfile(UpdateUserRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        foreach (['valid_id_front', 'valid_id_back'] as $field) {
            if ($request->hasFile($field)) {
                $validated[$field] = $request
                    ->file($field)
                    ->store('resident-valid-ids', 'public');
            }
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User profile updated successfully.',
            'data' => $user->fresh(),
        ]);
    }
}
