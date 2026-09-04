<?php

namespace App\Services;

use App\Models\GuestRequest;
use Illuminate\Support\Str;

class TrackingNumberService
{
    /**
     * Generate a unique tracking number like:
     * BRGY-2026-AB12CD
     */
    public static function generate(): string
    {
        do {
            $year = date('Y');
            $random = strtoupper(Str::random(6));
            $trackingNumber = "BRGY-{$year}-{$random}";
        } while (GuestRequest::where('tracking_number', $trackingNumber)->exists());

        return $trackingNumber;
    }
}