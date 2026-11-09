<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DocumentRequestTrendService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DocumentRequestTrendController extends Controller
{
    public function __invoke(
        Request $request,
        DocumentRequestTrendService $trends
    ) {
        $validated = $request->validate([
            'period' => ['required', 'in:daily,weekly,monthly,yearly,custom'],
            'start_date' => ['required_if:period,custom', 'nullable', 'date_format:Y-m-d'],
            'end_date' => ['required_if:period,custom', 'nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);

        if ($validated['period'] === 'custom') {
            $start = \Carbon\CarbonImmutable::createFromFormat(
                '!Y-m-d',
                $validated['start_date']
            );
            $end = \Carbon\CarbonImmutable::createFromFormat(
                '!Y-m-d',
                $validated['end_date']
            );

            $rangeDays = \Carbon\CarbonImmutable::parse(
                $start->toDateString(),
                'UTC'
            )->diff(
                \Carbon\CarbonImmutable::parse($end->toDateString(), 'UTC')
            )->days;

            if ($rangeDays > 365) {
                throw ValidationException::withMessages([
                    'end_date' => 'The selected date range cannot exceed 366 days.',
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $trends->getTrends(
                $validated['period'],
                $validated['start_date'] ?? null,
                $validated['end_date'] ?? null
            ),
        ]);
    }
}
