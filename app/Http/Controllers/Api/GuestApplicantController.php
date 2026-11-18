<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGuestBarangayRequest;
use App\Models\BarangayRequest;
use App\Models\GuestApplicant;
use App\Services\AuditService;
use App\Services\QrCodeService;
use App\Services\RequestStatusService;
use App\Support\ResidentAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class GuestApplicantController extends Controller
{
    public function store(StoreGuestBarangayRequest $request)
    {
        $validated = $request->validated();
        $diskName = config('filesystems.private_upload_disk');
        $storedFiles = [];
        $guestFiles = [];

        try {
            foreach (['valid_id_front', 'valid_id_back'] as $field) {
                $file = $request->file($field);
                $path = $file->store('guest-request-ids', $diskName);
                if (! is_string($path) || $path === '') {
                    throw new RuntimeException("Unable to store {$field}.");
                }
                $storedFiles[] = ['disk' => $diskName, 'path' => $path];
                $guestFiles[$field] = [
                    $field => $path,
                    "{$field}_disk" => $diskName,
                    "{$field}_original_name" => $file->getClientOriginalName(),
                    "{$field}_mime_type" => $file->getMimeType() ?: 'application/octet-stream',
                ];
            }

            $barangayRequest = DB::transaction(function () use ($validated, $guestFiles): BarangayRequest {
                $trackingNumber = 'BR-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
                $barangayRequest = BarangayRequest::create([
                    'user_id' => null,
                    'document_type_id' => $validated['document_type_id'],
                    'purpose' => $validated['purpose'],
                    'request_data' => $validated['request_data'] ?? null,
                    'tracking_number' => $trackingNumber,
                    'status' => RequestStatusService::STATUS_REQUEST_SUBMITTED,
                ]);
                $address = ResidentAddress::fromStreetName($validated['street_name']);
                $barangayRequest->guestApplicant()->create([
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['no_middle_name']
                        ? null
                        : $validated['middle_name'],
                    'no_middle_name' => (bool) $validated['no_middle_name'],
                    'last_name' => $validated['last_name'],
                    'birth_date' => $validated['birth_date'],
                    'contact_number' => $validated['contact_number'],
                    'street_name' => $address['street_name'],
                    'address' => $address['address'],
                    'valid_id_type' => null,
                    ...$guestFiles['valid_id_front'],
                    ...$guestFiles['valid_id_back'],
                ]);

                return $barangayRequest;
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($storedFiles);
            throw $exception;
        }

        $barangayRequest->load('documentType');
        AuditService::log(
            'request_submitted',
            $barangayRequest,
            "Guest submitted a barangay request (Tracking: {$barangayRequest->tracking_number})"
        );
        AuditService::notifyStaffAndAdmins(
            'new_request',
            'New Guest Barangay Request',
            "A guest submitted a request for {$barangayRequest->documentType?->document_name} ({$barangayRequest->tracking_number}) and is awaiting processing.",
            $barangayRequest->request_id
        );

        return response()->json([
            'success' => true,
            'message' => 'Guest request submitted successfully.',
            'data' => [
                'request' => $barangayRequest,
                'qr_code' => QrCodeService::generate($barangayRequest->tracking_number),
            ],
        ], 201);
    }

    public function updateIdType(Request $request, BarangayRequest $barangayRequest)
    {
        if ($barangayRequest->status !== RequestStatusService::STATUS_REQUEST_SUBMITTED) {
            return response()->json([
                'success' => false,
                'message' => 'The guest ID can only be verified before request processing begins.',
            ], 422);
        }

        $validated = $request->validate([
            'valid_id_type' => ['required', 'string', 'max:120'],
        ]);
        $guestApplicant = $barangayRequest->guestApplicant()->firstOrFail();
        $previousType = $guestApplicant->valid_id_type;
        $guestApplicant->update(['valid_id_type' => $validated['valid_id_type']]);

        AuditService::log(
            'guest_id_type_verified',
            $guestApplicant,
            'Staff recorded the valid ID type during guest background verification.',
            ['valid_id_type' => $previousType],
            ['valid_id_type' => $validated['valid_id_type']]
        );

        return response()->json([
            'success' => true,
            'message' => 'Guest ID type verified successfully.',
            'data' => ['valid_id_type' => $guestApplicant->valid_id_type],
        ]);
    }

    public function showIdFile(GuestApplicant $guestApplicant, string $field)
    {
        if (! in_array($field, ['valid_id_front', 'valid_id_back'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'The requested file is unavailable.',
            ], 404);
        }

        $path = $guestApplicant->getRawOriginal($field);
        $disk = Storage::disk(
            $guestApplicant->getRawOriginal("{$field}_disk")
        );
        if (! is_string($path) || $path === '' || ! $disk->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'The requested file is unavailable.',
            ], 404);
        }

        $stream = $disk->readStream($path);
        if (! is_resource($stream)) {
            throw new RuntimeException('Unable to read the stored guest ID image.');
        }

        $originalName = preg_replace(
            '/[\r\n]/',
            '',
            $guestApplicant->getRawOriginal("{$field}_original_name") ?: basename($path)
        );

        return response()->stream(
            function () use ($stream): void {
                try {
                    fpassthru($stream);
                } finally {
                    if (is_resource($stream)) {
                        fclose($stream);
                    }
                }
            },
            200,
            [
                'Content-Type' => $guestApplicant->getRawOriginal("{$field}_mime_type")
                    ?: $disk->mimeType($path)
                    ?: 'application/octet-stream',
                'Content-Disposition' => 'inline; filename="'.addcslashes($originalName, '"\\').'"',
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'private, no-store',
            ]
        );
    }

    private function deleteStoredFiles(array $storedFiles): void
    {
        foreach ($storedFiles as $storedFile) {
            $disk = Storage::disk($storedFile['disk']);
            if ($disk->exists($storedFile['path']) && ! $disk->delete($storedFile['path'])) {
                throw new RuntimeException('Unable to remove a guest ID image after request failure.');
            }
        }
    }
}
