<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BarangaySettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BarangaySettingsController extends Controller
{
    public function show()
    {
        return response()->json([
            'success' => true,
            'data' => $this->settingsPayload(BarangaySettings::query()->findOrFail(1)),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'barangay_name' => 'required|string|max:150',
            'municipality' => 'nullable|string|max:150',
            'province' => 'nullable|string|max:150',
            'punong_barangay_name' => 'nullable|string|max:255',
            'office_address' => 'nullable|string|max:255',
            'contact_information' => 'nullable|string|max:255',
            'council_roster' => 'nullable|string|max:5000',
        ]);
        $validated['council_roster'] = $this->parseCouncilRoster(
            $validated['council_roster'] ?? ''
        );

        $settings = DB::transaction(function () use ($validated): BarangaySettings {
            $settings = BarangaySettings::query()
                ->lockForUpdate()
                ->findOrFail(1);
            $settings->fill($validated);
            $settings->save();

            return $settings->fresh();
        });

        return response()->json([
            'success' => true,
            'message' => 'Barangay settings saved.',
            'data' => $this->settingsPayload($settings),
        ]);
    }

    private function settingsPayload(BarangaySettings $settings): array
    {
        return array_merge(
            $settings->only([
                'barangay_name',
                'municipality',
                'province',
                'punong_barangay_name',
                'seal_path',
                'office_address',
                'contact_information',
                'council_roster',
            ]),
            [
                'seal_url' => $settings->seal_path
                    ? Storage::disk('public')->url($settings->seal_path)
                    : null,
            ]
        );
    }

    private function parseCouncilRoster(string $rosterText): array
    {
        $roster = [];
        foreach (preg_split('/\r\n|\r|\n/', $rosterText) ?: [] as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            $parts = explode('|', $line, 2);
            $name = trim($parts[0] ?? '');
            $position = trim($parts[1] ?? '');
            if ($name === '' || $position === '' || strlen($name) > 255 || strlen($position) > 100) {
                throw ValidationException::withMessages([
                    'council_roster' => [
                        'Enter each official as "Name | Position", with a name up to 255 characters and position up to 100 characters.',
                    ],
                ]);
            }

            $roster[] = [
                'name' => $name,
                'position' => $position,
            ];
        }

        return $roster;
    }
}
