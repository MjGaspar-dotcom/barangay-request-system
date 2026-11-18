<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentGenerationProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BarangayOfficialsController extends Controller
{
    public function show()
    {
        $profile = $this->profile();

        return response()->json([
            'success' => true,
            'data' => $this->officials($profile),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'captain_name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[\pL\pM][\pL\pM .\'-]*$/u',
            ],
            'secretary_name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[\pL\pM][\pL\pM .\'-]*$/u',
            ],
        ], [
            '*.required' => 'Enter the official’s full name.',
            '*.max' => 'The name must be 255 characters or fewer.',
            '*.regex' => 'Use letters, spaces, periods, apostrophes, or hyphens only.',
        ]);

        $profile = DB::transaction(function () use ($validated): DocumentGenerationProfile {
            $profile = $this->profile();
            $roster = collect($profile->council_roster ?? [])
                ->reject(fn ($member): bool =>
                    is_array($member) &&
                    str_contains(
                        strtolower((string) ($member['position'] ?? '')),
                        'secretary'
                    )
                )
                ->values()
                ->all();

            $roster[] = [
                'name' => $validated['secretary_name'],
                'position' => 'Barangay Secretary',
            ];

            $profile->update([
                'punong_barangay_name' => $validated['captain_name'],
                'council_roster' => $roster,
            ]);

            return $profile->refresh();
        });

        return response()->json([
            'success' => true,
            'message' => 'Barangay officials updated.',
            'data' => $this->officials($profile),
        ]);
    }

    private function profile(): DocumentGenerationProfile
    {
        return DocumentGenerationProfile::query()->firstOrCreate(
            ['id' => 1],
            ['barangay_name' => 'Barangay Aurora']
        );
    }

    private function officials(DocumentGenerationProfile $profile): array
    {
        $secretary = collect($profile->council_roster ?? [])->first(
            fn ($member): bool =>
                is_array($member) &&
                str_contains(
                    strtolower((string) ($member['position'] ?? '')),
                    'secretary'
                )
        );

        return [
            'captain_name' => $profile->punong_barangay_name,
            'secretary_name' => is_array($secretary)
                ? ($secretary['name'] ?? null)
                : null,
        ];
    }
}
