<?php

namespace Tests\Feature;

use Tests\TestCase;

class QrCodeTrackingRedirectTest extends TestCase
{
    public function test_tracking_qr_url_redirects_to_the_frontend_and_preserves_tracking_number(): void
    {
        config([
            'app.url' => 'http://127.0.0.1:8000',
            'app.frontend_url' => 'http://localhost:5173',
        ]);

        $this->get('/track-request?tracking_number=BR-20261117-8AZRRL')
            ->assertRedirect(
                'http://localhost:5173/track-request?tracking_number=BR-20261117-8AZRRL'
            );
    }

    public function test_tracking_qr_url_reports_missing_frontend_configuration(): void
    {
        config([
            'app.url' => 'http://127.0.0.1:8000',
            'app.frontend_url' => 'http://127.0.0.1:8000',
        ]);

        $this->get('/track-request?tracking_number=BR-20261117-8AZRRL')
            ->assertStatus(503);
    }
}
