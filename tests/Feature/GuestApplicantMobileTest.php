<?php

namespace Tests\Feature;

use App\Models\DocumentType;
use App\Models\GuestApplicant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GuestApplicantMobileTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_submit_with_both_id_sides_and_track_the_request(): void
    {
        $disk = config('filesystems.private_upload_disk');
        Storage::fake($disk);
        $documentType = DocumentType::create([
            'document_name' => 'Guest Mobile Test Clearance',
            'description' => 'Proof of residency',
            'fee' => 50,
        ]);

        $response = $this->post('/api/guest-requests', [
            'first_name' => 'Juan',
            'middle_name' => 'Miguel',
            'no_middle_name' => '0',
            'last_name' => 'Dela Cruz',
            'birth_date' => '1995-03-20',
            'contact_number' => '09123456789',
            'street_name' => 'Main Street',
            'valid_id_front' => $this->fakeIdImage('front.png'),
            'valid_id_back' => $this->fakeIdImage('back.png'),
            'document_type_id' => $documentType->document_type_id,
            'purpose' => 'School enrollment',
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.request.user_id', null);

        $trackingNumber = $response->json('data.request.tracking_number');
        $this->assertIsString($trackingNumber);
        $this->assertNotEmpty($response->json('data.qr_code'));

        $applicant = GuestApplicant::query()
            ->where('request_id', $response->json('data.request.request_id'))
            ->firstOrFail();
        $this->assertSame('Miguel', $applicant->middle_name);
        $this->assertFalse((bool) $applicant->no_middle_name);
        $this->assertSame('1995-03-20', $applicant->birth_date->toDateString());
        $this->assertNull($applicant->valid_id_type);
        Storage::disk($disk)->assertExists($applicant->valid_id_front);
        Storage::disk($disk)->assertExists($applicant->valid_id_back);

        $this->getJson("/api/track/{$trackingNumber}")
            ->assertOk()
            ->assertJsonPath('data.tracking_number', $trackingNumber);
    }

    public function test_guest_submission_requires_the_back_of_the_valid_id(): void
    {
        $documentType = DocumentType::create([
            'document_name' => 'Guest Mobile Validation Clearance',
            'description' => 'Proof of residency',
            'fee' => 50,
        ]);

        $this->post('/api/guest-requests', [
            'first_name' => 'Juan',
            'middle_name' => 'Miguel',
            'no_middle_name' => '0',
            'last_name' => 'Dela Cruz',
            'birth_date' => '1995-03-20',
            'contact_number' => '09123456789',
            'street_name' => 'Main Street',
            'valid_id_front' => $this->fakeIdImage('front.png'),
            'document_type_id' => $documentType->document_type_id,
            'purpose' => 'School enrollment',
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['valid_id_back']);
    }

    public function test_guest_can_choose_no_middle_name(): void
    {
        Storage::fake(config('filesystems.private_upload_disk'));
        $documentType = DocumentType::create([
            'document_name' => 'Guest No Middle Name Clearance',
            'description' => 'Proof of residency',
            'fee' => 50,
        ]);

        $response = $this->post('/api/guest-requests', [
            'first_name' => 'Juan',
            'no_middle_name' => '1',
            'last_name' => 'Dela Cruz',
            'birth_date' => '1995-03-20',
            'contact_number' => '09123456789',
            'street_name' => 'Main Street',
            'valid_id_front' => $this->fakeIdImage('front.png'),
            'valid_id_back' => $this->fakeIdImage('back.png'),
            'document_type_id' => $documentType->document_type_id,
            'purpose' => 'School enrollment',
        ], ['Accept' => 'application/json']);

        $response->assertCreated();
        $applicant = GuestApplicant::query()
            ->where('request_id', $response->json('data.request.request_id'))
            ->firstOrFail();
        $this->assertNull($applicant->middle_name);
        $this->assertTrue((bool) $applicant->no_middle_name);
    }

    public function test_guest_must_provide_middle_name_or_choose_no_middle_name(): void
    {
        Storage::fake(config('filesystems.private_upload_disk'));
        $documentType = DocumentType::create([
            'document_name' => 'Guest Middle Name Validation Clearance',
            'description' => 'Proof of residency',
            'fee' => 50,
        ]);

        $this->post('/api/guest-requests', [
            'first_name' => 'Juan',
            'no_middle_name' => '0',
            'last_name' => 'Dela Cruz',
            'birth_date' => '1995-03-20',
            'contact_number' => '09123456789',
            'street_name' => 'Main Street',
            'valid_id_front' => $this->fakeIdImage('front.png'),
            'valid_id_back' => $this->fakeIdImage('back.png'),
            'document_type_id' => $documentType->document_type_id,
            'purpose' => 'School enrollment',
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['middle_name']);
    }

    public function test_guest_birth_date_is_required_and_cannot_be_in_the_future(): void
    {
        Storage::fake(config('filesystems.private_upload_disk'));
        $documentType = DocumentType::create([
            'document_name' => 'Guest Birthday Validation Clearance',
            'description' => 'Proof of residency',
            'fee' => 50,
        ]);
        $guestDetails = [
            'first_name' => 'Juan',
            'no_middle_name' => '1',
            'last_name' => 'Dela Cruz',
            'contact_number' => '09123456789',
            'street_name' => 'Main Street',
            'document_type_id' => $documentType->document_type_id,
            'purpose' => 'School enrollment',
        ];

        $this->post('/api/guest-requests', [
            ...$guestDetails,
            'valid_id_front' => $this->fakeIdImage('front.png'),
            'valid_id_back' => $this->fakeIdImage('back.png'),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['birth_date']);

        $this->post('/api/guest-requests', [
            ...$guestDetails,
            'birth_date' => now()->addDay()->toDateString(),
            'valid_id_front' => $this->fakeIdImage('front.png'),
            'valid_id_back' => $this->fakeIdImage('back.png'),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['birth_date']);
    }

    private function fakeIdImage(string $fileName): UploadedFile
    {
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/qWQAAAAASUVORK5CYII=',
            true
        );
        if (!is_string($png)) {
            throw new \RuntimeException('Unable to decode the test ID image.');
        }

        return UploadedFile::fake()->createWithContent($fileName, $png);
    }
}
