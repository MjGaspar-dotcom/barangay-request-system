<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GoogleIdTokenVerifier
{
    /**
     * Verify the token with Google's tokeninfo endpoint and restrict it to the
     * OAuth clients configured for this application.
     *
     * @return array<string, mixed>|null
     */
    public function verify(string $idToken): ?array
    {
        try {
            $response = Http::acceptJson()
                ->timeout(10)
                ->get('https://oauth2.googleapis.com/tokeninfo', [
                    'id_token' => $idToken,
                ]);
        } catch (ConnectionException $exception) {
            throw new RuntimeException(
                'Google token verification is unavailable.',
                previous: $exception
            );
        }

        if ($response->status() === 400 || $response->status() === 401) {
            return null;
        }

        if (! $response->successful()) {
            throw new RuntimeException('Google token verification is unavailable.');
        }

        $claims = $response->json();
        if (! is_array($claims)) {
            return null;
        }

        $clientIds = config('services.google.client_ids', []);
        $clientIds = is_array($clientIds) ? $clientIds : [];
        $audience = $claims['aud'] ?? null;
        $emailVerified = filter_var(
            $claims['email_verified'] ?? false,
            FILTER_VALIDATE_BOOLEAN
        );
        $expiresAt = filter_var($claims['exp'] ?? null, FILTER_VALIDATE_INT);
        $issuer = $claims['iss'] ?? null;

        if (
            ! is_string($audience) ||
            ! in_array($audience, $clientIds, true) ||
            ! in_array($issuer, ['accounts.google.com', 'https://accounts.google.com'], true) ||
            ! $emailVerified ||
            ! $expiresAt ||
            $expiresAt <= time() ||
            ! is_string($claims['sub'] ?? null) ||
            ($claims['sub'] ?? '') === '' ||
            ! filter_var($claims['email'] ?? null, FILTER_VALIDATE_EMAIL)
        ) {
            return null;
        }

        if (
            isset($claims['azp']) &&
            ! in_array($claims['azp'], $clientIds, true)
        ) {
            return null;
        }

        return $claims;
    }
}
