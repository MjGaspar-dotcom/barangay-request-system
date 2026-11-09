<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class DocumentRequestTrendService
{
    public function getTrends(
        string $period,
        ?string $startDate = null,
        ?string $endDate = null
    ): array {
        $now = CarbonImmutable::now();

        [$start, $endExclusive, $bucket, $labels] = match ($period) {
            'daily' => $this->dailyRange($now),
            'weekly' => $this->weeklyRange($now),
            'monthly' => $this->monthlyRange($now),
            'yearly' => $this->yearlyRange($now),
            'custom' => $this->customRange($startDate, $endDate),
        };

        $points = $this->emptyPoints($start, $endExclusive, $period, $labels);
        $counts = $this->aggregateCounts($start, $endExclusive, $bucket);

        foreach ($counts as $row) {
            $key = (string) $row->period;
            if (isset($points[$key])) {
                $points[$key]['count'] = (int) $row->count;
            }
        }

        $pointList = array_values($points);
        $total = array_sum(array_column($pointList, 'count'));
        $peak = null;

        foreach ($pointList as $point) {
            if ($peak === null || $point['count'] > $peak['count']) {
                $peak = $point;
            }
        }

        if ($total === 0) {
            $peak = null;
        }

        $periodDays = CarbonImmutable::parse($start->toDateString(), 'UTC')
            ->diff(CarbonImmutable::parse($endExclusive->toDateString(), 'UTC'))
            ->days;
        $comparisonStart = $start->subDays($periodDays);
        $previousTotal = array_sum(array_column(
            $this->aggregateCounts($comparisonStart, $start, $bucket),
            'count'
        ));

        $comparison = [
            'previous_start_date' => $comparisonStart->toDateString(),
            'previous_end_date' => $start->subDay()->toDateString(),
            'previous_total' => $previousTotal,
            'percentage' => $previousTotal > 0
                ? round((($total - $previousTotal) / $previousTotal) * 100, 1)
                : null,
            'direction' => $previousTotal === 0
                ? 'no_previous_data'
                : ($total > $previousTotal
                    ? 'increase'
                    : ($total < $previousTotal ? 'decrease' : 'same')),
        ];

        return [
            'period' => $period,
            'start_date' => $start->toDateString(),
            'end_date' => $endExclusive->subDay()->toDateString(),
            'points' => $pointList,
            'summary' => [
                'total_requests' => $total,
                'average_requests' => count($pointList) > 0
                    ? round($total / count($pointList), 2)
                    : 0,
                'peak_period' => $peak,
                'comparison' => $comparison,
            ],
        ];
    }

    /**
     * @return array{CarbonImmutable, CarbonImmutable, string, string}
     */
    private function dailyRange(CarbonImmutable $now): array
    {
        $end = $now->startOfDay()->addDay();

        return [$end->subDays(7), $end, 'daily', 'daily'];
    }

    /**
     * @return array{CarbonImmutable, CarbonImmutable, string, string}
     */
    private function weeklyRange(CarbonImmutable $now): array
    {
        $end = $now
            ->startOfWeek(CarbonImmutable::MONDAY)
            ->addWeek();

        return [$end->subWeeks(8), $end, 'weekly', 'weekly'];
    }

    /**
     * @return array{CarbonImmutable, CarbonImmutable, string, string}
     */
    private function monthlyRange(CarbonImmutable $now): array
    {
        $end = $now->startOfMonth()->addMonth();

        return [$end->subMonths(12), $end, 'monthly', 'monthly'];
    }

    /**
     * @return array{CarbonImmutable, CarbonImmutable, string, string}
     */
    private function yearlyRange(CarbonImmutable $now): array
    {
        $firstRequest = $this->firstRequestDate();
        $start = ($firstRequest ?? $now)->startOfYear();

        return [$start, $now->startOfYear()->addYear(), 'yearly', 'yearly'];
    }

    /**
     * @return array{CarbonImmutable, CarbonImmutable, string, string}
     */
    private function customRange(?string $startDate, ?string $endDate): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m-d', $startDate);
        $end = CarbonImmutable::createFromFormat('!Y-m-d', $endDate)->addDay();

        return [$start, $end, 'daily', 'daily'];
    }

    private function firstRequestDate(): ?CarbonImmutable
    {
        $dates = [
            DB::table('barangay_requests')
                ->whereNull('deleted_at')
                ->min('created_at'),
        ];
        $dates = array_values(array_filter($dates));

        if ($dates === []) {
            return null;
        }

        return CarbonImmutable::parse(min($dates));
    }

    /**
     * @return array<string, array{period: string, label: string, count: int}>
     */
    private function emptyPoints(
        CarbonImmutable $start,
        CarbonImmutable $endExclusive,
        string $period,
        string $labelFormat
    ): array {
        $points = [];
        $cursor = match ($period) {
            'weekly' => $start->startOfWeek(CarbonImmutable::MONDAY),
            'monthly' => $start->startOfMonth(),
            'yearly' => $start->startOfYear(),
            default => $start->startOfDay(),
        };

        while ($cursor < $endExclusive) {
            $key = match ($period) {
                'weekly' => $cursor->toDateString(),
                'monthly' => $cursor->format('Y-m-01'),
                'yearly' => $cursor->format('Y-01-01'),
                default => $cursor->toDateString(),
            };
            $label = match ($labelFormat) {
                'weekly' => $cursor->format('M j'),
                'monthly' => $cursor->format('M Y'),
                'yearly' => $cursor->format('Y'),
                default => $cursor->format('M j'),
            };

            $points[$key] = [
                'period' => $key,
                'label' => $label,
                'tooltip_label' => match ($period) {
                    'weekly' => 'Week of ' . $cursor->format('M j, Y'),
                    'monthly' => $cursor->format('F Y'),
                    'yearly' => $cursor->format('Y'),
                    default => $cursor->format('F j, Y'),
                },
                'count' => 0,
            ];
            $cursor = match ($period) {
                'weekly' => $cursor->addWeek(),
                'monthly' => $cursor->addMonth(),
                'yearly' => $cursor->addYear(),
                default => $cursor->addDay(),
            };
        }

        return $points;
    }

    /**
     * Aggregate request counts in SQL without loading request rows.
     */
    private function aggregateCounts(
        CarbonImmutable $start,
        CarbonImmutable $endExclusive,
        string $period
    ): array {
        $bucket = $this->bucketExpression($period);
        $registered = $this->tableAggregate(
            'barangay_requests',
            $bucket,
            $start,
            $endExclusive
        );
        return DB::query()
            ->fromSub($registered, 'request_counts')
            ->selectRaw('period, SUM(request_count) as count')
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->all();
    }

    private function tableAggregate(
        string $table,
        string $bucket,
        CarbonImmutable $start,
        CarbonImmutable $endExclusive
    ): Builder {
        return DB::table($table)
            ->selectRaw("{$bucket} as period, COUNT(*) as request_count")
            ->where('created_at', '>=', $start->toDateTimeString())
            ->where('created_at', '<', $endExclusive->toDateTimeString())
            ->whereNull('deleted_at')
            ->groupByRaw($bucket);
    }

    private function bucketExpression(string $period): string
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            return match ($period) {
                'weekly' => "date(created_at, '-' || ((CAST(strftime('%w', created_at) AS INTEGER) + 6) % 7) || ' days')",
                'monthly' => "strftime('%Y-%m-01', created_at)",
                'yearly' => "strftime('%Y-01-01', created_at)",
                default => "date(created_at)",
            };
        }

        if ($driver === 'pgsql') {
            return match ($period) {
                'weekly' => "TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD')",
                'monthly' => "TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM-01')",
                'yearly' => "TO_CHAR(DATE_TRUNC('year', created_at), 'YYYY-01-01')",
                default => "TO_CHAR(created_at, 'YYYY-MM-DD')",
            };
        }

        return match ($period) {
            'weekly' => "DATE_FORMAT(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY), '%Y-%m-%d')",
            'monthly' => "DATE_FORMAT(created_at, '%Y-%m-01')",
            'yearly' => "DATE_FORMAT(created_at, '%Y-01-01')",
            default => 'DATE(created_at)',
        };
    }
}
