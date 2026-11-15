<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityRecommendation;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RecommendationController extends Controller
{
    private const CATEGORIES = [
        'program',
        'service',
        'announcement',
        'activity',
        'government_assistance',
    ];

    public function index(Request $request)
    {
        $user = $request->user();
        $birthDate = $user->birth_date;
        $age = $birthDate
            ? $this->ageOn(CarbonImmutable::parse($birthDate), CarbonImmutable::today())
            : null;
        $ageGroup = $this->ageGroupFor($age);
        $today = CarbonImmutable::today()->toDateString();

        $query = CommunityRecommendation::query()
            ->where('is_active', true)
            ->where(fn ($query) => $query
                ->whereNull('starts_at')
                ->orWhereDate('starts_at', '<=', $today))
            ->where(fn ($query) => $query
                ->whereNull('ends_at')
                ->orWhereDate('ends_at', '>=', $today));

        if ($ageGroup === null) {
            $query->whereNull('min_age')->whereNull('max_age');
        } else {
            $query
                ->where(fn ($query) => $query
                    ->whereNull('min_age')
                    ->orWhere('min_age', '<=', $age))
                ->where(fn ($query) => $query
                    ->whereNull('max_age')
                    ->orWhere('max_age', '>=', $age));
        }

        $recommendations = $query
            ->orderByRaw(
                "CASE category
                    WHEN 'government_assistance' THEN 0
                    WHEN 'program' THEN 1
                    WHEN 'service' THEN 2
                    WHEN 'activity' THEN 3
                    ELSE 4
                END"
            )
            ->orderByDesc('priority')
            ->orderBy('title')
            ->get()
            ->filter(fn (CommunityRecommendation $recommendation) =>
                $this->matchesEligibility($recommendation, $user)
            )
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'age' => $age,
                'age_group' => $ageGroup,
                'recommendations' => $recommendations,
            ],
        ]);
    }

    public function adminIndex()
    {
        return response()->json([
            'success' => true,
            'data' => CommunityRecommendation::query()
                ->orderByDesc('is_active')
                ->orderByDesc('priority')
                ->orderBy('title')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $recommendation = CommunityRecommendation::create(
            $this->validatedData($request)
        );

        return response()->json([
            'success' => true,
            'data' => $recommendation,
        ], 201);
    }

    public function update(Request $request, CommunityRecommendation $recommendation)
    {
        $recommendation->update($this->validatedData($request));

        return response()->json([
            'success' => true,
            'data' => $recommendation->refresh(),
        ]);
    }

    public function destroy(CommunityRecommendation $recommendation)
    {
        $recommendation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Recommendation removed.',
        ]);
    }

    private function validatedData(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
            'category' => ['required', Rule::in(self::CATEGORIES)],
            'eligibility' => ['nullable', 'string', 'max:5000'],
            'min_age' => ['nullable', 'integer', 'min:0', 'max:120'],
            'max_age' => ['nullable', 'integer', 'min:0', 'max:120'],
            'eligible_genders' => ['nullable', 'array'],
            'eligible_genders.*' => [
                'string',
                Rule::in(['Male', 'Female', 'Prefer not to say']),
            ],
            'eligible_civil_statuses' => ['nullable', 'array'],
            'eligible_civil_statuses.*' => [
                'string',
                Rule::in(['Single', 'Married', 'Widowed', 'Separated']),
            ],
            'requires_verified' => ['sometimes', 'boolean'],
            'priority' => ['sometimes', 'integer', 'min:0', 'max:65535'],
            'starts_at' => ['nullable', 'date_format:Y-m-d'],
            'ends_at' => ['nullable', 'date_format:Y-m-d'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (
            isset($validated['min_age'], $validated['max_age']) &&
            (int) $validated['min_age'] > (int) $validated['max_age']
        ) {
            throw ValidationException::withMessages([
                'max_age' => 'The maximum age must be at least the minimum age.',
            ]);
        }

        if (
            isset($validated['starts_at'], $validated['ends_at']) &&
            $validated['ends_at'] < $validated['starts_at']
        ) {
            throw ValidationException::withMessages([
                'ends_at' => 'The end date must be on or after the start date.',
            ]);
        }

        return $validated;
    }

    private function matchesEligibility(
        CommunityRecommendation $recommendation,
        User $user
    ): bool {
        if (
            $recommendation->eligible_genders !== null &&
            ! in_array($user->gender, $recommendation->eligible_genders, true)
        ) {
            return false;
        }

        if (
            $recommendation->eligible_civil_statuses !== null &&
            ! in_array(
                $user->civil_status,
                $recommendation->eligible_civil_statuses,
                true
            )
        ) {
            return false;
        }

        return ! $recommendation->requires_verified ||
            $user->verification_status === 'verified';
    }

    private function ageOn(CarbonImmutable $birthDate, CarbonImmutable $today): ?int
    {
        if ($birthDate->greaterThan($today)) {
            return null;
        }

        $age = $today->year - $birthDate->year;
        if (
            $today->month < $birthDate->month ||
            ($today->month === $birthDate->month && $today->day < $birthDate->day)
        ) {
            $age--;
        }

        return $age;
    }

    private function ageGroupFor(?int $age): ?string
    {
        return match (true) {
            $age !== null && $age >= 13 && $age <= 17 => 'Teenagers',
            $age !== null && $age >= 18 && $age <= 24 => 'Young Adults',
            $age !== null && $age >= 25 && $age <= 34 => 'Adults',
            $age !== null && $age >= 35 && $age <= 49 => 'Middle-aged Adults',
            $age !== null && $age >= 50 && $age <= 59 => 'Older Adults',
            $age !== null && $age >= 60 => 'Senior Citizens',
            default => null,
        };
    }
}
