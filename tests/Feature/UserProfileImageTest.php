<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UserProfileImageTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_image_is_available_only_through_a_valid_signed_url(): void
    {
        $disk = config('filesystems.private_upload_disk');
        Storage::fake($disk);
        $path = 'resident-profile-pictures/profile.jpg';
        Storage::disk($disk)->put($path, 'profile-image-bytes');

        $user = User::factory()->create([
            'profile_picture' => $path,
            'profile_picture_disk' => $disk,
            'profile_picture_original_name' => 'profile.jpg',
            'profile_picture_mime_type' => 'image/jpeg',
        ]);
        $url = $user->profile_picture_url;

        $this->get($url)
            ->assertOk()
            ->assertHeader('Content-Type', 'image/jpeg')
            ->assertStreamedContent('profile-image-bytes');

        $this->get($url.'&signature=invalid')
            ->assertForbidden();
    }
}