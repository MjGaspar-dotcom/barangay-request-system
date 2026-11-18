<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\AuditService;
use App\Services\IdTypeRecognitionService;
use App\Support\ResidentAddress;
use Dunn\LaravelOcr\Exceptions\OcrProcessingException;
use Dunn\LaravelOcr\Exceptions\TesseractNotFoundException;
use Dunn\LaravelOcr\Exceptions\UnsupportedLanguageException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class UserController extends Controller
{
    public function updateProfile(UpdateUserRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();
        $this->composeStructuredAddress($validated);
        $idTypeDetection = null;
        if ($request->hasFile('valid_id_front')) {
            try {
                $detectedIdType = app(IdTypeRecognitionService::class)->detectFromPath(
                    $request->file('valid_id_front')->getRealPath()
                );

                if ($detectedIdType !== null) {
                    $validated['valid_id_type'] = $detectedIdType;
                    $idTypeDetection = [
                        'status' => 'identified',
                        'id_type' => $detectedIdType,
                    ];
                } else {
                    $idTypeDetection = [
                        'status' => 'unrecognized',
                        'id_type' => null,
                    ];
                }
            } catch (
                OcrProcessingException|
                TesseractNotFoundException|
                UnsupportedLanguageException $exception
            ) {
                Log::warning('ID type could not be detected from the uploaded image.', [
                    'user_id' => $user->user_id,
                    'exception' => $exception->getMessage(),
                ]);
                $idTypeDetection = [
                    'status' => 'unavailable',
                    'id_type' => null,
                ];
            }
        }

        $identityDetailsChanged = false;
        $newFiles = [];
        $oldFiles = [];

        $uploadDirectories = [
            'profile_picture' => 'resident-profile-pictures',
            'valid_id_front' => 'resident-valid-ids',
            'valid_id_back' => 'resident-valid-ids',
        ];

        try {
            foreach ($uploadDirectories as $field => $directory) {
                if (! $request->hasFile($field)) {
                    continue;
                }

                $file = $request->file($field);
                $disk = config('filesystems.private_upload_disk');
                $path = $file->store($directory, $disk);
                if (! is_string($path) || $path === '') {
                    throw new RuntimeException("Unable to store {$field}.");
                }

                $newFiles[] = ['disk' => $disk, 'path' => $path];
                $oldPath = $user->getRawOriginal($field);
                if (is_string($oldPath) && $oldPath !== '') {
                    $oldFiles[] = [
                        'disk' => $user->getRawOriginal("{$field}_disk")
                            ?: config(
                                $field === 'profile_picture'
                                    ? 'filesystems.legacy_profile_picture_disk'
                                    : 'filesystems.legacy_valid_id_disk'
                            ),
                        'path' => $oldPath,
                    ];
                }

                $validated[$field] = $path;
                $validated["{$field}_disk"] = $disk;
                $validated["{$field}_original_name"] = $file->getClientOriginalName();
                $validated["{$field}_mime_type"] =
                    $file->getMimeType() ?: 'application/octet-stream';
                $validated["{$field}_uploaded_at"] = now();

                if ($field !== 'profile_picture') {
                    $identityDetailsChanged = true;
                }
            }

            if (
                array_key_exists('valid_id_type', $validated) &&
                $validated['valid_id_type'] !== $user->valid_id_type
            ) {
                $identityDetailsChanged = true;
            }

            $verificationReset =
                $identityDetailsChanged &&
                $user->verification_status === 'verified';
            if ($verificationReset) {
                $validated['verification_status'] = 'pending';
            }

            $user->update($validated);
        } catch (Throwable $exception) {
            foreach ($newFiles as $storedFile) {
                $this->deleteStoredFile($storedFile);
            }
            throw $exception;
        }

        foreach ($oldFiles as $storedFile) {
            if (! in_array($storedFile, $newFiles, true)) {
                $this->deleteStoredFile($storedFile);
            }
        }

        if ($verificationReset) {
            AuditService::log(
                'verification_updated',
                $user,
                'Resident ID information changed; account verification was returned to pending.',
                ['verification_status' => 'verified'],
                ['verification_status' => 'pending']
            );
        }

        $message = $verificationReset
            ? 'Profile updated. Your account verification is pending review because your ID details changed.'
            : 'User profile updated successfully.';
        $profileUpdatedMessage = $verificationReset
            ? 'Profile updated and returned to pending verification.'
            : 'Profile updated.';
        if (($idTypeDetection['status'] ?? null) === 'identified') {
            $message = "{$profileUpdatedMessage} The uploaded ID was identified as {$idTypeDetection['id_type']}.";
        } elseif (($idTypeDetection['status'] ?? null) === 'unrecognized') {
            $message = "{$profileUpdatedMessage} The ID type could not be recognized. Use a clear front-side image or review the type manually.";
        } elseif (($idTypeDetection['status'] ?? null) === 'unavailable') {
            $message = "{$profileUpdatedMessage} Automatic ID detection is unavailable. Please contact an administrator.";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $user->fresh(),
            'id_type_detection' => $idTypeDetection,
        ]);
    }

    private function composeStructuredAddress(array &$validated): void
    {
        if (!array_key_exists('street_name', $validated)) {
            return;
        }

        $validated = array_replace(
            $validated,
            ResidentAddress::fromStreetName($validated['street_name'])
        );
    }

    public function showFile(Request $request, User $user, string $field)
    {
        $allowedFields = [
            'profile_picture',
            'valid_id_front',
            'valid_id_back',
        ];
        if (! in_array($field, $allowedFields, true)) {
            return response()->json([
                'success' => false,
                'message' => 'The requested file is unavailable.',
            ], 404);
        }

        $path = $user->getRawOriginal($field);
        if (! is_string($path) || $path === '') {
            return response()->json([
                'success' => false,
                'message' => 'The requested file is unavailable.',
            ], 404);
        }

        $diskName = $user->getRawOriginal("{$field}_disk");
        if (! $diskName) {
            $diskName = config(
                $field === 'profile_picture'
                    ? 'filesystems.legacy_profile_picture_disk'
                    : 'filesystems.legacy_valid_id_disk'
            );
        }

        $disk = Storage::disk($diskName);
        if (! $disk->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'The requested file is unavailable.',
            ], 404);
        }

        $stream = $disk->readStream($path);
        if (! is_resource($stream)) {
            throw new RuntimeException('Unable to read the requested stored file.');
        }

        $originalName = $user->getRawOriginal("{$field}_original_name")
            ?: basename($path);
        $originalName = preg_replace('/[\r\n]/', '', $originalName);
        $mimeType = $user->getRawOriginal("{$field}_mime_type")
            ?: $disk->mimeType($path)
            ?: 'application/octet-stream';

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
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="'.
                    addcslashes($originalName, '"\\').'"',
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'private, no-store',
            ]
        );
    }

    /**
     * @param  array{disk: string, path: string}  $storedFile
     */
    private function deleteStoredFile(array $storedFile): void
    {
        $disk = Storage::disk($storedFile['disk']);
        if ($disk->exists($storedFile['path']) && ! $disk->delete($storedFile['path'])) {
            throw new RuntimeException(
                "Unable to remove replaced profile file {$storedFile['path']}."
            );
        }
    }
}
