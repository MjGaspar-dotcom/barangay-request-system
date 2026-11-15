<?php

namespace App\Services;

use Dunn\QrCode\Laravel\Facades\QrCode;

class QrCodeService
{
    /**
     * Generate a QR code as SVG.
     */
    public static function generate(string $trackingNumber): string
    {
        return QrCode::svg(self::trackingUrl($trackingNumber));
    }

    public static function trackingUrl(string $trackingNumber): string
    {
        return rtrim((string) config('app.frontend_url'), '/')
            .'/track-request?'
            .http_build_query(['tracking_number' => $trackingNumber]);
    }
}
    