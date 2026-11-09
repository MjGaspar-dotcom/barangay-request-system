<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.google.client_ids' => ['test-web-client']]);
    }

    public function test_new_google_account_must_complete_resident_profile(): void
    {
        $this->fakeGoogleIdentity();

        $this->postJson('/api/auth/google', ['id_token' => 'valid-token'])
            ->assertOk()
            ->assertJson([
                'requires_profile' => true,
                'email' => 'resident@example.com',
                'first_name' => 'Test',
                'last_name' => 'Resident',
            ]);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_google_sign_in_reports_missing_server_configuration(): void
    {
        config(['services.google.client_ids' => []]);

        $this->postJson('/api/auth/google', ['id_token' => 'unused-token'])
            ->assertServiceUnavailable()
            ->assertJsonPath(
                'message',
                'Google sign-in is not configured on the server.'
            );
    }

    public function test_google_sign_up_creates_a_resident_and_returns_api_token(): void
    {
        $this->fakeGoogleIdentity();

        $response = $this->postJson('/api/auth/google', [
            'id_token' => 'valid-token',
            'first_name' => 'Test',
            'middle_name' => 'Marie',
            'last_name' => 'Resident',
            'birth_date' => '2000-01-01',
            'gender' => 'Prefer not to say',
            'civil_status' => 'Single',
            'address' => '1 Main Street',
            'contact_number' => '09123456789',
        ]);

        $response->assertCreated()
            ->assertJsonPath('role', 'user')
            ->assertJsonPath('data.email', 'resident@example.com')
            ->assertJsonStructure(['token', 'data' => ['user_id']]);

        $this->assertDatabaseHas('users', [
            'username' => 'resident',
            'email' => 'resident@example.com',
            'google_id' => 'google-subject-1',
            'middle_name' => 'Marie',
        ]);
        $this->assertNotNull(User::where('email', 'resident@example.com')->value('email_verified_at'));

        $this->withToken($response->json('token'))
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.user_id', 1);

        $this->fakeGoogleIdentity();
        $this->postJson('/api/auth/google', ['id_token' => 'valid-token'])
            ->assertOk()
            ->assertJsonPath('data.email', 'resident@example.com');

        $this->assertDatabaseCount('users', 1);
    }

    public function test_google_sign_up_allows_a_resident_without_a_middle_name(): void
    {
        $this->fakeGoogleIdentity();

        $this->postJson('/api/auth/google', [
            'id_token' => 'valid-token',
            'first_name' => 'Test',
            'last_name' => 'Resident',
            'birth_date' => '2000-01-01',
            'gender' => 'Prefer not to say',
            'civil_status' => 'Single',
            'address' => '1 Main Street',
            'contact_number' => '09123456789',
        ])->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'resident@example.com',
            'middle_name' => null,
        ]);
    }

    public function test_google_sign_in_links_an_existing_resident_by_verified_email(): void
    {
        $user = User::create([
            'username' => 'existing-resident',
            'password' => Hash::make('test-password'),
            'first_name' => 'Existing',
            'last_name' => 'Resident',
            'birth_date' => '1990-01-01',
            'gender' => 'Male',
            'civil_status' => 'Single',
            'address' => '1 Main Street',
            'contact_number' => '09123456789',
            'email' => 'Resident@Example.com',
            'verification_status' => 'pending',
        ]);
        $this->fakeGoogleIdentity();

        $this->postJson('/api/auth/google', ['id_token' => 'valid-token'])
            ->assertOk()
            ->assertJsonPath('data.user_id', $user->user_id);

        $this->assertDatabaseHas('users', [
            'user_id' => $user->user_id,
            'google_id' => 'google-subject-1',
        ]);
    }

    public function test_unverified_google_identity_is_rejected(): void
    {
        $this->fakeGoogleIdentity(['email_verified' => 'false']);

        $this->postJson('/api/auth/google', ['id_token' => 'invalid-token'])
            ->assertUnauthorized()
            ->assertJsonPath('message', 'The Google account could not be verified.');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_local_web_origin_can_call_api(): void
    {
        $response = $this->call(
            'OPTIONS',
            '/api/auth/google',
            server: [
                'HTTP_ORIGIN' => 'http://localhost:65110',
                'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
                'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'content-type',
            ]
        );

        $response->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:65110');
    }

    public function test_flutter_web_can_use_an_ephemeral_localhost_port(): void
    {
        $response = $this->call(
            'OPTIONS',
            '/api/login',
            server: [
                'HTTP_ORIGIN' => 'http://localhost:62179',
                'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
                'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'content-type',
            ]
        );

        $response->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:62179');
    }

    public function test_token_with_wrong_audience_is_rejected(): void
    {
        $this->fakeGoogleIdentity(['aud' => 'another-client']);

        $this->postJson('/api/auth/google', ['id_token' => 'wrong-audience'])
            ->assertUnauthorized();
    }

    private function fakeGoogleIdentity(array $overrides = []): void
    {
        Http::fake([
            'oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'test-web-client',
                'iss' => 'https://accounts.google.com',
                'sub' => 'google-subject-1',
                'email' => 'resident@example.com',
                'email_verified' => 'true',
                'exp' => (string) (time() + 300),
                'given_name' => 'Test',
                'family_name' => 'Resident',
                ...$overrides,
            ]),
        ]);
    }
}
