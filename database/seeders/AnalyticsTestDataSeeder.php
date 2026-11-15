<?php

namespace Database\Seeders;

use App\Models\BarangayRequest;
use App\Models\DocumentType;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AnalyticsTestDataSeeder extends Seeder
{
    private const REQUEST_COUNT = 100;

    private const TRACKING_PREFIX = 'BR-SYNTH-ANALYTICS-';

    public function run(): void
    {
        $user = User::where('username', 'resident')->first();
        $documentTypeIds = DocumentType::where('is_active', true)
            ->orderBy('document_type_id')
            ->pluck('document_type_id')
            ->all();

        if (! $user) {
            throw new RuntimeException(
                'Seed the resident account before adding analytics test requests.'
            );
        }

        if (! $documentTypeIds) {
            throw new RuntimeException(
                'Create at least one active document type before adding analytics test requests.'
            );
        }

        DB::transaction(function () use ($user, $documentTypeIds): void {
            $trackingNumbers = collect(range(1, self::REQUEST_COUNT))
                ->map(fn (int $number): string => self::TRACKING_PREFIX
                    .str_pad((string) $number, 3, '0', STR_PAD_LEFT));
            $reconciled = DB::table('barangay_requests')
                ->whereIn('tracking_number', $trackingNumbers)
                ->where('status', 'migration_review')
                ->whereIn(
                    'request_id',
                    DB::table('request_workflow_migration_issues')
                        ->select('request_id')
                        ->where('original_status', 'Processing')
                )
                ->update(['status' => 'approved']);
            $existing = BarangayRequest::withTrashed()
                ->whereIn('tracking_number', $trackingNumbers)
                ->pluck('tracking_number')
                ->all();
            $existingSet = array_flip($existing);
            $now = CarbonImmutable::now();
            $firstMonth = $now->startOfMonth()->subMonths(5);
            $statuses = [
                'request_submitted',
                'approved',
                'ready_for_pickup',
                'completed',
                'rejected',
            ];
            $records = [];

            for ($number = 1; $number <= self::REQUEST_COUNT; $number++) {
                $trackingNumber = self::TRACKING_PREFIX
                    .str_pad((string) $number, 3, '0', STR_PAD_LEFT);
                if (isset($existingSet[$trackingNumber])) {
                    continue;
                }

                $monthOffset = intdiv(($number - 1) * 6, self::REQUEST_COUNT);
                $monthStart = $firstMonth->addMonths($monthOffset);
                $lastAllowedDay = $monthStart->isSameMonth($now)
                    ? $now->day
                    : $monthStart->daysInMonth;
                $day = (($number * 7 - 1) % $lastAllowedDay) + 1;
                $createdAt = $monthStart
                    ->setDay($day)
                    ->setTime(8 + ($number % 10), ($number * 13) % 60);
                if ($createdAt->greaterThan($now)) {
                    $createdAt = $now->subMinutes($number);
                }

                $status = $statuses[($number - 1) % count($statuses)];
                $approvedAt = in_array(
                    $status,
                    ['approved', 'ready_for_pickup', 'completed'],
                    true
                )
                    ? $createdAt->addDay()
                    : null;
                $readyAt = in_array(
                    $status,
                    ['ready_for_pickup', 'completed'],
                    true
                )
                    ? $createdAt->addDays(2)
                    : null;

                $records[] = [
                    'user_id' => $user->user_id,
                    'document_type_id' => $documentTypeIds[($number - 1) % count($documentTypeIds)],
                    'purpose' => 'Synthetic analytics test data request '
                        .str_pad((string) $number, 3, '0', STR_PAD_LEFT),
                    'tracking_number' => $trackingNumber,
                    'status' => $status,
                    'verified_at' => $approvedAt,
                    'approved_at' => $approvedAt,
                    'ready_for_pickup_at' => $readyAt,
                    'claimed_at' => $status === 'completed'
                        ? $createdAt->addDays(3)
                        : null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
            }

            foreach (array_chunk($records, 100) as $chunk) {
                DB::table('barangay_requests')->insert($chunk);
            }

            $this->command?->info(
                'Analytics test data ready: '
                .$reconciled
                .' legacy synthetic requests updated to the current workflow; '
                .(self::REQUEST_COUNT - count($existingSet))
                .' synthetic requests added; '
                .count($existingSet)
                .' already existed.'
            );
        });
    }
}
