<?php

namespace App\Services;

use App\Models\BarangayRequest;
use App\Models\GuestRequest;
use Illuminate\Support\Facades\DB;

class RequestReportService
{
    /**
     * Get request counts grouped by status.
     */
    public static function getStatusCounts(): array
    {
        $barangay = BarangayRequest::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $guest = GuestRequest::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return [
            'barangay_requests' => $barangay,
            'guest_requests'    => $guest,
            'total'             => array_sum($barangay) + array_sum($guest),
        ];
    }

    /**
     * Get most requested document types.
     */
    public static function getTopDocumentTypes(int $limit = 5): array
    {
        return DB::table('barangay_requests')
            ->join('document_types', 'barangay_requests.document_type_id', '=', 'document_types.id')
            ->select('document_types.name', DB::raw('count(*) as total'))
            ->groupBy('document_types.name')
            ->orderByDesc('total')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get average processing time in hours.
     */
    public static function getAverageProcessingTime(): float
    {
        return (float) DB::table('barangay_requests')
            ->whereNotNull('updated_at')
            ->where('status', 'completed')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours')
            ->value('avg_hours') ?? 0;
    }
}