<?php

namespace App\Console\Commands;

use App\Models\BarangayRequestDocument;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateUploadsToPersistentStorage extends Command
{
    protected $signature = 'uploads:migrate-to-persistent-storage {--dry-run}';

    protected $description = 'Move existing user and request uploads to the configured private disk.';

    public function handle(): int
    {
        $targetDisk = config('filesystems.private_upload_disk');
        $dryRun = (bool) $this->option('dry-run');
        $failures = 0;
        $migrations = 0;

        foreach (User::withTrashed()->cursor() as $user) {
            foreach ([
                'profile_picture' => 'filesystems.legacy_profile_picture_disk',
                'valid_id_front' => 'filesystems.legacy_valid_id_disk',
                'valid_id_back' => 'filesystems.legacy_valid_id_disk',
            ] as $field => $legacyDiskConfig) {
                $result = $this->migrateUserFile(
                    $user,
                    $field,
                    $targetDisk,
                    config($legacyDiskConfig),
                    $dryRun
                );
                if ($result === true) {
                    $migrations++;
                } elseif ($result === false) {
                    $failures++;
                }
            }
        }

        foreach (BarangayRequestDocument::cursor() as $document) {
            if ($document->storage_disk === $targetDisk) {
                $legacyDisk = config('filesystems.legacy_request_document_disk');
                if ($legacyDisk !== $targetDisk && ! $this->migrateFile(
                    $document->storage_path,
                    $legacyDisk,
                    $targetDisk,
                    $dryRun
                )) {
                    $failures++;
                }

                continue;
            }

            $sourceDisk = $document->storage_disk
                ?: config('filesystems.legacy_request_document_disk');
            if ($sourceDisk === $targetDisk) {
                if (! $dryRun) {
                    $document->storage_disk = $targetDisk;
                    $document->save();
                }

                continue;
            }

            if ($this->migrateFile(
                $document->storage_path,
                $sourceDisk,
                $targetDisk,
                $dryRun
            )) {
                if (! $dryRun) {
                    $document->storage_disk = $targetDisk;
                    $document->save();
                }
                $migrations++;
            } else {
                $failures++;
            }
        }

        $this->info(sprintf(
            '%s %d file record(s); %d missing or failed.',
            $dryRun ? 'Would migrate' : 'Migrated',
            $migrations,
            $failures
        ));

        return $failures === 0 ? self::SUCCESS : self::FAILURE;
    }

    private function migrateUserFile(
        User $user,
        string $field,
        string $targetDisk,
        string $legacyDisk,
        bool $dryRun
    ): ?bool {
        $path = $user->getRawOriginal($field);
        if (! is_string($path) || $path === '') {
            return null;
        }

        $diskField = "{$field}_disk";
        $sourceDisk = $user->getRawOriginal($diskField) ?: $legacyDisk;
        if ($sourceDisk === $targetDisk) {
            if ($legacyDisk === $targetDisk) {
                return null;
            }

            return $this->migrateFile(
                $path,
                $legacyDisk,
                $targetDisk,
                $dryRun
            ) ? null : false;
        }

        if (! $this->migrateFile($path, $sourceDisk, $targetDisk, $dryRun)) {
            return false;
        }

        if (! $dryRun) {
            $user->forceFill([
                $diskField => $targetDisk,
                "{$field}_original_name" => $user->getRawOriginal("{$field}_original_name") ?: basename($path),
                "{$field}_mime_type" => $user->getRawOriginal("{$field}_mime_type")
                    ?: Storage::disk($targetDisk)->mimeType($path)
                    ?: 'application/octet-stream',
                "{$field}_uploaded_at" => $user->getRawOriginal("{$field}_uploaded_at")
                    ?: $user->updated_at
                    ?: now(),
            ])->save();
        }

        return true;
    }

    private function migrateFile(
        string $path,
        string $sourceDiskName,
        string $targetDiskName,
        bool $dryRun
    ): bool {
        $source = Storage::disk($sourceDiskName);
        $target = Storage::disk($targetDiskName);

        if (! $source->exists($path)) {
            if (! $target->exists($path)) {
                $this->error("Missing upload on {$sourceDiskName}: {$path}");

                return false;
            }

            return true;
        }

        if ($dryRun) {
            $this->line("{$sourceDiskName}:{$path} -> {$targetDiskName}:{$path}");

            return true;
        }

        if (! $target->exists($path)) {
            $stream = $source->readStream($path);
            if (! is_resource($stream)) {
                $this->error("Unable to read {$sourceDiskName}:{$path}");

                return false;
            }

            try {
                $written = $target->writeStream($path, $stream);
            } finally {
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }

            if (! $written) {
                $this->error("Unable to write {$targetDiskName}:{$path}");

                return false;
            }
        }

        if (! $source->delete($path)) {
            $this->error("Copied {$path}, but could not remove its legacy copy.");

            return false;
        }

        return true;
    }
}
